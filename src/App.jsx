import { BrowserRouter, Routes, Route, Navigate } from "react-router-dom";
import Layout from "./components/Layout";
import DashboardLayout from "./components/DashboardLayout";
import ProtectedRoute from "./components/ProtectedRoute";
import ScrollToTop from "./components/ScrollToTop";
import { AuthProvider } from "./contexts/AuthContext";

import Home from "./pages/Home";
import About from "./pages/About";
import Contact from "./pages/Contact";
import Service from "./pages/Service";
import Apply from "./pages/Apply";
import Career from "./pages/Career";
import JoinUs from "./pages/JoinUs";
import TermsAndConditions from "./pages/TermsAndConditions";
import PrivacyPolicy from "./pages/PrivacyPolicy";
import RefundPolicy from "./pages/RefundPolicy";
import PasswordGate from "./components/PasswordGate";
import Installation from "./pages/Installation";
import Login from "./pages/Login";
import ChangePassword from "./pages/ChangePassword";
import ForgotPassword from "./pages/ForgotPassword";
import ResetPassword from "./pages/ResetPassword";
import TrackApplication from "./pages/TrackApplication";
import Partner from "./pages/Partner";
import AdminDashboard from "./pages/AdminDashboard";
import EmployeeDashboard from "./pages/EmployeeDashboard";
import ApplicationDetail from "./pages/ApplicationDetail";
import PartnerDetail from "./pages/PartnerDetail";
import JoinUsDetail from "./pages/JoinUsDetail";
import CareerDetail from "./pages/CareerDetail";
import ContactDetail from "./pages/ContactDetail";

export default function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <ScrollToTop />
        <Routes>
          {/* Public site with navbar/footer */}
          <Route element={<Layout />}>
            <Route index element={<Home />} />
            <Route path="/about" element={<About />} />
            <Route path="/service" element={<Service />} />
            <Route path="/contact" element={<Contact />} />
            <Route path="/apply" element={<Apply />} />
            <Route path="/career" element={<Career />} />

            {/* Join Us is password-gated.
                To make it public, wrap JoinUs directly without PasswordGate:
                  element={<JoinUs />}
            */}
            <Route
              path="/join-us-mnyt2026"
              element={
                <PasswordGate>
                  <JoinUs />
                </PasswordGate>
              }
            />

            <Route path="/terms" element={<TermsAndConditions />} />
            <Route path="/privacy" element={<PrivacyPolicy />} />
            <Route path="/refund" element={<RefundPolicy />} />
            <Route path="/installation" element={<Installation />} />
            <Route path="/track" element={<TrackApplication />} />
            <Route path="/partner" element={<Partner />} />
          </Route>

          {/* Auth (no chrome) */}
          <Route path="/login" element={<Login />} />
          <Route path="/forgot-password" element={<ForgotPassword />} />
          <Route path="/reset-password" element={<ResetPassword />} />
          <Route
            path="/change-password"
            element={
              <ProtectedRoute>
                <ChangePassword />
              </ProtectedRoute>
            }
          />

          {/* Owner dashboard */}
          <Route
            path="/admin"
            element={
              <ProtectedRoute roles={["owner"]}>
                <AdminDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/applications/:id"
            element={
              <ProtectedRoute roles={["owner"]}>
                <DashboardLayout title="Application Detail">
                  <ApplicationDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/partners/:id"
            element={
              <ProtectedRoute roles={["owner"]}>
                <DashboardLayout title="Partner Detail">
                  <PartnerDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/join-us/:id"
            element={
              <ProtectedRoute roles={["owner"]}>
                <DashboardLayout title="Join Us Detail">
                  <JoinUsDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/careers/:id"
            element={
              <ProtectedRoute roles={["owner"]}>
                <DashboardLayout title="Career Application Detail">
                  <CareerDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />
          <Route
            path="/admin/contacts/:id"
            element={
              <ProtectedRoute roles={["owner"]}>
                <DashboardLayout title="Contact Enquiry Detail">
                  <ContactDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          {/* Employee dashboard */}
          <Route
            path="/employee"
            element={
              <ProtectedRoute roles={["employee"]}>
                <EmployeeDashboard />
              </ProtectedRoute>
            }
          />
          <Route
            path="/employee/applications/:id"
            element={
              <ProtectedRoute roles={["employee"]}>
                <DashboardLayout title="Application Detail">
                  <ApplicationDetail />
                </DashboardLayout>
              </ProtectedRoute>
            }
          />

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}
