import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { ReactNode } from 'react';
import { Layout } from './components/Layout';
import { Dashboard, Discovery, Explorer, Assistant, Reports, Configuration, Login, Users, Alarms } from './pages';
import { useAuthStore } from './hooks/useStore';
import { SocketProvider } from './providers/SocketProvider';

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
            <Route path="discovery" element={<Discovery />} />
            <Route path="explorer" element={<Explorer />} />
            <Route path="alarms" element={<Alarms />} />
            <Route path="assistant" element={<Assistant />} />
            <Route path="reports" element={<Reports />} />
            <Route path="configuration" element={<Configuration />} />
            <Route
              path="users"
              element={
                <AdminRoute>
                  <Users />
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
