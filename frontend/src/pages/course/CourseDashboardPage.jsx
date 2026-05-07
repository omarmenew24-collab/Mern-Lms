import { useLocation, useNavigate, useParams } from "react-router-dom";
import { useEffect, useMemo, useState } from "react";

import { useGetTasks, useDeleteTask, useGetMyCourseSubmissionGrades, useMarkTask } from "../../api/task";
import {
  useGetStudentsByCourse,
  useGetCourseProgress,
  useGetBulkProgress,
  useGetCourseById,
  useSubmitCourseForReview,
  useUpdateCourse,
  useGetCourseCategories,
} from "../../api/course";
import { useGetLecturesByCourse, useDeleteLecture, useMarkLecture } from "../../api/lecture";
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

import CourseWorkspaceSideNav from "../../components/course/workspace/CourseWorkspaceSideNav";
import StudentProgressCard from "../../components/course/workspace/StudentProgressCard";
import CourseWorkspaceHero from "../../components/course/workspace/CourseWorkspaceHero";
import CourseEditDetailsSection from "../../components/course/workspace/CourseEditDetailsSection";
import LecturesAndPlayerSection from "../../components/course/workspace/LecturesAndPlayerSection";
import TeacherQuickActionsBar from "../../components/course/workspace/TeacherQuickActionsBar";
import TeacherCourseStatsStrip from "../../components/course/workspace/TeacherCourseStatsStrip";
import CourseRefundCard from "../../components/refunds/CourseRefundCard";

const CourseDashboard = () => {
  const location = useLocation();
  const navigate = useNavigate();
  const { courseId: routeCourseId } = useParams();
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

  const { submitForReview, isPending: isSubmittingReview } = useSubmitCourseForReview(courseId);
  const { saveCourse, isPending: isSavingCourse } = useUpdateCourse(courseId);
  const { data: teacherCategoryOptions = [] } = useGetCourseCategories(
    user?.role === "admin" ? course?.teacher?._id ?? course?.teacher : undefined,
  );
  const editableCourse = liveCourse || course;
  const status = editableCourse?.status || "draft";

  const [courseForm, setCourseForm] = useState({ title: "", description: "", category: "" });
  const [catalogForm, setCatalogForm] = useState(() => emptyCatalogForm());
  const [courseImageFile, setCourseImageFile] = useState(null);
  const [courseImagePreview, setCourseImagePreview] = useState("");
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
    });
    setCourseImagePreview(editableCourse?.image || "");
    setCourseImageFile(null);
  }, [
    editableCourse?._id,
    editableCourse?.title,
    editableCourse?.description,
    editableCourse?.category,
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
    if (!courseId || !selectedLectureId) return;
    try {
      sessionStorage.setItem(`workspaceSelectedLecture:${courseId}`, String(selectedLectureId));
    } catch {
      /* ignore */
    }
  }, [courseId, selectedLectureId]);

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

  const handleNextLecture = () => {
    if (nextLecture) setSelectedLectureId(nextLecture._id);
  };

  const inputClass =
    "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

  // ─────────────────────────────────────────────────────────────────────────
  // STUDENT LAYOUT: Player-first experience
  // ─────────────────────────────────────────────────────────────────────────
  if (!is_instructor) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950">
        {/* Course title bar above the player */}
        {course?.title && (
          <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800 px-4 py-3">
            <div className="max-w-[1440px] mx-auto flex items-center gap-2">
              <span className="text-sm font-semibold text-gray-800 dark:text-white truncate">{course.title}</span>
              {course?.teacher?.name && (
                <span className="text-xs text-gray-400 dark:text-gray-500 shrink-0">· {course.teacher.name}</span>
              )}
            </div>
          </div>
        )}

        {/* Full-width player + lecture list */}
        <div className="w-full bg-white dark:bg-gray-900 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-[1440px] mx-auto">
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
            />
          </div>
        </div>

        {/* Below-the-player content */}
        <div className="max-w-5xl mx-auto px-4 sm:px-6 py-6 space-y-5">
          <StudentProgressCard
            user={user}
            courseTitle={course?.title}
            progressPercent={progressData?.progress}
            isFullProgress={isFullProgress}
            isApproved={isApproved}
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
            showRefundLink
          />

          <div id="workspace-tasks" className="scroll-mt-20">
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

          <CourseRefundCard courseId={course?._id} />

          <div id="workspace-comments" className="scroll-mt-20">
            <CourseCommentsSection
              courseId={course?._id}
              courseTeacherId={course?.teacher?._id}
              title="Course comments"
            />
          </div>
        </div>
      </div>
    );
  }

  // ─────────────────────────────────────────────────────────────────────────
  // TEACHER / ADMIN LAYOUT: Management-first dashboard
  // ─────────────────────────────────────────────────────────────────────────
  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-8 px-4 sm:px-6">
      <div className="max-w-6xl mx-auto">
        <div className="flex flex-col-reverse gap-6 lg:flex-row lg:items-start">
          <div className="w-full lg:w-52 shrink-0">
            <CourseWorkspaceSideNav
              isInstructor={true}
              courseStatus={status}
            />
          </div>

          <div className="min-w-0 flex-1 space-y-6">
            <CourseWorkspaceHero
              userName={user?.name}
              course={course}
              editableCourse={editableCourse}
              isInstructor={true}
              status={status}
              liveCourse={liveCourse}
              ratingAvg={ratingAvg}
              ratingCount={ratingCount}
              onSubmitForReview={() => submitForReview()}
              isSubmittingReview={isSubmittingReview}
              publicCourseId={course._id}
            />

            <TeacherCourseStatsStrip
              studentsCount={teacherStats.studentsCount}
              overallCompletionPercent={teacherStats.overallCompletionPercent}
              lecturesCount={teacherStats.lecturesCount}
              totalLectureSeconds={teacherStats.totalLectureSeconds}
              ratingAvg={ratingAvg}
              ratingCount={ratingCount}
            />

            <TeacherQuickActionsBar
              courseId={course._id}
              lectureCount={(lectures || []).length}
              taskCount={(tasks || []).length}
            />

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

            <div id="workspace-students" className="scroll-mt-20">
              <StudentsSection
                courseId={course?._id}
                students={students || []}
                bulkprogressData={bulkprogressData || []}
                isLoading={isbulkLoading}
                announcementHref={paths.sendAnnouncement}
              />
            </div>

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
            />

            <div id="workspace-tasks" className="scroll-mt-20">
              <TasksSection
                tasks={tasks || []}
                canDelete={true}
                onDeleteTask={handleDelete}
                courseId={course._id}
                getInstructorAction={(task) => ({
                  href: paths.courseTaskSubmissions(course._id, task._id),
                  label: "View submissions",
                })}
              />
            </div>

            <div id="workspace-comments" className="scroll-mt-20">
              <CourseCommentsSection
                courseId={course?._id}
                courseTeacherId={course?.teacher?._id}
                title="Course comments"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CourseDashboard;
