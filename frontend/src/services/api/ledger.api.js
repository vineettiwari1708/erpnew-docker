import http from "./http";
import { store } from "../../store/store";

const getTenantId = () => store.getState().auth.user?.tenantId;

export const getLedgerApi = async (tenantId) => {
  const res = await http.get(`/${tenantId}/ledger`);
  return { data: res.data };
};

export const getLedgerByIdApi = async (id) => {
  const tenantId = getTenantId();
  const res = await http.get(`/${tenantId}/ledger/${id}`);
  return { data: res.data };
};
