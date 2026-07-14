import { useCallback, useEffect, useState } from "react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useQueryClient } from "@tanstack/react-query";
import LecturesSection from "../../courseSections/LecturesSection";
import LecturePlayerPanel from "../../courseSections/LecturePlayerPanel";
import LectureVideoPreviewModal from "../../courseSections/LectureVideoPreviewModal";
import InstructorLectureWorkspace from "./InstructorLectureWorkspace";
import { useUpdateLecture, useReorderLecture } from "../../../api/lecture";
import { axiosInstance } from "../../../lib/axios";
import { confirmAction } from "../../../lib/confirmToast.jsx";

/**
 * Student (watchMode): list + full player (two columns).
 * Instructor (!watchMode): curriculum tree | large lecture workspace.
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
  onToggleWatchMode: _onToggleWatchMode,
  nextLecture,
  onNextLecture,
  /** Student: widen video column; expand = full-width video + slim outline below */
  studentVideoExpanded = false,
  /** Student "reviewed" checkmarks (distinct from lecture complete). */
  acknowledgedLectureIds,
  onAcknowledgeLecture,
  /** Instructor curriculum: leave lecture workspace focus and return to the tree */
  onBackToCurriculum,
  /** Instructor curriculum analytics (views, finish rate, level completion) */
  curriculumAnalytics,
}) {
  const { t: translate } = useTranslation();
  const [previewLecture, setPreviewLecture] = useState(null);
  /** Instructor curriculum: workspace column only after user picks a lecture from the tree */
  const [instructorPanelOpen, setInstructorPanelOpen] = useState(false);
  const teacherListOnly = Boolean(isInstructor && !watchMode);
  const studentWatch = Boolean(isStudent && watchMode);
  const queryClient = useQueryClient();

  const handleRenameLevel = useCallback(
    async (levelNum, newTitle) => {
      const t = typeof newTitle === "string" ? newTitle.trim() : "";
      if (!t || !courseId) return;
      const targets = (lectures || []).filter((l) => (l.level?.number ?? 1) === levelNum);
      if (!targets.length) return;
      try {
        await Promise.all(
          targets.map((l) =>
            axiosInstance.patch(`/course/${courseId}/lecture/${l._id}`, {
              level: { number: levelNum, title: t },
            }),
          ),
        );
        await queryClient.invalidateQueries({ queryKey: ["lectures", courseId] });
        await queryClient.invalidateQueries({ queryKey: ["public-course", courseId] });
        toast.success(translate("workspace.lecturePanel.sectionRenamed"));
      } catch {
        toast.error(translate("workspace.lecturePanel.sectionRenameError"));
      }
    },
    [courseId, lectures, queryClient],
  );

  const handleDeleteLevelSection = useCallback(
    async (lectureIds) => {
      if (!lectureIds?.length || !courseId) return;
      const ok = await confirmAction(
        translate("workspace.lecturePanel.deleteSectionConfirm", { count: lectureIds.length }),
        { destructive: true, confirmLabel: translate("workspace.lecturePanel.deleteSectionLabel") },
      );
      if (!ok) return;
      try {
        await Promise.all(
          lectureIds.map((id) => axiosInstance.delete(`/courses/lecture/${courseId}/${id}`)),
        );
        await queryClient.invalidateQueries({ queryKey: ["lectures", courseId] });
        await queryClient.invalidateQueries({ queryKey: ["public-course", courseId] });
        toast.success(translate("workspace.lecturePanel.sectionDeleted"));
      } catch {
        toast.error(translate("workspace.lecturePanel.sectionDeleteError"));
      }
    },
    [courseId, queryClient],
  );

  useEffect(() => {
    if (teacherListOnly && !selectedLecture) setInstructorPanelOpen(false);
  }, [teacherListOnly, selectedLecture]);

  const showTeacherWorkspace = Boolean(teacherListOnly && instructorPanelOpen && selectedLecture);

  const handleTeacherSelectLecture = useCallback(
    (lecture) => {
      setInstructorPanelOpen(true);
      onSelectLecture?.(lecture);
    },
    [onSelectLecture],
  );

  const handleTeacherBackToCurriculum = useCallback(() => {
    setInstructorPanelOpen(false);
    onBackToCurriculum?.();
  }, [onBackToCurriculum]);

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
        toast.error(translate("workspace.lecturePanel.reorderError"));
      }
    },
    [reorderLecture],
  );

  const isLectureCompleted = selectedLecture
    ? completedLectureIds?.has(String(selectedLecture._id))
    : false;

  const lecturePlayerPanel = (
        <LecturePlayerPanel
          lecture={selectedLecture}
          title={translate("workspace.lecturePanel.coursePlayer")}
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
  );

  const gridClass =
    studentWatch && studentVideoExpanded
      ? "grid-cols-1 gap-5 lg:gap-6"
      : studentWatch || watchMode
        ? "lg:grid-cols-[minmax(0,2.2fr)_minmax(0,1fr)] gap-4 lg:gap-5 xl:gap-6 items-start"
        : "lg:grid-cols-[minmax(0,0.9fr)_minmax(0,1.1fr)]";

  const listColumnClass =
    !watchMode
      ? "lg:order-1"
      : studentWatch && studentVideoExpanded
        ? "order-2 max-h-[min(40vh,22rem)] overflow-y-auto rounded-xl border border-gray-100 dark:border-gray-800"
        : studentWatch
          ? "lg:order-2 lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto lg:sticky lg:top-[7.25rem] lg:self-start rounded-xl"
          : "lg:order-2 lg:max-h-[calc(100dvh-8.5rem)] lg:overflow-y-auto lg:sticky lg:top-[7.25rem] lg:self-start rounded-xl";

  const playerWrapClass = studentWatch
    ? studentVideoExpanded
      ? "min-w-0 w-full space-y-3 order-1"
      : "min-w-0 w-full space-y-3 order-1 lg:sticky lg:top-[7.25rem] lg:self-start"
    : watchMode
      ? "min-w-0 space-y-3 lg:order-1 lg:sticky lg:top-20 lg:self-start"
      : "min-w-0 space-y-3 lg:order-2 lg:sticky lg:top-20 lg:self-start";

  if (teacherListOnly) {
    return (
      <>
        <div
          id="workspace-lectures"
          className={[
            "scroll-mt-20 overflow-hidden rounded-2xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none",
            "min-h-[min(480px,calc(100dvh-10.5rem))] lg:min-h-[min(640px,calc(100dvh-10.5rem))]",
            showTeacherWorkspace
              ? "lg:grid lg:grid-cols-[minmax(240px,min(32vw,21rem))_minmax(0,1fr)] lg:items-stretch lg:gap-0"
              : "",
          ].join(" ")}
        >
          <aside
            id="workspace-curriculum-tree"
            className={[
              "flex min-h-0 min-w-0 flex-col border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900",
              showTeacherWorkspace
                ? "hidden lg:flex lg:border-e lg:border-gray-200 dark:lg:border-gray-800"
                : "w-full flex-1 border-b-0",
            ].join(" ")}
          >
            <LecturesSection
              variant="workspaceTree"
              courseId={courseId}
              lectures={lectures}
              canDelete={isInstructor}
              onDeleteLecture={onDeleteLecture}
              onSelectLecture={handleTeacherSelectLecture}
              selectedLectureId={showTeacherWorkspace ? selectedLectureId : undefined}
              completedLectureIds={completedLectureIds}
              onEditLecture={isInstructor ? onEditLecture : undefined}
              onRename={isInstructor ? handleRename : undefined}
              onReorder={isInstructor ? handleReorder : undefined}
              onInstructorPreview={(lec) => setPreviewLecture(lec)}
              showAcknowledge={false}
              onRenameLevel={handleRenameLevel}
              onDeleteLevelSection={handleDeleteLevelSection}
              curriculumAnalytics={curriculumAnalytics}
            />
          </aside>
          {showTeacherWorkspace ? (
            <section className="min-h-0 min-w-0 flex-1 overflow-y-auto overscroll-y-contain px-4 pb-5 pt-4 sm:px-5 lg:border-s lg:border-gray-200 lg:px-6 lg:pb-6 lg:pt-3 dark:lg:border-gray-800">
              <InstructorLectureWorkspace
                selectedLecture={selectedLecture}
                onEditLecture={onEditLecture}
                onPreview={(lec) => setPreviewLecture(lec)}
                isSavingPreview={isSavingPreview}
                onToggleFreePreview={onToggleFreePreview}
                onBackToCurriculum={
                  typeof onBackToCurriculum === "function" ? handleTeacherBackToCurriculum : undefined
                }
              />
            </section>
          ) : null}
        </div>
        <LectureVideoPreviewModal lecture={previewLecture} onClose={() => setPreviewLecture(null)} />
      </>
    );
  }

  return (
    <>
      <div
        id="workspace-lectures"
        className={`grid grid-cols-1 scroll-mt-20 ${gridClass}`}
      >
        <div className={`min-w-0 ${listColumnClass}`}>
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
            onInstructorPreview={isInstructor ? (lec) => setPreviewLecture(lec) : undefined}
            showAcknowledge={studentWatch && typeof onAcknowledgeLecture === "function"}
            acknowledgedLectureIds={acknowledgedLectureIds}
            onAcknowledgeLecture={onAcknowledgeLecture}
            variant={studentWatch ? "watchSidebar" : "default"}
          />
        </div>

        <div className={playerWrapClass}>
          {lecturePlayerPanel}

        {isInstructor && courseId && selectedLecture && !watchMode && (
          <div className="rounded-xl border border-violet-200/90 dark:border-violet-800/50 bg-violet-50/50 dark:bg-violet-950/20 px-4 py-3.5">
            <div className="flex items-start gap-3">
              <div className="min-w-0 flex-1">
                  <p className="text-sm font-semibold text-gray-900 dark:text-white">{translate("workspace.lecturePanel.publicCoursePage")}</p>
                <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5 leading-relaxed">
                    {translate("workspace.lecturePanel.publicCoursePageDesc")}
                </p>
                <div className="mt-3 flex items-center justify-between gap-3">
                    <span className="text-sm font-medium text-gray-800 dark:text-gray-200">{translate("workspace.lecturePanel.freePreview")}</span>
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

      <LectureVideoPreviewModal lecture={previewLecture} onClose={() => setPreviewLecture(null)} />
    </>
  );
}
