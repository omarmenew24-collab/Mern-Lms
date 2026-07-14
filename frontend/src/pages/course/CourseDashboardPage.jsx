import { useLocation, useNavigate, useParams, Navigate } from "react-router-dom";
import { useEffect, useMemo, useState, useRef, useCallback } from "react";
import { useTranslation } from "react-i18next";
import { Maximize2, Minimize2, PieChart } from "lucide-react";

import { useGetTasks, useDeleteTask, useGetMyCourseSubmissionGrades, useMarkTask } from "../../api/task";
import {
  useGetStudentsByCourse,
  useGetCourseProgress,
  useGetBulkProgress,
  useGetCourseById,
  usePublishCourse,
  useUpdateCourse,
  useGetCourseCategories,
  useCourseRosterLearnerSnapshots,
  useCourseCurriculumAnalytics,
  useCourseInstructorActivity,
  useCourseTaskAnalytics,
} from "../../api/course";
import { useGetLecturesByCourse, useDeleteLecture, useMarkLecture, useAcknowledgeLecture } from "../../api/lecture";
import useUserStore from "../../store/userstore";
import { toast } from "react-hot-toast";
import { confirmAction } from "../../lib/confirmToast.jsx";

import TasksSection from "../../components/courseSections/TasksSection";
import StudentsSection from "../../components/courseSections/StudentsSection";
import { useGetRatingSummary, useGetMyRating, useUpsertRating } from "../../api/rating";
import CourseCommentsSection from "../../components/CourseCommentsSection";
import { paths } from "../../config/paths";
import { useGetPublicCourse } from "../../api/rating";
import { catalogFromCourse, emptyCatalogForm } from "../../components/course/CourseCatalogSectionsForm";

import StudentProgressCard from "../../components/course/workspace/StudentProgressCard";
import CourseWorkspaceHero from "../../components/course/workspace/CourseWorkspaceHero";
import CourseEditDetailsSection from "../../components/course/workspace/CourseEditDetailsSection";
import LecturesAndPlayerSection from "../../components/course/workspace/LecturesAndPlayerSection";
import TeacherQuickActionsBar from "../../components/course/workspace/TeacherQuickActionsBar";
import TeacherCourseOverviewPanel from "../../components/course/workspace/TeacherCourseOverviewPanel";
import TeacherWorkspaceTabNav, {
  TEACHER_WORKSPACE_TAB_IDS,
} from "../../components/course/workspace/TeacherWorkspaceTabNav";
import CourseRefundCard from "../../components/refunds/CourseRefundCard";
import StudentCourseWorkspaceTabs from "../../components/course/workspace/StudentCourseWorkspaceTabs";
import { axiosInstance } from "../../lib/axios";

