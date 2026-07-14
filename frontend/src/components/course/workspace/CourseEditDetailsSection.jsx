import { PenLine, ChevronDown, Film } from "lucide-react";
import { useTranslation } from "react-i18next";
import CourseCatalogSectionsForm from "../CourseCatalogSectionsForm";
import SavedCourseCategoryChips from "../SavedCourseCategoryChips";
import CourseCategoryField from "../CourseCategoryField";

/**
 * Collapsible course settings form (instructor). Catalog + image + core fields.
 */
export default function CourseEditDetailsSection({
  open,
  onToggle,
  onSubmit,
  inputClass,
  courseForm,
  onFieldChange,
  onImageChange,
  courseImagePreview,
  isSaving,
  teacherCategoryOptions,
  catalogForm,
  onCatalogChange,
}) {
  const { t } = useTranslation();
  return (
    <div
      id="course-settings"
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden scroll-mt-20"
    >
      <button
        type="button"
        aria-expanded={open}
        onClick={onToggle}
        className={
          "w-full px-5 py-4 flex items-center justify-between gap-3 text-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/60 " +
          (open ? "border-b border-gray-100 dark:border-gray-800" : "")
        }
      >
        <div className="flex items-center gap-2.5 min-w-0">
          <PenLine className="w-4 h-4 text-brand-500 shrink-0" />
          <div>
            <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.courseEdit.courseSettings")}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">
              {open
                ? t("workspace.courseEdit.clickToHide")
                : t("workspace.courseEdit.settingsSummary")}
            </p>
          </div>
        </div>
        <ChevronDown
          className={`w-5 h-5 shrink-0 text-gray-500 transition-transform ${open ? "rotate-180" : ""}`}
          aria-hidden
        />
      </button>
      {open && (
        <form onSubmit={onSubmit} className="p-5 grid gap-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {t("workspace.courseEdit.courseImage")}
            </label>
            <input
              type="file"
              accept="image/*"
              onChange={onImageChange}
              className="w-full rounded-lg border border-gray-300 dark:border-gray-700 dark:bg-gray-900 p-2 text-sm file:me-3 file:rounded-md file:border-0 file:bg-brand-50 file:px-3 file:py-1 file:text-xs file:font-medium file:text-brand-700 dark:file:bg-brand-900/30 dark:file:text-brand-300"
            />
            {courseImagePreview && (
              <img
                src={courseImagePreview}
                alt={t("workspace.courseEdit.preview")}
                className="mt-3 h-36 w-full rounded-lg object-cover border dark:border-gray-700"
              />
            )}
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {t("workspace.courseEdit.title")}
            </label>
            <input
              type="text"
              name="title"
              value={courseForm.title}
              onChange={onFieldChange}
              className={inputClass}
              required
            />
          </div>
          <CourseCategoryField
            name="category"
            value={courseForm.category}
            onChange={onFieldChange}
            options={teacherCategoryOptions}
            inputClass={inputClass}
            idPrefix="workspace"
            required
            disabled={isSaving}
            helpText={
              <p className="text-[11px] text-gray-500 dark:text-gray-500">
                {t("workspace.courseEdit.helpPrefix")}
                <span className="font-medium">{t("workspace.courseEdit.helpOther")}</span>
                {t("workspace.courseEdit.helpMid")}
                <span className="font-medium">{t("workspace.courseEdit.helpAdmin")}</span>
                {t("workspace.courseEdit.helpSuffix")}
              </p>
            }
          >
            <SavedCourseCategoryChips
              categories={teacherCategoryOptions}
              disabled={isSaving}
            />
          </CourseCategoryField>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
              {t("workspace.courseEdit.description")}
            </label>
            <textarea
              name="description"
              value={courseForm.description}
              onChange={onFieldChange}
              rows={3}
              className={`${inputClass} h-auto py-2`}
              required
            />
          </div>

          <div className="rounded-lg border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/20 p-4 space-y-3">
            <div className="flex items-center gap-2">
              <Film className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0" />
              <span className="text-xs font-bold text-gray-800 dark:text-gray-100">{t("workspace.courseEdit.trailerSection")}</span>
            </div>
            <p className="text-[11px] text-gray-600 dark:text-gray-400 leading-relaxed">
              {t("workspace.courseEdit.trailerInfo")}
            </p>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {t("workspace.courseEdit.trailerTitleLabel")}
              </label>
              <input
                type="text"
                name="trailerTitle"
                value={courseForm.trailerTitle ?? ""}
                onChange={onFieldChange}
                placeholder={t("workspace.courseEdit.trailerTitlePlaceholder")}
                maxLength={200}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {t("workspace.courseEdit.trailerUrlLabel")}
              </label>
              <input
                type="url"
                name="trailerVideoUrl"
                value={courseForm.trailerVideoUrl ?? ""}
                onChange={onFieldChange}
                placeholder={t("workspace.courseEdit.trailerUrlPlaceholder")}
                maxLength={500}
                className={inputClass}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">
                {t("workspace.courseEdit.vimeoIdLabel")}
              </label>
              <input
                type="text"
                name="trailerVimeoVideoId"
                value={courseForm.trailerVimeoVideoId ?? ""}
                onChange={onFieldChange}
                placeholder={t("workspace.courseEdit.vimeoIdPlaceholder")}
                maxLength={24}
                className={inputClass}
              />
            </div>
          </div>

          <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
            <CourseCatalogSectionsForm
              value={catalogForm}
              onChange={onCatalogChange}
              disabled={isSaving}
            />
          </div>
          <div className="flex justify-end">
            <button
              type="submit"
              disabled={isSaving}
              className="px-5 py-2 rounded-lg text-sm font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
            >
              {isSaving ? t("workspace.courseEdit.saving") : t("workspace.courseEdit.saveDetails")}
            </button>
          </div>
        </form>
      )}
    </div>
  );
}
