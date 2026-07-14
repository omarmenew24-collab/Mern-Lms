import { ChevronLeft, GripVertical, Pencil, PlayCircle, Sparkles } from "lucide-react";
import { useTranslation } from "react-i18next";
import LecturePlayerPanel from "../../courseSections/LecturePlayerPanel";

function formatDuration(seconds) {
  if (!seconds) return null;
  const h = Math.floor(seconds / 3600);
  const m = Math.floor((seconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

const TYPE_LABEL_KEY = {
  video: "workspace.lecturePanel.typeVideo",
  file: "workspace.lecturePanel.typeFile",
  link: "workspace.lecturePanel.typeLink",
  text: "workspace.lecturePanel.typeText",
};

/**
 * Large right-hand workspace for the selected lecture (instructor curriculum).
 * Layout: back + player at top (aligned beside tree); title, description, actions below player.
 */
export default function InstructorLectureWorkspace({
  selectedLecture,
  onEditLecture,
  onPreview,
  isSavingPreview,
  onToggleFreePreview,
  onBackToCurriculum,
}) {
  const { t } = useTranslation();
  if (!selectedLecture) {
    return (
      <div className="flex min-h-[min(420px,calc(100dvh-14rem))] flex-col items-center justify-center rounded-xl border-2 border-dashed border-gray-200 bg-gray-50/80 px-6 py-16 text-center dark:border-gray-700 dark:bg-gray-950/40">
        <div className="mb-4 flex h-16 w-16 items-center justify-center rounded-2xl bg-brand-100/80 text-brand-600 dark:bg-brand-950/60 dark:text-brand-300">
          <Pencil className="h-8 w-8" aria-hidden />
        </div>
        <p className="text-lg font-semibold text-gray-900 dark:text-white">{t("workspace.lecturePanel.emptyTitle")}</p>
        <p className="mt-2 max-w-sm text-sm leading-relaxed text-gray-500 dark:text-gray-400">
          {t("workspace.lecturePanel.emptyDesc")}
        </p>
      </div>
    );
  }

  const type = selectedLecture.contentType || "video";
  const typeLabel = TYPE_LABEL_KEY[type] ? t(TYPE_LABEL_KEY[type]) : t("workspace.lecturePanel.typeLecture");
  const levelNum = selectedLecture.level?.number ?? 1;
  const levelTitle = selectedLecture.level?.title || t("workspace.lecturePanel.level", { number: levelNum });

  return (
    <div className="flex min-h-0 min-w-0 flex-col gap-5">
      {/* Player column top: back only, then video — lines up visually with curriculum tree */}
      <div className="min-w-0 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
        {typeof onBackToCurriculum === "function" ? (
          <div className="border-b border-gray-100 px-4 py-2.5 dark:border-gray-800 sm:px-5 sm:py-3">
            <button
              type="button"
              onClick={onBackToCurriculum}
              className="inline-flex w-fit items-center gap-1 rounded-lg border border-transparent px-2 py-1 text-sm font-semibold text-gray-700 transition hover:border-gray-200 hover:bg-gray-50 dark:text-gray-200 dark:hover:border-gray-700 dark:hover:bg-gray-800/80"
            >
              <ChevronLeft className="h-4 w-4 shrink-0 opacity-80 rtl-flip" aria-hidden />
              {t("workspace.lecturePanel.backToCurriculum")}
            </button>
          </div>
        ) : null}
        <div className="p-3 sm:p-4">
          <LecturePlayerPanel
            lecture={selectedLecture}
            title={t("workspace.lecturePanel.lecturePreview")}
            previewLabel={t("workspace.lecturePanel.preview")}
            embedded
            showMarkWatched={false}
          />
        </div>
      </div>

      {/* Title, description, primary actions — strictly below the lecture preview */}
      <div className="min-w-0 rounded-2xl border border-gray-200/90 bg-white px-5 py-5 shadow-[0_1px_3px_rgba(0,0,0,0.04)] dark:border-gray-800 dark:bg-gray-900 dark:shadow-none sm:px-6 sm:py-6">
        <div className="flex flex-wrap items-center gap-2">
          <span className="rounded-full bg-brand-600/12 px-2.5 py-0.5 text-[11px] font-bold uppercase tracking-wider text-brand-800 ring-1 ring-brand-600/15 dark:bg-brand-500/15 dark:text-brand-200 dark:ring-brand-400/25">
            {t("workspace.lecturePanel.currentLecture")}
          </span>
          <span className="rounded-lg bg-gray-100/95 px-2 py-0.5 text-[11px] font-semibold text-gray-600 dark:bg-gray-800/90 dark:text-gray-300">
            {typeLabel}
          </span>
          <span className="text-xs font-medium text-gray-500 dark:text-gray-400">
            {levelTitle} · {t("workspace.lecturePanel.order", { number: (selectedLecture.order ?? 0) + 1 })}
          </span>
          {selectedLecture.duration ? (
            <span className="text-xs tabular-nums font-medium text-gray-400 dark:text-gray-500">
              {formatDuration(selectedLecture.duration)}
            </span>
          ) : null}
        </div>

        <h2 className="mt-4 text-xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-2xl">
          {selectedLecture.title || t("workspace.lecturePanel.untitledLecture")}
        </h2>
        {selectedLecture.description ? (
          <p className="mt-2 max-w-3xl text-sm leading-relaxed text-gray-600 dark:text-gray-300 sm:text-[0.9375rem]">
            {selectedLecture.description}
          </p>
        ) : (
          <p className="mt-2 text-sm text-gray-400 dark:text-gray-500">
            {t("workspace.lecturePanel.noDescription")}
          </p>
        )}

        <div className="mt-5 flex flex-wrap items-center gap-2.5">
          <button
            type="button"
            onClick={() => onEditLecture?.(selectedLecture)}
            className="inline-flex items-center justify-center gap-2 rounded-xl bg-brand-600 px-4 py-2.5 text-sm font-bold text-white shadow-sm ring-1 ring-brand-600/30 transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:focus-visible:ring-offset-gray-900"
          >
            <Pencil className="h-4 w-4 shrink-0" aria-hidden />
            {t("workspace.lecturePanel.fullEditor")}
          </button>
          {type === "video" && onPreview ? (
            <button
              type="button"
              onClick={() => onPreview(selectedLecture)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-gray-200 bg-white px-4 py-2.5 text-sm font-semibold text-gray-800 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/70 dark:border-gray-600 dark:bg-gray-900 dark:text-gray-100 dark:hover:border-brand-500/50 dark:hover:bg-brand-950/60"
            >
              <PlayCircle className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" aria-hidden />
              {t("workspace.lecturePanel.modalPreview")}
            </button>
          ) : null}
        </div>
      </div>

      <div className="rounded-2xl border border-violet-200/85 bg-gradient-to-br from-violet-50/95 via-white to-violet-50/40 px-5 py-5 dark:border-violet-800/45 dark:from-violet-950/35 dark:via-gray-900 dark:to-gray-900 sm:px-6 sm:py-6">
        <div className="flex flex-col gap-5 sm:flex-row sm:items-start sm:gap-6">
          <div className="flex min-w-0 flex-1 gap-3.5">
            <div
              className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-200/80 text-violet-800 shadow-sm ring-1 ring-violet-300/35 dark:bg-violet-900/55 dark:text-violet-200 dark:ring-violet-500/20"
              aria-hidden
            >
              <Sparkles className="h-5 w-5" />
            </div>
            <div className="min-w-0 pt-0.5">
              <p className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.lecturePanel.catalogVisibility")}</p>
              <p className="mt-1.5 text-sm leading-relaxed text-gray-600 dark:text-gray-300">
                {t("workspace.lecturePanel.catalogDescPrefix")}
                <span className="font-semibold text-violet-700 dark:text-violet-300">{t("workspace.lecturePanel.fullEditor")}</span>
                {t("workspace.lecturePanel.catalogDescSuffix")}
              </p>
            </div>
          </div>
          <div className="flex shrink-0 items-center gap-3 self-start rounded-xl border border-violet-200/70 bg-white/90 px-4 py-2.5 shadow-sm dark:border-violet-800/50 dark:bg-gray-950/60 sm:py-3">
            <span className="text-sm font-semibold text-gray-800 dark:text-gray-200">{t("workspace.lecturePanel.freePreview")}</span>
            <button
              type="button"
              role="switch"
              aria-checked={Boolean(selectedLecture.isFreePreview)}
              disabled={isSavingPreview}
              onClick={() => onToggleFreePreview(!Boolean(selectedLecture.isFreePreview))}
              className={[
                "relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950",
                selectedLecture.isFreePreview ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600",
                isSavingPreview ? "pointer-events-none opacity-60" : "",
              ].join(" ")}
            >
              <span
                className={`toggle-thumb ${selectedLecture.isFreePreview ? "toggle-thumb-on" : "toggle-thumb-off"}`}
              />
            </button>
          </div>
        </div>
      </div>

      <div className="flex flex-wrap gap-x-6 gap-y-2 rounded-xl border border-gray-100 bg-gray-50/90 px-4 py-3 text-xs text-gray-600 dark:border-gray-800 dark:bg-gray-900/40 dark:text-gray-400">
        <span className="inline-flex items-center gap-1.5 font-medium">
          <GripVertical className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          {t("workspace.lecturePanel.reorderHint")}
        </span>
        <span className="inline-flex items-center gap-1.5 font-medium">
          <Pencil className="h-3.5 w-3.5 text-gray-400" aria-hidden />
          {t("workspace.lecturePanel.uploadHint")}
        </span>
      </div>
    </div>
  );
}
