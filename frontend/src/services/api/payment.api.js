import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getPaymentsApi = async (tenantId) => {
  const res = await http.get(`/${tenantId}/payments`);
  return { data: res.data };
};

export const getPaymentByIdApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/payments/${id}`);
  return { data: res.data };
};

export const getClientPaymentsApi = async (tenantId, clientId) => {
  const res = await http.get(`/${tenantId}/payments/client/${clientId}`);
  return { data: res.data };
};

export const getClientPaymentByIdApi = async (tenantId, paymentId) => {
  const res = await http.get(`/${tenantId}/payments/${paymentId}`);
  return { data: res.data };
};

export const createPaymentApi = async (payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  // Use FormData if a proof file is included
  if (payload.proofFile instanceof File) {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (k !== "proofFile" && v != null) form.append(k, v);
    });
    form.append("proof", payload.proofFile);
    const res = await http.post(`/${tenantId}/payments`, form);
    return { data: res.data };
  }
  const res = await http.post(`/${tenantId}/payments`, payload);
  return { data: res.data };
};

export const updatePaymentApi = async (id, payload) => {
  const tenantId = payload?.tenantId || getTenantId();
  if (payload.proofFile instanceof File) {
    const form = new FormData();
    Object.entries(payload).forEach(([k, v]) => {
      if (k !== "proofFile" && v != null) form.append(k, v);
    });
    form.append("proof", payload.proofFile);
    const res = await http.put(`/${tenantId}/payments/${id}`, form);
    return { data: res.data };
  }
  const res = await http.put(`/${tenantId}/payments/${id}`, payload);
  return { data: res.data };
};

export const deletePaymentApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.delete(`/${tenantId}/payments/${id}`);
  return { data: res.data };
};
