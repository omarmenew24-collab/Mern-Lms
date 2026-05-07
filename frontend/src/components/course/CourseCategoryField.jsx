import { useMemo } from "react";

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
  label = "Category",
  helpText = null,
  required = true,
  placeholder = "e.g. Web development",
  children = null,
}) {
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
        {label}
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
        aria-label="Choose from suggested categories"
      >
        <option value="">— Choose a category (see list) —</option>
        {names.map((n) => (
          <option key={n} value={n}>
            {n}
          </option>
        ))}
        <option value={OTHER}>Other — type your own in the field below</option>
      </select>
      <input
        id={`${idPrefix}-category-text`}
        type="text"
        name={name}
        value={value}
        onChange={onChange}
        placeholder={placeholder}
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
