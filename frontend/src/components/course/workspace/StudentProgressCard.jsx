import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import { CheckCircle, FileText, Trophy, RefreshCcw, BookOpen, ClipboardCheck, Star, Loader2 } from "lucide-react";
import { downloadCourseCertificatePdf } from "../../../api/course";
import { CourseRatingForm } from "../../CourseRatingBlock";
import { paths } from "../../../config/paths";
import { getApproximateLectureTimeRemainingPhrase } from "../../../lib/estimateLectureTimeRemaining";

/**
 * Enrolled student: rich progress card with breakdown + rating + certificate.
 */
export default function StudentProgressCard({
  courseId,
  courseTitle,
  progressPercent,
  isFullProgress,
  isApproved,
  certificateCode,
  totalLectures = 0,
  completedLecturesCount = 0,
  totalTasks = 0,
  completedTasksCount = 0,
  myRating,
  onSubmitRating,
  isSubmittingRating = false,
  ratingBlocked = false,
  showRefundLink = false,
  /** Same lecture list used for counts; used to average `duration` (seconds) for the estimate. */
  lectures = [],
}) {
  const { t } = useTranslation();
  const queryClient = useQueryClient();
  const [downloading, setDownloading] = useState(false);
  const progress = Math.min(100, Math.max(0, Number(progressPercent || 0)));
  const shouldShowCertificate = isApproved || isFullProgress || progress >= 80;

  const handleDownload = async () => {
    if (!isApproved || !courseId || downloading) return;
    setDownloading(true);
    try {
      await downloadCourseCertificatePdf({ courseId, queryClient });
    } catch {
      /* toast in api */
    } finally {
      setDownloading(false);
    }
  };

  const lecturePercent = totalLectures > 0 ? Math.round((completedLecturesCount / totalLectures) * 100) : 0;
  const taskPercent = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

  const timeRemainingPhrase = useMemo(
    () =>
      isFullProgress
        ? null
        : getApproximateLectureTimeRemainingPhrase(lectures, totalLectures, completedLecturesCount),
    [lectures, totalLectures, completedLecturesCount, isFullProgress],
  );

  return (
    <div
      id="workspace-progress"
      className={`rounded-xl border overflow-hidden scroll-mt-20 ${
        isFullProgress
          ? "border-emerald-200 dark:border-emerald-800"
          : "border-gray-200 dark:border-gray-800"
      }`}
    >
      {/* Top band */}
      <div
        className={`px-5 py-4 ${
          isFullProgress
            ? "bg-gradient-to-r from-emerald-500 to-teal-500"
            : "bg-white dark:bg-gray-900"
        }`}
      >
        <div className="flex items-center justify-between mb-3">
          <div className="flex items-center gap-2">
            {isFullProgress ? (
              <Trophy className="w-5 h-5 text-white" />
            ) : (
              <BookOpen className="w-4 h-4 text-brand-500" />
            )}
            <span
              className={`text-sm font-bold ${
                isFullProgress ? "text-white" : "text-gray-900 dark:text-white"
              }`}
            >
              {isFullProgress ? t("workspace.progressCard.courseCompleted") : t("workspace.progressCard.yourProgress")}
            </span>
          </div>
          <span
            className={`text-2xl font-extrabold tabular-nums ${
              isFullProgress ? "text-white" : "text-brand-600 dark:text-brand-400"
            }`}
          >
            {progress}%
          </span>
        </div>

        {/* Main progress bar */}
        <div
          className={`w-full rounded-full h-2.5 overflow-hidden ${
            isFullProgress ? "bg-white/30" : "bg-gray-200 dark:bg-gray-700"
          }`}
        >
          <div
            className={`h-full rounded-full transition-all duration-700 ${
              isFullProgress ? "bg-white" : "bg-brand-600"
            }`}
            style={{ width: `${progress}%` }}
          />
        </div>

        {!isFullProgress && timeRemainingPhrase && (
          <p className="mt-2.5 text-xs text-gray-500 dark:text-gray-400 leading-relaxed">{timeRemainingPhrase}.</p>
        )}

        {isFullProgress && (
          <p className="mt-2.5 text-sm text-white/90">
            {t("workspace.progressCard.congrats")}
          </p>
        )}
      </div>

      {/* Breakdown row */}
      {(totalLectures > 0 || totalTasks > 0) && (
        <div className="px-5 py-3 bg-gray-50 dark:bg-gray-800/50 border-t border-gray-100 dark:border-gray-800 grid grid-cols-2 gap-3">
          {totalLectures > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-brand-100 dark:bg-brand-900/40 flex items-center justify-center shrink-0">
                <BookOpen className="w-3.5 h-3.5 text-brand-600 dark:text-brand-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {completedLecturesCount}/{totalLectures}
                </p>
                <div className="mt-0.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-brand-500 rounded-full transition-all duration-500"
                    style={{ width: `${lecturePercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{t("workspace.progressCard.lectures")}</p>
              </div>
            </div>
          )}
          {totalTasks > 0 && (
            <div className="flex items-center gap-2.5">
              <div className="w-7 h-7 rounded-lg bg-amber-100 dark:bg-amber-900/40 flex items-center justify-center shrink-0">
                <ClipboardCheck className="w-3.5 h-3.5 text-amber-600 dark:text-amber-400" />
              </div>
              <div className="min-w-0">
                <p className="text-xs font-bold text-gray-900 dark:text-white">
                  {completedTasksCount}/{totalTasks}
                </p>
                <div className="mt-0.5 w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
                  <div
                    className="h-full bg-amber-500 rounded-full transition-all duration-500"
                    style={{ width: `${taskPercent}%` }}
                  />
                </div>
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">{t("workspace.progressCard.tasks")}</p>
              </div>
            </div>
          )}
        </div>
      )}

      {/* Actions + extras */}
      <div className="px-5 py-4 bg-white dark:bg-gray-900 space-y-3">
        <div className="flex flex-wrap items-center gap-3">
          {showRefundLink && (
            <a
              href="#workspace-refund"
              className="inline-flex items-center gap-1.5 text-xs font-semibold text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
            >
              <RefreshCcw className="w-3.5 h-3.5" />
              {t("workspace.progressCard.refundOptions")}
            </a>
          )}
          {shouldShowCertificate && (
            <button
              type="button"
              onClick={() => handleDownload()}
              disabled={!isApproved || downloading || !courseId}
              title={!isApproved ? t("workspace.progressCard.certificatePending") : undefined}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isApproved
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              {downloading ? (
                <Loader2 className="w-3.5 h-3.5 animate-spin" />
              ) : (
                <FileText className="w-3.5 h-3.5" />
              )}
              {isApproved ? t("workspace.progressCard.downloadCertificate") : t("workspace.progressCard.certificateLocked")}
            </button>
          )}
          {certificateCode && isApproved && (
            <Link
              to={paths.certificateVerify(certificateCode)}
              target="_blank"
              rel="noopener noreferrer"
              className="inline-flex items-center gap-1 text-xs font-semibold text-gray-600 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400"
            >
              <CheckCircle className="w-3.5 h-3.5" />
              {t("workspace.progressCard.verifyCredential")}
            </Link>
          )}
        </div>

        {/* Rating */}
        {typeof onSubmitRating === "function" && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">{t("workspace.progressCard.rateCourse")}</span>
            </div>
            <CourseRatingForm
              viewerState={ratingBlocked ? "rating_blocked" : "can_rate"}
              myRating={myRating}
              onSubmit={onSubmitRating}
              isPending={isSubmittingRating}
            />
          </div>
        )}
      </div>
    </div>
  );
}
