import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getProjectsApi = async (tenantId) => {
  const res = await http.get(`/${tenantId}/projects`);
  return { data: res.data };
};

export const getProjectByIdApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/projects/${id}`);
  return { data: res.data };
};

export const createProjectApi = async (payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.post(`/${tenantId}/projects`, payload);
  return { data: res.data };
};

export const updateProjectApi = async (id, payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.put(`/${tenantId}/projects/${id}`, payload);
  return { data: res.data };
};

export const deleteProjectApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.delete(`/${tenantId}/projects/${id}`);
  return { data: res.data };
};
