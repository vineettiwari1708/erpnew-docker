import { useEffect } from "react";
import { useDispatch } from "react-redux";
import { useNavigate } from "react-router-dom";
import { logout } from "../../store/slices/authSlice";

export default function Logout() {
  const dispatch  = useDispatch();
  const navigate  = useNavigate();

  useEffect(() => {
    dispatch(logout());
    navigate("/login", { replace: true });
  }, []);

  return (
    <div className="flex min-h-screen items-center justify-center bg-slate-100">
      <div className="rounded-xl border border-slate-200 bg-white px-8 py-6 shadow-sm">
        <h2 className="text-lg font-semibold text-slate-800">Logging out...</h2>
        <p className="mt-1 text-sm text-slate-500">Please wait</p>
      </div>
    </div>
  );
}
