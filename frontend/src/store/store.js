import { configureStore } from "@reduxjs/toolkit";

import authReducer from "../slices/authSlice";
import tenantReducer from "../slices/tenantSlice";
import permissionReducer from "../slices/permissionSlice";
import uiReducer from "../slices/uiSlice";

export const store = configureStore({
  reducer: {
    auth: authReducer,
    tenant: tenantReducer,
    permission: permissionReducer,
    ui: uiReducer
  }
});