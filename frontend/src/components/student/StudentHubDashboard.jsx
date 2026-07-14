import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import {
  BookOpen,
  Code2,
  Database,
  Palette,
  Layers,
  ArrowUpRight,
  GraduationCap,
  CalendarClock,
  Award,
  PlayCircle,
  ClipboardList,
  BookOpenCheck,
} from "lucide-react";
import { paths } from "../../config/paths";
import {
  HubStatCard,
  completionTone,
  iconAccent,
  timeAgo,
  formatDueLabel,
} from "../hub/hubShared";

function CategoryIcon({ category, className = "h-5 w-5" }) {
  const value = String(category || "").toLowerCase();
  if (value.includes("data") || value.includes("sql") || value.includes("engineer")) {
    return <Database className={className} aria-hidden />;
  }
  if (
    value.includes("program") ||
    value.includes("code") ||
    value.includes("dev") ||
    value.includes("web")
  ) {
    return <Code2 className={className} aria-hidden />;
  }
  if (value.includes("design") || value.includes("ui") || value.includes("figma")) {
    return <Palette className={className} aria-hidden />;
  }
  return <BookOpen className={className} aria-hidden />;
}

function StudentCourseCard({ course, onOpen }) {
  const { t, i18n } = useTranslation();
  const completion = completionTone(course.progress);
  const progressValue = Math.max(0, Math.min(100, Math.round(Number(course.progress) || 0)));
  const accent = iconAccent(course.category);

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
            <img src={course.image} alt="" className="h-full w-full rounded-xl object-cover" />
          ) : (
            <CategoryIcon category={course.category} />
          )}
        </div>
        {course.isCompleted ? (
          <span className="shrink-0 rounded-full bg-emerald-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-emerald-700 ring-1 ring-emerald-200/80 dark:bg-emerald-950/40 dark:text-emerald-300 dark:ring-emerald-800/50">
            {t("workspace.hub.completed")}
          </span>
        ) : course.pendingTasks > 0 ? (
          <span className="shrink-0 rounded-full bg-amber-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-amber-800 ring-1 ring-amber-200/80 dark:bg-amber-950/40 dark:text-amber-200 dark:ring-amber-800/50">
            {t("workspace.hub.pending", { count: course.pendingTasks })}
          </span>
        ) : (
          <span className="shrink-0 rounded-full bg-sky-50 px-2.5 py-1 text-[10px] font-bold uppercase tracking-wide text-sky-700 ring-1 ring-sky-200/80 dark:bg-sky-950/40 dark:text-sky-300 dark:ring-sky-800/50">
            {t("workspace.hub.inProgress")}
          </span>
        )}
      </div>

      <h3 className="line-clamp-1 text-[15px] font-bold text-gray-900 dark:text-white">
        {course.title}
      </h3>
      <p className="mt-0.5 text-xs font-medium text-gray-500 dark:text-gray-400">
        {course.teacherName}
      </p>
      <p className="mt-1 line-clamp-2 min-h-[2.5rem] text-xs leading-relaxed text-gray-500 dark:text-gray-400">
        {course.description}
      </p>

      {course.nextDueAt && !course.isCompleted ? (
        <p className="mt-3 flex items-center gap-1 text-[11px] font-semibold text-amber-700 dark:text-amber-300">
          <CalendarClock className="h-3.5 w-3.5 shrink-0" />
          {formatDueLabel(course.nextDueAt, t, i18n.language)}
          {course.nextDueTitle ? ` · ${course.nextDueTitle}` : ""}
        </p>
      ) : null}

      <div className="mt-auto pt-4">
        <div className="flex items-center justify-between gap-2 text-[11px] font-semibold">
          <span className={`tabular-nums ${completion.text}`}>{t("workspace.hub.percentComplete", { percent: progressValue })}</span>
          {course.hasCertificate ? (
            <span className="inline-flex items-center gap-1 text-emerald-600 dark:text-emerald-400">
              <Award className="h-3.5 w-3.5" />
              {t("workspace.hub.certificate")}
            </span>
          ) : null}
        </div>
        <div className="mt-1.5 h-1.5 overflow-hidden rounded-full bg-gray-100 dark:bg-gray-800">
          <div
            className={`h-full rounded-full ${completion.bar}`}
            style={{ width: `${progressValue}%` }}
          />
        </div>
      </div>
    </button>
  );
}

