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
import { FEATURES } from "@/lib/features";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
const DashboardLayout = lazy(() => import("@/components/DashboardLayout"));
const Dashboard = lazy(() => import("@/pages/Dashboard"));
const SetPasswordPage = lazy(() => import("@/pages/SetPasswordPage"));
const BanksPage = lazy(() => import("@/pages/BanksPage"));
const CustomersPage = lazy(() => import("@/pages/CustomersPage"));
const AccountsPage = lazy(() => import("@/pages/AccountsPage"));
const TransactionsPage = lazy(() => import("@/pages/TransactionsPage"));
const MyTransactionsPage = lazy(() => import("@/pages/MyTransactionsPage"));
const UpiPage = lazy(() => import("@/pages/UpiPage"));
const AdminDashboard = lazy(() => import("@/pages/AdminDashboard"));
const ManagerDashboard = lazy(() => import("@/pages/ManagerDashboard"));
const CustomerManagerDashboard = lazy(() => import("@/pages/CustomerManagerDashboard"));
const AuditorDashboard = lazy(() => import("@/pages/AuditorDashboard"));
const SendMoneyPage = lazy(() => import("@/pages/SendMoneyPage"));
const UpiPayPage = lazy(() => import("@/pages/UpiPayPage"));
const AuditLogsPage = lazy(() => import("@/pages/AuditLogsPage"));
const SecurityPage = lazy(() => import("@/pages/SecurityPage"));
const ProfilePage = lazy(() => import("@/pages/ProfilePage"));
const WebhooksPage = lazy(() => import("@/pages/WebhooksPage"));
const NotFound = lazy(() => import("./pages/NotFound"));
const CardsPage = lazy(() => import("@/pages/CardsPage"));
const LoansPage = lazy(() => import("@/pages/LoansPage"));

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
            <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
              <Suspense
                fallback={
                  <div className="min-h-screen flex items-center justify-center bg-background text-muted-foreground">
                    Loading secure workspace...
                  </div>
                }
              >
                <Routes>
                {/* Public Routes */}
                <Route path="/" element={<HomePage />} />
                <Route path="/login" element={<LoginPage />} />
                <Route path="/forgot-password" element={<ForgotPasswordPage />} />
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
                  <Route path="/dashboard" element={<RoleDashboardRedirect />} />
                  <Route path="/banks" element={<BanksPage />} />
                  <Route path="/customers" element={<CustomersPage />} />
                  <Route path="/accounts" element={<AccountsPage />} />
                  <Route path="/transactions" element={
                    <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_MANAGER', 'ROLE_AUDITOR', 'ROLE_CUSTOMER_MANAGER']}>
                      <TransactionsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/my-transactions" element={
                    <ProtectedRoute requiredRoles={['ROLE_USER']}>
                      <MyTransactionsPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/upi" element={<UpiPage />} />
                  <Route path="/profile" element={<ProfilePage />} />
                  {FEATURES.enableAuditModule && (
                    <Route path="/audit" element={
                      <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_AUDITOR']}>
                        <AuditLogsPage />
                      </ProtectedRoute>
                    } />
                  )}
                  {FEATURES.enableSecurityModule && (
                    <Route path="/security" element={
                      <ProtectedRoute requiredRoles={['ROLE_ADMIN']}>
                        <SecurityPage />
                      </ProtectedRoute>
                    } />
                  )}
                  <Route path="/webhooks" element={
                    <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_MANAGER']}>
                      <WebhooksPage />
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
                  <Route path="/auditor" element={
                    <ProtectedRoute requiredRoles={['ROLE_ADMIN', 'ROLE_AUDITOR']}>
                      <AuditorDashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/user" element={
                    <ProtectedRoute requiredRoles={['ROLE_USER']}>
                      <Dashboard />
                    </ProtectedRoute>
                  } />
                  <Route path="/send-money" element={
                    <ProtectedRoute requiredRoles={['ROLE_USER']}>
                      <SendMoneyPage />
                    </ProtectedRoute>
                  } />
                  <Route path="/upi-pay" element={
                    <ProtectedRoute requiredRoles={['ROLE_USER']}>
                      <UpiPayPage />
                    </ProtectedRoute>
                  } />
                    <Route path="/cards" element={
                      <ProtectedRoute requiredRoles={['ROLE_USER', 'ROLE_ADMIN', 'ROLE_MANAGER']}>
                        <CardsPage />
                      </ProtectedRoute>
                    } />
                    <Route path="/loans" element={
                      <ProtectedRoute requiredRoles={['ROLE_USER']}>
                        <LoansPage />
                      </ProtectedRoute>
                    } />
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
