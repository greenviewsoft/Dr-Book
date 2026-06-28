import { Routes, Route, Navigate } from "react-router-dom";
import { BookingPage } from "@/features/booking/BookingPage";
import { LoginPage } from "@/features/admin/pages/LoginPage";
import { DashboardPage } from "@/features/admin/pages/DashboardPage";
import { SettingsPage } from "@/features/admin/pages/SettingsPage";
import { HolidaysPage } from "@/features/admin/pages/HolidaysPage";
import { ProtectedRoute } from "@/routes/ProtectedRoute";
import { DashboardLayout } from "@/components/layout/DashboardLayout";
import { AuthProvider } from "@/features/admin/hooks/useAuth";

// Admin subtree — AuthProvider scoped here so the public booking page
// makes no auth calls.
function AdminRoot() {
  return (
    <AuthProvider>
      <Routes>
        <Route path="login" element={<LoginPage />} />
        <Route
          element={
            <ProtectedRoute>
              <DashboardLayout />
            </ProtectedRoute>
          }
        >
          <Route index element={<DashboardPage />} />
          <Route path="settings" element={<SettingsPage />} />
          <Route path="holidays" element={<HolidaysPage />} />
        </Route>
      </Routes>
    </AuthProvider>
  );
}

function App() {
  return (
    <Routes>
      <Route path="/" element={<BookingPage />} />
      <Route path="/admin/*" element={<AdminRoot />} />
      <Route path="*" element={<Navigate to="/" replace />} />
    </Routes>
  );
}

export default App;
