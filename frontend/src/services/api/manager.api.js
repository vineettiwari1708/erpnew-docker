import http from "./http";

export const getManagerPermissionsApi = async () => {
  const res = await http.get("/system/managers/permissions");
  return { data: res.data };
};

export const getManagersApi = async () => {
  const res = await http.get("/system/managers");
  return { data: res.data };
};

export const createManagerApi = async (payload) => {
  const res = await http.post("/system/managers", payload);
  return { data: res.data };
};

export const updateManagerApi = async (id, payload) => {
  const res = await http.put(`/system/managers/${id}`, payload);
  return { data: res.data };
};

export const deleteManagerApi = async (id) => {
  const res = await http.delete(`/system/managers/${id}`);
  return { data: res.data };
};
