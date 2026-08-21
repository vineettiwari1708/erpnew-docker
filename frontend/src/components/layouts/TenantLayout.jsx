import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "./Sidebar";
import Header from "./Header";

export default function TenantLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  return (
    <div className="min-h-screen bg-slate-100 lg:flex">
     <Sidebar
  sidebarOpen={sidebarOpen}
  setSidebarOpen={setSidebarOpen}
  compact={compact}
  setCompact={setCompact}
/>
      <div className="flex min-w-0 flex-1 flex-col">
        <Header setSidebarOpen={setSidebarOpen} />
        <main className="p-4 sm:p-6">
          <Outlet />
        </main>
      </div>
    </div>
  );
}

