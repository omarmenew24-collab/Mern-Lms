/**
 * Locale-aware formatting utilities.
 * Always pass i18n.language so formatting matches the active UI language.
 *
 * Usage:
 *   import { formatMoney, formatNumber, formatDate } from "../lib/i18nFormatters";
 *   const price = formatMoney(99.99, i18n.language);          // "$99.99" or "99.99 $"
 *   const count = formatNumber(1234, i18n.language);           // "1,234" or "١٬٢٣٤"
 *   const date  = formatDate(new Date(), i18n.language);       // locale-aware date string
 *
 * Or use the hook (preferred in React components):
 *   import { useFormatter } from "../lib/i18nFormatters";
 *   const { money, number, date, shortDate } = useFormatter();
 */

import { useTranslation } from "react-i18next";

/**
 * Format a monetary value with the correct locale symbol/placement.
 * Arabic uses Western Arabic numerals for prices in most financial UIs, which
 * `Intl.NumberFormat` handles correctly when locale is "ar-SA" or "ar".
 */
export function formatMoney(value, language, currency = "USD") {
  if (value == null || isNaN(value)) return "—";
  const locale = language === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(locale, {
    style: "currency",
    currency,
    maximumFractionDigits: 2,
  }).format(value);
}

/**
 * Format a plain number with locale-aware digit grouping.
 */
export function formatNumber(value, language, options = {}) {
  if (value == null || isNaN(value)) return "—";
  const locale = language === "ar" ? "ar-SA" : "en-US";
  return new Intl.NumberFormat(locale, options).format(value);
}

/**
 * Format a date for display. Defaults to a medium date style.
 */
export function formatDate(value, language, options = { dateStyle: "medium" }) {
  if (!value) return "—";
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format a date+time for display.
 */
export function formatDateTime(value, language, options = { dateStyle: "medium", timeStyle: "short" }) {
  if (!value) return "—";
  const locale = language === "ar" ? "ar-SA" : "en-US";
  const d = value instanceof Date ? value : new Date(value);
  if (isNaN(d.getTime())) return "—";
  return new Intl.DateTimeFormat(locale, options).format(d);
}

/**
 * Format a short date (month + year only, e.g. "January 2025" / "يناير 2025").
 */
export function formatMonthYear(value, language) {
  return formatDate(value, language, { year: "numeric", month: "long" });
}

/**
 * React hook — returns formatter functions pre-bound to the current i18n language.
 * Automatically re-runs when language changes.
 */
export function useFormatter() {
  const { i18n } = useTranslation();
  const lang = i18n.language;

  return {
    money: (value, currency) => formatMoney(value, lang, currency),
    number: (value, opts) => formatNumber(value, lang, opts),
    date: (value, opts) => formatDate(value, lang, opts),
    dateTime: (value, opts) => formatDateTime(value, lang, opts),
    monthYear: (value) => formatMonthYear(value, lang),
  };
}
