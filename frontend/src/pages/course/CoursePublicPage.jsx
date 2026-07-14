import { useEffect, useMemo, useState } from "react";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import { useLocation, useNavigate, useParams, Link } from "react-router-dom";
import {
  Clock,
  BookOpen,
  Users,
  FileText,
  ChevronDown,
  ChevronUp,
  Play,
  Award,
  CheckCircle,
  Globe,
  PenLine,
  ArrowRight,
  ShoppingCart,
  ExternalLink,
  ShieldCheck,
  Film,
} from "lucide-react";
import useUserStore from "../../store/userstore";
import useCartStore from "../../store/cartStore";
import {
  useGetPublicCourse,
  useGetRatingSummary,
  useGetMyRating,
  useUpsertRating,
} from "../../api/rating";
import { StarsDisplay, CourseRatingForm } from "../../components/CourseRatingBlock";
import CourseCommentsSection from "../../components/CourseCommentsSection";
import { paths } from "../../config/paths";
import { useEnrollmentSnapshot } from "../../api/payment";
import toast from "react-hot-toast";
import { useUpdateCourse } from "../../api/course";
import CourseCatalogSectionsForm, {
  catalogFromCourse,
  emptyCatalogForm,
} from "../../components/course/CourseCatalogSectionsForm";
import LecturePlayerPanel from "../../components/courseSections/LecturePlayerPanel";
import { usePublicMoneyBackGuarantee } from "../../api/admin";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23f1f0fb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='42' fill='%239b8ec4'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E";

function formatDuration(totalSeconds) {
  if (!totalSeconds) return null;
  const h = Math.floor(totalSeconds / 3600);
  const m = Math.floor((totalSeconds % 3600) / 60);
  if (h > 0) return `${h}h ${m}m`;
  return `${m}m`;
}

function groupByLevel(lectures = []) {
  const map = {};
  for (const l of lectures) {
    const num = l.level?.number ?? 1;
    if (!map[num]) map[num] = { title: l.level?.title || `Level ${num}`, items: [] };
    map[num].items.push(l);
  }
  return Object.entries(map)
    .sort(([a], [b]) => Number(a) - Number(b))
    .map(([num, data]) => ({ num: Number(num), ...data }));
}

