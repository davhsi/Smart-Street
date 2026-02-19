import React from 'react';
import { useTranslation } from 'react-i18next';

const LanguageSwitcher = () => {
  const { i18n } = useTranslation();

  const toggleLanguage = () => {
    const newLang = i18n.language === 'en' ? 'ta' : 'en';
    i18n.changeLanguage(newLang);
  };

  return (
    <div
      onClick={toggleLanguage}
      className="relative flex items-center w-24 h-8 bg-slate-200 dark:bg-slate-800 rounded-lg cursor-pointer border border-slate-300 dark:border-slate-700 p-0.5 select-none transition-all hover:border-slate-400 dark:hover:border-slate-600"
      role="button"
      aria-label="Toggle Language"
    >
      {/* Sliding Active Background */}
      <div
        className={`absolute top-0.5 bottom-0.5 w-[calc(50%-2px)] rounded-md shadow-sm transition-all duration-300 ease-out flex items-center justify-center ${i18n.language === 'en'
            ? 'left-0.5 bg-blue-600'
            : 'left-[calc(50%+1px)] bg-green-600'
          }`}
      />

      {/* Text Labels */}
      <div className="relative z-10 flex w-full h-full text-xs font-bold leading-none">
        <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${i18n.language === 'en' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
          }`}>
          EN
        </div>
        <div className={`flex-1 flex items-center justify-center transition-colors duration-300 ${i18n.language === 'ta' ? 'text-white' : 'text-slate-600 dark:text-slate-400'
          }`}>
          தமிழ்
        </div>
      </div>
    </div>
  );
};

export default LanguageSwitcher;
