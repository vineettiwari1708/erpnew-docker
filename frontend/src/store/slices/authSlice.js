import { createSlice } from "@reduxjs/toolkit";

const AUTH_KEY = "erp_auth";

function loadAuth() {
  try {
    const raw = localStorage.getItem(AUTH_KEY);
    return raw ? JSON.parse(raw) : { user: null, token: null, isAuthenticated: false };
  } catch {
    return { user: null, token: null, isAuthenticated: false };
  }
}

const authSlice = createSlice({
  name: "auth",
  initialState: loadAuth(),
  reducers: {
    loginSuccess: (state, action) => {
      state.user            = action.payload.user;
      state.token           = action.payload.token;
      state.isAuthenticated = true;
      localStorage.setItem(AUTH_KEY, JSON.stringify({ user: state.user, token: state.token, isAuthenticated: true }));
    },

    updateProfile: (state, action) => {
      if (state.user) {
        state.user = { ...state.user, ...action.payload };
        localStorage.setItem(AUTH_KEY, JSON.stringify({ user: state.user, token: state.token, isAuthenticated: true }));
      }
    },

    logout: (state) => {
      state.user            = null;
      state.token           = null;
      state.isAuthenticated = false;
      localStorage.removeItem(AUTH_KEY);
    },
  },
});

export const { loginSuccess, updateProfile, logout } = authSlice.actions;
export default authSlice.reducer;