import http from "./http";

export const getRolesApi = async (tenantId) => {
  const res = await http.get(`/${tenantId}/roles`);
  return res.data;
};

export const getRoleByNameApi = async (tenantId, name) => {
  const res = await http.get(`/${tenantId}/roles/${name}`);
  return res.data;
};

export const updateRolePermissionsApi = async (tenantId, name, permissionKeys) => {
  const res = await http.put(`/${tenantId}/roles/${name}/permissions`, { permissionKeys });
  return res.data;
};
