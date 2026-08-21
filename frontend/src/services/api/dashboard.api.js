import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getDashboardApi = async (tenantId) => {
  const tid = tenantId || getTenantId();
  const res = await http.get(`/${tid}/dashboard`);
  return { data: res.data };
};
