import i18n from "i18next";
import { initReactI18next } from "react-i18next";
import {
  resources,
  defaultLanguage,
  supportedLanguages,
  languageMeta,
} from "./translations";

export const LANGUAGE_STORAGE_KEY = "lms.language";

function isSupportedLanguage(language) {
  return supportedLanguages.includes(language);
}

/**
 * Detect the visitor's preferred language from the browser when no choice has
 * been saved yet. Arabic-locale browsers (e.g. "ar", "ar-EG") get Arabic;
 * everyone else falls back to English (the neutral default).
 */
function detectBrowserLanguage() {
  if (typeof navigator === "undefined") return "en";

  const candidates = Array.isArray(navigator.languages) && navigator.languages.length
    ? navigator.languages
    : [navigator.language];

  for (const tag of candidates) {
    if (typeof tag === "string" && tag.toLowerCase().startsWith("ar")) {
      return "ar";
    }
  }
  return "en";
}

function getStoredLanguage() {
  if (typeof window === "undefined") return "en";

  const persisted = window.localStorage.getItem(LANGUAGE_STORAGE_KEY);
  if (isSupportedLanguage(persisted)) return persisted;

  // No saved preference yet: auto-detect from the browser, then guard.
  const detected = detectBrowserLanguage();
  return isSupportedLanguage(detected) ? detected : "en";
}

function getDirection(language) {
  return languageMeta[language]?.direction || languageMeta[defaultLanguage].direction;
}

function applyHtmlLanguageAttributes(language) {
  if (typeof document === "undefined") return;

  document.documentElement.lang = language;
  document.documentElement.dir = getDirection(language);
}

const initialLanguage = getStoredLanguage();

i18n.use(initReactI18next).init({
  resources,
  lng: initialLanguage,
  fallbackLng: "en",
  supportedLngs: supportedLanguages,
  defaultNS: "common",
  interpolation: {
    escapeValue: false,
  },
  returnNull: false,
  // Enable CLDR plural rules (zero/one/two/few/many/other) for Arabic
  compatibilityJSON: "v4",
});

applyHtmlLanguageAttributes(initialLanguage);

i18n.on("languageChanged", (language) => {
  if (typeof window !== "undefined") {
    window.localStorage.setItem(LANGUAGE_STORAGE_KEY, language);
  }
  applyHtmlLanguageAttributes(language);
});

export default i18n;
