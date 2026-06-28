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
    <header className="flex h-[var(--header-height)] items-center justify-between gap-4 border-b border-[var(--border-default)] bg-[var(--surface-primary)] px-4 py-4 md:px-6 transition-colors duration-300">
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
        
        <div className="hidden items-center gap-2 rounded-full border border-[var(--border-default)] px-3 py-1 text-sm text-[var(--text-secondary)] md:flex">
          <span className="inline-block h-2 w-2 rounded-full bg-[var(--accent-success)]" />
          Focus mode
        </div>
        <button
          onClick={logout}
          className="rounded-full bg-[var(--text-primary)] px-4 py-1.5 text-sm font-semibold text-[var(--surface-primary)] shadow-[var(--shadow-sm)] transition hover:opacity-90"
        >
          {t('common.logout')}
        </button>
      </div>
    </header>
  );
};

export default Header;
