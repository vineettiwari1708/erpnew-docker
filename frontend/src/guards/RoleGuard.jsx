import { Navigate } from "react-router-dom";
import { useSelector } from "react-redux";
import { hasPermission } from "../utils/permissions";

export default function RoleGuard({ children, roles: allowedRoles = [], permission = null, superAdminOnly = false }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const isSuperAdmin = user?.role === "super_admin";

  if (superAdminOnly && !isSuperAdmin) return <Navigate to="/unauthorized" replace />;

  if (allowedRoles.length > 0 && !allowedRoles.includes(user.role)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permission) {
    if (!hasPermission(user.permissions || [], permission)) return <Navigate to="/unauthorized" replace />;
  }

  return children;
}

