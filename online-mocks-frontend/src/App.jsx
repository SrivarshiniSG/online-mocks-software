import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LandingPage from "./components/LandingPage";
import HRLogin from "./components/HRLogin";
import VolunteerLogin from "./components/VolunteerLogin";
import VolunteerDashboard from "./components/VolunteerDashboard";
import ProtectedRoute from "./components/ProtectedRoute";
import LoginRoute from "./components/LoginRoute";
import HRDashboard from "./components/HRDashboard";
import AdminLogin from "./components/AdminLogin";
import AdminDashboard from "./components/AdminDashboard";
import HRFeedback from "./components/HRFeedback";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LandingPage />} />
        <Route path="/hr-login" element={
          <LoginRoute hrRoute={true}>
            <HRLogin />
          </LoginRoute>
        } />
        <Route path="/volunteer-login" element={
          <LoginRoute>
            <VolunteerLogin />
          </LoginRoute>
        } />
        <Route
          path="/volunteer-dashboard"
          element={
            <ProtectedRoute>
              <VolunteerDashboard />
            </ProtectedRoute>
          }
        />
        <Route
          path="/hr-dashboard"
          element={
            <ProtectedRoute hrRoute={true}>
              <HRDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/admin-login" element={
          <LoginRoute adminRoute={true}>
            <AdminLogin />
          </LoginRoute>
        } />
        <Route
          path="/admin-dashboard"
          element={
            <ProtectedRoute adminRoute={true}>
              <AdminDashboard />
            </ProtectedRoute>
          }
        />
        <Route path="/hr-feedback" element={<HRFeedback />} />
      </Routes>
    </Router>
  );
}

export default App;
