import { useState } from "react";
import { Outlet } from "react-router-dom";
import Sidebar from "../../components/layouts/Sidebar";
import Header from "../../components/layouts/Header";
import ErrorBoundary from "../ErrorBoundary";

export default function SystemLayout() {
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const [compact, setCompact] = useState(false);

  return (
    <div className="flex h-screen overflow-hidden">
      <Sidebar
        sidebarOpen={sidebarOpen}
        setSidebarOpen={setSidebarOpen}
        compact={compact}
        setCompact={setCompact}
      />

      <div className="flex flex-1 flex-col overflow-hidden">
        <Header setSidebarOpen={setSidebarOpen} />

        <main className="flex-1 overflow-y-auto p-5">
          <ErrorBoundary>
            <Outlet />
          </ErrorBoundary>
        </main>
      </div>
    </div>
  );
}

