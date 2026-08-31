import { lazy, Suspense, useEffect } from "react";
import { Route, Routes, useLocation } from "react-router";
import Navbar from "./components/Navbar";
import SignupPage from "./pages/SignupPage";
import Homepage from "./pages/Homepage";
import SignInPage from "./pages/SigninPage";
import ForgotPasswordPage from "./pages/ForgotPasswordPage";
import ResetPasswordPage from "./pages/ResetPasswordPage";
import PrivacyPage from "./pages/PrivacyPage";
import TermsPage from "./pages/TermsPage";
import Dashboard from "./pages/Dashboard";
import CreateJobPage from "./pages/CreateJobPage";
import JobsPage from "./pages/JobsPage";
import JobDetailsPage from "./pages/JobDetailsPage";
import MyJobsPage from "./pages/MyJobsPage";
import JobProposalsPage from "./pages/JobProposalsPage";
import MyProposalsPage from "./pages/MyProposalsPage";
import ProtectedRoute from "./components/ProtectedRoute";
import AdminRoute from "./components/AdminRoute";
import RoleRoute from "./components/RoleRoute";

const AdminPage = lazy(() => import("./pages/AdminPage"));
const ServicesPage = lazy(() => import("./pages/ServicesPage"));
const ServiceDetailPage = lazy(() => import("./pages/ServiceDetailPage"));
const CreateServicePage = lazy(() => import("./pages/CreateServicePage"));
const MyOrdersPage = lazy(() => import("./pages/MyOrdersPage"));
const ProfilePage = lazy(() => import("./pages/ProfilePage"));
const ProfileEditPage = lazy(() => import("./pages/ProfileEditPage"));
const SearchPage = lazy(() => import("./pages/SearchPage"));
const MyContractsPage = lazy(() => import("./pages/MyContractsPage"));
const ContractWorkspacePage = lazy(() => import("./pages/ContractWorkspacePage"));
const WalletPage = lazy(() => import("./pages/WalletPage"));
const TransactionReceiptPage = lazy(() => import("./pages/TransactionReceiptPage"));

function MarketplacePageFallback({ label = "Loading services…" }) {
  return (
    <div className="flex min-h-[50vh] items-center justify-center text-sm text-muted-foreground">
      {label}
    </div>
  );
}

