import http from "./http";

export const getTenantsApi = async () => {
  const res = await http.get("/system/tenants");
  return { data: res.data };
};

export const getTenantByIdApi = async (id) => {
  const res = await http.get(`/system/tenants/${id}`);
  return { data: res.data };
};

export const createTenantApi = async (payload) => {
  const res = await http.post("/system/tenants", payload);
  return { data: res.data };
};

export const updateTenantApi = async (id, payload) => {
  const res = await http.put(`/system/tenants/${id}`, payload);
  return { data: res.data };
};

export const deleteTenantApi = async (id) => {
  const res = await http.delete(`/system/tenants/${id}`);
  return { data: res.data };
};