const CoursePublic = () => {
  const { t } = useTranslation();
  const { money, monthYear } = useFormatter();
  const { courseId: courseIdParam } = useParams();
  const location = useLocation();
  const navigate = useNavigate();
  const user = useUserStore((state) => state.user);
  const courseId = courseIdParam || location.state?._id;

  const { course: fetchedCourse, meta, isLoading, isError } = useGetPublicCourse(courseId);

  /**
   * Public API includes `effectivePrice`, `listPrice`, and `promotionActive` (what the student pays).
   * Navigation `state` (e.g. from the catalog) may only have the list `price`. Merge so the API
   * always wins once loaded—otherwise the sidebar can show the list price and miss the sale.
   */
  const course = useMemo(() => {
    const fromApi = fetchedCourse;
    const fromNav = location.state;
    if (fromApi) {
      return fromNav && typeof fromNav === "object" ? { ...fromNav, ...fromApi } : fromApi;
    }
    return fromNav || null;
  }, [fetchedCourse, location.state]);

  /** Sidebar: list vs effective (sale) with optional end date from `course.promotion`. */
  const pricingDisplay = useMemo(() => {
    if (!course) {
      return { onSale: false, list: null, eff: null, pctOff: 0, endsLabel: null };
    }
    const listRaw = typeof course.listPrice === "number" ? course.listPrice : Number(course.price);
    const effRaw =
      typeof course.effectivePrice === "number" ? course.effectivePrice : listRaw;
    const list = Number.isFinite(listRaw) ? listRaw : null;
    const eff = Number.isFinite(effRaw) ? effRaw : null;
    const onSale =
      Boolean(course.promotionActive) &&
      list != null &&
      eff != null &&
      eff < list - 0.001;
    const pctOff = onSale && list > 0 ? Math.round(((list - eff) / list) * 100) : 0;
    let endsLabel = null;
    if (course.promotion?.endsAt) {
      const d = new Date(course.promotion.endsAt);
      if (!Number.isNaN(d.getTime())) {
        endsLabel = d.toLocaleString(undefined, { dateStyle: "medium", timeStyle: "short" });
      }
    }
    return { onSale, list, eff, pctOff, endsLabel };
  }, [course]);

  const showAsFree = Boolean(course?.isFree);

  const { average, count, policy: ratingPolicy, isLoading: summaryLoading } = useGetRatingSummary(courseId);
  const isOwner =
    Boolean(user && course?.teacher) &&
    (String(course.teacher._id ?? course.teacher) === String(user._id));

  const canEditCatalog =
    Boolean(user && course) && (isOwner || user.role === "admin");

  const { saveCourse, isPending: isSavingCatalog } = useUpdateCourse(courseId);

  const [editingCatalog, setEditingCatalog] = useState(false);
  const [catalogDraft, setCatalogDraft] = useState(() => emptyCatalogForm());
  const [editTitle, setEditTitle] = useState("");
  const [editDescription, setEditDescription] = useState("");

  useEffect(() => {
    if (!editingCatalog && course) {
      setCatalogDraft(catalogFromCourse(course));
      setEditTitle(course.title || "");
      setEditDescription(course.description || "");
    }
  }, [course, editingCatalog]);

  const { myRating } = useGetMyRating(courseId, Boolean(user && courseId && !isOwner));
  const { mutate: submitRating, isPending } = useUpsertRating(courseId);

  const { isEnrolled, isLoading: enrollmentLoading } = useEnrollmentSnapshot(
    courseId,
    user?._id,
  );

  const moneyBack = usePublicMoneyBackGuarantee();

  const addItemToCart = useCartStore((s) => s.addItem);
  const inCart = useCartStore((s) =>
    course?._id ? s.items.some((i) => i.courseId === course._id) : false,
  );

  const handleAddToCart = () => {
    if (!course?._id) return;
    const eff =
      pricingDisplay.eff ??
      (typeof course.effectivePrice === "number" ? course.effectivePrice : null) ??
      (typeof course.price === "number" ? course.price : 0);
    const list = pricingDisplay.list ?? (typeof course.listPrice === "number" ? course.listPrice : null);
    addItemToCart({
      courseId: course._id,
      title: course.title,
      image: course.image,
      price: eff,
      listPrice: list,
    });
    toast.success("Added to your cart");
  };

  const ratingViewerState = (() => {
    if (ratingPolicy?.ratingsGloballyDisabled || ratingPolicy?.courseRatingsDisabled) {
      return "rating_blocked";
    }
    if (!user) return "guest";
    if (isOwner) return "owner";
    if (enrollmentLoading) return "checking";
    if (!isEnrolled) return "need_enrollment";
    return "can_rate";
  })();

  const groupedLectures = useMemo(
    () => groupByLevel(course?.lectures || []),
    [course?.lectures],
  );

  const freePreviewLectures = useMemo(() => {
    const list = (course?.lectures || []).filter((l) => l.isFreePreview);
    return list.sort((a, b) => {
      const la = a.level?.number ?? 1;
      const lb = b.level?.number ?? 1;
      if (la !== lb) return la - lb;
      return (a.order ?? 0) - (b.order ?? 0);
    });
  }, [course?.lectures]);

  const [activeFreePreviewId, setActiveFreePreviewId] = useState(null);

  const activeFreeLecture = useMemo(() => {
    if (freePreviewLectures.length === 0) return null;
    if (activeFreePreviewId == null) return freePreviewLectures[0];
    return (
      freePreviewLectures.find((l) => String(l._id) === String(activeFreePreviewId)) ??
      freePreviewLectures[0]
    );
  }, [freePreviewLectures, activeFreePreviewId]);

  const trailerPlayerLecture = useMemo(() => {
    if (!course) return null;
    const url = typeof course.trailerVideoUrl === "string" ? course.trailerVideoUrl.trim() : "";
    const vid = typeof course.trailerVimeoVideoId === "string" ? course.trailerVimeoVideoId.trim() : "";
    if (!url && !vid) return null;
    const title =
      (typeof course.trailerTitle === "string" && course.trailerTitle.trim()) ||
      t("coursePublic.trailerDefaultTitle");
    return {
      _id: "course-trailer",
      title,
      contentType: "video",
      videoUrl: url,
      vimeoVideoId: vid,
    };
  }, [course, t]);

  const showTrailerBlock = !isEnrolled && Boolean(trailerPlayerLecture);
  const showFreePreviewBlock = !isEnrolled && !trailerPlayerLecture && freePreviewLectures.length > 0;

  const [expandedLevels, setExpandedLevels] = useState({});
  const toggleLevel = (num) => setExpandedLevels((prev) => ({ ...prev, [num]: !prev[num] }));

  const teacher = course?.teacher || {};
  const totalLectures = meta?.totalLectures ?? course?.lectures?.length ?? 0;
  const totalStudents = meta?.totalStudents ?? 0;
  const totalTasks = meta?.totalTasks ?? 0;
  const teacherCourseCount = meta?.teacherCourseCount ?? 0;

  const languageLabel = ((course?.courseLanguage || "English").trim() || "English");
  const purchaseNoteText =
    course && typeof course.purchaseNote === "string" && course.purchaseNote.trim()
      ? course.purchaseNote.trim()
      : t("coursePublic.moneyBackDefault");
  const showCert = course ? course.showCertificateInCatalog !== false : true;
  const showLifetime = course ? course.showLifetimeAccessInCatalog !== false : true;

  const learningPoints = useMemo(() => {
    if (!course) return [];
    const custom = (course.learningOutcomes || []).map((s) => String(s).trim()).filter(Boolean);
    if (custom.length > 0) return custom;
    return [
      t("coursePublic.defaultLearnFundamentals", { subject: course.category || t("coursePublic.defaultReqKnowledge", { subject: "" }).replace(".", "") }),
      t("coursePublic.defaultLearnHandsOn"),
      t("coursePublic.defaultLearnFrom", { instructor: teacher.name || "Unknown" }),
      totalTasks > 0
        ? t("coursePublic.defaultLearnAssignments", { count: totalTasks })
        : t("coursePublic.defaultLearnExercises"),
    ];
  }, [course, teacher.name, totalTasks, t]);

  const requirementPoints = useMemo(() => {
    if (!course) return [];
    const custom = (course.requirements || []).map((s) => String(s).trim()).filter(Boolean);
    if (custom.length > 0) return custom;
    return [
      t("coursePublic.defaultReqKnowledge", { subject: course.category || t("coursePublic.notFound") }),
      t("coursePublic.defaultReqComputer"),
      t("coursePublic.defaultReqWillingness"),
    ];
  }, [course, t]);

  const extraIncludes = useMemo(() => {
    if (!course) return [];
    return (course.includesExtras || []).map((s) => String(s).trim()).filter(Boolean);
  }, [course]);

  const draftLearningPreview = useMemo(() => {
    if (!editingCatalog || !course) return null;
    const custom = (catalogDraft.learningOutcomes || []).map((s) => String(s).trim()).filter(Boolean);
    if (custom.length > 0) return custom;
    return learningPoints;
  }, [editingCatalog, course, catalogDraft.learningOutcomes, learningPoints]);

  const draftRequirementPreview = useMemo(() => {
    if (!editingCatalog || !course) return null;
    const custom = (catalogDraft.requirements || []).map((s) => String(s).trim()).filter(Boolean);
    if (custom.length > 0) return custom;
    return requirementPoints;
  }, [editingCatalog, course, catalogDraft.requirements, requirementPoints]);

  if (!courseId) return <p className="p-8 text-center">{t("coursePublic.notFound")}</p>;

  if (isLoading && !location.state) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError && !location.state) {
    return (
      <div className="min-h-screen bg-white dark:bg-gray-950 flex items-center justify-center">
        <p className="text-red-500 font-medium">{t("coursePublic.notPublished")}</p>
      </div>
    );
  }

  if (!course) return <p className="p-8 text-center">{t("coursePublic.notFound")}</p>;

  const totalDuration = formatDuration(meta?.totalDuration);
  const memberSince = teacher.createdAt ? monthYear(teacher.createdAt) : null;

  const handleStartEditCatalog = () => {
    setEditTitle(course.title || "");
    setEditDescription(course.description || "");
    setCatalogDraft(catalogFromCourse(course));
    setEditingCatalog(true);
  };

  const handleCancelCatalog = () => {
    setCatalogDraft(catalogFromCourse(course));
    setEditTitle(course.title || "");
    setEditDescription(course.description || "");
    setEditingCatalog(false);
  };

  const handleSaveCatalog = async () => {
    const title = editTitle.trim();
    const description = editDescription.trim();
    if (!title || !description) {
      toast.error(t("coursePublic.titleDescRequired"));
      return;
    }
    await saveCourse({
      title,
      description,
      category: course.category,
      ...catalogDraft,
    });
    setEditingCatalog(false);
  };

  const displayTitle = editingCatalog ? editTitle : course.title;
  const displayDescription = editingCatalog ? editDescription : course.description;

  const displayLanguage = editingCatalog
    ? (catalogDraft.courseLanguage || "English").trim() || "English"
    : languageLabel;

  const sidebarNotePreview = editingCatalog
    ? catalogDraft.purchaseNote?.trim() || t("coursePublic.moneyBackDefault")
    : purchaseNoteText;

  const previewCert = editingCatalog ? catalogDraft.showCertificateInCatalog !== false : showCert;
  const previewLifetime = editingCatalog
    ? catalogDraft.showLifetimeAccessInCatalog !== false
    : showLifetime;
  const previewExtras = editingCatalog
    ? (catalogDraft.includesExtras || []).map((s) => String(s).trim()).filter(Boolean)
    : extraIncludes;

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      {/* Instructor / admin: clear edit entry point */}
      {canEditCatalog && (
        <div
          className={`border-b shadow-sm ${
            editingCatalog
              ? "bg-amber-50 dark:bg-amber-950/40 border-amber-200 dark:border-amber-900/50"
              : "bg-gradient-to-r from-brand-600 via-brand-600 to-violet-700 border-brand-500/30"
          }`}
        >
          <div className="max-w-6xl mx-auto px-4 sm:px-6 py-3.5 flex flex-wrap items-center justify-between gap-3">
            <div className="flex items-start sm:items-center gap-3 min-w-0">
              <div
                className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-lg ${
                  editingCatalog
                    ? "bg-amber-200/80 dark:bg-amber-900/50 text-amber-900 dark:text-amber-200"
                    : "bg-white/20 text-white"
                }`}
              >
                <PenLine className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <p
                  className={`text-sm font-bold leading-tight ${
                    editingCatalog
                      ? "text-amber-950 dark:text-amber-100"
                      : "text-white"
                  }`}
                >
                  {editingCatalog ? t("coursePublic.editingLabel") : t("coursePublic.manageLabel")}
                </p>
                <p
                  className={`text-xs mt-0.5 ${
                    editingCatalog
                      ? "text-amber-800/90 dark:text-amber-200/80"
                      : "text-white/85"
                  }`}
                >
                  {editingCatalog
                    ? t("coursePublic.editingHint")
                    : t("coursePublic.manageHint")}
                </p>
              </div>
            </div>
            <div className="flex flex-wrap items-center gap-2 w-full sm:w-auto justify-end">
              {!editingCatalog ? (
                <button
                  type="button"
                  onClick={handleStartEditCatalog}
                  className="inline-flex items-center justify-center gap-2 px-5 py-2.5 rounded-lg bg-white text-brand-700 text-sm font-bold shadow-md hover:bg-gray-50 active:scale-[0.98] transition-colors w-full sm:w-auto"
                >
                  <PenLine className="w-4 h-4" />
                  {t("coursePublic.editPublicPage")}
                </button>
              ) : (
                <>
                  <button
                    type="button"
                    onClick={handleCancelCatalog}
                    disabled={isSavingCatalog}
                    className="px-4 py-2.5 rounded-lg border border-amber-300 dark:border-amber-800 bg-white dark:bg-gray-900 text-amber-950 dark:text-amber-100 text-sm font-semibold hover:bg-amber-50 dark:hover:bg-gray-800 disabled:opacity-50"
                  >
                    {t("commonActions.cancel")}
                  </button>
                  <button
                    type="button"
                    onClick={handleSaveCatalog}
                    disabled={isSavingCatalog}
                    className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50 shadow-md"
                  >
                    {isSavingCatalog ? t("commonActions.saving") : t("commonActions.save")}
                  </button>
                </>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Hero banner */}
      <div className="bg-gray-900 dark:bg-gray-950 border-b border-gray-800">
        <div className="max-w-6xl mx-auto px-6 py-10 lg:py-14">
          <div className="max-w-3xl min-w-0">
            <span className="inline-block text-xs font-semibold uppercase tracking-wider px-2.5 py-1 rounded bg-brand-900/50 text-brand-300 mb-3">
              {course.category}
            </span>
            <h1 className="text-3xl lg:text-4xl font-extrabold text-white leading-tight">
              {displayTitle}
            </h1>
            <p className="mt-4 text-base text-gray-400 leading-relaxed line-clamp-4 whitespace-pre-wrap">
              {displayDescription}
            </p>
            {editingCatalog && (
              <p className="mt-2 text-[11px] font-medium uppercase tracking-wide text-brand-400/90">
                {t("coursePublic.heroPreviewNote")}
              </p>
            )}

            <div className="mt-5 flex flex-wrap items-center gap-x-5 gap-y-2 text-sm">
              {!summaryLoading && (
                <div className="flex items-center gap-1.5">
                  <span className="text-amber-400 font-bold">{Number(average).toFixed(1)}</span>
                  <StarsDisplay average={average} count={count} size="sm" />
                </div>
              )}
              {totalStudents > 0 && (
                <span className="text-gray-500">{t("coursePublic.studentCount", { count: totalStudents })}</span>
              )}
            </div>

            <div className="mt-3 flex flex-wrap items-center gap-x-4 gap-y-2 text-sm text-gray-500">
              <span className="inline-flex items-center gap-1.5 flex-wrap">
                {t("coursePublic.createdBy")}{" "}
                {teacher._id ? (
                  <Link
                    to={paths.userPublic(teacher._id)}
                    className="text-brand-400 font-medium hover:text-brand-300 hover:underline"
                  >
                    {teacher.name || "Unknown"}
                  </Link>
                ) : (
                  <span className="text-brand-400 font-medium">{teacher.name || "Unknown"}</span>
                )}
              </span>
              {course.updatedAt && (
                <span className="flex items-center gap-1">
                  <Clock className="w-3.5 h-3.5" />
                  {t("coursePublic.lastUpdated", { date: monthYear(course.updatedAt) })}
                </span>
              )}
              <span className="flex items-center gap-1">
                <Globe className="w-3.5 h-3.5" /> {displayLanguage}
                {editingCatalog && (
                  <span className="text-[10px] uppercase tracking-wide text-brand-400/90 ms-1">{t("coursePublic.previewBadge")}</span>
                )}
              </span>
            </div>
          </div>
        </div>
      </div>

      {canEditCatalog && editingCatalog && (
        <div className="bg-gray-50 dark:bg-gray-900/80 border-b border-gray-200 dark:border-gray-800">
          <div className="max-w-6xl mx-auto px-6 py-6">
            <div className="rounded-xl border-2 border-brand-500/35 bg-white dark:bg-gray-900 shadow-sm p-5 sm:p-6 space-y-5">
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-1">{t("coursePublic.titleAndDesc")}</p>
                <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
                  {t("coursePublic.titleDescHint", { category: course.category })}
                </p>
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("coursePublic.courseTitle")}</label>
                <input
                  type="text"
                  value={editTitle}
                  onChange={(e) => setEditTitle(e.target.value)}
                  disabled={isSavingCatalog}
                  className="w-full h-11 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent"
                  placeholder={t("coursePublic.courseTitlePlaceholder")}
                />
                <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5 mt-4">{t("coursePublic.descriptionLabel")}</label>
                <textarea
                  value={editDescription}
                  onChange={(e) => setEditDescription(e.target.value)}
                  disabled={isSavingCatalog}
                  rows={5}
                  className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent resize-y min-h-[120px]"
                  placeholder={t("coursePublic.descriptionPlaceholder")}
                />
              </div>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-5">
                <p className="text-sm font-semibold text-gray-900 dark:text-white mb-4">{t("coursePublic.marketingSections")}</p>
                <CourseCatalogSectionsForm
                  compact
                  value={catalogDraft}
                  onChange={setCatalogDraft}
                  disabled={isSavingCatalog}
                />
              </div>

              {draftLearningPreview && draftRequirementPreview && (
                <div className="mt-6 grid grid-cols-1 md:grid-cols-2 gap-4 pt-6 border-t border-gray-200 dark:border-gray-700">
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                      {t("coursePublic.previewWhatLearn")}
                    </p>
                    <ul className="space-y-2">
                      {draftLearningPreview.map((point, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-700 dark:text-gray-300">
                          <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                          <span>{point}</span>
                        </li>
                      ))}
                    </ul>
                  </div>
                  <div>
                    <p className="text-[11px] font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
                      {t("coursePublic.previewRequirements")}
                    </p>
                    <ul className="space-y-2">
                      {draftRequirementPreview.map((line, i) => (
                        <li key={i} className="flex items-start gap-2 text-sm text-gray-600 dark:text-gray-400">
                          <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                          {line}
                        </li>
                      ))}
                    </ul>
                  </div>
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Main content */}
      <div className="max-w-6xl mx-auto px-6 py-10 grid grid-cols-1 lg:grid-cols-3 gap-10">
        {/* Left column */}
        <div className="lg:col-span-2 space-y-8">
          {/* What you'll learn */}
          {!editingCatalog && (
            <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("coursePublic.whatYouLearn")}</h2>
              <ul className="grid grid-cols-1 md:grid-cols-2 gap-3">
                {learningPoints.map((point, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0 mt-0.5" />
                    <span className="text-sm text-gray-700 dark:text-gray-300">{point}</span>
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Includes */}
          <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("coursePublic.courseIncludes")}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600 dark:text-gray-300">
              <div className="flex items-center gap-3"><Play className="w-4 h-4 text-brand-500" /><span>{t("coursePublic.lectureCount", { count: totalLectures })}</span></div>
              {totalDuration && <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-brand-500" /><span>{t("coursePublic.totalLength", { duration: totalDuration })}</span></div>}
              {totalTasks > 0 && <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-brand-500" /><span>{t("coursePublic.assignmentCount", { count: totalTasks })}</span></div>}
              {previewCert && (
                <div className="flex items-center gap-3"><Award className="w-4 h-4 text-brand-500" /><span>{t("coursePublic.certificate")}</span></div>
              )}
              {previewLifetime && (
                <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-brand-500" /><span>{t("coursePublic.lifetimeAccess")}</span></div>
              )}
              {previewExtras.map((line, i) => (
                <div key={`extra-${i}`} className="flex items-center gap-3 sm:col-span-2">
                  <CheckCircle className="w-4 h-4 text-brand-500 flex-shrink-0" />
                  <span>{line}</span>
                </div>
              ))}
            </div>
            {editingCatalog && (
              <p className="mt-4 text-xs text-gray-500 dark:text-gray-400 border-t border-gray-100 dark:border-gray-800 pt-4">
                {t("coursePublic.liveCountsNote")}
              </p>
            )}
          </section>

          {/* Course trailer (optional) — for visitors; replaces free-preview block when configured */}
          {showTrailerBlock && trailerPlayerLecture && (
            <section className="rounded-xl border border-emerald-200/80 dark:border-emerald-800/50 bg-emerald-50/40 dark:bg-emerald-950/20 p-6">
              <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-2 mb-4">
                <div className="flex items-start gap-2.5 min-w-0">
                  <div className="mt-0.5 flex h-9 w-9 shrink-0 items-center justify-center rounded-lg bg-emerald-600/15 text-emerald-700 dark:text-emerald-300">
                    <Film className="h-4 w-4" aria-hidden />
                  </div>
                  <div>
                    <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("coursePublic.trailerTitle")}</h2>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">{t("coursePublic.trailerSubtitle")}</p>
                  </div>
                </div>
              </div>
              <div className="min-w-0">
                <LecturePlayerPanel lecture={trailerPlayerLecture} title={trailerPlayerLecture.title} />
              </div>
            </section>
          )}

          {/* Free preview: watchable before enrollment (API only exposes play URLs for preview lectures) */}
          {showFreePreviewBlock && activeFreeLecture && (
            <section className="rounded-xl border border-violet-200/80 dark:border-violet-800/50 bg-violet-50/40 dark:bg-violet-950/20 p-6">
              <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-2 mb-4">
                <div>
                  <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("coursePublic.freePreviewTitle")}</h2>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mt-0.5">
                    {t("coursePublic.watchSample")}
                    {freePreviewLectures.length > 1 && (
                      <span> {t("coursePublic.freePreviewChoose", { count: freePreviewLectures.length })}</span>
                    )}
                  </p>
                </div>
              </div>
              <div
                className={
                  freePreviewLectures.length > 1
                    ? "grid grid-cols-1 lg:grid-cols-3 gap-4 lg:gap-6"
                    : ""
                }
              >
                <div className={freePreviewLectures.length > 1 ? "lg:col-span-2 min-w-0" : "min-w-0"}>
                  <LecturePlayerPanel lecture={activeFreeLecture} title={activeFreeLecture.title} />
                </div>
                {freePreviewLectures.length > 1 && (
                  <div>
                    <p className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2.5">
                      {t("coursePublic.morePreviews")}
                    </p>
                    <ul className="space-y-1.5">
                      {freePreviewLectures.map((l) => {
                        const isActive = String(l._id) === String(activeFreeLecture?._id);
                        return (
                          <li key={l._id}>
                            <button
                              type="button"
                              onClick={() => setActiveFreePreviewId(l._id)}
                              className={
                                isActive
                                  ? "w-full text-start text-sm font-medium rounded-lg border border-violet-500/60 bg-white dark:bg-gray-900/80 px-3.5 py-2.5 text-violet-900 dark:text-violet-100"
                                  : "w-full text-start text-sm rounded-lg border border-transparent bg-white/50 dark:bg-gray-900/40 hover:border-gray-200 dark:hover:border-gray-700 px-3.5 py-2.5 text-gray-700 dark:text-gray-300"
                              }
                            >
                              {l.title}
                            </button>
                          </li>
                        );
                      })}
                    </ul>
                  </div>
                )}
              </div>
            </section>
          )}

          {/* Course content */}
          {groupedLectures.length > 0 && (
            <section>
              <div className="flex items-center justify-between mb-4">
                <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("coursePublic.courseContent")}</h2>
                <span className="text-xs text-gray-500 dark:text-gray-400 text-end max-w-[min(18rem,55vw)]">
                  {t("coursePublic.sectionCount", { count: groupedLectures.length })} · {t("coursePublic.lectureCount", { count: totalLectures })}
                  {totalDuration ? ` · ${totalDuration}` : ""}
                  {!isEnrolled && meta?.hasTrailer
                    ? ` · ${t("coursePublic.metaTrailer")}`
                    : !isEnrolled && meta?.freePreviewCount > 0
                      ? ` · ${t("coursePublic.freePreviewChoose", { count: meta.freePreviewCount })}`
                      : ""}
                </span>
              </div>

              <div className="rounded-xl border border-gray-200 dark:border-gray-800 overflow-hidden divide-y divide-gray-200 dark:divide-gray-800">
                {groupedLectures.map((level) => {
                  const isOpen = expandedLevels[level.num];
                  const sectionDuration = formatDuration(level.items.reduce((s, l) => s + (l.duration || 0), 0));
                  return (
                    <div key={level.num}>
                      <button
                        onClick={() => toggleLevel(level.num)}
                        className="w-full flex items-center justify-between px-5 py-3.5 bg-gray-50 dark:bg-gray-900 hover:bg-gray-100 dark:hover:bg-gray-800/60 transition text-start"
                      >
                        <div className="flex items-center gap-2">
                          {isOpen ? <ChevronUp className="w-4 h-4 text-gray-400" /> : <ChevronDown className="w-4 h-4 text-gray-400" />}
                          <span className="font-semibold text-sm text-gray-800 dark:text-white">{level.title}</span>
                        </div>
                        <span className="text-xs text-gray-500 dark:text-gray-400">
                          {t("coursePublic.lectureCount", { count: level.items.length })}
                          {sectionDuration ? ` · ${sectionDuration}` : ""}
                        </span>
                      </button>
                      {isOpen && (
                        <ul className="divide-y divide-gray-100 dark:divide-gray-800/60">
                          {level.items.sort((a, b) => (a.order ?? 0) - (b.order ?? 0)).map((lecture) => (
                            <li key={lecture._id} className="flex items-center justify-between gap-2 px-5 py-3 text-sm">
                              <div className="flex items-center gap-3 min-w-0">
                                <Play className="w-3.5 h-3.5 text-gray-400 flex-shrink-0" />
                                <span className="text-gray-700 dark:text-gray-300 truncate">{lecture.title}</span>
                                {lecture.isFreePreview && (
                                  <span className="shrink-0 rounded bg-violet-100 dark:bg-violet-900/50 text-violet-800 dark:text-violet-200 text-[10px] font-bold uppercase tracking-wide px-1.5 py-0.5">
                                    {t("coursePublic.freeBadge")}
                                  </span>
                                )}
                              </div>
                              {lecture.duration && (
                                <span className="text-xs text-gray-400 flex-shrink-0 tabular-nums">
                                  {formatDuration(lecture.duration)}
                                </span>
                              )}
                            </li>
                          ))}
                        </ul>
                      )}
                    </div>
                  );
                })}
              </div>
            </section>
          )}

          {/* Description */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t("coursePublic.descriptionSection")}</h2>
            <p className="text-sm text-gray-600 dark:text-gray-400 leading-relaxed whitespace-pre-wrap">
              {displayDescription}
            </p>
            {editingCatalog && (
              <p className="mt-2 text-xs text-gray-500 dark:text-gray-500">{t("coursePublic.matchesHeroNote")}</p>
            )}
          </section>

          {/* Requirements */}
          {!editingCatalog && (
            <section className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-3">{t("coursePublic.requirements")}</h2>
              <ul className="space-y-2 text-sm text-gray-600 dark:text-gray-400">
                {requirementPoints.map((line, i) => (
                  <li key={i} className="flex items-start gap-2">
                    <span className="mt-1.5 w-1.5 h-1.5 rounded-full bg-gray-400 shrink-0" />
                    {line}
                  </li>
                ))}
              </ul>
            </section>
          )}

          {/* Instructor */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("coursePublic.instructor")}</h2>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-start gap-5">
                {teacher._id ? (
                  <Link
                    to={paths.userPublic(teacher._id)}
                    className="shrink-0 rounded-full ring-2 ring-transparent hover:ring-brand-500/50 transition-shadow"
                    title={t("coursePublic.viewPublicProfile")}
                  >
                    <img
                      src={teacher.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || "U")}&background=7c3aed&color=fff`}
                      alt={teacher.name}
                      onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=U&background=7c3aed&color=fff`; }}
                      className="w-16 h-16 rounded-full object-cover"
                    />
                  </Link>
                ) : (
                  <img
                    src={teacher.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(teacher.name || "U")}&background=7c3aed&color=fff`}
                    alt={teacher.name}
                    onError={(e) => { e.target.onerror = null; e.target.src = `https://ui-avatars.com/api/?name=U&background=7c3aed&color=fff`; }}
                    className="w-16 h-16 rounded-full object-cover flex-shrink-0"
                  />
                )}
                <div className="min-w-0 flex-1">
                  {teacher._id ? (
                    <Link to={paths.userPublic(teacher._id)} className="group block">
                      <h3 className="text-base font-bold text-brand-600 dark:text-brand-400 group-hover:underline">
                        {teacher.name || "Unknown"}
                      </h3>
                    </Link>
                  ) : (
                    <h3 className="text-base font-bold text-brand-600 dark:text-brand-400">{teacher.name || "Unknown"}</h3>
                  )}
                  {teacher._id && (
                    <p className="mt-1">
                      <Link
                        to={paths.userPublic(teacher._id)}
                        className="text-xs font-semibold text-brand-500 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
                      >
                        {t("coursePublic.viewPublicProfile")}
                        <ExternalLink className="w-3 h-3 rtl-flip" />
                      </Link>
                    </p>
                  )}
                  {teacher.email && <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">{teacher.email}</p>}
                  {typeof teacher.publicAbout === "string" && teacher.publicAbout.trim() && (
                    <p className="text-sm text-gray-600 dark:text-gray-300 mt-3 leading-relaxed whitespace-pre-wrap">
                      {teacher.publicAbout.trim()}
                    </p>
                  )}
                  {Array.isArray(teacher.publicProjectLinks) && teacher.publicProjectLinks.length > 0 && (
                    <ul className="mt-3 space-y-1.5">
                      {teacher.publicProjectLinks.map((url, i) => (
                        <li key={i}>
                          <a
                            href={url}
                            target="_blank"
                            rel="nofollow noopener noreferrer"
                            className="text-xs text-brand-600 dark:text-brand-400 hover:underline break-all inline-flex items-center gap-1"
                          >
                            {url}
                            <ExternalLink className="w-3 h-3 shrink-0" />
                          </a>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="mt-3 flex flex-wrap gap-x-5 gap-y-2 text-xs text-gray-500 dark:text-gray-400">
                    <span className="flex items-center gap-1.5"><BookOpen className="w-3.5 h-3.5" />{t("coursePublic.courseCount", { count: teacherCourseCount })}</span>
                    {totalStudents > 0 && <span className="flex items-center gap-1.5"><Users className="w-3.5 h-3.5" />{t("coursePublic.studentCount", { count: totalStudents })}</span>}
                    {memberSince && <span className="flex items-center gap-1.5"><Award className="w-3.5 h-3.5" />{t("coursePublic.memberSince", { date: memberSince })}</span>}
                  </div>
                </div>
              </div>
            </div>
          </section>

          {/* Rating */}
          <section>
            <h2 className="text-lg font-bold text-gray-900 dark:text-white mb-4">{t("coursePublic.studentFeedback")}</h2>
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 p-6">
              <div className="flex items-center gap-4 mb-5">
                <div className="text-center">
                  <div className="text-4xl font-extrabold text-gray-900 dark:text-white">{Number(average).toFixed(1)}</div>
                  <StarsDisplay average={average} count={count} />
                </div>
              </div>
              <CourseRatingForm
                viewerState={ratingViewerState}
                myRating={myRating}
                onSubmit={(v) => submitRating(v)}
                isPending={isPending}
              />
            </div>
          </section>

          <CourseCommentsSection courseId={courseId} courseTeacherId={teacher._id || course.teacher} title={t("coursePublic.commentsTitle")} />
        </div>

        {/* Sticky sidebar */}
        <div className="lg:col-span-1">
          <div className="sticky top-20 space-y-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-md overflow-hidden">
              <img
                src={course.image || FALLBACK_IMG}
                alt={displayTitle || course.title}
                onError={(e) => { e.target.onerror = null; e.target.src = FALLBACK_IMG; }}
                className="w-full aspect-video object-cover"
              />
              <div className="p-5 space-y-4">
                {showAsFree ? (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">
                      {t("coursePublic.priceLabel")}
                    </p>
                    <p className="text-3xl font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                      {t("coursePublic.freeBadge")}
                    </p>
                  </div>
                ) : pricingDisplay.onSale && pricingDisplay.list != null && pricingDisplay.eff != null ? (
                  <div className="rounded-xl border border-amber-200/90 dark:border-amber-800/50 bg-gradient-to-br from-amber-50/95 via-white to-orange-50/80 dark:from-amber-950/35 dark:via-gray-900/40 dark:to-orange-950/25 p-4 shadow-inner space-y-3">
                    <div className="flex items-center justify-between gap-2">
                      <span className="text-[10px] font-extrabold uppercase tracking-widest text-amber-800/90 dark:text-amber-200/90">
                        {t("coursePublic.onSale")}
                      </span>
                      {pricingDisplay.pctOff > 0 && (
                        <span className="text-[11px] font-extrabold text-white tabular-nums bg-gradient-to-r from-rose-500 to-amber-500 px-2.5 py-0.5 rounded-full shadow-sm">
                          {t("coursePublic.savePercent", { pct: pricingDisplay.pctOff })}
                        </span>
                      )}
                    </div>
                    <div className="grid grid-cols-[1fr_auto_1fr] items-end gap-2 text-tabular-nums">
                      <div>
                        <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide mb-0.5">{t("coursePublic.priceFrom")}</p>
                        <p className="text-base sm:text-lg font-semibold text-gray-400 dark:text-gray-500 line-through decoration-2">
                          {money(pricingDisplay.list)}
                        </p>
                      </div>
                      <ArrowRight
                        className="w-5 h-5 text-amber-500 dark:text-amber-400/90 mb-1.5 justify-self-center shrink-0 rtl-flip"
                        strokeWidth={2.5}
                        aria-hidden
                      />
                      <div className="text-end">
                        <p className="text-[10px] font-bold text-emerald-600 dark:text-emerald-400 uppercase tracking-wide mb-0.5">{t("coursePublic.priceNow")}</p>
                        <p className="text-3xl font-black text-gray-900 dark:text-white leading-none tracking-tight">
                          {money(pricingDisplay.eff)}
                        </p>
                      </div>
                    </div>
                    {pricingDisplay.endsLabel && (
                      <p className="text-[11px] text-amber-900/85 dark:text-amber-200/80 border-t border-amber-200/60 dark:border-amber-800/40 pt-2">
                        <span className="font-semibold">{t("coursePublic.endsLabel")}</span> {pricingDisplay.endsLabel}
                      </p>
                    )}
                  </div>
                ) : (
                  <div className="space-y-1">
                    <p className="text-[10px] font-semibold text-gray-500 dark:text-gray-400 uppercase tracking-wide">{t("coursePublic.priceLabel")}</p>
                    <p className="text-3xl font-black text-gray-900 dark:text-white tabular-nums">
                      {pricingDisplay.eff != null
                        ? money(pricingDisplay.eff)
                        : typeof (course?.effectivePrice ?? course?.price) === "number"
                          ? money(course.effectivePrice ?? course.price)
                          : "—"}
                    </p>
                  </div>
                )}

                {!isOwner ? (
                  !user ? (
                    <div className="space-y-3">
                      {inCart ? (
                        <Link
                          to={paths.cart}
                          className="flex w-full h-12 items-center justify-center gap-2 rounded-lg border-2 border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-500 font-bold text-base hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" aria-hidden />
                          {t("coursePublic.viewCart")}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          className="flex w-full h-12 items-center justify-center gap-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 font-bold text-base hover:border-brand-500/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" aria-hidden />
                          {t("coursePublic.addToCart")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate(paths.checkoutCourse(course._id))}
                        className="w-full h-12 rounded-lg bg-brand-600 text-white font-bold text-base hover:bg-brand-700 transition-colors active:scale-[0.98]"
                      >
                        {showAsFree ? t("coursePublic.enrollFreeCta") : t("coursePublic.enrollNow")}
                      </button>
                    </div>
                  ) : user.role !== "student" ? (
                    <div className="rounded-lg border border-amber-200 dark:border-amber-900/50 bg-amber-50/80 dark:bg-amber-950/20 px-3 py-2 text-sm text-amber-900 dark:text-amber-100">
                      Only student accounts can enroll in courses.
                    </div>
                  ) : enrollmentLoading ? (
                    <button
                      type="button"
                      disabled
                      className="w-full h-12 rounded-lg bg-gray-200 dark:bg-gray-800 text-gray-500 font-bold text-base cursor-not-allowed"
                    >
                      {t("coursePublic.checkingEnrollment")}
                    </button>
                  ) : isEnrolled ? (
                    <button
                      type="button"
                      onClick={() => navigate(paths.courseWorkspace(course._id))}
                      className="w-full h-12 rounded-lg bg-emerald-600 text-white font-bold text-base hover:bg-emerald-700 transition-colors active:scale-[0.98]"
                    >
                      {t("coursePublic.goToCourse")}
                    </button>
                  ) : (
                    <div className="space-y-3">
                      {inCart ? (
                        <Link
                          to={paths.cart}
                          className="flex w-full h-12 items-center justify-center gap-2 rounded-lg border-2 border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-500 font-bold text-base hover:bg-brand-50 dark:hover:bg-brand-950/30 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" aria-hidden />
                          {t("coursePublic.viewCart")}
                        </Link>
                      ) : (
                        <button
                          type="button"
                          onClick={handleAddToCart}
                          className="flex w-full h-12 items-center justify-center gap-2 rounded-lg border-2 border-gray-200 dark:border-gray-600 text-gray-800 dark:text-gray-100 font-bold text-base hover:border-brand-500/50 hover:bg-gray-50 dark:hover:bg-gray-800/50 transition-colors"
                        >
                          <ShoppingCart className="h-4 w-4" aria-hidden />
                          {t("coursePublic.addToCart")}
                        </button>
                      )}
                      <button
                        type="button"
                        onClick={() => navigate(paths.checkoutCourse(course._id))}
                        className="w-full h-12 rounded-lg bg-brand-600 text-white font-bold text-base hover:bg-brand-700 transition-colors active:scale-[0.98]"
                      >
                        {showAsFree ? t("coursePublic.enrollFreeCta") : t("coursePublic.enrollNow")}
                      </button>
                    </div>
                  )
                ) : null}

                {!editingCatalog && moneyBack.enabled && !moneyBack.isLoading && (
                  <div className="rounded-lg border border-emerald-200/90 dark:border-emerald-800/50 bg-emerald-50/50 dark:bg-emerald-950/25 px-3 py-2.5 text-start">
                    <div className="flex items-start gap-2.5">
                      <ShieldCheck
                        className="w-4 h-4 text-emerald-600 dark:text-emerald-400 shrink-0 mt-0.5"
                        aria-hidden
                      />
                      <div className="min-w-0">
                        <p className="text-xs font-bold text-emerald-900 dark:text-emerald-100">
                          {moneyBack.title || "Money-back guarantee"}
                        </p>
                        {moneyBack.body ? (
                          <p className="text-[11px] text-emerald-800/95 dark:text-emerald-200/90 mt-1 leading-relaxed whitespace-pre-wrap">
                            {moneyBack.body}
                          </p>
                        ) : null}
                        {moneyBack.linkUrl ? (
                          <a
                            href={moneyBack.linkUrl}
                            target="_blank"
                            rel="noopener noreferrer"
                            className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-700 dark:text-emerald-300 mt-1.5 hover:underline"
                          >
                            {t("coursePublic.learnMore")}
                            <ExternalLink className="w-3 h-3 rtl-flip" />
                          </a>
                        ) : null}
                      </div>
                    </div>
                  </div>
                )}

                <p className="text-[11px] text-center text-gray-400">
                  {sidebarNotePreview}
                  {editingCatalog && (
                    <span className="block text-[10px] text-brand-500/90 mt-0.5">{t("coursePublic.previewLabel")}</span>
                  )}
                </p>

                <div className="pt-3 border-t border-gray-100 dark:border-gray-800 space-y-3 text-sm text-gray-600 dark:text-gray-400">
                  <div className="flex items-center gap-3"><Play className="w-4 h-4 text-gray-400" /><span>{t("coursePublic.lectureCount", { count: totalLectures })}</span></div>
                  {totalDuration && <div className="flex items-center gap-3"><Clock className="w-4 h-4 text-gray-400" /><span>{t("coursePublic.totalLength", { duration: totalDuration })}</span></div>}
                  {totalTasks > 0 && <div className="flex items-center gap-3"><FileText className="w-4 h-4 text-gray-400" /><span>{t("coursePublic.assignmentCount", { count: totalTasks })}</span></div>}
                  {previewCert && (
                    <div className="flex items-center gap-3"><Award className="w-4 h-4 text-gray-400" /><span>{t("coursePublic.certificate")}</span></div>
                  )}
                  {previewLifetime && (
                    <div className="flex items-center gap-3"><Globe className="w-4 h-4 text-gray-400" /><span>{t("coursePublic.lifetimeAccess")}</span></div>
                  )}
                  {previewExtras.map((line, i) => (
                    <div key={`sb-${i}`} className="flex items-center gap-3 text-sm">
                      <CheckCircle className="w-4 h-4 text-gray-400 flex-shrink-0" />
                      <span>{line}</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default CoursePublic;
