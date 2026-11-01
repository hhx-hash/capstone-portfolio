import { Navigate, useLocation } from "react-router";
import { useAuth } from "../context/AuthContext.js";
import Loading from "./Loading.jsx";

/**
 * Route guard for `/admin`.
 *
 * While the session is being restored it shows a loading state instead of
 * redirecting: otherwise a refresh would bounce a logged-in owner to the login
 * page for a fraction of a second. Once the check finishes, a guest is sent to
 * `/login` with the page they wanted, so the login form can return them there.
 */
export default function ProtectedRoute({ children }) {
  const { isAuthenticated, loading } = useAuth();
  const location = useLocation();

  if (loading) {
    return <Loading label="Checking your session..." />;
  }

  if (!isAuthenticated) {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />;
  }

  return children;
}
