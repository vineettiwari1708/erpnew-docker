import ReactDOM from "react-dom/client";
import { Provider } from "react-redux";
import { Toaster } from "react-hot-toast";
import { store } from "./store/store";
import { RouterProvider } from "react-router-dom";
import { router } from "./routes/routes";

ReactDOM.createRoot(document.getElementById("root")).render(
  <Provider store={store}>
    <RouterProvider router={router} />
    <Toaster
      position="top-right"
      toastOptions={{
        duration: 3500,
        success: { style: { background: "#f0fdf4", color: "#166534", border: "1px solid #bbf7d0" } },
        error:   { style: { background: "#fef2f2", color: "#991b1b", border: "1px solid #fecaca" } },
      }}
    />
  </Provider>
);