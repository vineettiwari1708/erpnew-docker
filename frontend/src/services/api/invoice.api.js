import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getInvoicesApi = async (tenantId) => {
  const res = await http.get(`/${tenantId}/invoices`);
  return { data: res.data };
};

export const getInvoiceByIdApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/invoices/${id}`);
  return { data: res.data };
};

export const getClientInvoicesApi = async (tenantId, clientId) => {
  const res = await http.get(`/${tenantId}/invoices/client/${clientId}`);
  return { data: res.data };
};

export const getClientInvoiceByIdApi = async (tenantId, invoiceId) => {
  const res = await http.get(`/${tenantId}/invoices/${invoiceId}`);
  return { data: res.data };
};

export const getNextInvoiceNumberApi = async (tenantId, clientId, projectId) => {
  const params = new URLSearchParams({ clientId });
  if (projectId) params.set("projectId", projectId);
  const res = await http.get(`/${tenantId}/invoices/next-number?${params}`);
  return { data: res.data };
};

export const createInvoiceApi = async (payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.post(`/${tenantId}/invoices`, payload);
  return { data: res.data };
};

export const updateInvoiceApi = async (id, payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  const res = await http.put(`/${tenantId}/invoices/${id}`, payload);
  return { data: res.data };
};

export const deleteInvoiceApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.delete(`/${tenantId}/invoices/${id}`);
  return { data: res.data };
};

export const approveInvoiceApi = async (id, approvedBy) => {
  const tenantId = getTenantId();
  const res = await http.patch(`/${tenantId}/invoices/${id}/approve`, { approvedBy });
  return { data: res.data };
};

export const confirmPaymentApi = async (invoiceId, payload) => {
  const tenantId = getTenantId();
  const isFormData = payload instanceof FormData;
  const res = await http.post(
    `/${tenantId}/invoices/${invoiceId}/confirm-payment`,
    payload,
    isFormData ? { headers: { "Content-Type": "multipart/form-data" } } : {},
  );
  return { data: res.data };
};
