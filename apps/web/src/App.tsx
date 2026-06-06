import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import { Toaster } from "sonner";
import { AuthProvider, useAuth } from "@/hooks/use-auth";
import { AuthGuard } from "@/features/auth/AuthGuard";
import { LoginPage } from "@/features/auth/pages/LoginPage";
import { AppLayout } from "@/components/layout/AppLayout";
import { PlaceholderPage } from "@/components/shared/PlaceholderPage";
import { ComingSoonPage } from "@/components/shared/ComingSoon";
import { ROUTES } from "@/lib/constants";

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      retry: 1,
      refetchOnWindowFocus: false,
      staleTime: 30_000,
    },
  },
});

function GuestGuard() {
  const { isAuthenticated, isLoading } = useAuth();
  if (isLoading) return null;
  if (isAuthenticated) return <Navigate to={ROUTES.DASHBOARD} replace />;
  return <LoginPage />;
}

function AppRoutes() {
  return (
    <Routes>
      {/* Public */}
      <Route path={ROUTES.LOGIN} element={<GuestGuard />} />

      {/* Protected */}
      <Route element={<AuthGuard />}>
        <Route element={<AppLayout />}>
          {/* Dashboard */}
          <Route
            index
            element={<PlaceholderPage title="Dashboard" />}
          />

          {/* Members */}
          <Route path="members">
            <Route
              index
              element={<PlaceholderPage title="Members" />}
            />
            <Route
              path="new"
              element={
                <PlaceholderPage title="New Member" showBack backTo={ROUTES.MEMBERS} />
              }
            />
            <Route
              path=":id"
              element={<PlaceholderPage title="Member Detail" showBack />}
            />
          </Route>

          {/* Memberships */}
          <Route path="memberships">
            <Route
              index
              element={<PlaceholderPage title="Memberships" />}
            />
            <Route
              path=":id"
              element={<PlaceholderPage title="Membership Detail" showBack />}
            />
          </Route>

          {/* Payments */}
          <Route path="payments">
            <Route
              index
              element={<PlaceholderPage title="Payments" />}
            />
            <Route
              path="new"
              element={
                <PlaceholderPage
                  title="Record Payment"
                  showBack
                  backTo={ROUTES.PAYMENTS}
                />
              }
            />
            <Route
              path=":id"
              element={<PlaceholderPage title="Payment Detail" showBack />}
            />
          </Route>

          {/* Expenses */}
          <Route path="expenses">
            <Route
              index
              element={<PlaceholderPage title="Expenses" />}
            />
            <Route
              path="new"
              element={
                <PlaceholderPage
                  title="New Expense"
                  showBack
                  backTo={ROUTES.EXPENSES}
                />
              }
            />
            <Route
              path=":id"
              element={<PlaceholderPage title="Expense Detail" showBack />}
            />
          </Route>

          {/* Reports */}
          <Route path="reports">
            <Route
              index
              element={<PlaceholderPage title="Reports" />}
            />
            <Route
              path="revenue"
              element={
                <PlaceholderPage
                  title="Revenue Report"
                  showBack
                  backTo={ROUTES.REPORTS}
                />
              }
            />
            <Route
              path="expenses"
              element={
                <PlaceholderPage
                  title="Expense Report"
                  showBack
                  backTo={ROUTES.REPORTS}
                />
              }
            />
            <Route
              path="profit"
              element={
                <PlaceholderPage
                  title="Profit Report"
                  showBack
                  backTo={ROUTES.REPORTS}
                />
              }
            />
            <Route
              path="memberships"
              element={
                <PlaceholderPage
                  title="Membership Report"
                  showBack
                  backTo={ROUTES.REPORTS}
                />
              }
            />
            <Route
              path="outstanding"
              element={
                <PlaceholderPage
                  title="Outstanding Balances"
                  showBack
                  backTo={ROUTES.REPORTS}
                />
              }
            />
          </Route>

          {/* Settings */}
          <Route path="settings">
            <Route
              index
              element={<PlaceholderPage title="Settings" />}
            />
            <Route
              path="profile"
              element={
                <PlaceholderPage
                  title="Gym Profile"
                  showBack
                  backTo={ROUTES.SETTINGS}
                />
              }
            />
            <Route
              path="users"
              element={
                <PlaceholderPage
                  title="Users & Roles"
                  showBack
                  backTo={ROUTES.SETTINGS}
                />
              }
            />
            <Route
              path="plans"
              element={
                <PlaceholderPage
                  title="Membership Plans"
                  showBack
                  backTo={ROUTES.SETTINGS}
                />
              }
            />
            <Route
              path="categories"
              element={
                <PlaceholderPage
                  title="Expense Categories"
                  showBack
                  backTo={ROUTES.SETTINGS}
                />
              }
            />
            <Route
              path="automation"
              element={
                <PlaceholderPage
                  title="Automation"
                  showBack
                  backTo={ROUTES.SETTINGS}
                />
              }
            />
            <Route
              path="exports"
              element={
                <PlaceholderPage
                  title="Data Exports"
                  showBack
                  backTo={ROUTES.SETTINGS}
                />
              }
            />
            <Route
              path="system"
              element={
                <PlaceholderPage
                  title="System Info"
                  showBack
                  backTo={ROUTES.SETTINGS}
                />
              }
            />
            {/* Future messaging */}
            <Route
              path="templates"
              element={<ComingSoonPage feature="templates" />}
            />
            <Route
              path="scheduled"
              element={<ComingSoonPage feature="scheduled" />}
            />
          </Route>

          {/* Future modules */}
          <Route
            path="messages"
            element={<ComingSoonPage feature="history" />}
          />
          <Route
            path="notifications"
            element={<ComingSoonPage feature="notifications" />}
          />
          <Route
            path="leads"
            element={<ComingSoonPage feature="leads" />}
          />
        </Route>
      </Route>

      {/* 404 */}
      <Route
        path="*"
        element={<Navigate to={ROUTES.DASHBOARD} replace />}
      />
    </Routes>
  );
}

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
