import { createSlice } from "@reduxjs/toolkit";

const uiSlice = createSlice({
  name: "ui",
  initialState: {
    sidebarOpen: true,
    theme: "light"
  },
  reducers: {
    toggleSidebar: (state) => {
      state.sidebarOpen = !state.sidebarOpen;
    },

    setTheme: (state, action) => {
      state.theme = action.payload;
    }
  }
});

export const { toggleSidebar, setTheme } = uiSlice.actions;
export default uiSlice.reducer;