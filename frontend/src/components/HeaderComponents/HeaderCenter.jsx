import { useState, useEffect } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { Search, X } from "lucide-react";
import { useTranslation } from "react-i18next";

const HeaderCenter = () => {
  const navigate = useNavigate();
  const { t } = useTranslation();
  const [searchParams] = useSearchParams();
  const urlQuery = searchParams.get("q") || "";
  const [query, setQuery] = useState(urlQuery);

  useEffect(() => {
    setQuery(urlQuery);
  }, [urlQuery]);

  const handleSubmit = (e) => {
    e.preventDefault();
    const trimmed = query.trim();
    if (trimmed) {
      navigate(`/?q=${encodeURIComponent(trimmed)}`);
    } else {
      navigate("/");
    }
  };

  return (
    <div className="flex-1 max-w-lg mx-4">
      <form
        onSubmit={handleSubmit}
        className="flex items-center h-10 rounded-full border border-gray-300 dark:border-gray-700 bg-gray-50 dark:bg-gray-900 px-4 transition-colors focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500"
      >
        <Search className="w-4 h-4 text-gray-400 shrink-0" />
        <input
          type="text"
          value={query}
          onChange={(e) => setQuery(e.target.value)}
          placeholder={t("nav.searchPlaceholder")}
          className="flex-1 ms-3 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 dark:placeholder-gray-500 focus:outline-none"
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
  );
};

export default HeaderCenter;
