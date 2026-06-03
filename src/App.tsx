import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, lazy, Suspense, useEffect, useState } from 'react';
import { Layout } from './components/Layout';
import { Dashboard, Discovery, Explorer, Configuration, Login, Users, ConnectionsPage, DataModelsPage, AlertsPage, LicensesPage, Landing, ApiRestPage, I3xPage, OrganizationsPage, ConfigTransferPage } from './pages';
import { SharedDashboard } from './pages/SharedDashboard';
import { useAuthStore } from './hooks/useStore';
import { useTenant } from './hooks/useTenant';
import { SocketProvider } from './providers/SocketProvider';
import { authApi } from './services/api';

// Lazy-loaded heavy pages
const PlantModel = lazy(() => import('./pages/PlantModel').then(m => ({ default: m.PlantModel })));
const ProcessDashboard = lazy(() => import('./pages/ProcessDashboard').then(m => ({ default: m.ProcessDashboard })));

// Create a client
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 5000,
    },
  },
});

// Root route: Landing for guests (only at "/"), app shell for authed users,
// and a redirect to the landing for guests typing a deep URL directly.
function RootRoute() {
  const { isAuthenticated } = useAuthStore();
  const location = useLocation();
  const hydrating = useCookieSessionRehydration();
  const { isTenantSubdomain } = useTenant();

  // Wait for the cross-subdomain cookie probe before deciding what to
  // render — otherwise users arriving on tupinix.* / highbyte.* with a
  // valid cookie would briefly see Landing/login and then jump to the app.
  if (hydrating) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-[#0A0E14]">
        <div className="w-6 h-6 border-2 border-white/20 border-t-white/60 rounded-full animate-spin" />
      </div>
    );
  }

  if (isAuthenticated) return <Layout />;

  // The marketing Landing only makes sense on the apex domain — it's
  // there to convert new visitors. A guest on a tenant subdomain
  // (highbyte.espaco…) probably came from a bookmark or shared link
  // and is just trying to sign in; send them to /login. The intended
  // onboarding path is apex → login → redirect to the user's tenant.
  if (isTenantSubdomain) return <Navigate to="/login" replace />;

  if (location.pathname === '/') return <Landing />;
  return <Navigate to="/" replace />;
}

/**
 * Sprint 2 — on first mount, if we have no in-memory auth state but the
 * cross-subdomain cookie is present (Domain=.espacodedadosunificado.com.br),
 * call /auth/me to rehydrate. This is how a user landing on
 * tupinix.espacodedadosunificado.com.br after a redirect from the apex
 * login goes straight into the app without re-entering credentials.
 */
function useCookieSessionRehydration(): boolean {
  const { isAuthenticated, setAuth } = useAuthStore();
  const [done, setDone] = useState(false);
  useEffect(() => {
    let cancelled = false;
    if (isAuthenticated) {
      setDone(true);
      return;
    }
    (async () => {
      try {
        const me = await authApi.getMe();
        if (cancelled) return;
        setAuth(
          {
            id: me.id,
            email: me.email,
            name: me.name,
            role: me.role as 'admin' | 'engineer' | 'viewer',
            tenantId: me.tenant?.id ?? 'default',
            status: 'active',
            tenant: me.tenant ?? null,
          },
          // The server reads the cookie on every call, so the localStorage
          // token isn't load-bearing for API auth — use a sentinel value so
          // isAuthenticated flips true and the apiClient interceptor knows
          // to skip the Authorization header.
          'cookie',
        );
      } catch {
        // No cookie or expired — stay a guest, route guards take over.
      } finally {
        if (!cancelled) setDone(true);
      }
    })();
    return () => { cancelled = true; };
  }, [isAuthenticated, setAuth]);
  return !done;
}

// Admin Route wrapper
function AdminRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  if (user?.role !== 'admin') {
    return <Navigate to="/" replace />;
  }

  return <>{children}</>;
}

function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <SocketProvider>
      <BrowserRouter>
        <Routes>
          {/* Public routes */}
          <Route path="/login" element={<Login />} />
          <Route path="/view/:token" element={<SharedDashboard />} />

          {/* Root — Landing for guests, app shell for authed users */}
          <Route path="/" element={<RootRoute />}>
            <Route index element={<Dashboard />} />
            <Route path="neo4j" element={<Suspense fallback={<div>Loading...</div>}><PlantModel /></Suspense>} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="explorer" element={<Explorer />} />
            <Route path="api-rest" element={<ApiRestPage />} />
            <Route path="i3x" element={<I3xPage />} />

            <Route path="data-models" element={<DataModelsPage />} />
            <Route path="alerts" element={<AlertsPage />} />
            <Route path="process" element={<Suspense fallback={<div>Loading...</div>}><ProcessDashboard /></Suspense>} />
            <Route path="configuration" element={<Configuration />} />
            <Route
              path="connections"
              element={
                <AdminRoute>
                  <ConnectionsPage />
                </AdminRoute>
              }
            />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <Users />
                </AdminRoute>
              }
            />
            <Route
              path="organizations"
              element={
                <AdminRoute>
                  <OrganizationsPage />
                </AdminRoute>
              }
            />
            <Route
              path="licenses"
              element={
                <AdminRoute>
                  <LicensesPage />
                </AdminRoute>
              }
            />
            <Route
              path="config-transfer"
              element={
                <AdminRoute>
                  <ConfigTransferPage />
                </AdminRoute>
              }
            />
          </Route>
        </Routes>
      </BrowserRouter>
      </SocketProvider>
    </QueryClientProvider>
  );
}

export default App;
