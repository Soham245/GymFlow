import { lazy, Suspense } from "react";
import { BrowserRouter, Routes, Route, Navigate, Outlet } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { PageLoader } from "@/components/shared/PageLoader";
import { ErrorBoundary } from "@/components/shared/ErrorBoundary";
import { ROUTES } from "@/lib/constants";

// ---------------------------------------------------------------------------
// Lazy-loaded feature pages — each becomes its own chunk at build time.
// When real pages replace the placeholders, they inherit the lazy boundary
// automatically — no changes needed in this file.
// ---------------------------------------------------------------------------

// Dashboard
const DashboardPage = lazy(() => import("@/features/dashboard/pages/DashboardPage"));

// Members
const MembersListPage = lazy(() => import("@/features/members/pages/MembersListPage"));
const MemberNewPage = lazy(() => import("@/features/members/pages/MemberNewPage"));
const MemberDetailPage = lazy(() => import("@/features/members/pages/MemberDetailPage"));
const MemberEditPage = lazy(() => import("@/features/members/pages/MemberEditPage"));

// Memberships
const MembershipsListPage = lazy(() => import("@/features/memberships/pages/MembershipsListPage"));
const MembershipDetailPage = lazy(() => import("@/features/memberships/pages/MembershipDetailPage"));

// Payments
const PaymentsListPage = lazy(() => import("@/features/payments/pages/PaymentsListPage"));
const PaymentNewPage = lazy(() => import("@/features/payments/pages/PaymentNewPage"));
const PaymentDetailPage = lazy(() => import("@/features/payments/pages/PaymentDetailPage"));

// Expenses
const ExpensesListPage = lazy(() => import("@/features/expenses/pages/ExpensesListPage"));
const ExpenseNewPage = lazy(() => import("@/features/expenses/pages/ExpenseNewPage"));
const ExpenseDetailPage = lazy(() => import("@/features/expenses/pages/ExpenseDetailPage"));

// Reports
const ReportsIndexPage = lazy(() => import("@/features/reports/pages/ReportsIndexPage"));
const RevenueReportPage = lazy(() => import("@/features/reports/pages/RevenueReportPage"));
const ExpenseReportPage = lazy(() => import("@/features/reports/pages/ExpenseReportPage"));
const ProfitReportPage = lazy(() => import("@/features/reports/pages/ProfitReportPage"));
const MembershipReportPage = lazy(() => import("@/features/reports/pages/MembershipReportPage"));
const OutstandingReportPage = lazy(() => import("@/features/reports/pages/OutstandingReportPage"));

// Settings
const SettingsIndexPage = lazy(() => import("@/features/settings/pages/SettingsIndexPage"));
const GymProfilePage = lazy(() => import("@/features/settings/pages/GymProfilePage"));
const UsersRolesPage = lazy(() => import("@/features/settings/pages/UsersRolesPage"));
const PlansSettingsPage = lazy(() => import("@/features/settings/pages/PlansSettingsPage"));
const CategoriesPage = lazy(() => import("@/features/settings/pages/CategoriesPage"));
const AutomationPage = lazy(() => import("@/features/settings/pages/AutomationPage"));
const ExportsPage = lazy(() => import("@/features/settings/pages/ExportsPage"));
const SystemInfoPage = lazy(() => import("@/features/settings/pages/SystemInfoPage"));

// Future modules (messaging, notifications, leads)
const TemplatesPage = lazy(() => import("@/features/messaging/pages/TemplatesPage"));
const ScheduledPage = lazy(() => import("@/features/messaging/pages/ScheduledPage"));
const MessageHistoryPage = lazy(() => import("@/features/messaging/pages/MessageHistoryPage"));
const NotificationsPage = lazy(() => import("@/features/messaging/pages/NotificationsPage"));
const LeadsPage = lazy(() => import("@/features/messaging/pages/LeadsPage"));

// ---------------------------------------------------------------------------
// Query client — stays in main bundle (needed immediately after login)
// ---------------------------------------------------------------------------
const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

// ---------------------------------------------------------------------------
// Guards — kept in main bundle for instant redirect decisions
// ---------------------------------------------------------------------------
function GuestGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <LoginPage />;
}

/** Layout route that wraps child route output in Suspense + ErrorBoundary. */
function SuspenseOutlet() {
  return (
    <ErrorBoundary>
      <Suspense fallback={<PageLoader />}>
        <Outlet />
      </Suspense>
    </ErrorBoundary>
  );
}

// ---------------------------------------------------------------------------
// Route tree
// ---------------------------------------------------------------------------
function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.LOGIN} element={<GuestGuard />} />

      {/* Protected — shell loads immediately, pages stream in */}
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          <Route element={<SuspenseOutlet />}>
            {/* Dashboard */}
            <Route index element={<DashboardPage />} />

            {/* Members */}
            <Route path="members">
              <Route index element={<MembersListPage />} />
              <Route path="new" element={<MemberNewPage />} />
              <Route path=":id" element={<MemberDetailPage />} />
              <Route path=":id/edit" element={<MemberEditPage />} />
            </Route>

            {/* Memberships */}
            <Route path="memberships">
              <Route index element={<MembershipsListPage />} />
              <Route path=":id" element={<MembershipDetailPage />} />
            </Route>

            {/* Payments */}
            <Route path="payments">
              <Route index element={<PaymentsListPage />} />
              <Route path="new" element={<PaymentNewPage />} />
              <Route path=":id" element={<PaymentDetailPage />} />
            </Route>

            {/* Expenses */}
            <Route path="expenses">
              <Route index element={<ExpensesListPage />} />
              <Route path="new" element={<ExpenseNewPage />} />
              <Route path=":id" element={<ExpenseDetailPage />} />
            </Route>

            {/* Reports */}
            <Route path="reports">
              <Route index element={<ReportsIndexPage />} />
              <Route path="revenue" element={<RevenueReportPage />} />
              <Route path="expenses" element={<ExpenseReportPage />} />
              <Route path="profit" element={<ProfitReportPage />} />
              <Route path="memberships" element={<MembershipReportPage />} />
              <Route path="outstanding" element={<OutstandingReportPage />} />
            </Route>

            {/* Settings */}
            <Route path="settings">
              <Route index element={<SettingsIndexPage />} />
              <Route path="profile" element={<GymProfilePage />} />
              <Route path="users" element={<UsersRolesPage />} />
              <Route path="plans" element={<PlansSettingsPage />} />
              <Route path="categories" element={<CategoriesPage />} />
              <Route path="automation" element={<AutomationPage />} />
              <Route path="exports" element={<ExportsPage />} />
              <Route path="system" element={<SystemInfoPage />} />
              {/* Future messaging */}
              <Route path="templates" element={<TemplatesPage />} />
              <Route path="scheduled" element={<ScheduledPage />} />
            </Route>

            {/* Future modules */}
            <Route path="messages" element={<MessageHistoryPage />} />
            <Route path="notifications" element={<NotificationsPage />} />
            <Route path="leads" element={<LeadsPage />} />
          </Route>
        </Route>
      </Route>

      {/* 404 */}
      <Route path="*" element={<Navigate to={ROUTES.DASHBOARD} replace />} />
    </Routes>
  );
}

// ---------------------------------------------------------------------------
// App root
// ---------------------------------------------------------------------------
export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <BrowserRouter>
        <AuthProvider>
          <AppRoutes />
          <Toaster position="top-center" richColors closeButton />
        </AuthProvider>
      </BrowserRouter>
    </QueryClientProvider>
  );
}
