import { Plus, Trash2, LayoutList } from "lucide-react";
import { useTranslation } from "react-i18next";

const inputClass =
  "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";
const textareaClass =
  "w-full min-h-[2.5rem] px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

const MAX_LINES = 10;

function LineListEditor({
  label,
  hint,
  lines,
  onChange,
  placeholder,
  disabled,
}) {
  const { t } = useTranslation();
  const resolvedPlaceholder = placeholder || t("workspace.catalogForm.addLinePlaceholder");
  const add = () => {
    if (lines.length >= MAX_LINES) return;
    onChange([...lines, ""]);
  };
  const remove = (i) => onChange(lines.filter((_, j) => j !== i));
  const setLine = (i, v) => onChange(lines.map((l, j) => (j === i ? v : l)));

  return (
    <div>
      <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
        {label}
      </label>
      {hint ? (
        <p className="text-[11px] text-gray-500 dark:text-gray-500 mb-2">{hint}</p>
      ) : null}
      <div className="space-y-2">
        {lines.map((line, i) => (
          <div key={i} className="flex gap-2 items-start">
            <textarea
              value={line}
              onChange={(e) => setLine(i, e.target.value)}
              placeholder={resolvedPlaceholder}
              rows={2}
              disabled={disabled}
              className={`${textareaClass} flex-1 resize-y min-h-[2.75rem]`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              className="mt-1 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40"
              aria-label={t("workspace.catalogForm.removeLine")}
            >
              <Trash2 className="w-4 h-4" />
            </button>
          </div>
        ))}
        {lines.length < MAX_LINES && (
          <button
            type="button"
            onClick={add}
            disabled={disabled}
            className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
          >
            <Plus className="w-3.5 h-3.5" /> {t("workspace.catalogForm.addLine")}
          </button>
        )}
      </div>
    </div>
  );
}

/**
 * Controlled fields for public course page sections (catalog / marketing).
 * Matches backend: learningOutcomes, requirements, includesExtras, courseLanguage, purchaseNote, toggles.
 */
export default function CourseCatalogSectionsForm({ value, onChange, disabled, compact = false }) {
  const { t } = useTranslation();
  const patch = (partial) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-6">
      {!compact && (
        <>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            <LayoutList className="w-4 h-4 text-brand-500" />
            {t("workspace.catalogForm.publicCoursePage")}
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            {t("workspace.catalogForm.intro")}
          </p>
        </>
      )}
      {compact && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("workspace.catalogForm.introCompact")}
        </p>
      )}

      <LineListEditor
        label={t("workspace.catalogForm.learnLabel")}
        hint={t("workspace.catalogForm.learnHint", { max: MAX_LINES })}
        lines={value.learningOutcomes || []}
        onChange={(learningOutcomes) => patch({ learningOutcomes })}
        disabled={disabled}
        placeholder={t("workspace.catalogForm.learnPlaceholder")}
      />

      <LineListEditor
        label={t("workspace.catalogForm.reqLabel")}
        hint={t("workspace.catalogForm.reqHint")}
        lines={value.requirements || []}
        onChange={(requirements) => patch({ requirements })}
        disabled={disabled}
        placeholder={t("workspace.catalogForm.reqPlaceholder")}
      />

      <LineListEditor
        label={t("workspace.catalogForm.includesLabel")}
        hint={t("workspace.catalogForm.includesHint")}
        lines={value.includesExtras || []}
        onChange={(includesExtras) => patch({ includesExtras })}
        disabled={disabled}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {t("workspace.catalogForm.courseLanguage")}
          </label>
          <input
            type="text"
            value={value.courseLanguage ?? "English"}
            onChange={(e) => patch({ courseLanguage: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder={t("workspace.catalogForm.courseLanguagePlaceholder")}
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            {t("workspace.catalogForm.sidebarNote")}
          </label>
          <input
            type="text"
            value={value.purchaseNote ?? ""}
            onChange={(e) => patch({ purchaseNote: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder={t("workspace.catalogForm.sidebarPlaceholder")}
          />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
            {t("workspace.catalogForm.sidebarHint")}
          </p>
        </div>
      </div>

      <div className="flex flex-col sm:flex-row sm:flex-wrap gap-4">
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.showCertificateInCatalog !== false}
            onChange={(e) => patch({ showCertificateInCatalog: e.target.checked })}
            disabled={disabled}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t("workspace.catalogForm.showCertificate")}
          </span>
        </label>
        <label className="inline-flex items-center gap-2 cursor-pointer select-none">
          <input
            type="checkbox"
            checked={value.showLifetimeAccessInCatalog !== false}
            onChange={(e) => patch({ showLifetimeAccessInCatalog: e.target.checked })}
            disabled={disabled}
            className="rounded border-gray-300 text-brand-600 focus:ring-brand-500"
          />
          <span className="text-sm text-gray-700 dark:text-gray-300">
            {t("workspace.catalogForm.showLifetime")}
          </span>
        </label>
      </div>
    </div>
  );
}

export const emptyCatalogForm = () => ({
  learningOutcomes: [],
  requirements: [],
  includesExtras: [],
  courseLanguage: "English",
  purchaseNote: "",
  showCertificateInCatalog: true,
  showLifetimeAccessInCatalog: true,
});

export function catalogFromCourse(course) {
  if (!course) return emptyCatalogForm();
  return {
    learningOutcomes: Array.isArray(course.learningOutcomes) ? [...course.learningOutcomes] : [],
    requirements: Array.isArray(course.requirements) ? [...course.requirements] : [],
    includesExtras: Array.isArray(course.includesExtras) ? [...course.includesExtras] : [],
    courseLanguage: course.courseLanguage || "English",
    purchaseNote: course.purchaseNote ?? "",
    showCertificateInCatalog: course.showCertificateInCatalog !== false,
    showLifetimeAccessInCatalog: course.showLifetimeAccessInCatalog !== false,
  };
}
