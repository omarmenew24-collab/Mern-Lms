import { useMemo } from "react";
import { useTranslation } from "react-i18next";

const OTHER = "__cc_other__";

/**
 * Dropdown of merged suggestions (site defaults + admin + this teacher) plus a text field.
 * `onChange` matches a text input: `{ target: { name, value } }`.
 */
export default function CourseCategoryField({
  name = "category",
  value,
  onChange,
  options = [],
  disabled = false,
  inputClass = "",
  selectClass,
  idPrefix = "cc",
  label,
  helpText = null,
  required = true,
  placeholder,
  children = null,
}) {
  const { t } = useTranslation();
  const resolvedLabel = label || t("workspace.courseFields.categoryLabel");
  const resolvedPlaceholder = placeholder || t("workspace.courseFields.categoryPlaceholder");
  const names = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const c of options) {
      const n = String(c?.name ?? "")
        .trim();
      if (!n) continue;
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
    return out.sort((a, b) =>
      a.localeCompare(b, undefined, { sensitivity: "base" }),
    );
  }, [options]);

  const inList = value && names.some((n) => n === value);
  const selectValue = !value ? "" : inList ? value : OTHER;

  const baseSelect = selectClass || `${inputClass} mb-1.5`;

  return (
    <div>
      <label
        className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
        htmlFor={`${idPrefix}-category-text`}
      >
        {resolvedLabel}
      </label>
      <select
        id={`${idPrefix}-category-sel`}
        className={baseSelect}
        value={selectValue}
        disabled={disabled}
        onChange={(e) => {
          const v = e.target.value;
          if (v === "") {
            onChange({ target: { name, value: "" } });
            return;
          }
          if (v === OTHER) {
            return;
          }
          onChange({ target: { name, value: v } });
        }}
        aria-label={t("workspace.courseFields.chooseSuggested")}
      >
        <option value="">{t("workspace.courseFields.choosePrompt")}</option>
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value={OTHER}>{t("workspace.courseFields.otherOption")}</option>
      </select>
      <input
        id={`${idPrefix}-category-text`}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={resolvedPlaceholder}
        className={inputClass}
        required={required}
        disabled={disabled}
        autoComplete="off"
        maxLength={80}
      />
      {helpText}
      {children}
    </div>
  );
}
