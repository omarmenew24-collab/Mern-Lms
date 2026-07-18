import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const HeaderCenter = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);
  const [mobileOpen, setMobileOpen] = useState(false);
  const mobileInputRef = useRef(null);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  useEffect(() => {
    if (mobileOpen) mobileInputRef.current?.focus();
  }, [mobileOpen]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    navigate(trimmed ? `/?q=${encodeURIComponent(trimmed)}` : "/");
    setMobileOpen(false);
  };

  const fieldClass =
    "flex items-center h-10 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 transition-colors focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500";
  const inputClass =
    "flex-1 ms-3 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none";

  return (
    <div className="flex-1 flex items-center justify-end md:justify-stretch md:mx-4 md:max-w-lg">
      {/* Desktop inline search */}
      <form onSubmit={handleSubmit} className={`hidden md:flex w-full ${fieldClass}`}>
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("nav.searchPlaceholder")}
          className={inputClass}
        />
        {query.trim() && (
          <button
            type="button"
            onClick={() => {
              setQuery("");
              navigate("/");
            }}
            className="ms-1 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        )}
      </form>

      {/* Mobile search toggle */}
      <button
        type="button"
        onClick={() => setMobileOpen((v) => !v)}
        aria-label={t("nav.search")}
        aria-expanded={mobileOpen}
        className="md:hidden shrink-0 rounded-lg p-2 text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
      >
        {mobileOpen ? <X className="w-5 h-5" /> : <Search className="w-5 h-5" />}
      </button>

      {/* Mobile search overlay row — docks below the 64px header without growing it */}
      {mobileOpen && (
        <div className="md:hidden absolute top-full inset-x-0 z-40 bg-white dark:bg-gray-950 border-b border-gray-200 dark:border-gray-800 shadow-sm px-4 py-3">
          <form onSubmit={handleSubmit} className={fieldClass}>
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              ref={mobileInputRef}
              type="text"
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              placeholder={t("nav.searchPlaceholder")}
              className={inputClass}
            />
            {query.trim() && (
              <button
                type="button"
                onClick={() => {
                  setQuery("");
                  navigate("/");
                }}
                className="ms-1 p-1 rounded-full text-gray-400 hover:text-gray-600 dark:hover:text-gray-200 transition-colors"
              >
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </form>
        </div>
      )}
    </div>
  );
};

export default HeaderCenter;
