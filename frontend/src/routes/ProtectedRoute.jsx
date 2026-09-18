import { Navigate, useLocation } from "react-router-dom";
import { useSelector } from "react-redux";
import { useHasPermission } from "../store/hooks";

/* Pages a CLIENT portal user is allowed to visit */
const CLIENT_ALLOWED_PATHS = [
  "/dashboard",
  "/invoices/client",
  "/payments/client",
  "/payments/create",
  "/projects",
  "/my-profile",
  "/statement",
];

const isClientAllowed = (pathname) =>
  CLIENT_ALLOWED_PATHS.some((allowed) => pathname.includes(allowed));

export default function ProtectedRoute({ children, systemOnly = false, superAdminExclusive = false, permission }) {
  const { user, isAuthenticated } = useSelector((state) => state.auth);
  const allowed = useHasPermission(permission);
  const location = useLocation();

  if (!isAuthenticated || !user) return <Navigate to="/login" replace />;

  const isSuperAdmin = user?.role === "super_admin";
  const isClient     = user?.role === "CLIENT";

  if (systemOnly && !isSuperAdmin) return <Navigate to="/unauthorized" replace />;

  // Reserved for the true Super Admin only — never satisfiable by any granted
  // permission. Used for managing Manager accounts themselves.
  if (superAdminExclusive && user?.isSuperAdmin !== true) return <Navigate to="/unauthorized" replace />;

  // CLIENT users are hard-blocked from any page not in their allowed list
  if (isClient && permission && !isClientAllowed(location.pathname)) {
    return <Navigate to="/unauthorized" replace />;
  }

  if (permission && !allowed) return <Navigate to="/unauthorized" replace />;

  return children;
}
