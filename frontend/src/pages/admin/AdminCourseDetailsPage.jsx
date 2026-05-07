import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import { confirmAction } from "../../lib/confirmToast.jsx";

import {
  useGetBulkProgress,
  useGetCourseById,
  useGetStudentsByCourse,
  useReviewCourse,
  useSetCoursePublished,
  useSoftDeleteCourse,
  useUpdateCourse,
  useGetCourseCategories,
} from "../../api/course";
import {
  useGetCoursePaymentReport,
  useBulkEnrollStudents,
} from "../../api/payment";
import { useGetLecturesByCourse, useDeleteLecture } from "../../api/lecture";
import { useGetTasks, useDeleteTask } from "../../api/task";

import LecturesSection from "../../components/courseSections/LecturesSection";
import LecturePlayerPanel from "../../components/courseSections/LecturePlayerPanel";
import TasksSection from "../../components/courseSections/TasksSection";
import StudentsSection from "../../components/courseSections/StudentsSection";
import { useGetRatingSummary } from "../../api/rating";
import CourseCommentsSection from "../../components/CourseCommentsSection";
import ExportCsvButton from "../../components/admin/ExportCsvButton";
import CourseCatalogSectionsForm, {
  catalogFromCourse,
  emptyCatalogForm,
} from "../../components/course/CourseCatalogSectionsForm";
import SavedCourseCategoryChips from "../../components/course/SavedCourseCategoryChips";
import CourseCategoryField from "../../components/course/CourseCategoryField";

const tabs = [
  { id: "overview", label: "Overview" },
  { id: "students", label: "Students" },
  { id: "content", label: "Content" },
  { id: "comments", label: "Comments" },
  { id: "payments", label: "Payments" },
  { id: "settings", label: "Settings" },
];

function StatCard({ label, value, sub }) {
  return (
    <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
      <div className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
        {label}
      </div>
      <div className="mt-1 text-2xl font-black text-gray-900 dark:text-white">{value}</div>
      {sub && <div className="mt-1 text-xs text-gray-500 dark:text-gray-400">{sub}</div>}
    </div>
  );
}

