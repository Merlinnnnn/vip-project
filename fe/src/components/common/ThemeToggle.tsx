import type { FC } from 'react';
import { Sun, Moon } from 'lucide-react';
import { useThemeStore } from '../../store/useThemeStore';

const ThemeToggle: FC = () => {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      onClick={toggleTheme}
      className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors"
      aria-label="Toggle Theme"
    >
      {theme === 'light' ? (
        <Moon className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      ) : (
        <Sun className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      )}
    </button>
  );
};

export default ThemeToggle;
