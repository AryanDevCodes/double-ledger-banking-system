// App.tsx
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

// Eager-load layout (not lazy!) — this prevents sidebar/header flash on every route change
import DashboardLayout from "@/components/DashboardLayout";

const LoginPage = lazy(() => import("@/pages/LoginPage"));
const HomePage = lazy(() => import("@/pages/HomePage"));
const ForgotPasswordPage = lazy(() => import("@/pages/ForgotPasswordPage"));
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
      staleTime: 5 * 60 * 1000,
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

// Page wrapper that adds Suspense per-route
function PageWrapper({ children }: { children: React.ReactNode }) {
  return (
    <Suspense
      fallback={
        <div className="flex items-center justify-center py-20 text-muted-foreground animate-pulse">
          <div className="flex flex-col items-center gap-3">
            <div className="h-8 w-8 rounded-full border-2 border-primary/30 border-t-primary animate-spin" />
            <span className="text-sm font-medium">Loading page…</span>
          </div>
        </div>
      }
    >
      {children}
    </Suspense>
  );
}

const App = () => (
  <QueryClientProvider client={queryClient}>
    <TooltipProvider>
      <ErrorBoundary>
        <AuthProvider>
          <BrandProvider>
            <Toaster />
            <Sonner />
            {/* Remove future flags — they cause transition bugs with Suspense */}
            <BrowserRouter>
              <Routes>
                {/* Public Routes */}
                <Route path="/" element={<PageWrapper><HomePage /></PageWrapper>} />
                <Route path="/login" element={<PageWrapper><LoginPage /></PageWrapper>} />
                <Route path="/forgot-password" element={<PageWrapper><ForgotPasswordPage /></PageWrapper>} />
                <Route
                  path="/set-password"
                  element={
                    <ProtectedRoute>
                      <PageWrapper><SetPasswordPage /></PageWrapper>
                    </ProtectedRoute>
                  }
                />

                {/* Protected Routes — Layout stays mounted! */}
                <Route
                  element={
                    <ProtectedRoute>
                      <DashboardLayout />
                    </ProtectedRoute>
                  }
                >
                  <Route path="/dashboard" element={<RoleDashboardRedirect />} />
                  <Route path="/banks" element={<PageWrapper><BanksPage /></PageWrapper>} />
                  <Route path="/customers" element={<PageWrapper><CustomersPage /></PageWrapper>} />
                  <Route path="/accounts" element={<PageWrapper><AccountsPage /></PageWrapper>} />
                  <Route
                    path="/transactions"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_AUDITOR", "ROLE_CUSTOMER_MANAGER"]}>
                        <PageWrapper><TransactionsPage /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/my-transactions"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_USER"]}>
                        <PageWrapper><MyTransactionsPage /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route path="/upi" element={<PageWrapper><UpiPage /></PageWrapper>} />
                  <Route path="/profile" element={<PageWrapper><ProfilePage /></PageWrapper>} />
                  {FEATURES.enableAuditModule && (
                    <Route
                      path="/audit"
                      element={
                        <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_AUDITOR"]}>
                          <PageWrapper><AuditLogsPage /></PageWrapper>
                        </ProtectedRoute>
                      }
                    />
                  )}
                  {FEATURES.enableSecurityModule && (
                    <Route
                      path="/security"
                      element={
                        <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
                          <PageWrapper><SecurityPage /></PageWrapper>
                        </ProtectedRoute>
                      }
                    />
                  )}
                  <Route
                    path="/webhooks"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
                        <PageWrapper><WebhooksPage /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/admin"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_ADMIN"]}>
                        <PageWrapper><AdminDashboard /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/manager"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_MANAGER"]}>
                        <PageWrapper><ManagerDashboard /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/customer-manager"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_MANAGER", "ROLE_CUSTOMER_MANAGER"]}>
                        <PageWrapper><CustomerManagerDashboard /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/auditor"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_ADMIN", "ROLE_AUDITOR"]}>
                        <PageWrapper><AuditorDashboard /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/user"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_USER"]}>
                        <PageWrapper><Dashboard /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/send-money"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_USER"]}>
                        <PageWrapper><SendMoneyPage /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/upi-pay"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_USER"]}>
                        <PageWrapper><UpiPayPage /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/cards"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_USER", "ROLE_ADMIN", "ROLE_MANAGER"]}>
                        <PageWrapper><CardsPage /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                  <Route
                    path="/loans"
                    element={
                      <ProtectedRoute requiredRoles={["ROLE_USER"]}>
                        <PageWrapper><LoansPage /></PageWrapper>
                      </ProtectedRoute>
                    }
                  />
                </Route>

                <Route path="*" element={<PageWrapper><NotFound /></PageWrapper>} />
              </Routes>
            </BrowserRouter>
          </BrandProvider>
        </AuthProvider>
      </ErrorBoundary>
    </TooltipProvider>
  </QueryClientProvider>
);

export default App;