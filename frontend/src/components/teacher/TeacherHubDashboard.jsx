import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Code2,
  Database,
  MessageCircle,
  Plus,
  Star,
  Users,
  ArrowUpRight,
  Palette,
  Layers,
} from "lucide-react";
import { paths } from "../../config/paths";

function completionTone(percent) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  if (safe >= 75) return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  if (safe >= 45) return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
  return { bar: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" };
}

function statusBadge(status) {
  switch (status) {
    case "published":
      return "bg-emerald-50 text-emerald-700 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50";
    case "pending_review":
      return "bg-sky-50 text-sky-700 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/50";
    case "draft":
    default:
      return "bg-amber-50 text-amber-800 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50";
  }
}

function statusLabelKey(status) {
  switch (status) {
    case "published":
      return "workspace.hub.statusPublished";
    case "pending_review":
      return "workspace.hub.statusInReview";
    case "changes_requested":
      return "workspace.hub.statusChangesNeeded";
    case "archived":
      return "workspace.hub.statusArchived";
    default:
      return "workspace.hub.statusDraft";
  }
}

function categoryIcon(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("data") || value.includes("sql") || value.includes("engineer")) {
    return Database;
  }
  if (
    value.includes("program") ||
    value.includes("code") ||
    value.includes("dev") ||
    value.includes("web")
  ) {
    return Code2;
  }
  if (value.includes("design") || value.includes("ui") || value.includes("figma")) {
    return Palette;
  }
  return BookOpen;
}

function iconAccent(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("data")) return "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300";
  if (value.includes("program") || value.includes("code") || value.includes("dev")) {
    return "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300";
  }
  if (value.includes("design")) return "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300";
  return "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300";
}

function timeAgo(iso, t, locale) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return t("workspace.hub.minutesAgo", { count: Math.max(1, Math.floor(s / 60)) });
  if (s < 86400) return t("workspace.hub.hoursAgo", { count: Math.floor(s / 3600) });
  if (s < 604800) return t("workspace.hub.daysAgo", { count: Math.floor(s / 86400) });
  return new Date(iso).toLocaleDateString(locale);
}

function HubStatCard({ label, value, hint, tone = "neutral" }) {
  const tones = {
    neutral: "border-gray-200/90 dark:border-gray-800",
    brand: "border-brand-200/70 dark:border-brand-900/50",
    emerald: "border-emerald-200/70 dark:border-emerald-900/40",
    amber: "border-amber-200/70 dark:border-amber-900/40",
  };

  return (
    <div
      className={`rounded-2xl border bg-white px-4 py-4 shadow-sm dark:bg-gray-900 ${tones[tone] ?? tones.neutral}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}

function TeacherCourseCard({ course, onOpen }) {
  const { t } = useTranslation();
  const Icon = categoryIcon(course.category);
  const accent = iconAccent(course.category);
  const completion = completionTone(course.avgCompletionPercent);
  const completionValue = Math.max(0, Math.min(100, Math.round(Number(course.avgCompletionPercent) || 0)));

  return (
    <button
      type="button"
      onClick={() => onOpen(course)}
      className="group flex h-full flex-col rounded-2xl border border-gray-200/90 bg-white p-4 text-start shadow-sm transition hover:-translate-y-0.5 hover:border-brand-300/60 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-700/50"
    >
      <div className="mb-3 flex items-start justify-between gap-2">
        <div
          className={`flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ${accent}`}
        >
          {course.image ? (
            <img
              src={course.image}
              alt=""
              className="h-full w-full rounded-xl object-cover"
            />
          ) : (
            <Icon className="h-5 w-5" aria-hidden />
          )}
        </div>
        <span
          className={`shrink-0 rounded-full px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide ring-1 ${statusBadge(course.status)}`}
        >
          {t(statusLabelKey(course.status))}
        </span>
      </div>

      <h3 className="line-clamp-1 text-[15px] font-bold text-gray-900 dark:text-white">
        {course.title}
      </h3>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {course.description}
      </p>

      <div className="mt-4 flex flex-wrap items-center gap-3 text-xs font-semibold text-gray-500 dark:text-gray-400">
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Users className="h-3.5 w-3.5 text-gray-400" />
          {course.studentCount ?? 0}
        </span>
        <span className="inline-flex items-center gap-1 tabular-nums">
          <Star className="h-3.5 w-3.5 text-amber-500" />
          {course.ratingAvg != null ? course.ratingAvg.toFixed(1) : "—"}
        </span>
        {(course.openQuestions ?? 0) > 0 && (
          <span className="inline-flex items-center gap-1 tabular-nums text-rose-600 dark:text-rose-400">
            <MessageCircle className="h-3.5 w-3.5" />
            {course.openQuestions}
          </span>
        )}
      </div>

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
          <span className={`tabular-nums ${completion.text}`}>{t("workspace.hub.avgCompletion", { percent: completionValue })}</span>
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full transition-all ${completion.bar}`}
            style={{ width: `${completionValue}%` }}
          />
        </div>
      </div>
    </button>
  );
}

