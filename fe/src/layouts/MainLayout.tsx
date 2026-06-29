import type { ReactNode } from "react";
import { useEffect, useState } from "react";
import { Toaster } from "react-hot-toast";
import Header from "../components/layout/Header";
import Sidebar from "../components/layout/Sidebar";
import { useNotifications } from "../hooks/useNotifications";
import { useThemeStore } from "../store/useThemeStore";

type Props = {
  children: ReactNode;
};

const MainLayout = ({ children }: Props) => {
  useNotifications();
  const { theme } = useThemeStore();
  
  useEffect(() => {
    const root = window.document.documentElement;
    root.classList.remove('light', 'dark');
    root.classList.add(theme);
  }, [theme]);

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
    <div className={`flex h-screen overflow-hidden bg-[var(--surface-base)] text-[var(--text-primary)] transition-colors duration-300`}>
      <Toaster position="top-right" />
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
        <main className="flex-1 overflow-y-auto p-6 transition-all duration-200">
          <div className="h-full flex flex-col">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;
