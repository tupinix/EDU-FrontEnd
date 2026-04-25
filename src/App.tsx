import { BrowserRouter, Routes, Route, Navigate, useLocation } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { Dashboard, Discovery, Explorer, Configuration, Login, Users, ModbusPage, OpcUaPage, EthernetIpPage, ConnectionsPage, DataModelsPage, AlertsPage, LicensesPage, NetworkScan, Landing } from './pages';
import { SharedDashboard } from './pages/SharedDashboard';
import { useAuthStore } from './hooks/useStore';
import { SocketProvider } from './providers/SocketProvider';
import { editionPages } from './config/edition';

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

  if (isAuthenticated) return <Layout />;
  if (location.pathname === '/') return <Landing />;
  return <Navigate to="/" replace />;
}

// Edition Route wrapper - redirects if page not allowed in current edition
function EditionRoute({ path, children }: { path: string; children: ReactNode }) {
  const { editionMode } = useAuthStore();
  const allowed = new Set(editionPages[editionMode]);
  if (!allowed.has(path)) {
    return <Navigate to="/" replace />;
  }
  return <>{children}</>;
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
            <Route path="neo4j" element={<EditionRoute path="/neo4j"><Suspense fallback={<div>Loading...</div>}><PlantModel /></Suspense></EditionRoute>} />
            <Route path="discovery" element={<Discovery />} />
            <Route path="network-scan" element={<EditionRoute path="/network-scan"><NetworkScan /></EditionRoute>} />
            <Route path="explorer" element={<Explorer />} />
            <Route path="modbus" element={<EditionRoute path="/modbus"><ModbusPage /></EditionRoute>} />
            <Route path="opcua" element={<EditionRoute path="/opcua"><OpcUaPage /></EditionRoute>} />
            <Route path="ethip" element={<EditionRoute path="/ethip"><EthernetIpPage /></EditionRoute>} />

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
              path="licenses"
              element={
                <AdminRoute>
                  <LicensesPage />
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