export default function TeacherHubDashboard({ dashboard, onOpenCourse }) {
  const { t, i18n } = useTranslation();
  const summary = dashboard?.summary ?? {};
  const courses = dashboard?.courses ?? [];
  const unansweredQuestions = dashboard?.unansweredQuestions ?? [];
  const draftCourses = dashboard?.draftCourses ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <HubStatCard
          label={t("workspace.hub.courses")}
          value={summary.courseCount ?? 0}
          hint={t("workspace.hub.coursesHint", {
            published: summary.publishedCount ?? 0,
            draft: summary.draftCount ?? 0,
          })}
          tone="brand"
        />
        <HubStatCard
          label={t("workspace.hub.totalStudents")}
          value={summary.totalStudents ?? 0}
          hint={
            (summary.newStudentsThisMonth ?? 0) > 0
              ? t("workspace.hub.newThisMonth", { count: summary.newStudentsThisMonth })
              : t("workspace.hub.acrossCourses")
          }
          tone="emerald"
        />
        <HubStatCard
          label={t("workspace.hub.openQA")}
          value={summary.openQACount ?? 0}
          hint={
            (summary.unansweredQACount ?? 0) > 0
              ? t("workspace.hub.unansweredHint", { count: summary.unansweredQACount })
              : t("workspace.hub.allCaughtUp")
          }
          tone={(summary.unansweredQACount ?? 0) > 0 ? "amber" : "neutral"}
        />
        <HubStatCard
          label={t("workspace.hub.avgRating")}
          value={summary.avgRating != null ? summary.avgRating.toFixed(1) : "—"}
          hint={
            (summary.ratingCount ?? 0) > 0
              ? t("workspace.hub.acrossReviews", { count: summary.ratingCount })
              : t("workspace.hub.noReviews")
          }
          tone="neutral"
        />
      </div>

      <section aria-label={t("workspace.hub.myCourses")}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{t("workspace.hub.myCourses")}</h2>
          </div>
          <Link
            to={paths.teacherNewCourse}
            className="inline-flex items-center gap-1.5 rounded-xl border border-gray-200 bg-white px-3 py-2 text-xs font-semibold text-gray-700 shadow-sm transition hover:border-brand-300 hover:text-brand-700 dark:border-gray-700 dark:bg-gray-900 dark:text-gray-200 dark:hover:border-brand-700 dark:hover:text-brand-300"
          >
            <Plus className="h-3.5 w-3.5" />
            {t("workspace.hub.newCourse")}
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
            <BookOpen className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
              {t("workspace.hub.noCourseYet")}
            </p>
            <Link
              to={paths.teacherNewCourse}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              <Plus className="h-4 w-4" />
              {t("workspace.hub.createFirstCourse")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <TeacherCourseCard key={course._id} course={course} onOpen={onOpenCourse} />
            ))}
            <Link
              to={paths.teacherNewCourse}
              className="flex min-h-[220px] flex-col items-center justify-center rounded-2xl border border-dashed border-gray-300 bg-gray-50/50 text-center transition hover:border-brand-400 hover:bg-brand-50/40 dark:border-gray-700 dark:bg-gray-900/40 dark:hover:border-brand-700 dark:hover:bg-brand-950/20"
            >
              <span className="flex h-11 w-11 items-center justify-center rounded-full bg-white text-gray-400 shadow-sm ring-1 ring-gray-200 dark:bg-gray-800 dark:text-gray-500 dark:ring-gray-700">
                <Plus className="h-5 w-5" />
              </span>
              <span className="mt-3 text-sm font-semibold text-gray-600 dark:text-gray-300">
                {t("workspace.hub.createNewCourse")}
              </span>
            </Link>
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-label={t("workspace.hub.unansweredQA")}
          className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <MessageCircle className="h-4 w-4 text-rose-500" aria-hidden />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.hub.unansweredQA")}</h3>
            </div>
            {(summary.unansweredQACount ?? 0) > 0 && (
              <span className="rounded-full bg-rose-100 px-2 py-0.5 text-[10px] font-bold text-rose-700 dark:bg-rose-950/50 dark:text-rose-300">
                {t("workspace.hub.newCount", { count: summary.unansweredQACount })}
              </span>
            )}
          </div>
          {unansweredQuestions.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("workspace.hub.noOpenQuestions")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800" role="list">
              {unansweredQuestions.map((item) => (
                <li key={item.id}>
                  <Link
                    to={paths.courseWorkspaceTab(item.courseId, "comments")}
                    className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="mt-1.5 h-2 w-2 shrink-0 rounded-full bg-rose-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block text-sm font-semibold text-gray-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                        {item.content}
                      </span>
                      <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                        {item.courseTitle}
                      </span>
                    </span>
                    <span className="shrink-0 text-[11px] tabular-nums text-gray-400">
                      {timeAgo(item.createdAt, t, i18n.language)}
                    </span>
                  </Link>
                </li>
              ))}
            </ul>
          )}
        </section>

        <section
          aria-label="Draft courses"
          className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <BookOpen className="h-4 w-4 text-amber-500" aria-hidden />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">
                {t("workspace.hub.draftsToFinish")}
              </h3>
            </div>
            {(summary.draftCount ?? 0) > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                {t("workspace.hub.draftCount", { count: summary.draftCount })}
              </span>
            )}
          </div>
          {draftCourses.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("workspace.hub.noDrafts")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800" role="list">
              {draftCourses.map((course) => (
                <li key={course._id}>
                  <button
                    type="button"
                    onClick={() => onOpenCourse(course)}
                    className="group flex w-full items-center gap-3 px-4 py-3.5 text-start transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                  >
                    <span className="h-2 w-2 shrink-0 rounded-full bg-amber-500" aria-hidden />
                    <span className="min-w-0 flex-1">
                      <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                        {course.title}
                      </span>
                      <span className="mt-0.5 block text-xs capitalize text-gray-500 dark:text-gray-400">
                        {t(statusLabelKey(course.status))}
                      </span>
                    </span>
                    <span className="flex shrink-0 items-center gap-1 text-[11px] text-gray-400">
                      {course.updatedAt
                        ? new Date(course.updatedAt).toLocaleDateString(i18n.language)
                        : "—"}
                      <ArrowUpRight className="h-3 w-3 opacity-0 transition group-hover:opacity-100" />
                    </span>
                  </button>
                </li>
              ))}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
