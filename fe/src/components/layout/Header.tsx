import type { FC } from "react";
import { useAuth } from "../../routes/AuthContext";

type Props = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

const Header: FC<Props> = ({ isSidebarCollapsed }) => {
  const { logout } = useAuth();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 md:px-6">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500">
            Today
          </p>
          <p className="text-lg font-semibold text-slate-900">
            {isSidebarCollapsed ? "Focus mode" : "Keep your streak alive"}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-3">
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 md:flex">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Focus mode
        </div>
        <button
          onClick={logout}
          className="rounded-full bg-slate-900 px-3 py-1.5 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800"
        >
          Log out
        </button>
      </div>
    </header>
  );
};

export default Header;
