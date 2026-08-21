import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getAuditLogsApi = async ({ entity, limit } = {}) => {
  const tenantId = getTenantId();
  const params = new URLSearchParams();
  if (entity) params.set("entity", entity);
  if (limit)  params.set("limit", limit);
  const res = await http.get(`/${tenantId}/audit?${params}`);
  return { data: res.data };
};
