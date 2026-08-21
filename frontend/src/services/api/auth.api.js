import http from "./http";

export const loginApi = async (email, password) => {
  try {
    const res = await http.post("/auth/login", { email, password });
    const { user, token } = res.data;
    const normalizedUser = { ...user, role: user.role?.name ?? user.role };
    return { data: { user: normalizedUser, token } };
  } catch (err) {
    // Surface the actual server error message instead of the generic Axios one
    const message = err.response?.data?.message || err.message || "Login failed";
    throw new Error(message);
  }
};
