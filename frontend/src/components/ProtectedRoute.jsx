import { Navigate } from "react-router-dom";
import { useAuth } from "../contexts/AuthContext";

const ProtectedRoute = ({ children, requireAdmin = false, requireUser = false }) => {
  const { user, loading } = useAuth();

  if (loading) return null;
  if (!user) return <Navigate to="/login" replace />;

  if (requireAdmin && !user.isAdmin) return <Navigate to="/dashboard" replace />;
  if (requireUser && user.isAdmin) return <Navigate to="/dashboard" replace />;
  return children;
};

export default ProtectedRoute;
