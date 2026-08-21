import { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { useMatch, useParams } from "react-router-dom";
import { getTenantProfileApi } from "../services/api/client.api";

export const useAuth = () => useSelector((state) => state.auth);

export const usePermissions = () =>
  useSelector((state) => state.permission.permissions);

export const useTenant = () =>
  useSelector((state) => state.tenant.currentTenant);

export const useTenantPath = () => {
  const user = useSelector((state) => state.auth.user);
  const { tenantId: urlTenantId } = useParams();
  // Prefer the actual URL param (slug) over the stored value
  const tenantRef = urlTenantId ?? (user?.tenantSlug || user?.tenantId);
  return (path) => `/tenant/${tenantRef}${path}`;
};

const profileCache = {};

export const clearTenantProfileCache = (tenantId) => {
  if (tenantId) delete profileCache[tenantId];
};

export const useTenantProfile = () => {
  const { user } = useSelector((state) => state.auth);
  const tenantId = user?.tenantId;
  const [profile, setProfile] = useState(tenantId ? profileCache[tenantId] ?? null : null);

  useEffect(() => {
    if (!tenantId || profileCache[tenantId]) return;
    getTenantProfileApi(tenantId)
      .then((res) => {
        profileCache[tenantId] = res.data;
        setProfile(res.data);
      })
      .catch(() => {});
  }, [tenantId]);

  return profile;
};

// Returns true if the logged-in user has the given permission key
export const useHasPermission = (perm) => {
  const { user } = useSelector((state) => state.auth);
  if (!user) return false;
  const perms = Array.isArray(user.permissions) ? user.permissions : [];
  return perms.includes("*") || perms.includes(perm);
};