function App() {
  const location = useLocation();
  const isAdminRoute = location.pathname === "/admin" || location.pathname.startsWith("/admin/");
  const isLegalRoute = /^\/(privacy|terms)\/?$/i.test(location.pathname);

  useEffect(() => {
    if (!location.hash) return undefined;

    const frame = window.requestAnimationFrame(() => {
      document.getElementById(location.hash.slice(1))?.scrollIntoView({
        behavior: "smooth",
        block: "start",
      });
    });

    return () => window.cancelAnimationFrame(frame);
  }, [location.hash, location.pathname]);

  return (
    <div>
      {!isAdminRoute && !isLegalRoute && <Navbar />}
      <Routes>
        <Route path="/" element={<Homepage />} />
        <Route path="/sign-up" element={<SignupPage />} />
        <Route path="/sign-in" element={<SignInPage />} />
        <Route path="/forgot-password" element={<ForgotPasswordPage />} />
        <Route path="/reset-password" element={<ResetPasswordPage />} />
        <Route path="/privacy" element={<PrivacyPage />} />
        <Route path="/terms" element={<TermsPage />} />
        <Route
          path="/search"
          element={(
            <Suspense fallback={<MarketplacePageFallback label="Loading search…" />}>
              <SearchPage />
            </Suspense>
          )}
        />
        <Route
          path="/profile/:id"
          element={(
            <Suspense fallback={<MarketplacePageFallback label="Loading profile…" />}>
              <ProfilePage />
            </Suspense>
          )}
        />
        <Route
          path="/profile/edit"
          element={(
            <RoleRoute
              allowedRoles={["client", "freelancer"]}
              signInMessage="Sign in to edit your profile."
              forbiddenMessage="Only marketplace profiles can be edited here."
            >
              <Suspense fallback={<MarketplacePageFallback label="Loading profile editor…" />}>
                <ProfileEditPage />
              </Suspense>
            </RoleRoute>
          )}
        />
        <Route path="/dashboard" element={<ProtectedRoute><Dashboard /></ProtectedRoute>} />
        <Route path="/jobs" element={<JobsPage />} />
        <Route
          path="/jobs/new"
          element={(
            <RoleRoute
              allowedRoles={["client"]}
              signInMessage="Sign in with a client account to post a job."
              forbiddenMessage="Only client accounts can post jobs."
            >
              <CreateJobPage />
            </RoleRoute>
          )}
        />
        <Route
          path="/jobs/:id/edit"
          element={(
            <RoleRoute
              allowedRoles={["client"]}
              signInMessage="Sign in with a client account to edit a job."
              forbiddenMessage="Only client accounts can edit posted jobs."
            >
              <CreateJobPage />
            </RoleRoute>
          )}
        />
        <Route
          path="/jobs/mine"
          element={(
            <RoleRoute
              allowedRoles={["client"]}
              signInMessage="Sign in with a client account to manage your jobs."
              forbiddenMessage="Only client accounts can manage posted jobs."
            >
              <MyJobsPage />
            </RoleRoute>
          )}
        />
        <Route
          path="/jobs/:id/proposals"
          element={(
            <RoleRoute
              allowedRoles={["client"]}
              signInMessage="Sign in with a client account to review proposals."
              forbiddenMessage="Only client accounts can review proposals."
            >
              <JobProposalsPage />
            </RoleRoute>
          )}
        />
        <Route path="/jobs/:id" element={<JobDetailsPage />} />
        <Route
          path="/services"
          element={(
            <Suspense fallback={<MarketplacePageFallback />}>
              <ServicesPage />
            </Suspense>
          )}
        />
        <Route
          path="/services/new"
          element={(
            <RoleRoute
              allowedRoles={["freelancer"]}
              signInMessage="Sign in with a freelancer account to create a service."
              forbiddenMessage="Only freelancer accounts can create services."
            >
              <Suspense fallback={<MarketplacePageFallback />}>
                <CreateServicePage />
              </Suspense>
            </RoleRoute>
          )}
        />
        <Route
          path="/services/:id"
          element={(
            <Suspense fallback={<MarketplacePageFallback />}>
              <ServiceDetailPage />
            </Suspense>
          )}
        />
        <Route
          path="/orders"
          element={(
            <RoleRoute
              allowedRoles={["client"]}
              signInMessage="Sign in with a client account to view your orders."
              forbiddenMessage="Only client accounts can view service orders."
            >
              <Suspense fallback={<MarketplacePageFallback label="Loading orders…" />}>
                <MyOrdersPage />
              </Suspense>
            </RoleRoute>
          )}
        />
        <Route
          path="/proposals"
          element={(
            <RoleRoute
              allowedRoles={["freelancer"]}
              signInMessage="Sign in with a freelancer account to view your proposals."
              forbiddenMessage="Only freelancer accounts can view submitted proposals."
            >
              <MyProposalsPage />
            </RoleRoute>
          )}
        />
        <Route
          path="/contracts"
          element={(
            <RoleRoute
              allowedRoles={["client", "freelancer"]}
              signInMessage="Sign in to view your contracts."
              forbiddenMessage="Only marketplace accounts can view contracts."
            >
              <Suspense fallback={<MarketplacePageFallback label="Loading contracts…" />}>
                <MyContractsPage />
              </Suspense>
            </RoleRoute>
          )}
        />
        <Route
          path="/contracts/:id"
          element={(
            <RoleRoute
              allowedRoles={["client", "freelancer"]}
              signInMessage="Sign in to open this contract workspace."
              forbiddenMessage="Only contract participants can open a workspace."
            >
              <Suspense fallback={<MarketplacePageFallback label="Loading workspace…" />}>
                <ContractWorkspacePage />
              </Suspense>
            </RoleRoute>
          )}
        />
        <Route
          path="/wallet"
          element={(
            <RoleRoute
              allowedRoles={["client", "freelancer"]}
              signInMessage="Sign in to open your wallet."
              forbiddenMessage="Only marketplace accounts can use the wallet."
            >
              <Suspense fallback={<MarketplacePageFallback label="Loading wallet…" />}>
                <WalletPage />
              </Suspense>
            </RoleRoute>
          )}
        />
        <Route
          path="/transactions/:id/receipt"
          element={(
            <RoleRoute
              allowedRoles={["client", "freelancer"]}
              signInMessage="Sign in to view this receipt."
              forbiddenMessage="Only marketplace accounts can view transaction receipts."
            >
              <Suspense fallback={<MarketplacePageFallback label="Loading receipt…" />}>
                <TransactionReceiptPage />
              </Suspense>
            </RoleRoute>
          )}
        />
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
