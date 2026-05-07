import { CheckCircle, FileText, Trophy, RefreshCcw, BookOpen, ClipboardCheck, Star } from "lucide-react";
import CertificateTemplate from "../../CertificateTemplate";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import { CourseRatingForm } from "../../CourseRatingBlock";

/**
 * Enrolled student: rich progress card with breakdown + rating + certificate.
 */
export default function StudentProgressCard({
  user,
  courseTitle,
  progressPercent,
  isFullProgress,
  isApproved,
  totalLectures = 0,
  completedLecturesCount = 0,
  totalTasks = 0,
  completedTasksCount = 0,
  myRating,
  onSubmitRating,
  isSubmittingRating = false,
  ratingBlocked = false,
  showRefundLink = false,
}) {
  const certificateRef = useRef(null);
  const progress = Math.min(100, Math.max(0, Number(progressPercent || 0)));
  const shouldShowCertificate = isApproved || isFullProgress || progress >= 80;

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `${user?.name}_${courseTitle}_Certificate`,
  });

  const lecturePercent = totalLectures > 0 ? Math.round((completedLecturesCount / totalLectures) * 100) : 0;
  const taskPercent = totalTasks > 0 ? Math.round((completedTasksCount / totalTasks) * 100) : 0;

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
              {isFullProgress ? "Course completed!" : "Your progress"}
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

        {isFullProgress && (
          <p className="mt-2.5 text-sm text-white/90">
            Congratulations! You&apos;ve mastered all the materials.
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
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Lectures</p>
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
                <p className="text-[10px] text-gray-500 dark:text-gray-400 mt-0.5">Tasks</p>
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
              Refund options
            </a>
          )}
          {shouldShowCertificate && (
            <button
              type="button"
              onClick={() => isApproved && handlePrint()}
              disabled={!isApproved}
              title={!isApproved ? "Certificate pending approval by your instructor" : undefined}
              className={`inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-colors ${
                isApproved
                  ? "bg-brand-600 text-white hover:bg-brand-700"
                  : "bg-gray-100 dark:bg-gray-800 text-gray-400 dark:text-gray-500 cursor-not-allowed"
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              {isApproved ? "Download certificate" : "Certificate locked"}
            </button>
          )}
        </div>

        {/* Rating */}
        {typeof onSubmitRating === "function" && (
          <div className="pt-3 border-t border-gray-100 dark:border-gray-800">
            <div className="flex items-center gap-1.5 mb-2">
              <Star className="w-3.5 h-3.5 text-amber-400" />
              <span className="text-xs font-semibold text-gray-700 dark:text-gray-300">Rate this course</span>
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

      {/* Hidden certificate for print */}
      <div className="absolute -z-50 opacity-0 pointer-events-none" aria-hidden>
        <CertificateTemplate
          ref={certificateRef}
          studentName={user?.name}
          courseTitle={courseTitle}
          date={new Date().toLocaleDateString()}
        />
      </div>
    </div>
  );
}