export default function AdminCourseDetails() {
  const { t } = useTranslation();
  const { money, dateTime } = useFormatter();
  const { courseId } = useParams();
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("overview");
  const [reviewNote, setReviewNote] = useState("");
  const [courseForm, setCourseForm] = useState({
    title: "",
    description: "",
    category: "",
    price: "",
    promotionEnabled: false,
    promotionType: "percent",
    promotionValue: "",
    promotionStartsAt: "",
    promotionEndsAt: "",
    commentsDisabled: false,
    ratingsDisabled: false,
  });
  const [courseImageFile, setCourseImageFile] = useState(null);
  const [courseImagePreview, setCourseImagePreview] = useState("");
  const [catalogForm, setCatalogForm] = useState(() => emptyCatalogForm());
  const [selectedLectureId, setSelectedLectureId] = useState(null);

  const { course, isLoading: isCourseLoading, isError: isCourseError } =
    useGetCourseById(courseId);
  const { lectures, isLoading: isLecturesLoading } =
    useGetLecturesByCourse(courseId);
  const { tasks, isLoading: isTasksLoading } = useGetTasks(courseId);
  const { students, isLoading: isStudentsLoading } =
    useGetStudentsByCourse(courseId);
  const { bulkprogressData, isbulkLoading } = useGetBulkProgress(courseId);

  const {
    totalRevenue,
    currency,
    payments,
    isLoading: isPaymentReportLoading,
    isError: isPaymentReportError,
    error: paymentReportError,
  } = useGetCoursePaymentReport(courseId);

  const { deleteMyLecture } = useDeleteLecture(courseId);
  const { deleteMyTask } = useDeleteTask(courseId);

  const { setCoursePublished, isPending: isPublishPending } =
    useSetCoursePublished(courseId);
  const { reviewCourse, isPending: isReviewPending } = useReviewCourse(courseId);
  const { softDeleteCourse, isPending: isDeletePending } =
    useSoftDeleteCourse(courseId);
  const { saveCourse, isPending: isSaveCoursePending } = useUpdateCourse(courseId);

  const { data: teacherCategoryOptions = [] } = useGetCourseCategories(
    course?.teacher?._id ?? course?.teacher,
  );

  const { average: ratingAvg, count: ratingCount } =
    useGetRatingSummary(courseId);

  // Bulk enrollment: StudentsSection calls this with selected user ids → POST /enroll/:courseId/bulk
  const { bulkEnrollStudents, isBulkEnrolling } =
    useBulkEnrollStudents(courseId);

  const handleBulkEnroll = async (studentIds) => {
    try {
      await bulkEnrollStudents(studentIds);
    } catch {
      /* toasts handled in mutation */
    }
  };

  const sortedLectures = useMemo(
    () =>
      [...(lectures || [])].sort((a, b) => {
        const levelDiff = (a.level?.number ?? 0) - (b.level?.number ?? 0);
        if (levelDiff !== 0) return levelDiff;
        return (a.order ?? 0) - (b.order ?? 0);
      }),
    [lectures],
  );

  const selectedLecture =
    sortedLectures.find((lecture) => lecture._id === selectedLectureId) ||
    sortedLectures[0] ||
    null;

  const quickCategoryNames = useMemo(() => {
    const seen = new Set();
    const out = [];
    for (const c of teacherCategoryOptions) {
      const n = String(c?.name || "").trim();
      if (!n) continue;
      const k = n.toLowerCase();
      if (seen.has(k)) continue;
      seen.add(k);
      out.push(n);
    }
    return out
      .sort((a, b) => a.localeCompare(b, undefined, { sensitivity: "base" }))
      .slice(0, 14);
  }, [teacherCategoryOptions]);

  const getCourseSavePayload = (overrides = {}) => ({
    title: courseForm.title,
    description: courseForm.description,
    category: courseForm.category,
    price: Number(courseForm.price),
    image: courseImageFile,
    promotionEnabled: courseForm.promotionEnabled,
    promotionType: courseForm.promotionType,
    promotionValue: courseForm.promotionValue,
    promotionStartsAt: courseForm.promotionStartsAt || undefined,
    promotionEndsAt: courseForm.promotionEndsAt || undefined,
    commentsDisabled: courseForm.commentsDisabled,
    ratingsDisabled: courseForm.ratingsDisabled,
    ...catalogForm,
    ...overrides,
  });

  const applyCategoryQuick = async (nextCategory) => {
    const t = String(nextCategory || "").trim();
    if (!t || t === (course?.category || "").trim()) return;
    try {
      await saveCourse(getCourseSavePayload({ category: t }));
      setCourseForm((prev) => ({ ...prev, category: t }));
    } catch {
      /* saveCourse toasts on success; errors logged in hook or below */
    }
  };

  const computed = useMemo(() => {
    const totalEnrollments = students?.length ?? 0;
    const progressValues = (bulkprogressData || [])
      .map((r) => Number(r.progress ?? 0))
      .filter((n) => !Number.isNaN(n));
    const avgProgress =
      progressValues.length === 0
        ? 0
        : Math.round(
            progressValues.reduce((a, b) => a + b, 0) / progressValues.length,
          );
    const completedCount = (bulkprogressData || []).filter(
      (r) => r.isCompleted,
    ).length;
    const completionRate =
      totalEnrollments === 0
        ? 0
        : Math.round((completedCount / totalEnrollments) * 100);

    return {
      totalEnrollments,
      avgProgress,
      completionRate,
      totalRevenue,
    };
  }, [students, bulkprogressData, totalRevenue]);

  const toDatetimeLocal = (iso) => {
    if (!iso) return "";
    const d = new Date(iso);
    if (Number.isNaN(d.getTime())) return "";
    const pad = (n) => String(n).padStart(2, "0");
    return `${d.getFullYear()}-${pad(d.getMonth() + 1)}-${pad(d.getDate())}T${pad(d.getHours())}:${pad(d.getMinutes())}`;
  };

  useEffect(() => {
    const p = course?.promotion;
    setCourseForm({
      title: course?.title || "",
      description: course?.description || "",
      category: course?.category || "",
      price: course?.price ?? "",
      promotionEnabled: Boolean(p?.enabled),
      promotionType: p?.discountType === "fixed" ? "fixed" : "percent",
      promotionValue: p?.value !== undefined && p?.value !== null ? String(p.value) : "",
      promotionStartsAt: toDatetimeLocal(p?.startsAt),
      promotionEndsAt: toDatetimeLocal(p?.endsAt),
      commentsDisabled: Boolean(course?.commentsDisabled),
      ratingsDisabled: Boolean(course?.ratingsDisabled),
    });
    setCourseImagePreview(course?.image || "");
    setCourseImageFile(null);
  }, [
    course?._id,
    course?.title,
    course?.description,
    course?.category,
    course?.price,
    course?.promotion,
    course?.commentsDisabled,
    course?.ratingsDisabled,
  ]);

  useEffect(() => {
    setCatalogForm(catalogFromCourse(course));
  }, [course?._id]);

  useEffect(() => {
    if (!sortedLectures.length) {
      setSelectedLectureId(null);
      return;
    }

    const lectureStillExists = sortedLectures.some(
      (lecture) => lecture._id === selectedLectureId,
    );

    if (!lectureStillExists) {
      setSelectedLectureId(sortedLectures[0]._id);
    }
  }, [sortedLectures, selectedLectureId]);

  const handleDeleteLecture = async (lectureId) => {
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

  const handleDeleteTask = async (taskId) => {
    const ok = await confirmAction("Delete this task? This cannot be undone.", {
      destructive: true,
      confirmLabel: "Delete",
    });
    if (!ok) return;
    try {
      await deleteMyTask(taskId);
    } catch {
      toast.error("Failed to delete task");
    }
  };

  const handleTogglePublished = async () => {
    const next = !course?.isPublished;
    const ok = await confirmAction(
      next
        ? "Publish this course? It will become visible to users."
        : "Unpublish this course? It will be hidden from users.",
      { confirmLabel: next ? "Publish" : "Unpublish" },
    );
    if (!ok) return;
    try {
      await setCoursePublished(next);
    } catch {
      toast.error("Failed to update publish status");
    }
  };

  const handleSoftDelete = async () => {
    const ok = await confirmAction(
      "Soft delete this course? It will be hidden and unpublished (recommended).",
      { destructive: true, confirmLabel: "Soft delete" },
    );
    if (!ok) return;
    try {
      await softDeleteCourse();
      navigate("/admin/courses");
    } catch {
      toast.error("Failed to delete course");
    }
  };

  const handleCourseFieldChange = (e) => {
    const { name, value } = e.target;
    setCourseForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleCourseImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setCourseImageFile(file);
    setCourseImagePreview(file ? URL.createObjectURL(file) : course?.image || "");
  };

  const handleSaveCourse = async (e) => {
    e.preventDefault();
    try {
      await saveCourse(getCourseSavePayload());
    } catch (error) {
      console.error("Failed to save course details", error);
    }
  };

  if (isCourseLoading) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto">
          <div className="h-8 w-60 bg-gray-200 dark:bg-gray-800 rounded animate-pulse" />
          <div className="mt-6 grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse" />
            <div className="h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse" />
            <div className="h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse" />
            <div className="h-24 bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl animate-pulse" />
          </div>
        </div>
      </div>
    );
  }

  if (isCourseError || !course) {
    return (
      <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
        <div className="max-w-6xl mx-auto bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="text-lg font-bold text-gray-900 dark:text-white">
            Course not found
          </div>
          <button
            className="mt-4 px-4 py-2 bg-brand-600 text-white rounded-lg font-semibold hover:bg-brand-700 transition-colors"
            onClick={() => navigate("/admin/courses")}
          >
            Back to courses
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
          <div className="flex flex-col gap-4 md:flex-row md:items-start md:justify-between">
            <div className="min-w-0">
              <div className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500">
                Admin • Course Details
              </div>
              <h1 className="mt-1 text-2xl font-black text-gray-900 dark:text-white truncate">
                {course.title}
              </h1>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Teacher:{" "}
                <span className="font-semibold text-gray-800 dark:text-white">
                  {course.teacher?.name || "N/A"}
                </span>
              </div>
              <div className="mt-2 flex flex-wrap gap-2">
                <span
                  className={`px-2.5 py-1 rounded-full text-xs font-bold ${
                    course.isPublished
                      ? "bg-green-50 text-green-700 border border-green-200"
                      : "bg-gray-50 dark:bg-gray-800 text-gray-600 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
                  }`}
                >
                  {course.isPublished ? "PUBLISHED" : "UNPUBLISHED"}
                </span>
              </div>
            </div>

            <div className="flex gap-2">
              <button
                onClick={() => navigate("/admin/courses")}
                className="px-4 py-2 bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 rounded-lg text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 transition-colors"
              >
                Back
              </button>
            </div>
          </div>

          <div className="mt-5 border-t border-gray-100 dark:border-gray-800 pt-4 flex flex-wrap gap-2">
            {tabs.map((t) => (
              <button
                key={t.id}
                onClick={() => setActiveTab(t.id)}
                className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                  activeTab === t.id
                    ? "bg-brand-600 text-white"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-700"
                }`}
              >
                {t.label}
              </button>
            ))}
          </div>
        </div>

        {activeTab === "overview" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
              <StatCard
                label="Total enrollments"
                value={computed.totalEnrollments}
              />
              <StatCard
                label="Total revenue"
                value={
                  isPaymentReportLoading
                    ? "…"
                    : new Intl.NumberFormat(undefined, {
                        style: "currency",
                        currency: (currency || "usd").toUpperCase(),
                      }).format(Number(computed.totalRevenue))
                }
                sub={
                  isPaymentReportError
                    ? paymentReportError?.response?.data?.message ||
                      "Could not load payment data"
                    : "Stored Payment records (webhook: payment_intent.succeeded)"
                }
              />
              <StatCard
                label="Average progress"
                value={`${computed.avgProgress}%`}
                sub={isbulkLoading ? "Loading progress..." : undefined}
              />
              <StatCard
                label="Completion rate"
                value={`${computed.completionRate}%`}
                sub="Based on bulk progress records"
              />
              <StatCard
                label="Avg. rating"
                value={
                  ratingCount > 0
                    ? `${Number(ratingAvg).toFixed(1)} / 5`
                    : "—"
                }
                sub={
                  ratingCount > 0
                    ? `${ratingCount} rating${ratingCount === 1 ? "" : "s"}`
                    : "No ratings yet"
                }
              />
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <StudentsSection
                courseId={courseId}
                students={students || []}
                bulkprogressData={bulkprogressData || []}
                isLoading={isStudentsLoading || isbulkLoading}
                onBulkEnroll={handleBulkEnroll}
                isBulkEnrolling={isBulkEnrolling}
                adminRosterExportCourseId={courseId}
              />

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <div className="text-sm font-bold text-gray-900 dark:text-white">
                  Quick summary
                </div>
                <div className="mt-3 text-sm text-gray-600 dark:text-gray-300 space-y-2">
                  <div>
                    <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                      <span>
                        <span className="font-semibold text-gray-800 dark:text-white">Category:</span>{" "}
                        {course.category || "—"}
                      </span>
                      <button
                        type="button"
                        onClick={() => setActiveTab("settings")}
                        className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                      >
                        Full editor in Settings
                      </button>
                    </div>
                    {quickCategoryNames.length > 0 && (
                      <div className="mt-2 flex flex-wrap gap-1.5">
                        <span className="text-xs text-gray-500 dark:text-gray-400 w-full sm:w-auto">Set to:</span>
                        {quickCategoryNames.map((name) => {
                          const active =
                            (course?.category || "").trim().toLowerCase() ===
                            name.toLowerCase();
                          return (
                            <button
                              key={name}
                              type="button"
                              disabled={isSaveCoursePending}
                              onClick={() => applyCategoryQuick(name)}
                              className={
                                active
                                  ? "px-2.5 py-0.5 rounded-md text-xs font-medium bg-brand-100 dark:bg-brand-900/40 text-brand-800 dark:text-brand-200 border border-brand-300 dark:border-brand-700"
                                  : "px-2.5 py-0.5 rounded-md text-xs font-medium border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/80 text-gray-700 dark:text-gray-200 hover:border-brand-400 dark:hover:border-brand-600"
                              }
                            >
                              {name}
                            </button>
                          );
                        })}
                      </div>
                    )}
                  </div>
                  <div>
                    <span className="font-semibold text-gray-800 dark:text-white">Price:</span>{" "}
                    {course.promotionActive &&
                    typeof course.listPrice === "number" &&
                    typeof course.effectivePrice === "number" ? (
                      <span>
                        <span className="line-through text-gray-400 me-1">{money(course.listPrice)}</span>
                        <span>{money(course.effectivePrice)}</span>
                        <span className="text-emerald-600 dark:text-emerald-400 text-xs ms-1">(sale)</span>
                      </span>
                    ) : typeof (course.effectivePrice ?? course.price) === "number" ? (
                      money(course.effectivePrice ?? course.price)
                    ) : (
                      "—"
                    )}
                  </div>
                  <div>
                    <button
                      type="button"
                      onClick={() => setActiveTab("settings")}
                      className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Edit list price &amp; promotions (Settings tab) →
                    </button>
                  </div>
                  <div className="pt-2 border-t border-gray-100 dark:border-gray-800">
                    <span className="font-semibold text-gray-800 dark:text-white">
                      Description:
                    </span>
                    <div className="mt-1 text-gray-600 dark:text-gray-300">
                      {course.description || "—"}
                    </div>
                  </div>
                </div>
              </div>
            </div>
          </div>
        )}

        {activeTab === "students" && (
          <StudentsSection
            courseId={courseId}
            students={students || []}
            bulkprogressData={bulkprogressData || []}
            isLoading={isStudentsLoading || isbulkLoading}
            onBulkEnroll={handleBulkEnroll}
            isBulkEnrolling={isBulkEnrolling}
            adminRosterExportCourseId={courseId}
          />
        )}

        {activeTab === "content" && (
          <div className="space-y-6">
            <div className="grid grid-cols-1 xl:grid-cols-[1.25fr_0.9fr] gap-6">
              <LecturePlayerPanel
                lecture={selectedLecture}
                title="Course player"
              />
              <LecturesSection
                courseId={courseId}
                lectures={lectures || []}
                canDelete
                isLoading={isLecturesLoading}
                onDeleteLecture={handleDeleteLecture}
                onSelectLecture={(lecture) => setSelectedLectureId(lecture._id)}
                selectedLectureId={selectedLecture?._id}
              />
            </div>
            <TasksSection
              tasks={tasks || []}
              canDelete
              isLoading={isTasksLoading}
              onDeleteTask={handleDeleteTask}
            />
          </div>
        )}

        {activeTab === "comments" && (
          <CourseCommentsSection
            courseId={courseId}
            courseTeacherId={course?.teacher?._id}
            title="Course comments"
          />
        )}

        {activeTab === "payments" && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">Payments</h3>
              <div className="flex items-center gap-2">
                <ExportCsvButton
                  exportKey="payments"
                  params={{ courseId, limit: 5000 }}
                  label="Export course payments CSV"
                />
                <span className="text-xs text-gray-500 dark:text-gray-400 text-end">
                  From Payment collection (saved on successful charge)
                </span>
              </div>
            </div>

            {isPaymentReportLoading && (
              <p className="text-gray-500 dark:text-gray-400 mt-3">Loading payments…</p>
            )}
            {isPaymentReportError && (
              <p className="text-red-600 dark:text-red-400 mt-3 text-sm">
                {paymentReportError?.response?.data?.message ||
                  "Failed to load payments."}
              </p>
            )}
            {!isPaymentReportLoading &&
              !isPaymentReportError &&
              !payments?.length && (
                <p className="text-gray-400 dark:text-gray-500 italic mt-3">
                  No payment records for this course yet. They are created when
                  Stripe sends <code className="text-xs bg-gray-100 dark:bg-gray-700 dark:text-gray-300 px-1 rounded">payment_intent.succeeded</code> to your webhook. Older charges from before this feature will not appear until you backfill or re-sync.
                </p>
              )}
            {!isPaymentReportLoading && !isPaymentReportError && payments?.length > 0 && (
              <div className="mt-4 overflow-x-auto">
                <table className="w-full text-sm">
                  <thead>
                    <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                      <th className="p-3 text-start font-semibold text-gray-600 dark:text-gray-400">
                        Student
                      </th>
                      <th className="p-3 text-start font-semibold text-gray-600 dark:text-gray-400">
                        Date
                      </th>
                      <th className="p-3 text-start font-semibold text-gray-600 dark:text-gray-400">
                        Amount
                      </th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
                    {payments.map((p) => (
                      <tr key={p.paymentIntentId} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                        <td className="p-3 text-gray-900 dark:text-white">{p.studentName}</td>
                        <td className="p-3 text-gray-600 dark:text-gray-300">
                          {dateTime(p.date)}
                        </td>
                        <td className="p-3 font-semibold text-gray-900 dark:text-white">
                          {money(p.amount, (p.currency || currency || "USD").toUpperCase())}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </div>
        )}

        {activeTab === "settings" && (
          <div className="space-y-6">
            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                Course details
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Change anything below, then use <strong className="text-gray-800 dark:text-white">Save all changes</strong>. Nothing is stored until you save.
              </div>

              <form onSubmit={handleSaveCourse} className="mt-4 grid gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 p-4 rounded-xl bg-brand-50/80 dark:bg-brand-950/30 border border-brand-200/80 dark:border-brand-800/50">
                  <p className="text-sm text-gray-700 dark:text-gray-200">
                    Price, image, description, and sale settings are saved together.
                  </p>
                  <button
                    type="submit"
                    disabled={isSaveCoursePending}
                    className={`shrink-0 w-full sm:w-auto px-6 py-2.5 rounded-lg text-sm font-bold shadow-sm transition-colors ${
                      isSaveCoursePending
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-brand-600 text-white hover:bg-brand-700"
                    }`}
                  >
                    {isSaveCoursePending ? "Saving…" : "Save all changes"}
                  </button>
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    Course image
                  </label>
                  <input
                    type="file"
                    accept="image/*"
                    onChange={handleCourseImageChange}
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                  />
                  {courseImagePreview ? (
                    <img
                      src={courseImagePreview}
                      alt="Course preview"
                      className="mt-3 h-52 w-full rounded-xl object-cover border dark:border-gray-600"
                    />
                  ) : null}
                </div>
                <input
                  type="text"
                  name="title"
                  value={courseForm.title}
                  onChange={handleCourseFieldChange}
                  placeholder="Course title"
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                  required
                />
                <CourseCategoryField
                  name="category"
                  value={courseForm.category}
                  onChange={handleCourseFieldChange}
                  options={teacherCategoryOptions}
                  inputClass="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                  idPrefix="admin-course"
                  label="Category"
                  required
                  disabled={isSaveCoursePending || !course?.teacher}
                  placeholder="Select from the list or type a custom category"
                  helpText={
                    <p className="text-xs text-gray-500 dark:text-gray-400">
                      Suggestions include site defaults, this teacher’s labels, and existing course categories. The
                      global list is under <span className="font-medium">Admin → settings</span> (admins only).
                    </p>
                  }
                >
                  <SavedCourseCategoryChips
                    categories={teacherCategoryOptions}
                    disabled={isSaveCoursePending || !course?.teacher}
                  />
                </CourseCategoryField>
                <textarea
                  name="description"
                  value={courseForm.description}
                  onChange={handleCourseFieldChange}
                  placeholder="Course description"
                  rows={4}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                  required
                />
                <div>
                  <label className="block text-sm font-medium text-gray-700 dark:text-gray-200 mb-2">
                    List price (USD)
                  </label>
                  <input
                    type="number"
                    min="0"
                    step="0.01"
                    name="price"
                    value={courseForm.price}
                    onChange={handleCourseFieldChange}
                    placeholder="0.00"
                    className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                    required
                  />
                </div>

                <div className="rounded-lg border border-dashed border-gray-200 dark:border-gray-700 p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Optional sale (promotion)</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    <strong className="text-gray-700 dark:text-gray-300">Percent off</strong> — enter how much of the price to remove as a percent (e.g. 20 means the student pays 80% of the list price).
                    <br />
                    <strong className="text-gray-700 dark:text-gray-300">Dollars off</strong> — enter a fixed number of US dollars to subtract (e.g. 15 means $15 less than the list price).
                  </p>
                  <label className="flex items-center gap-2 text-sm font-medium text-gray-800 dark:text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseForm.promotionEnabled}
                      onChange={(e) =>
                        setCourseForm((prev) => ({ ...prev, promotionEnabled: e.target.checked }))
                      }
                      className="rounded border-gray-300"
                    />
                    Turn on a sale (discount on the list price)
                  </label>
                  {courseForm.promotionEnabled && (
                    <div className="grid gap-3 sm:grid-cols-2">
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          How to calculate the discount
                        </label>
                        <div className="flex flex-col sm:flex-row gap-2">
                          <select
                            value={courseForm.promotionType}
                            onChange={(e) =>
                              setCourseForm((prev) => ({ ...prev, promotionType: e.target.value }))
                            }
                            className="h-10 w-full sm:min-w-[200px] px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                          >
                            <option value="percent">Percentage off (e.g. 20% off)</option>
                            <option value="fixed">Dollars off (e.g. $10 off)</option>
                          </select>
                          <input
                            type="number"
                            min="0"
                            step={courseForm.promotionType === "percent" ? "1" : "0.01"}
                            max={courseForm.promotionType === "percent" ? "100" : undefined}
                            value={courseForm.promotionValue}
                            onChange={(e) =>
                              setCourseForm((prev) => ({ ...prev, promotionValue: e.target.value }))
                            }
                            className="flex-1 h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900"
                            placeholder={courseForm.promotionType === "percent" ? "e.g. 20 for 20% off" : "e.g. 10 for $10 off"}
                          />
                        </div>
                        <p className="text-[11px] text-gray-500 dark:text-gray-400 mt-1.5">
                          {courseForm.promotionType === "percent"
                            ? "Use 0–100. Example: list $100 and 25 here → student pays $75."
                            : "Amount in US dollars. Example: list $100 and 20 here → student pays $80."}
                        </p>
                      </div>
                      <div>
                        <label className="block text-xs font-medium text-gray-600 dark:text-gray-300 mb-1">
                          Sale start &amp; end (optional)
                        </label>
                        <div className="space-y-1.5 text-xs">
                          <div>
                            <span className="text-[10px] text-gray-500">Starts</span>
                            <input
                              type="datetime-local"
                              value={courseForm.promotionStartsAt}
                              onChange={(e) =>
                                setCourseForm((prev) => ({ ...prev, promotionStartsAt: e.target.value }))
                              }
                              className="w-full h-9 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                            />
                          </div>
                          <div>
                            <span className="text-[10px] text-gray-500">Ends</span>
                            <input
                              type="datetime-local"
                              value={courseForm.promotionEndsAt}
                              onChange={(e) =>
                                setCourseForm((prev) => ({ ...prev, promotionEndsAt: e.target.value }))
                              }
                              className="w-full h-9 px-2 rounded border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                            />
                          </div>
                        </div>
                        <p className="text-[10px] text-gray-500 mt-1">Empty start = now. Empty end = no end date.</p>
                      </div>
                    </div>
                  )}
                  <p className="text-[11px] text-gray-500 dark:text-gray-400">
                    The price students pay at checkout must be at least $0.50. Your list price field above does not change; the site shows the lower price when the sale is active.
                  </p>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Comments on this course</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When this is enabled, only you (instructor) and platform admins can post or reply. Learners can still read existing comments.
                  </p>
                  <label className="flex items-start gap-2.5 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseForm.commentsDisabled}
                      onChange={(e) =>
                        setCourseForm((prev) => ({ ...prev, commentsDisabled: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-gray-300"
                    />
                    <span>Close comments for students and other visitors (staff can still reply)</span>
                  </label>
                </div>

                <div className="rounded-lg border border-gray-200 dark:border-gray-700 p-4 space-y-2">
                  <p className="text-sm font-medium text-gray-800 dark:text-gray-200">Ratings on this course</p>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    When enabled, learners cannot submit or update star ratings for this course.
                    Existing ratings remain visible in summary.
                  </p>
                  <label className="flex items-start gap-2.5 text-sm text-gray-800 dark:text-gray-200 cursor-pointer">
                    <input
                      type="checkbox"
                      checked={courseForm.ratingsDisabled}
                      onChange={(e) =>
                        setCourseForm((prev) => ({ ...prev, ratingsDisabled: e.target.checked }))
                      }
                      className="mt-0.5 rounded border-gray-300"
                    />
                    <span>Block ratings for this course</span>
                  </label>
                </div>

                <div className="pt-4 border-t border-gray-100 dark:border-gray-800">
                  <CourseCatalogSectionsForm
                    value={catalogForm}
                    onChange={setCatalogForm}
                    disabled={isSaveCoursePending}
                  />
                </div>

                <div className="flex flex-col sm:flex-row sm:justify-end gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                  <button
                    type="submit"
                    disabled={isSaveCoursePending}
                    className={`w-full sm:w-auto min-h-[44px] px-8 py-2.5 rounded-lg text-sm font-bold transition-colors ${
                      isSaveCoursePending
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-brand-600 text-white hover:bg-brand-700 shadow-sm"
                    }`}
                  >
                    {isSaveCoursePending ? "Saving…" : "Save all changes"}
                  </button>
                </div>
              </form>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                Review workflow
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Current status: <span className="font-semibold">{course.status || "draft"}</span>
              </div>
              {course.reviewNote ? (
                <div className="mt-3 text-sm text-red-600 dark:text-red-400">
                  Last note: {course.reviewNote}
                </div>
              ) : null}

              <div className="mt-4 grid gap-3">
                <textarea
                  value={reviewNote}
                  onChange={(e) => setReviewNote(e.target.value)}
                  placeholder="Optional note when requesting changes..."
                  rows={3}
                  className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow"
                />
                <div className="flex gap-2 flex-wrap">
                  <button
                    disabled={isReviewPending}
                    onClick={() => reviewCourse({ action: "approve", reviewNote: "" })}
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isReviewPending
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-emerald-600 text-white hover:bg-emerald-700"
                    }`}
                  >
                    Approve & publish
                  </button>
                  <button
                    disabled={isReviewPending}
                    onClick={() =>
                      reviewCourse({ action: "reject", reviewNote: reviewNote.trim() })
                    }
                    className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                      isReviewPending
                        ? "bg-gray-200 dark:bg-gray-800 text-gray-400 cursor-not-allowed"
                        : "bg-amber-600 text-white hover:bg-amber-700"
                    }`}
                  >
                    Request changes
                  </button>
                </div>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-6">
              <div className="text-sm font-bold text-gray-900 dark:text-white">
                Visibility
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Publish/unpublish controls whether the course is visible in the
                catalog.
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="text-sm">
                  <div className="font-semibold text-gray-800 dark:text-white">
                    {course.isPublished ? "Published" : "Unpublished"}
                  </div>
                  <div className="text-gray-500 dark:text-gray-400">
                    {course.isPublished
                      ? "Users can see and enroll"
                      : "Hidden from users"}
                  </div>
                </div>
                <button
                  disabled={isPublishPending}
                  onClick={handleTogglePublished}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold transition-colors ${
                    course.isPublished
                      ? "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-700"
                      : "bg-emerald-600 text-white hover:bg-emerald-700"
                  } ${isPublishPending ? "opacity-50 cursor-not-allowed" : ""}`}
                >
                  {course.isPublished ? "Unpublish" : "Publish"}
                </button>
              </div>
            </div>

            <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900/50 rounded-xl p-6">
              <div className="text-lg font-semibold text-red-700 dark:text-red-400">
                Danger Zone
              </div>
              <div className="mt-2 text-sm text-gray-600 dark:text-gray-300">
                Soft delete hides the course from the system without removing
                database records. (Recommended for schools.)
              </div>

              <div className="mt-4 flex items-center justify-between gap-4">
                <div className="text-sm">
                  <div className="font-semibold text-gray-800 dark:text-white">Soft delete</div>
                  <div className="text-gray-500 dark:text-gray-400">
                    Sets <span className="font-mono">isDeleted = true</span>
                  </div>
                </div>
                <button
                  disabled={isDeletePending}
                  onClick={handleSoftDelete}
                  className={`px-4 py-2 rounded-lg text-sm font-semibold bg-red-600 text-white hover:bg-red-700 transition-colors ${
                    isDeletePending ? "opacity-50 cursor-not-allowed" : ""
                  }`}
                >
                  Delete course
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
