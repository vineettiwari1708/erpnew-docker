import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getInvoiceRequestsApi = async (status) => {
  const tenantId = getTenantId();
  const params = status ? `?status=${status}` : "";
  const res = await http.get(`/${tenantId}/invoice-requests${params}`);
  return { data: res.data };
};

export const createInvoiceRequestApi = async (payload) => {
  const tenantId = getTenantId();
  const res = await http.post(`/${tenantId}/invoice-requests`, payload);
  return { data: res.data };
};

export const fulfillInvoiceRequestApi = async (id, invoiceId) => {
  const tenantId = getTenantId();
  const res = await http.patch(`/${tenantId}/invoice-requests/${id}/fulfill`, { invoiceId });
  return { data: res.data };
};

export const declineInvoiceRequestApi = async (id, reason) => {
  const tenantId = getTenantId();
  const res = await http.patch(`/${tenantId}/invoice-requests/${id}/decline`, { reason });
  return { data: res.data };
};
