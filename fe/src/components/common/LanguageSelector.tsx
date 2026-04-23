import type { FC } from 'react';
import { useTranslation } from 'react-i18next';
import { Languages } from 'lucide-react';

const LanguageSelector: FC = () => {
  const { i18n } = useTranslation();

  const changeLanguage = (lng: string) => {
    i18n.changeLanguage(lng);
  };

  return (
    <div className="relative flex items-center group">
      <button className="p-2 rounded-full hover:bg-slate-100 dark:hover:bg-slate-800 transition-colors">
        <Languages className="w-5 h-5 text-slate-600 dark:text-slate-400" />
      </button>
      <div className="absolute right-0 top-full mt-1 hidden group-hover:block bg-white dark:bg-slate-900 border border-slate-200 dark:border-slate-800 rounded-lg shadow-lg overflow-hidden z-50 min-w-[120px]">
        <button
          onClick={() => changeLanguage('vi')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
            i18n.language === 'vi' ? 'text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          Tiếng Việt
        </button>
        <button
          onClick={() => changeLanguage('en')}
          className={`w-full text-left px-4 py-2 text-sm hover:bg-slate-50 dark:hover:bg-slate-800 ${
            i18n.language === 'en' ? 'text-blue-600 font-bold' : 'text-slate-600 dark:text-slate-400'
          }`}
        >
          English
        </button>
      </div>
    </div>
  );
};

export default LanguageSelector;
