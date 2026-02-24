import { Navigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";
import Loader from "../components/Loader";

/**
 * ProtectedRoute wraps a route and enforces:
 * 1. User must be logged in.
 * 2. User role must be allowed (if specified).
 *
 * @param {ReactNode} children - The component(s) to render if allowed
 * @param {Array} allowedRoles - Optional array of roles allowed to access
 */
const ProtectedRoute = ({ children, allowedRoles }) => {
  const { user, loading } = useAuth();

  // Show loader while authentication state is being determined
  if (loading) return <Loader />;

  // Redirect to login if not authenticated
  if (!user) return <Navigate to="/login" replace />;

  // Redirect to unauthorized page if role is not permitted
  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  // Render child components if user is allowed
  return children;
};

export default ProtectedRoute;