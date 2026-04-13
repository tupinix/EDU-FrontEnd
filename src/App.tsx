import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode, lazy, Suspense } from 'react';
import { Layout } from './components/Layout';
import { Dashboard, Discovery, Explorer, Configuration, Login, Users, ModbusPage, OpcUaPage, EthernetIpPage, ConnectionsPage, DataModelsPage, AlertsPage, LicensesPage } from './pages';
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

// Protected Route wrapper
function PrivateRoute({ children }: { children: ReactNode }) {
  const { isAuthenticated } = useAuthStore();

  if (!isAuthenticated) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
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
          {/* Public route */}
          <Route path="/login" element={<Login />} />
          <Route path="/view/:token" element={<SharedDashboard />} />

          {/* Protected routes */}
          <Route
            path="/"
            element={
              <PrivateRoute>
                <Layout />
              </PrivateRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="neo4j" element={<EditionRoute path="/neo4j"><Suspense fallback={<div>Loading...</div>}><PlantModel /></Suspense></EditionRoute>} />
            <Route path="discovery" element={<Discovery />} />
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
