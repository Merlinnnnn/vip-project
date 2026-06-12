import type { FC } from "react";
import { useAuth } from "../../context/AuthContext";
import { useTranslation } from "react-i18next";
import ThemeToggle from "../ui/ThemeToggle";
import LanguageSelector from "../ui/LanguageSelector";

type Props = {
  isSidebarCollapsed: boolean;
  onToggleSidebar: () => void;
};

const Header: FC<Props> = ({ isSidebarCollapsed }) => {
  const { logout } = useAuth();
  const { t } = useTranslation();

  return (
    <header className="flex items-center justify-between gap-4 border-b border-slate-200 bg-white px-4 py-4 md:px-6 dark:border-slate-800 dark:bg-slate-900 transition-colors duration-300">
      <div className="flex items-center gap-3">
        <div>
          <p className="text-xs uppercase tracking-[0.2em] text-slate-500 dark:text-slate-400">
             {new Date().toLocaleDateString()}
          </p>
          <p className="text-lg font-semibold text-slate-900 dark:text-white">
            {isSidebarCollapsed ? "Focus mode" : t('dashboard.welcome')}
          </p>
        </div>
      </div>
      <div className="flex items-center gap-4">
        <div className="flex items-center gap-2">
          <ThemeToggle />
          <LanguageSelector />
        </div>
        
        <div className="hidden items-center gap-2 rounded-full border border-slate-200 px-3 py-1 text-sm text-slate-700 md:flex dark:border-slate-800 dark:text-slate-300">
          <span className="inline-block h-2 w-2 rounded-full bg-emerald-500" />
          Focus mode
        </div>
        <button
          onClick={logout}
          className="rounded-full bg-slate-900 px-4 py-2 text-sm font-semibold text-white shadow-sm transition hover:bg-slate-800 dark:bg-white dark:text-slate-900 dark:hover:bg-slate-100"
        >
          {t('common.logout')}
        </button>
      </div>
    </header>
  );
};

export default Header;
