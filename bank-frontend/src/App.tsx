import { Suspense, lazy } from "react";
import { Toaster } from "@/components/ui/toaster";
import { Toaster as Sonner } from "@/components/ui/sonner";
import { TooltipProvider } from "@/components/ui/tooltip";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { AuthProvider } from "@/contexts/AuthContext";
import { BrandProvider } from "@/contexts/BrandContext";
import ProtectedRoute from "@/components/ProtectedRoute";
import { ErrorBoundary } from "@/components/ErrorBoundary";
import { getDashboardRoute } from "@/lib/rbac";
import { useAuth } from "@/contexts/AuthContext";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const DashboardLayout = lazy(() => import("@/components/DashboardLayout"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SetPasswordPage = lazy(() => import("@/pages/SetPasswordPage"));
const BanksPage = lazy(() => import("@/pages/BanksPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const AccountsPage = lazy(() => import("@/pages/AccountsPage"));
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage"));
const UpiPage = lazy(() => import("@/pages/UpiPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const ManagerDashboard = lazy(() => import("@/pages/ManagerDashboard"));
const CustomerManagerDashboard = lazy(() => import("@/pages/CustomerManagerDashboard"));
const PaymentsPage = lazy(() => import("@/pages/PaymentsPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const SecurityPage = lazy(() => import("@/pages/SecurityPage"));
const NotFound = lazy(() => import("./pages/NotFound"));

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
          <BrandProvider>
            <Toaster />
            <Sonner />
            <BrowserRouter>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
                    Loading secure workspace...
                  </div>
                }
              >
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
              </Suspense>
            </BrowserRouter>
          </BrandProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;
