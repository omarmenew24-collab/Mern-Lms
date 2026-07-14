import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink, GraduationCap, Tag, CheckCircle2 } from "lucide-react";
import { StarsDisplay } from "../../CourseRatingBlock";
import { paths } from "../../../config/paths";

const STATUS_CONFIG = {
  published: {
    labelKey: "workspace.hero.statusPublished",
    classes: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    icon: CheckCircle2,
  },
  archived: {
    labelKey: "workspace.hero.statusUnpublished",
    classes: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    icon: null,
  },
  draft: {
    labelKey: "workspace.hero.statusDraft",
    classes: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    icon: null,
  },
};

function resolveWorkspaceStatus(liveCourse) {
  if (!liveCourse) return "draft";
  if (liveCourse.isPublished && liveCourse.status === "published") return "published";
  if (liveCourse.status === "archived") return "archived";
  return "draft";
}

export default function CourseWorkspaceHero({
  course,
  editableCourse,
  isInstructor,
  liveCourse,
  ratingAvg,
  ratingCount,
  onPublish,
  isPublishing,
  publicCourseId,
}) {
  const { t } = useTranslation();
  const title = editableCourse?.title || course?.title;
  const image = editableCourse?.image;
  const description = editableCourse?.description || course?.description;
  const teacherName = editableCourse?.teacher?.name || course?.teacher?.name;
  const category = editableCourse?.category || course?.category;

  const displayStatus = resolveWorkspaceStatus(liveCourse);
  const statusCfg = STATUS_CONFIG[displayStatus] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

  const showPublishButton =
    isInstructor &&
    liveCourse &&
    !liveCourse.isDeleted &&
    !(liveCourse.isPublished === true && liveCourse.status === "published");

  return (
    <div
      id="workspace-overview"
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden scroll-mt-20"
    >
      {/* Cover image */}
      {image ? (
        <div className="relative h-40 overflow-hidden">
          <img src={image} alt={title} className="w-full h-full object-cover" />
          <div className="absolute inset-0 bg-gradient-to-t from-black/60 via-black/10 to-transparent" />
          <div className="absolute bottom-0 inset-x-0 p-4">
            <h1 className="text-xl font-bold text-white leading-tight line-clamp-2">{title}</h1>
          </div>
        </div>
      ) : (
        <div className="px-5 pt-5 pb-0">
          <h1 className="text-xl font-bold text-gray-900 dark:text-white leading-tight">{title}</h1>
        </div>
      )}

      <div className="px-5 py-4">
        {/* Meta row */}
        <div className="flex flex-wrap items-center gap-x-4 gap-y-1.5 text-xs text-gray-500 dark:text-gray-400 mb-3">
          {teacherName && (
            <span className="flex items-center gap-1">
              <GraduationCap className="w-3.5 h-3.5" />
              {teacherName}
            </span>
          )}
          {category && (
            <span className="flex items-center gap-1">
              <Tag className="w-3.5 h-3.5" />
              {category}
            </span>
          )}
          {(ratingAvg > 0 || ratingCount > 0) && (
            <StarsDisplay average={ratingAvg} count={ratingCount} size="sm" />
          )}
        </div>

        {description && (
          <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed line-clamp-2 mb-3">
            {description}
          </p>
        )}

        {isInstructor && (
          <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-gray-100 dark:border-gray-800">
            {/* Status badge */}
            <span
              className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg border text-[11px] font-bold uppercase tracking-wide ${statusCfg.classes}`}
            >
              {StatusIcon && <StatusIcon className="w-3 h-3" />}
              {t(statusCfg.labelKey)}
            </span>

            {/* Preview public page */}
            {publicCourseId && (
              <Link
                to={paths.course(publicCourseId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                {t("workspace.hero.previewPublicPage")}
              </Link>
            )}

            {showPublishButton && (
              <button
                type="button"
                onClick={onPublish}
                disabled={isPublishing}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {isPublishing ? t("workspace.hero.publishing") : t("workspace.hero.publish")}
              </button>
            )}

          </div>
        )}
      </div>
    </div>
  );
}
