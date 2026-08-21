import { createSlice } from "@reduxjs/toolkit";

const tenantSlice = createSlice({
  name: "tenant",
  initialState: {
    currentTenant: null,
    tenants: []
  },
  reducers: {
    setTenant: (state, action) => {
      state.currentTenant = action.payload;
    },

    setTenants: (state, action) => {
      state.tenants = action.payload;
    }
  }
});

export const { setTenant, setTenants } = tenantSlice.actions;
export default tenantSlice.reducer;