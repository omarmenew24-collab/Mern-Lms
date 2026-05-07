import { Plus, Trash2, LayoutList } from "lucide-react";

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
  placeholder = "Add a line…",
  disabled,
}) {
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
              placeholder={placeholder}
              rows={2}
              disabled={disabled}
              className={`${textareaClass} flex-1 resize-y min-h-[2.75rem]`}
            />
            <button
              type="button"
              onClick={() => remove(i)}
              disabled={disabled}
              className="mt-1 p-2 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 disabled:opacity-40"
              aria-label="Remove line"
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
            <Plus className="w-3.5 h-3.5" /> Add line
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
  const patch = (partial) => onChange({ ...value, ...partial });

  return (
    <div className="space-y-6">
      {!compact && (
        <>
          <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white border-b border-gray-100 dark:border-gray-800 pb-2">
            <LayoutList className="w-4 h-4 text-brand-500" />
            Public course page
          </div>
          <p className="text-xs text-gray-500 dark:text-gray-400 -mt-2">
            Shown on the published course page. Leave lists empty to use smart defaults (category, lecture counts,
            etc.).
          </p>
        </>
      )}
      {compact && (
        <p className="text-xs text-gray-500 dark:text-gray-400">
          Leave lists empty to use smart defaults (category, lecture counts, etc.).
        </p>
      )}

      <LineListEditor
        label="What you&apos;ll learn"
        hint={`Up to ${MAX_LINES} bullet points. Empty → auto-generated bullets.`}
        lines={value.learningOutcomes || []}
        onChange={(learningOutcomes) => patch({ learningOutcomes })}
        disabled={disabled}
        placeholder="e.g. Build a full-stack app with React and Node"
      />

      <LineListEditor
        label="Requirements"
        hint="Empty → generic prerequisites based on category."
        lines={value.requirements || []}
        onChange={(requirements) => patch({ requirements })}
        disabled={disabled}
        placeholder="e.g. Basic JavaScript"
      />

      <LineListEditor
        label="Extra &quot;includes&quot; lines"
        hint="Optional. Shown after lecture duration and assignment counts. Use for perks (e.g. downloadable resources)."
        lines={value.includesExtras || []}
        onChange={(includesExtras) => patch({ includesExtras })}
        disabled={disabled}
      />

      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Course language
          </label>
          <input
            type="text"
            value={value.courseLanguage ?? "English"}
            onChange={(e) => patch({ courseLanguage: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder="English"
          />
        </div>
        <div>
          <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
            Sidebar note (under price)
          </label>
          <input
            type="text"
            value={value.purchaseNote ?? ""}
            onChange={(e) => patch({ purchaseNote: e.target.value })}
            disabled={disabled}
            className={inputClass}
            placeholder="e.g. 30-day money-back guarantee"
          />
          <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
            Empty uses the default guarantee line.
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
            Show &quot;Certificate of completion&quot;
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
            Show &quot;Full lifetime access&quot;
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
