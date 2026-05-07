import { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import { useTranslation } from "react-i18next";

const inputClass =
  "w-full h-11 ps-4 pe-11 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

/**
 * Password field with optional visibility toggle (professional auth forms).
 */
export default function PasswordInput({
  id,
  name,
  label,
  value,
  onChange,
  placeholder = "Enter your password",
  autoComplete = "current-password",
  required = true,
  showToggle = true,
}) {
  const { t } = useTranslation();
  const [visible, setVisible] = useState(false);

  return (
    <div>
      {label ? (
        <label
          htmlFor={id}
          className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5"
        >
          {label}
        </label>
      ) : null}
      <div className="relative">
        <input
          id={id}
          name={name}
          type={showToggle && visible ? "text" : "password"}
          value={value}
          onChange={onChange}
          placeholder={placeholder}
          autoComplete={autoComplete}
          required={required}
          className={inputClass}
        />
        {showToggle ? (
          <button
            type="button"
            tabIndex={-1}
            aria-label={visible ? t("auth.passwordInput.hide") : t("auth.passwordInput.show")}
            className="absolute end-1 top-1/2 -translate-y-1/2 p-2 rounded-md text-gray-500 hover:text-gray-800 dark:text-gray-400 dark:hover:text-gray-100 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            onClick={() => setVisible((v) => !v)}
          >
            {visible ? <EyeOff className="w-4 h-4" strokeWidth={2} /> : <Eye className="w-4 h-4" strokeWidth={2} />}
          </button>
        ) : null}
      </div>
    </div>
  );
}
