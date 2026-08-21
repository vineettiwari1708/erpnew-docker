import { createSlice } from "@reduxjs/toolkit";

const permissionSlice = createSlice({
  name: "permission",
  initialState: {
    permissions: []
  },
  reducers: {
    setPermissions: (state, action) => {
      state.permissions = action.payload;
    }
  }
});

export const { setPermissions } = permissionSlice.actions;
export default permissionSlice.reducer;