import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AuthProvider } from './lib/auth';
import Layout from './components/layout/Layout';
import Dashboard from './pages/Dashboard';
import Users from './pages/Users';
import Riders from './pages/Riders';
import Trips from './pages/Trips';
import Zones from './pages/Zones';
import Vehicles from './pages/Vehicles';
import Ratings from './pages/Ratings';
import Emergencies from './pages/Emergencies';
import LiveMap from './pages/LiveMap';
import SystemLogs from './pages/SystemLogs';
import Promotions from './pages/Promotions';
import Notifications from './pages/Notifications';
import ContentManagement from './pages/ContentManagement';
import AdminUsers from './pages/AdminUsers';
import PlatformSettings from './pages/PlatformSettings';
import Reports from './pages/Reports';
import DataExports from './pages/DataExports';
import Support from './pages/Support';
import Financial from './pages/Financial';
import Analytics from './pages/Analytics';
import Login from './pages/Login';
import ProtectedRoute from './components/ProtectedRoute';
import './index.css';

const queryClient = new QueryClient();

function App() {
  return (
    <BrowserRouter>
      <QueryClientProvider client={queryClient}>
        <AuthProvider>
          <Routes>
            <Route path="/login" element={<Login />} />
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <Layout />
                </ProtectedRoute>
              }
            >
              <Route index element={<Dashboard />} />
              <Route path="users" element={<Users />} />
              <Route path="riders" element={<Riders />} />
              <Route path="trips" element={<Trips />} />
              <Route path="zones" element={<Zones />} />
              <Route path="vehicles" element={<Vehicles />} />
              <Route path="ratings" element={<Ratings />} />
              <Route path="emergencies" element={<Emergencies />} />
              <Route path="live-map" element={<LiveMap />} />
              <Route path="logs" element={<SystemLogs />} />
              <Route path="promotions" element={<Promotions />} />
              <Route path="notifications" element={<Notifications />} />
              <Route path="content" element={<ContentManagement />} />
              <Route path="admin-users" element={<AdminUsers />} />
              <Route path="support" element={<Support />} />
              <Route path="financial" element={<Financial />} />
              <Route path="analytics" element={<Analytics />} />
              <Route path="reports" element={<Reports />} />
              <Route path="exports" element={<DataExports />} />
              <Route path="settings" element={<PlatformSettings />} />
            </Route>
            <Route path="*" element={<Navigate to="/" replace />} />
          </Routes>
        </AuthProvider>
      </QueryClientProvider>
    </BrowserRouter>
  );
}

export default App;
