import { useCallback } from "react";
import { Sparkles } from "lucide-react";
import toast from "react-hot-toast";
import LecturesSection from "../../courseSections/LecturesSection";
import LecturePlayerPanel from "../../courseSections/LecturePlayerPanel";
import { useUpdateLecture, useReorderLecture } from "../../../api/lecture";

/**
 * Two-column lectures list + player.
 *
 * watchMode=true (student default):
 *   Player LEFT (70%) — narrow scrollable list RIGHT (30%)
 *   Inside max-w-[1440px] with no sidebar.
 *
 * watchMode=false (teacher default):
 *   List LEFT (45%) — Player RIGHT (55%)
 *   Inside max-w-6xl with workspace sidebar.
 */
export default function LecturesAndPlayerSection({
  courseId,
  lectures = [],
  selectedLecture,
  onSelectLecture,
  isInstructor,
  isStudent,
  onDeleteLecture,
  onMarkLectureComplete,
  completedLectureIds,
  onEditLecture,
  selectedLectureId,
  watchMode = false,
  onToggleWatchMode,
  nextLecture,
  onNextLecture,
}) {
  const { saveLecture, isPending: isSavingPreview } = useUpdateLecture(courseId);
  const { reorderLecture } = useReorderLecture(courseId);

  const onToggleFreePreview = useCallback(
    async (next) => {
      if (!selectedLecture?._id) return;
      try {
        await saveLecture({ lectureId: selectedLecture._id, isFreePreview: next });
      } catch {
        /* toast in hook */
      }
    },
    [saveLecture, selectedLecture?._id],
  );

  const handleRename = useCallback(
    async (lectureId, title) => {
      try {
        await saveLecture({ lectureId, title });
      } catch {
        /* toast in hook */
      }
    },
    [saveLecture],
  );

  const handleReorder = useCallback(
    async (changedLectures) => {
      try {
        await Promise.all(
          changedLectures.map(({ _id, order }) => reorderLecture({ lectureId: _id, order })),
        );
      } catch {
        toast.error("Failed to save order. Please try again.");
      }
    },
    [reorderLecture],
  );

  const isLectureCompleted = selectedLecture
    ? completedLectureIds?.has(String(selectedLecture._id))
    : false;

  return (
    <div
      id="workspace-lectures"
      className={`grid grid-cols-1 gap-4 scroll-mt-20 ${
        watchMode
          ? "lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)]"
          : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]"
      }`}
    >
      {/* Lecture list */}
      <div
        className={`min-w-0 ${
          watchMode
            ? "lg:order-2 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto rounded-xl"
            : "lg:order-1"
        }`}
      >
        <LecturesSection
          courseId={courseId}
          lectures={lectures}
          canDelete={isInstructor}
          onDeleteLecture={onDeleteLecture}
          onSelectLecture={onSelectLecture}
          selectedLectureId={selectedLectureId}
          completedLectureIds={completedLectureIds}
          onEditLecture={isInstructor ? onEditLecture : undefined}
          onRename={isInstructor ? handleRename : undefined}
          onReorder={isInstructor ? handleReorder : undefined}
        />
      </div>

      {/* Player column */}
      <div
        className={`min-w-0 space-y-3 self-start ${
          watchMode ? "lg:order-1 lg:sticky lg:top-20" : "lg:order-2 lg:sticky lg:top-20"
        }`}
      >
        <LecturePlayerPanel
          lecture={selectedLecture}
          title="Course player"
          resumeStorageKey={
            selectedLecture?._id && courseId
              ? `lectureVideoResume:${courseId}:${selectedLecture._id}`
              : undefined
          }
          showMarkWatched={Boolean(isStudent && selectedLecture)}
          isLectureCompleted={Boolean(isLectureCompleted)}
          onMarkWatched={
            selectedLecture && onMarkLectureComplete
              ? () => onMarkLectureComplete(selectedLecture._id)
              : undefined
          }
          nextLecture={nextLecture}
          onNextLecture={onNextLecture}
        />

        {/* Free-preview toggle for instructors in normal mode */}
        {isInstructor && courseId && selectedLecture && !watchMode && (
          <div className="rounded-xl border border-violet-200/90 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div
                className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-violet-200/60 dark:bg-violet-900/50 text-violet-700 dark:text-violet-200"
                aria-hidden
              >
                <Sparkles className="h-4 w-4" />
              </div>
              <div className="min-w-0 flex-1">
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  Public course page
                </p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                  Let visitors watch this video before they enroll. You can also set this on the
                  full lecture form.
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                  <span className="text-sm font-medium text-gray-800 dark:text-gray-200">
                    Free preview
                  </span>
                  <button
                    type="button"
                    role="switch"
                    aria-checked={Boolean(selectedLecture.isFreePreview)}
                    disabled={isSavingPreview}
                    onClick={() => onToggleFreePreview(!Boolean(selectedLecture.isFreePreview))}
                    className={`
                      relative h-7 w-12 shrink-0 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 focus:ring-offset-2 dark:focus:ring-offset-gray-950
                      ${selectedLecture.isFreePreview ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"}
                      ${isSavingPreview ? "opacity-60 pointer-events-none" : ""}
                    `}
                  >
                    <span
                      className={`toggle-thumb ${selectedLecture.isFreePreview ? "toggle-thumb-on" : "toggle-thumb-off"}`}
                    />
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
