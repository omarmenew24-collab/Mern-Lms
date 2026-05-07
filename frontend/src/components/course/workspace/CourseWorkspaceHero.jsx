import { Link } from "react-router-dom";
import { ExternalLink, GraduationCap, Tag, CheckCircle2, Clock, AlertCircle } from "lucide-react";
import { StarsDisplay } from "../../CourseRatingBlock";
import { paths } from "../../../config/paths";

const STATUS_CONFIG = {
  published: {
    label: "Published",
    classes: "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300 border-emerald-200 dark:border-emerald-800/60",
    icon: CheckCircle2,
  },
  pending_review: {
    label: "Pending review",
    classes: "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300 border-amber-200 dark:border-amber-800/60",
    icon: Clock,
  },
  changes_requested: {
    label: "Changes requested",
    classes: "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300 border-red-200 dark:border-red-800/60",
    icon: AlertCircle,
  },
  draft: {
    label: "Draft",
    classes: "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400 border-gray-200 dark:border-gray-700",
    icon: null,
  },
};

export default function CourseWorkspaceHero({
  userName,
  course,
  editableCourse,
  isInstructor,
  status,
  liveCourse,
  ratingAvg,
  ratingCount,
  onSubmitForReview,
  isSubmittingReview,
  publicCourseId,
}) {
  const title = editableCourse?.title || course?.title;
  const image = editableCourse?.image;
  const description = editableCourse?.description || course?.description;
  const teacherName = editableCourse?.teacher?.name || course?.teacher?.name;
  const category = editableCourse?.category || course?.category;

  const statusCfg = STATUS_CONFIG[status] || STATUS_CONFIG.draft;
  const StatusIcon = statusCfg.icon;

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
          <div className="absolute bottom-0 left-0 right-0 p-4">
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
              {statusCfg.label}
            </span>

            {/* Preview public page */}
            {publicCourseId && (
              <Link
                to={paths.course(publicCourseId)}
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-50/50 dark:hover:bg-gray-700 transition-colors"
              >
                <ExternalLink className="w-3.5 h-3.5 opacity-60" />
                Preview public page
              </Link>
            )}

            {/* Submit for review */}
            {(status === "draft" || status === "changes_requested") && (
              <button
                type="button"
                onClick={onSubmitForReview}
                disabled={isSubmittingReview}
                className="px-3 py-1.5 rounded-lg text-xs font-semibold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 transition-colors"
              >
                {isSubmittingReview ? "Submitting…" : "Submit for review"}
              </button>
            )}

            {/* Admin review note */}
            {status === "changes_requested" && liveCourse?.reviewNote && (
              <div className="w-full mt-1 flex items-start gap-2 text-xs text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/20 border border-red-200 dark:border-red-800/40 px-3 py-2 rounded-lg">
                <AlertCircle className="w-3.5 h-3.5 shrink-0 mt-0.5" />
                <span><strong>Admin note:</strong> {liveCourse.reviewNote}</span>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
