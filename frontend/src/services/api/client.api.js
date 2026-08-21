import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getClientsApi = async (tenantId) => {
  const res = await http.get(`/${tenantId}/clients`);
  return { data: res.data };
};

export const getClientByIdApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/clients/${id}`);
  return { data: res.data };
};

export const createClientApi = async (payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.post(`/${tenantId}/clients`, payload);
  return { data: res.data };
};

export const updateClientApi = async (id, payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.put(`/${tenantId}/clients/${id}`, payload);
  return { data: res.data };
};

export const deleteClientApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.delete(`/${tenantId}/clients/${id}`);
  return { data: res.data };
};

export const getTenantProfileApi = async (tenantId) => {
  const tid = tenantId || getTenantId();
  const res = await http.get(`/${tid}/profile`);
  return { data: res.data };
};

export const updateTenantProfileApi = async (formData) => {
  const tenantId = getTenantId();
  const res = await http.patch(`/${tenantId}/profile`, formData, {
    headers: { "Content-Type": "multipart/form-data" },
  });
  return { data: res.data };
};

export const getClientStatementApi = async (clientId) => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/clients/${clientId}/statement`);
  return { data: res.data };
};

export const resetClientPortalPasswordApi = async (clientId, newPassword) => {
  const tenantId = getTenantId();
  const res = await http.post(`/${tenantId}/clients/${clientId}/reset-portal-password`, { newPassword });
  return { data: res.data };
};

export const createClientPortalUserApi = async (clientId, payload) => {
  const tenantId = getTenantId();
  const res = await http.post(`/${tenantId}/clients/${clientId}/portal-user`, payload);
  return { data: res.data };
};
