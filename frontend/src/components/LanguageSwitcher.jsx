import { Languages } from "lucide-react";
import { useTranslation } from "react-i18next";

const LANGUAGE_OPTIONS = ["ar", "en"];

const LanguageSwitcher = () => {
  const { i18n, t } = useTranslation();

  const activeLanguage = i18n.language?.startsWith("ar") ? "ar" : "en";

  const handleLanguageChange = (language) => {
    if (language === activeLanguage) return;
    i18n.changeLanguage(language);
  };

  return (
    <div className="flex items-center gap-2 rounded-full border border-gray-200 dark:border-gray-800 bg-white/70 dark:bg-gray-900/60 px-1 py-1 transition-colors">
      <span
        className="inline-flex items-center justify-center text-gray-500 dark:text-gray-400 px-2"
        aria-hidden
      >
        <Languages className="w-4 h-4" />
      </span>

      {LANGUAGE_OPTIONS.map((language) => {
        const isActive = language === activeLanguage;
        return (
          <button
            key={language}
            type="button"
            onClick={() => handleLanguageChange(language)}
            className={`rounded-full px-3 py-1.5 text-xs font-semibold transition-all duration-200 ${
              isActive
                ? "bg-brand-600 text-white shadow-sm"
                : "text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800"
            }`}
            aria-pressed={isActive}
            title={t("language.switchLabel")}
          >
            {language === "ar" ? t("language.arabic") : t("language.english")}
          </button>
        );
      })}
    </div>
  );
};

export default LanguageSwitcher;
