import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";

type Props = {
  children: ReactNode;
};

const MainLayout = ({ children }: Props) => {
  const [isSidebarCollapsed, setIsSidebarCollapsed] = useState<boolean>(() => {
    const stored = localStorage.getItem("sidebarCollapsed");
    return stored === "true";
  });

  useEffect(() => {
    localStorage.setItem("sidebarCollapsed", String(isSidebarCollapsed));
  }, [isSidebarCollapsed]);

  const sidebarWidth = isSidebarCollapsed ? "md:w-16" : "md:w-64";
  const mainOffset = isSidebarCollapsed ? "md:ml-16" : "md:ml-64";

  return (
    <div className="flex min-h-screen bg-slate-50 text-slate-900">
      <Sidebar
        isCollapsed={isSidebarCollapsed}
        onToggle={() => setIsSidebarCollapsed((prev) => !prev)}
        widthClass={sidebarWidth}
      />
      <div className={`flex flex-1 flex-col overflow-hidden ${mainOffset} transition-[margin] duration-200`}>
        <Header
          isSidebarCollapsed={isSidebarCollapsed}
          onToggleSidebar={() => setIsSidebarCollapsed((prev) => !prev)}
        />
        <main className="flex-1 overflow-y-auto p-6 transition-all duration-200">{children}</main>
      </div>
    </div>
  );
};

export default MainLayout;
