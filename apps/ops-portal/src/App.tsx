import { Navigate, Route, Routes } from 'react-router-dom';
import { AuthProvider } from './auth/AuthContext';
import { Layout } from './components/Layout';
import { ProtectedRoute } from './components/ProtectedRoute';
import { LoginPage } from './pages/LoginPage';
import { DashboardPage } from './pages/DashboardPage';
import { WorkOrdersListPage } from './pages/WorkOrdersListPage';
import { WorkOrderDetailPage } from './pages/WorkOrderDetailPage';
import { CreateWorkOrderPage } from './pages/CreateWorkOrderPage';
import { DataCollectionPage } from './pages/DataCollectionPage';
import { ReportsPage } from './pages/ReportsPage';
import { SettingsPage } from './pages/SettingsPage';

export function App() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="/login" element={<LoginPage />} />
        <Route element={<ProtectedRoute />}>
          <Route element={<Layout />}>
            <Route path="/" element={<Navigate to="/work-orders" replace />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/work-orders" element={<WorkOrdersListPage />} />
            <Route path="/work-orders/new" element={<CreateWorkOrderPage />} />
            <Route path="/work-orders/:id" element={<WorkOrderDetailPage />} />
            <Route path="/data-collection" element={<DataCollectionPage />} />
            <Route path="/reports" element={<ReportsPage />} />
            <Route path="/settings" element={<SettingsPage />} />
          </Route>
        </Route>
      </Routes>
    </AuthProvider>
  );
}