const CourseDashboard = () => {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId: routeCourseId, workspaceTab } = useParams();
  const stateCourse = location.state;
  const user = useUserStore((state) => state.user);

  const cidEarly = stateCourse?._id || routeCourseId;
  const isOwnerFromState = stateCourse
    ? user?._id === (stateCourse.teacher?._id ?? stateCourse.teacher)
    : false;
  const fetchTeacherCourse =
    !!cidEarly &&
    user?.role !== "student" &&
    (isOwnerFromState || (!stateCourse && !!routeCourseId));

  const { course: liveCourse, isLoading: loadingLiveCourse } = useGetCourseById(
    cidEarly,
    fetchTeacherCourse,
  );

  const publicFetchId =
    !stateCourse && user?.role === "student" && routeCourseId ? routeCourseId : undefined;
  const { course: publicCourse, isLoading: loadingPublicCourse } =
    useGetPublicCourse(publicFetchId);

  const course = stateCourse || liveCourse || publicCourse;
  const courseId = course?._id || routeCourseId;

  const { tasks = [] } = useGetTasks(courseId);
  const { deleteMyTask } = useDeleteTask(courseId);
  const { markTask } = useMarkTask(courseId);
  const { students = [] } = useGetStudentsByCourse(courseId);
  const { lectures = [] } = useGetLecturesByCourse(courseId);
  const { deleteMyLecture } = useDeleteLecture(courseId);
  const { markLecture } = useMarkLecture(courseId);
  const { setLectureAcknowledged } = useAcknowledgeLecture(courseId);
  const { progressData } = useGetCourseProgress(courseId);
  const { bulkprogressData, isbulkLoading } = useGetBulkProgress(courseId);
  const { average: ratingAvg, count: ratingCount, policy: ratingPolicy } = useGetRatingSummary(courseId);
  const { grades: mySubmissionGrades = [] } = useGetMyCourseSubmissionGrades(
    user?.role === "student" ? courseId : undefined,
  );
  const { myRating } = useGetMyRating(
    user?.role === "student" && courseId ? courseId : undefined,
    Boolean(user?.role === "student" && courseId),
  );
  const { mutate: submitRating, isPending: isSubmittingRating } = useUpsertRating(courseId);

  const is_instructor =
    user?._id &&
    course &&
    (user._id === course?.teacher?._id || user._id === course?.teacher);

  const { data: rosterLearnerSnapshots = [], isLoading: rosterSnapshotsLoading } =
    useCourseRosterLearnerSnapshots(courseId, Boolean(courseId && is_instructor));

  const { data: curriculumAnalytics } = useCourseCurriculumAnalytics(
    courseId,
    Boolean(courseId && is_instructor && workspaceTab === "curriculum"),
  );

  const { data: taskAnalytics } = useCourseTaskAnalytics(
    courseId,
    Boolean(courseId && is_instructor && workspaceTab === "tasks"),
  );

  const {
    data: instructorActivity,
    isLoading: activityLoading,
    isFetching: activityFetching,
    isError: activityError,
    refetch: refetchActivity,
  } = useCourseInstructorActivity(courseId, Boolean(courseId && is_instructor));

  useEffect(() => {
    if (user?.role !== "student" || !courseId) return;
    axiosInstance.post(`/courses/${courseId}/workspace-visits`).catch(() => {});
  }, [user?.role, courseId]);

  const { publishCourse, isPending: isPublishingCourse } = usePublishCourse(courseId);
  const { saveCourse, isPending: isSavingCourse } = useUpdateCourse(courseId);
  const { data: teacherCategoryOptions = [] } = useGetCourseCategories(
    user?.role === "admin" ? course?.teacher?._id ?? course?.teacher : undefined,
  );
  const editableCourse = liveCourse || course;
  const status = editableCourse?.status || "draft";

  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "",
    trailerTitle: "",
    trailerVideoUrl: "",
    trailerVimeoVideoId: "",
  });
  const [catalogForm, setCatalogForm] = useState(() => emptyCatalogForm());
  const [courseImageFile, setCourseImageFile] = useState(null);
  const [courseImagePreview, setCourseImagePreview] = useState("");
  const [studentWorkspaceTab, setStudentWorkspaceTab] = useState("progress");
  const [studentVideoExpanded, setStudentVideoExpanded] = useState(false);
  const studentTabsRef = useRef(null);
  const [selectedLectureId, setSelectedLectureId] = useState(null);
  const [editCourseDetailsOpen, setEditCourseDetailsOpen] = useState(false);

  const sortedLectures = useMemo(
    () =>
      [...(lectures || [])].sort((a, b) => {
        const levelDiff = (a.level?.number ?? 0) - (b.level?.number ?? 0);
        if (levelDiff !== 0) return levelDiff;
        return (a.order ?? 0) - (b.order ?? 0);
      }),
    [lectures],
  );

  const selectedLecture = useMemo(() => {
    if (!selectedLectureId) return null;
    return sortedLectures.find((l) => l._id === selectedLectureId) || null;
  }, [sortedLectures, selectedLectureId]);

  const nextLecture = useMemo(() => {
    if (!selectedLectureId || !sortedLectures.length) return null;
    const idx = sortedLectures.findIndex((l) => l._id === selectedLectureId);
    if (idx === -1 || idx >= sortedLectures.length - 1) return null;
    return sortedLectures[idx + 1];
  }, [sortedLectures, selectedLectureId]);

  const teacherStats = useMemo(() => {
    const validStudents = (students || []).filter(Boolean);
    const validProgressRows = (bulkprogressData || []).filter(
      (row) => row && Number.isFinite(Number(row.progress)),
    );
    const overallCompletionPercent = validProgressRows.length
      ? validProgressRows.reduce((sum, row) => sum + Number(row.progress || 0), 0) /
        validProgressRows.length
      : 0;
    const totalLectureSeconds = (lectures || []).reduce(
      (sum, l) => sum + Number(l?.duration || 0),
      0,
    );
    return {
      studentsCount: validStudents.length,
      overallCompletionPercent,
      lecturesCount: (lectures || []).length,
      totalLectureSeconds,
    };
  }, [students, bulkprogressData, lectures]);

  useEffect(() => {
    setCourseForm({
      title: editableCourse?.title || "",
      description: editableCourse?.description || "",
      category: editableCourse?.category || "",
      trailerTitle: typeof editableCourse?.trailerTitle === "string" ? editableCourse.trailerTitle : "",
      trailerVideoUrl: typeof editableCourse?.trailerVideoUrl === "string" ? editableCourse.trailerVideoUrl : "",
      trailerVimeoVideoId:
        typeof editableCourse?.trailerVimeoVideoId === "string" ? editableCourse.trailerVimeoVideoId : "",
    });
    setCourseImagePreview(editableCourse?.image || "");
    setCourseImageFile(null);
  }, [
    editableCourse?._id,
    editableCourse?.title,
    editableCourse?.description,
    editableCourse?.category,
    editableCourse?.trailerTitle,
    editableCourse?.trailerVideoUrl,
    editableCourse?.trailerVimeoVideoId,
    editableCourse?.image,
  ]);

  useEffect(() => {
    setCatalogForm(catalogFromCourse(editableCourse));
  }, [editableCourse?._id]);

  useEffect(() => {
    if (!sortedLectures.length) {
      setSelectedLectureId(null);
      return;
    }
    const storageKey = courseId ? `workspaceSelectedLecture:${courseId}` : null;
    setSelectedLectureId((prev) => {
      const normalizedPrev = prev ? String(prev) : null;
      const hasPrev = normalizedPrev
        ? sortedLectures.some((l) => String(l._id) === normalizedPrev)
        : false;
      if (hasPrev) return normalizedPrev;

      let fromStorage = null;
      if (storageKey) {
        try {
          fromStorage = sessionStorage.getItem(storageKey);
        } catch {
          fromStorage = null;
        }
      }
      if (fromStorage && sortedLectures.some((l) => String(l._id) === String(fromStorage))) {
        return String(fromStorage);
      }
      return sortedLectures[0]?._id ? String(sortedLectures[0]._id) : null;
    });
  }, [sortedLectures, courseId]);

  useEffect(() => {
    if (courseId && selectedLectureId) {
    try {
      sessionStorage.setItem(`workspaceSelectedLecture:${courseId}`, String(selectedLectureId));
    } catch {
      /* ignore */
      }
    }
  }, [courseId, selectedLectureId]);

  useEffect(() => {
    if (is_instructor && workspaceTab === "settings") {
      setEditCourseDetailsOpen(true);
    }
  }, [is_instructor, workspaceTab]);

  const isApproved = progressData?.certificateApproved;
  const completedTaskIds = new Set(
    (progressData?.completedTasks || []).map((id) => id?.toString?.() || String(id)),
  );
  const completedLectureIds = new Set(
    (progressData?.completedLectures || []).map((id) => id?.toString?.() || String(id)),
  );
  const gradeByTaskId = useMemo(
    () =>
      new Map(
        (mySubmissionGrades || []).map((g) => [
          String(g.taskId),
          g.grade == null ? null : Number(g.grade),
        ]),
      ),
    [mySubmissionGrades],
  );

  const acknowledgedLectureIds = useMemo(
    () =>
      new Set(
        (progressData?.acknowledgedLectures || []).map((id) =>
          id?.toString?.() ? id.toString() : String(id),
        ),
      ),
    [progressData?.acknowledgedLectures],
  );

  const handleAcknowledgeLecture = useCallback(
    async (lectureId, acknowledged) => {
      try {
        await setLectureAcknowledged({ lectureId, acknowledged });
      } catch {
        /* toast in hook */
      }
    },
    [setLectureAcknowledged],
  );

  /** Roughly sticky app header (top-16) + course title bar height + breathing room — avoids scrollIntoView fighting stickies */
  const scrollToStudentTabs = useCallback((tabId) => {
    const underHeaderPx = 140;
    if (tabId) setStudentWorkspaceTab(tabId);
    requestAnimationFrame(() => {
      const el = studentTabsRef.current;
      if (!el) return;
      const top = window.scrollY + el.getBoundingClientRect().top - underHeaderPx;
      window.scrollTo({ top: Math.max(0, top), behavior: "smooth" });
    });
  }, []);

  if ((loadingLiveCourse || loadingPublicCourse) && !course) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (!course) {
    return (
      <p className="p-8 text-center text-gray-500">
        Course not found. Open it from your dashboard or catalog.
      </p>
    );
  }

  if (!is_instructor && workspaceTab) {
    return <Navigate to={paths.courseWorkspace(course._id)} replace />;
  }

  if (is_instructor && !workspaceTab) {
    return (
      <Navigate
        to={paths.courseWorkspaceTab(course._id, "overview")}
        replace
        state={location.state}
      />
    );
  }

  if (is_instructor && workspaceTab === "activity") {
    return (
      <Navigate
        to={`${paths.courseWorkspaceTab(course._id, "overview")}#workspace-activity-feed`}
        replace
      />
    );
  }

  if (is_instructor && workspaceTab && !TEACHER_WORKSPACE_TAB_IDS.includes(workspaceTab)) {
    return <Navigate to={paths.courseWorkspaceTab(course._id, "overview")} replace />;
  }

  const isFullProgress = progressData?.progress === 100;

  const handleDelete = async (taskId) => {
    const ok = await confirmAction("Delete this task? This cannot be undone.", {
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteMyTask(taskId);
    } catch (error) {
      toast.error(error.response?.data?.message || "Failed to delete task");
    }
  };

  const handledeletelecture = async (lectureId) => {
    const ok = await confirmAction("Delete this lecture? This cannot be undone.", {
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteMyLecture(lectureId);
    } catch {
      toast.error("Failed to delete lecture");
    }
  };

  const handleMarkLectureComplete = async (lectureId) => {
    if (!lectureId || completedLectureIds.has(String(lectureId))) return;
    try {
      await markLecture(lectureId);
    } catch {
      /* toast in hook */
    }
  };

  const handleMarkExamComplete = async (taskId) => {
    if (!taskId || completedTaskIds.has(String(taskId))) return;
    try {
      await markTask(taskId);
    } catch {
      /* toast in hook */
    }
  };

  const handleSubmitRating = (value) => {
    if (
      !value ||
      is_instructor ||
      ratingPolicy?.ratingsGloballyDisabled ||
      ratingPolicy?.courseRatingsDisabled
    ) {
      return;
    }
    submitRating(value);
  };

  const handleCourseFieldChange = (e) =>
    setCourseForm((prev) => ({ ...prev, [e.target.name]: e.target.value }));
  const handleCourseImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCourseImageFile(file);
    setCourseImagePreview(file ? URL.createObjectURL(file) : editableCourse?.image || "");
  };
  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      await saveCourse({ ...courseForm, ...catalogForm, image: courseImageFile });
    } catch (error) {
      console.error("Failed to save course details", error);
    }
  };

  const handlePublishCourse = async () => {
    const ok = await confirmAction(t("learning.publishConfirm"));
    if (!ok) return;
    try {
      await publishCourse();
    } catch {
      /* errors surfaced by mutation toast */
    }
  };

  const handleNextLecture = () => {
    if (nextLecture) setSelectedLectureId(nextLecture._id);
  };

  const inputClass =
    "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

  // ─────────────────────────────────────────────────────────────────────────
  // STUDENT LAYOUT: Player-first experience
  // ─────────────────────────────────────────────────────────────────────────
  if (!is_instructor) {
    const progressPct = Math.min(100, Math.max(0, Number(progressData?.progress ?? 0)));

    const assignmentsPanel = (
      <div id="workspace-tasks" className="scroll-mt-4">
            <TasksSection
              tasks={tasks || []}
              canDelete={false}
              onDeleteTask={undefined}
              getAssignmentAction={(task) => {
                const isSubmitted = completedTaskIds.has(task._id?.toString?.());
                const isClosed = !!task.dueDate && new Date(task.dueDate) < new Date();
                if (task.type === "resource") return null;
                if (isClosed && !isSubmitted) return { label: "Closed", disabled: true };
                return {
                  href: paths.courseTaskSubmit(course._id, task._id),
                  label: isClosed
                    ? "View submission"
                    : isSubmitted
                      ? "Update submission"
                      : "Upload solution",
                };
              }}
              getTaskStatus={(task) => {
                if (task.type === "resource") return { label: "Resource", tone: "neutral" };
                if (task.type !== "assignment") return null;
                const isClosed = !!task.dueDate && new Date(task.dueDate) < new Date();
                const isSubmitted = completedTaskIds.has(task._id?.toString?.());
                if (isClosed)
                  return {
                    label: isSubmitted ? "Submitted" : "Closed",
                    tone: isSubmitted ? "success" : "danger",
                  };
                return {
                  label: isSubmitted ? "Submitted" : "Not submitted",
                  tone: isSubmitted ? "success" : "neutral",
                };
              }}
              getExamAction={(task) => {
                if (task.type !== "exam") return null;
                const isDone = completedTaskIds.has(String(task._id));
                const isClosed = !!task.dueDate && new Date(task.dueDate) < new Date();
                return {
                  label: isDone ? "Completed" : isClosed ? "Closed" : "Mark complete",
                  disabled: isDone || isClosed,
                  onClick: () => handleMarkExamComplete(task._id),
                };
              }}
              getTaskGrade={(task) => gradeByTaskId.get(String(task._id))}
              getResourceAction={(task) => {
                if (task.type !== "resource") return null;
                return {
                  href: task.resourceUrl || "#",
                  label: "Download",
                  download: true,
                };
              }}
            />
      </div>
    );

    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        <div className="sticky top-16 z-40 w-full border-b border-gray-200 dark:border-gray-800 bg-white/95 dark:bg-gray-900/95 backdrop-blur-md">
          <div className="max-w-[min(104rem,calc(100vw-2rem))] mx-auto px-4 sm:px-6 lg:px-8 py-3 flex items-center justify-between gap-3">
            <div className="min-w-0 flex-1">
              <h1 className="text-sm font-bold text-gray-900 dark:text-white truncate">
                {course?.title || "Course"}
              </h1>
              {course?.teacher?.name && (
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{course.teacher.name}</p>
              )}
            </div>
            <div className="flex items-center gap-2 shrink-0">
              <button
                type="button"
                onClick={() => setStudentVideoExpanded((v) => !v)}
                className="inline-flex items-center justify-center rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-800 p-2 text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
                title={studentVideoExpanded ? "Show lesson list beside video" : "Full-width video"}
                aria-pressed={studentVideoExpanded}
              >
                {studentVideoExpanded ? (
                  <Minimize2 className="w-4 h-4" aria-hidden />
                ) : (
                  <Maximize2 className="w-4 h-4" aria-hidden />
                )}
              </button>
              <button
                type="button"
                onClick={() => scrollToStudentTabs("progress")}
                className="inline-flex items-center gap-1.5 rounded-full border border-brand-200 dark:border-brand-800 bg-brand-50/90 dark:bg-brand-950/40 px-3 py-1.5 text-brand-800 dark:text-brand-200 hover:bg-brand-100/90 dark:hover:bg-brand-900/50 transition-colors"
                title="Open progress"
              >
                <PieChart className="w-4 h-4 shrink-0 opacity-90" aria-hidden />
                <span className="text-xs font-extrabold tabular-nums">{progressPct}%</span>
              </button>
            </div>
          </div>
        </div>

        <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="w-full max-w-[min(104rem,calc(100vw-2rem))] mx-auto px-4 sm:px-6 lg:px-8 py-5 sm:py-6">
            <LecturesAndPlayerSection
              courseId={course._id}
              lectures={lectures || []}
              selectedLecture={selectedLecture}
              onSelectLecture={(lecture) => setSelectedLectureId(lecture._id)}
              isInstructor={false}
              isStudent={true}
              onDeleteLecture={undefined}
              onMarkLectureComplete={handleMarkLectureComplete}
              completedLectureIds={completedLectureIds}
              onEditLecture={undefined}
              selectedLectureId={selectedLectureId}
              watchMode={true}
              onToggleWatchMode={undefined}
              nextLecture={nextLecture}
              onNextLecture={handleNextLecture}
              studentVideoExpanded={studentVideoExpanded}
              acknowledgedLectureIds={acknowledgedLectureIds}
              onAcknowledgeLecture={handleAcknowledgeLecture}
            />
          </div>
          </div>

        <div className="w-full bg-gray-50 dark:bg-gray-950 border-b border-gray-200/80 dark:border-gray-800">
          <div className="w-full max-w-[min(104rem,calc(100vw-2rem))] mx-auto px-4 sm:px-6 lg:px-8 py-8 sm:py-10">
            <StudentCourseWorkspaceTabs
              ref={studentTabsRef}
              activeTab={studentWorkspaceTab}
              onTabChange={setStudentWorkspaceTab}
              progressPanel={
                <StudentProgressCard
                  courseId={course?._id}
                  courseTitle={course?.title}
                  progressPercent={progressData?.progress}
                  isFullProgress={isFullProgress}
                  isApproved={isApproved}
                  certificateCode={progressData?.certificateCode}
                  totalLectures={(lectures || []).length}
                  completedLecturesCount={completedLectureIds.size}
                  totalTasks={(tasks || []).length}
                  completedTasksCount={completedTaskIds.size}
                  myRating={myRating}
                  onSubmitRating={handleSubmitRating}
                  isSubmittingRating={isSubmittingRating}
                  ratingBlocked={
                    Boolean(
                      ratingPolicy?.ratingsGloballyDisabled ||
                        ratingPolicy?.courseRatingsDisabled,
                    )
                  }
                  showRefundLink={false}
                  lectures={sortedLectures}
                />
              }
              assignmentsPanel={assignmentsPanel}
              refundsPanel={
                <div className="space-y-4">
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    Request a refund according to your enrollment and school policy.
                  </p>
          <CourseRefundCard courseId={course?._id} />
                </div>
              }
              qaPanel={
            <CourseCommentsSection
              courseId={course?._id}
              courseTeacherId={course?.teacher?._id}
                  title="Questions & answers"
                />
              }
            />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEACHER / ADMIN LAYOUT: Route tabs (curriculum · students · tasks · settings · Q&A → route id "comments")
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6">
      <div className="mx-auto max-w-[min(96rem,calc(100vw-2rem))] space-y-6">
            <CourseWorkspaceHero
              course={course}
              editableCourse={editableCourse}
              isInstructor={true}
              liveCourse={liveCourse}
              ratingAvg={ratingAvg}
              ratingCount={ratingCount}
          onPublish={handlePublishCourse}
          isPublishing={isPublishingCourse}
              publicCourseId={course._id}
            />

        <TeacherWorkspaceTabNav
          courseId={course._id}
          courseStatus={status}
          tabBadges={{
            overview: instructorActivity?.newEventCount ?? 0,
          }}
        />

        {workspaceTab === "overview" && (
          <TeacherCourseOverviewPanel
            courseId={course._id}
            studentsCount={teacherStats.studentsCount}
            overallCompletionPercent={teacherStats.overallCompletionPercent}
            instructorActivity={instructorActivity}
            activityLoading={activityLoading}
            activityError={activityError}
            activityFetching={activityFetching}
            onRefreshActivity={refetchActivity}
          />
        )}

        {workspaceTab === "curriculum" && (
          <>
            <TeacherQuickActionsBar
              courseId={course._id}
              lectureCount={(lectures || []).length}
              taskCount={(tasks || []).length}
              sortedLectures={sortedLectures}
            />

            <LecturesAndPlayerSection
              courseId={course._id}
              lectures={lectures || []}
              selectedLecture={selectedLecture}
              onSelectLecture={(lecture) => setSelectedLectureId(lecture._id)}
              isInstructor={true}
              isStudent={false}
              onDeleteLecture={handledeletelecture}
              onMarkLectureComplete={undefined}
              completedLectureIds={completedLectureIds}
              onEditLecture={(lecture) =>
                navigate(paths.courseEditLecture(course._id, lecture._id), {
                  state: { lecture },
                })
              }
              selectedLectureId={selectedLectureId}
              watchMode={false}
              onToggleWatchMode={undefined}
              curriculumAnalytics={curriculumAnalytics}
              onBackToCurriculum={() => {
                setSelectedLectureId(null);
                try {
                  if (course._id)
                    sessionStorage.removeItem(`workspaceSelectedLecture:${course._id}`);
                } catch {
                  /* ignore */
                }
                requestAnimationFrame(() => {
                  document.getElementById("workspace-curriculum-tree")?.scrollIntoView({
                    behavior: "smooth",
                    block: "start",
                  });
                });
              }}
            />
          </>
        )}

        {workspaceTab === "students" && (
          <div id="workspace-students" className="scroll-mt-20">
            <StudentsSection
              courseId={course?._id}
              students={students || []}
              bulkprogressData={bulkprogressData || []}
              isLoading={isbulkLoading}
              learnerSnapshots={rosterLearnerSnapshots}
              learnerSnapshotsLoading={rosterSnapshotsLoading}
              announcementHref={paths.sendAnnouncement}
            />
          </div>
        )}

        {workspaceTab === "tasks" && (
            <div id="workspace-tasks" className="scroll-mt-20">
              <TasksSection
                tasks={tasks || []}
                canDelete={true}
                onDeleteTask={handleDelete}
                courseId={course._id}
                taskAnalytics={taskAnalytics}
                getInstructorAction={(task) => ({
                  href: paths.courseTaskSubmissions(course._id, task._id),
                  label: "View submissions",
                })}
              />
            </div>
        )}

        {workspaceTab === "settings" && (
          <CourseEditDetailsSection
            open={editCourseDetailsOpen}
            onToggle={() => setEditCourseDetailsOpen((o) => !o)}
            onSubmit={handleSaveCourse}
            inputClass={inputClass}
            courseForm={courseForm}
            onFieldChange={handleCourseFieldChange}
            onImageChange={handleCourseImageChange}
            courseImagePreview={courseImagePreview}
            isSaving={isSavingCourse}
            teacherCategoryOptions={teacherCategoryOptions}
            catalogForm={catalogForm}
            onCatalogChange={setCatalogForm}
          />
        )}

        {workspaceTab === "comments" && (
            <div id="workspace-comments" className="scroll-mt-20">
              <CourseCommentsSection
                courseId={course?._id}
                courseTeacherId={course?.teacher?._id}
              title="Questions & answers"
              presentation="qa"
              />
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDashboard;
