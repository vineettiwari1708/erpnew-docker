import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getUsersApi = async (tenantId) => {
  const res = await http.get(`/${tenantId}/users`);
  return { data: res.data };
};

export const getUserByIdApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/users/${id}`);
  return { data: res.data };
};

export const createUserApi = async (payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.post(`/${tenantId}/users`, payload);
  return { data: res.data };
};

export const updateUserApi = async (id, payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.put(`/${tenantId}/users/${id}`, payload);
  return { data: res.data };
};

export const deleteUserApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.delete(`/${tenantId}/users/${id}`);
  return { data: res.data };
};

export const getMyProfileApi = async () => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/users/me`);
  return { data: res.data };
};

export const updateMyProfileApi = async (payload) => {
  const tenantId = getTenantId();
  const res = await http.patch(`/${tenantId}/users/me`, payload);
  return { data: res.data };
};

export const resetUserPasswordApi = async (id, tenantId, newPassword) => {
  const tid = tenantId || getTenantId();
  const res = await http.put(`/${tid}/users/${id}/reset-password`, { newPassword });
  return { data: res.data };
};