function taskTypeIcon(type) {
  if (type === "exam") return BookOpenCheck;
  return ClipboardList;
}

function continueDotClass(progress) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(progress) || 0)));
  if (safe >= 75) return "bg-emerald-500";
  if (safe >= 45) return "bg-amber-500";
  return "bg-sky-500";
}

export default function StudentHubDashboard({ dashboard, onOpenCourse }) {
  const { t, i18n } = useTranslation();
  const summary = dashboard?.summary ?? {};
  const courses = dashboard?.courses ?? [];
  const dueSoon = dashboard?.dueSoon ?? [];
  const continueCourses = dashboard?.continueCourses ?? [];

  return (
    <div className="space-y-6">
      <div className="grid grid-cols-2 gap-3 xl:grid-cols-4">
        <HubStatCard
          label={t("workspace.hub.myCourses")}
          value={summary.enrolledCount ?? 0}
          hint={t("workspace.hub.enrolledHint", {
            inProgress: summary.inProgressCount ?? 0,
            completed: summary.completedCount ?? 0,
          })}
          tone="brand"
        />
        <HubStatCard
          label={t("workspace.hub.avgProgress")}
          value={`${summary.avgProgress ?? 0}%`}
          hint={t("workspace.hub.acrossEnrollments")}
          tone="sky"
        />
        <HubStatCard
          label={t("workspace.hub.dueSoon")}
          value={summary.dueSoonCount ?? 0}
          hint={
            (summary.dueSoonCount ?? 0) > 0
              ? t("workspace.hub.dueSoonHint")
              : t("workspace.hub.nothingDue")
          }
          tone={(summary.dueSoonCount ?? 0) > 0 ? "amber" : "neutral"}
        />
        <HubStatCard
          label={t("workspace.hub.certificates")}
          value={summary.certificateCount ?? 0}
          hint={
            (summary.certificateCount ?? 0) > 0
              ? t("workspace.hub.certEarnedHint")
              : t("workspace.hub.certEarnHint")
          }
          tone="emerald"
        />
      </div>

      <section aria-label={t("workspace.hub.myCourses")}>
        <div className="mb-3 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2">
            <Layers className="h-4 w-4 text-brand-600 dark:text-brand-400" aria-hidden />
            <h2 className="text-base font-bold text-gray-900 dark:text-white">{t("workspace.hub.myCourses")}</h2>
          </div>
          <Link
            to={paths.home}
            className="inline-flex items-center gap-1 text-xs font-semibold text-brand-600 hover:underline dark:text-brand-400"
          >
            {t("workspace.hub.browseCatalog")}
            <ArrowUpRight className="h-3 w-3" />
          </Link>
        </div>

        {courses.length === 0 ? (
          <div className="rounded-2xl border border-dashed border-gray-300 bg-white px-6 py-14 text-center dark:border-gray-700 dark:bg-gray-900">
            <GraduationCap className="mx-auto h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="mt-3 text-sm font-medium text-gray-600 dark:text-gray-300">
              {t("workspace.hub.notEnrolled")}
            </p>
            <Link
              to={paths.home}
              className="mt-4 inline-flex items-center gap-1.5 rounded-xl bg-brand-600 px-4 py-2 text-sm font-semibold text-white hover:bg-brand-700"
            >
              {t("workspace.hub.browseCourses")}
            </Link>
          </div>
        ) : (
          <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 xl:grid-cols-3">
            {courses.map((course) => (
              <StudentCourseCard key={course._id} course={course} onOpen={onOpenCourse} />
            ))}
          </div>
        )}
      </section>

      <div className="grid gap-4 lg:grid-cols-2">
        <section
          aria-label={t("workspace.hub.dueSoon")}
          className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <CalendarClock className="h-4 w-4 text-amber-500" aria-hidden />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.hub.dueSoon")}</h3>
            </div>
            {(summary.dueSoonCount ?? 0) > 0 && (
              <span className="rounded-full bg-amber-100 px-2 py-0.5 text-[10px] font-bold text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
                {t("workspace.hub.upcoming", { count: summary.dueSoonCount })}
              </span>
            )}
          </div>
          {dueSoon.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {t("workspace.hub.noDeadlines")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800" role="list">
              {dueSoon.map((item) => {
                const Icon = taskTypeIcon(item.taskType);
                return (
                  <li key={item.id}>
                    <Link
                      to={paths.courseWorkspace(item.courseId)}
                      className="group flex items-start gap-3 px-4 py-3.5 transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span
                        className={`mt-1.5 h-2 w-2 shrink-0 rounded-full ${item.overdue ? "bg-rose-500" : "bg-amber-500"}`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="flex items-center gap-1.5">
                          <Icon className="h-3.5 w-3.5 shrink-0 text-gray-400" aria-hidden />
                          <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                            {item.taskTitle}
                          </span>
                        </span>
                        <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                          {item.courseTitle} · {formatDueLabel(item.dueAt, t, i18n.language)}
                        </span>
                      </span>
                      <ArrowUpRight className="mt-1 h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 transition group-hover:opacity-100 dark:text-gray-600" />
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>

        <section
          aria-label="Continue learning"
          className="overflow-hidden rounded-2xl border border-gray-200/90 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
        >
          <div className="flex items-center justify-between border-b border-gray-100 px-4 py-3.5 dark:border-gray-800">
            <div className="flex items-center gap-2">
              <PlayCircle className="h-4 w-4 text-brand-500" aria-hidden />
              <h3 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.hub.continueLearning")}</h3>
            </div>
            {(summary.inProgressCount ?? 0) > 0 && (
              <span className="rounded-full bg-brand-100 px-2 py-0.5 text-[10px] font-bold text-brand-700 dark:bg-brand-950/50 dark:text-brand-300">
                {t("workspace.hub.active", { count: summary.inProgressCount })}
              </span>
            )}
          </div>
          {continueCourses.length === 0 ? (
            <p className="px-4 py-8 text-center text-sm text-gray-500 dark:text-gray-400">
              {courses.length === 0
                ? t("workspace.hub.enrollToStart")
                : t("workspace.hub.completedAll")}
            </p>
          ) : (
            <ul className="divide-y divide-gray-100 dark:divide-gray-800" role="list">
              {continueCourses.map((course) => {
                const tone = completionTone(course.progress);
                const progressValue = Math.max(
                  0,
                  Math.min(100, Math.round(Number(course.progress) || 0)),
                );
                return (
                  <li key={course._id}>
                    <button
                      type="button"
                      onClick={() => onOpenCourse(course)}
                      className="group flex w-full items-center gap-3 px-4 py-3.5 text-start transition hover:bg-gray-50 dark:hover:bg-gray-800/50"
                    >
                      <span
                        className={`mt-0.5 h-2 w-2 shrink-0 rounded-full ${continueDotClass(course.progress)}`}
                        aria-hidden
                      />
                      <span className="min-w-0 flex-1">
                        <span className="block truncate text-sm font-semibold text-gray-900 group-hover:text-brand-700 dark:text-white dark:group-hover:text-brand-300">
                          {course.title}
                        </span>
                        <span className="mt-1 flex flex-wrap items-center gap-x-2 gap-y-0.5 text-xs text-gray-500 dark:text-gray-400">
                          <span className={`font-semibold tabular-nums ${tone.text}`}>
                            {progressValue}%
                          </span>
                          {course.pendingTasks > 0 && (
                            <span>
                              · {t("workspace.hub.tasksLeft", { count: course.pendingTasks })}
                            </span>
                          )}
                          {course.lastVisitedAt && (
                            <span>· {t("workspace.hub.visitedAgo", { time: timeAgo(course.lastVisitedAt, t, i18n.language) })}</span>
                          )}
                        </span>
                      </span>
                      <ArrowUpRight className="h-3.5 w-3.5 shrink-0 text-gray-300 opacity-0 transition group-hover:opacity-100 dark:text-gray-600" />
                    </button>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      </div>
    </div>
  );
}
