import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom";
import { useAuth } from "./context/AuthContext";
import ProtectedRoute from "./routes/ProtectedRoute";
import OrganizerEventDetail from "./pages/organizer/EventDetail";
import Register from "./pages/auth/Register";

// Layouts
import ParticipantLayout from "./layouts/ParticipantLayout";
import OrganizerLayout from "./layouts/OrganizerLayout";
import AdminLayout from "./layouts/AdminLayout";

// Pages
import Login from "./pages/auth/Login";

function App() {
  const { user } = useAuth();

  return (
    <Router>
      <Routes>

        {/* Public */}
        <Route path="/login" element={<Login />} />
<Route path="/register" element={<Register />} />
        {/* Unauthorized */}
        <Route path="/unauthorized" element={<h1 className="p-10 text-xl">Unauthorized Access</h1>} />

        {/* Participant Routes */}
        <Route
          path="/participant/*"
          element={
            <ProtectedRoute allowedRoles={["participant"]}>
              <ParticipantLayout />
            </ProtectedRoute>
          }
        />

        {/* Organizer Routes */}
        <Route
          path="/organizer/*"
          element={
            <ProtectedRoute allowedRoles={["organizer"]}>
              <OrganizerLayout />
            </ProtectedRoute>
          }
        />

        {/* Admin Routes */}
        <Route
          path="/admin/*"
          element={
            <ProtectedRoute allowedRoles={["admin"]}>
              <AdminLayout />
            </ProtectedRoute>
          }
        />

        {/* Default redirect */}
       <Route
  path="/"
  element={
    user
      ? user.role === "participant"
  ? (!user.interests || user.interests.length === 0)
    ? <Navigate to="/participant/onboarding" />
    : <Navigate to="/participant/dashboard" />
        : user.role === "organizer"
        ? <Navigate to="/organizer/dashboard" />
        : <Navigate to="/admin/dashboard" />
      : <Navigate to="/login" />
  }
/>

<Route
  path="/organizer/event/:id"
  element={
    <ProtectedRoute allowedRoles={["organizer"]}>
      <OrganizerEventDetail />
    </ProtectedRoute>
  }
/>


      </Routes>
    </Router>
  );
}

export default App;
