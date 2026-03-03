import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import LoginPage from "@/pages/LoginPage";
import DashboardLayout from "@/components/DashboardLayout";
import Dashboard from "@/pages/Dashboard";
import SetPasswordPage from "@/pages/SetPasswordPage";
import BanksPage from "@/pages/BanksPage";
import CustomersPage from "@/pages/CustomersPage";
import AccountsPage from "@/pages/AccountsPage";
import TransactionsPage from "@/pages/TransactionsPage";
import UpiPage from "@/pages/UpiPage";
import AdminDashboard from "@/pages/AdminDashboard";
import ManagerDashboard from "@/pages/ManagerDashboard";
import CustomerManagerDashboard from "@/pages/CustomerManagerDashboard";
import PaymentsPage from "@/pages/PaymentsPage";
import AuditLogsPage from "@/pages/AuditLogsPage";
import SecurityPage from "@/pages/SecurityPage";
import NotFound from "./pages/NotFound";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getDashboardRoute } from "@/lib/rbac";
import { useAuth } from "@/contexts/AuthContext";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 5 * 60 * 1000, // 5 minutes
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

const RoleDashboardRedirect = () => {
  const { user } = useAuth();
  const target = user ? getDashboardRoute(user.roles) : "/login";
  return <Navigate to={target} replace />;
};

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <Toaster />
          <Sonner />
          <BrowserRouter>
            <Routes>
              {/* Public Routes */}
              <Route path="/login" element={<LoginPage />} />
              <Route path="/set-password" element={
                <ProtectedRoute>
                  <SetPasswordPage />
                </ProtectedRoute>
              } />
              
              {/* Protected Routes */}
              <Route element={
                <ProtectedRoute>
                  <DashboardLayout />
                </ProtectedRoute>
              }>
                <Route path="/" element={<Navigate to="/dashboard" replace />} />
                <Route path="/dashboard" element={<RoleDashboardRedirect />} />
                <Route path="/banks" element={<BanksPage />} />
                <Route path="/customers" element={<CustomersPage />} />
                <Route path="/accounts" element={<AccountsPage />} />
                <Route path="/transactions" element={<TransactionsPage />} />
                <Route path="/upi" element={<UpiPage />} />
                <Route path="/audit" element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_AUDITOR']}>
                    <AuditLogsPage />
                  </ProtectedRoute>
                } />
                <Route path="/security" element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                    <SecurityPage />
                  </ProtectedRoute>
                } />
                <Route path="/admin" element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                    <AdminDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/manager" element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_MANAGER']}>
                    <ManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/customer-manager" element={
                  <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_CUSTOMER_MANAGER']}>
                    <CustomerManagerDashboard />
                  </ProtectedRoute>
                } />
                <Route path="/user" element={
                  <ProtectedRoute requiredRoles={['ROLE_USER']}>
                    <Dashboard />
                  </ProtectedRoute>
                } />
                <Route path="/payments" element={<PaymentsPage />} />
              </Route>
              <Route path="*" element={<NotFound />} />
            </Routes>
          </BrowserRouter>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
