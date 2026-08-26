import { lazy, Suspense } from "react";
import { Route, Routes, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import SignupPage from "./pages/SignupPage";
import Homepage from "./pages/Homepage";
import SignInPage from "./pages/SigninPage";
import Dashboard from "./pages/Dashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";

const AdminPage = lazy(() => import("./pages/AdminPage"));

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");

  return (
    <div>
      {!isAdminRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route
          path="/admin"
          element={(
            <AdminRoute>
              <Suspense fallback={<div className="flex min-h-svh items-center justify-center text-sm text-muted-foreground">Loading admin panel…</div>}>
                <AdminPage />
              </Suspense>
            </AdminRoute>
          )}
        />
      </Routes>
    </div>
  );
}

export default App;
