import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getNotificationsApi = async () => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/notifications`);
  return { data: res.data };
};

export const markNotificationReadApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.patch(`/${tenantId}/notifications/${id}/read`);
  return { data: res.data };
};

export const markAllNotificationsReadApi = async () => {
  const tenantId = getTenantId();
  const res = await http.patch(`/${tenantId}/notifications/read-all`);
  return { data: res.data };
};

export const getSystemNotificationsApi = async () => {
  const res = await http.get("/system/notifications");
  return { data: res.data };
};
