import { Link } from "react-router-dom";
import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import {
  Activity,
  ArrowUpRight,
  ClipboardCheck,
  ExternalLink,
  Gauge,
  HelpCircle,
  LayoutDashboard,
  RefreshCw,
  UserPlus,
  Users,
  Undo2,
  Video,
} from "lucide-react";
import { paths } from "../../../config/paths";

function timeAgo(iso, t, i18n) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return t("notifications.justNow");
  if (s < 3600) return t("notifications.minutesAgo", { count: Math.floor(s / 60) });
  if (s < 86400) return t("notifications.hoursAgo", { count: Math.floor(s / 3600) });
  return d.toLocaleDateString(i18n.language);
}

function eventIcon(type) {
  switch (type) {
    case "enrollment":
      return UserPlus;
    case "refund":
      return Undo2;
    case "submission":
      return ClipboardCheck;
    case "question":
      return HelpCircle;
    case "meeting":
      return Video;
    default:
      return Activity;
  }
}

function priorityStyles(priority) {
  switch (priority) {
    case "urgent":
      return {
        ring: "ring-rose-200 dark:ring-rose-900/50",
        icon: "bg-rose-100 text-rose-700 dark:bg-rose-950/50 dark:text-rose-300",
        badge: "bg-rose-600 text-white",
      };
    case "high":
      return {
        ring: "ring-amber-200 dark:ring-amber-900/40",
        icon: "bg-amber-100 text-amber-800 dark:bg-amber-950/40 dark:text-amber-200",
        badge: "bg-amber-600 text-white",
      };
    default:
      return {
        ring: "ring-gray-200 dark:ring-gray-800",
        icon: "bg-gray-100 text-gray-700 dark:bg-gray-800 dark:text-gray-300",
        badge: "bg-brand-600 text-white",
      };
  }
}

function OverviewStatCard({
  to,
  icon: Icon,
  label,
  value,
  hint,
  tone = "brand",
  highlight = false,
}) {
  const tones = {
    brand: {
      icon: "bg-brand-100 text-brand-700 dark:bg-brand-950/40 dark:text-brand-300",
      ring: highlight
        ? "border-brand-300 ring-2 ring-brand-500/20 dark:border-brand-700"
        : "border-gray-200 dark:border-gray-800",
    },
    emerald: {
      icon: "bg-emerald-100 text-emerald-700 dark:bg-emerald-950/40 dark:text-emerald-300",
      ring: "border-gray-200 dark:border-gray-800",
    },
    rose: {
      icon: "bg-rose-100 text-rose-700 dark:bg-rose-950/40 dark:text-rose-300",
      ring: highlight
        ? "border-rose-300 ring-2 ring-rose-500/20 dark:border-rose-700"
        : "border-gray-200 dark:border-gray-800",
    },
  };

  const style = tones[tone] ?? tones.brand;

  return (
    <Link
      to={to}
      className={[
        "group flex items-start justify-between gap-3 rounded-xl border bg-white px-4 py-4 shadow-sm transition hover:-translate-y-0.5 hover:shadow-md dark:bg-gray-900",
        style.ring,
      ].join(" ")}
    >
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-extrabold leading-none tracking-tight text-gray-900 dark:text-white">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">{hint}</p>
        )}
      </div>
      <div className="flex shrink-0 flex-col items-end gap-2">
        <span
          className={`flex h-10 w-10 items-center justify-center rounded-xl ${style.icon}`}
        >
          <Icon className="h-5 w-5" aria-hidden />
        </span>
        <ArrowUpRight
          className="h-4 w-4 text-gray-300 transition group-hover:text-brand-600 dark:text-gray-600 dark:group-hover:text-brand-400"
          aria-hidden
        />
      </div>
    </Link>
  );
}

function ActivityAction({ action }) {
  const className =
    "inline-flex items-center gap-1.5 rounded-lg bg-brand-600 px-3 py-1.5 text-xs font-semibold text-white shadow-sm transition hover:bg-brand-700 focus:outline-none focus-visible:ring-2 focus-visible:ring-brand-500 focus-visible:ring-offset-2 dark:bg-brand-500 dark:hover:bg-brand-400";

  if (action.external) {
    return (
      <a
        href={action.path}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
      >
        {action.label}
        <ExternalLink className="h-3.5 w-3.5" aria-hidden />
      </a>
    );
  }

  return (
    <Link to={action.path} className={className}>
      {action.label}
      <ArrowUpRight className="h-3.5 w-3.5" aria-hidden />
    </Link>
  );
}

export default function TeacherCourseOverviewPanel({
  courseId,
  studentsCount = 0,
  overallCompletionPercent = 0,
  instructorActivity,
  activityLoading = false,
  activityError = false,
  activityFetching = false,
  onRefreshActivity,
}) {
  const { t, i18n } = useTranslation();

  const events = instructorActivity?.events ?? [];
  const attentionCount = instructorActivity?.attentionCount ?? 0;
  const newEventCount = instructorActivity?.newEventCount ?? 0;
  const activityFeedAnchor = `${paths.courseWorkspaceTab(courseId, "overview")}#workspace-activity-feed`;

  const { toGrade, openQuestions } = useMemo(() => {
    let grade = 0;
    let questions = 0;
    for (const event of events) {
      if (event.type === "submission" && event.meta?.ungraded) grade += 1;
      if (event.type === "question" && event.meta?.unanswered) questions += 1;
    }
    return { toGrade: grade, openQuestions: questions };
  }, [events]);

  const safeCompletion = Number.isFinite(Number(overallCompletionPercent))
    ? Math.max(0, Math.min(100, Math.round(Number(overallCompletionPercent))))
    : 0;

  return (
    <div id="workspace-overview" className="scroll-mt-20 space-y-6">
      <section
        aria-label="Course overview"
        className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-5">
          <div className="flex items-center gap-2">
            <LayoutDashboard
              className="h-5 w-5 text-brand-600 dark:text-brand-400"
              aria-hidden
            />
            <div>
              <h2 className="text-lg font-bold text-gray-900 dark:text-white">Overview</h2>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                Key numbers for this course — tap a card to jump to the relevant section.
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-2 gap-3 p-4 sm:p-5 xl:grid-cols-4">
          <OverviewStatCard
            to={paths.courseWorkspaceTab(courseId, "students")}
            icon={Users}
            label="Students"
            value={studentsCount}
            hint={
              studentsCount === 1 ? "1 learner enrolled" : `${studentsCount} learners enrolled`
            }
            tone="brand"
          />
          <OverviewStatCard
            to={paths.courseWorkspaceTab(courseId, "students")}
            icon={Gauge}
            label="Avg. progress"
            value={`${safeCompletion}%`}
            hint="Class average completion"
            tone="emerald"
          />
          <OverviewStatCard
            to={activityFeedAnchor}
            icon={Activity}
            label="New activity"
            value={newEventCount}
            hint={
              newEventCount === 0
                ? "Nothing new in the last few days"
                : `${newEventCount} recent update${newEventCount !== 1 ? "s" : ""}`
            }
            tone="brand"
            highlight={newEventCount > 0}
          />
          <OverviewStatCard
            to={activityFeedAnchor}
            icon={ClipboardCheck}
            label="Needs attention"
            value={attentionCount}
            hint={
              attentionCount === 0
                ? "You're all caught up"
                : "Submissions, Q&A, refunds & meetings"
            }
            tone={attentionCount > 0 ? "rose" : "brand"}
            highlight={attentionCount > 0}
          />
        </div>

        {(toGrade > 0 || openQuestions > 0) && (
          <div className="flex flex-wrap gap-2 border-t border-gray-100 px-4 py-3 dark:border-gray-800 sm:px-5">
            {toGrade > 0 && (
              <Link
                to={paths.courseWorkspaceTab(courseId, "tasks")}
                className="inline-flex items-center gap-1.5 rounded-full bg-amber-50 px-3 py-1.5 text-xs font-semibold text-amber-800 transition hover:bg-amber-100 dark:bg-amber-950/40 dark:text-amber-200 dark:hover:bg-amber-950/60"
              >
                <ClipboardCheck className="h-3.5 w-3.5" aria-hidden />
                {toGrade} submission{toGrade !== 1 ? "s" : ""} to grade
              </Link>
            )}
            {openQuestions > 0 && (
              <Link
                to={paths.courseWorkspaceTab(courseId, "comments")}
                className="inline-flex items-center gap-1.5 rounded-full bg-sky-50 px-3 py-1.5 text-xs font-semibold text-sky-800 transition hover:bg-sky-100 dark:bg-sky-950/40 dark:text-sky-200 dark:hover:bg-sky-950/60"
              >
                <HelpCircle className="h-3.5 w-3.5" aria-hidden />
                {openQuestions} open question{openQuestions !== 1 ? "s" : ""}
              </Link>
            )}
          </div>
        )}
      </section>

      <section
        id="workspace-activity-feed"
        aria-label="Course activity"
        className="scroll-mt-24 overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900"
      >
        <div className="flex flex-wrap items-start justify-between gap-3 border-b border-gray-100 px-4 py-4 dark:border-gray-800 sm:px-5">
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <Activity className="h-5 w-5 text-brand-600 dark:text-brand-400" aria-hidden />
              <h3 className="text-lg font-bold text-gray-900 dark:text-white">Activity</h3>
              {attentionCount > 0 && (
                <span className="rounded-full bg-rose-600 px-2 py-0.5 text-[11px] font-bold text-white">
                  {attentionCount > 99 ? "99+" : attentionCount} need attention
                </span>
              )}
            </div>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              Enrollments, submissions, refunds, Q&amp;A, and upcoming meetings.
            </p>
          </div>
          <button
            type="button"
            onClick={onRefreshActivity}
            disabled={activityFetching}
            className="inline-flex items-center gap-1.5 rounded-lg border border-gray-200 px-3 py-2 text-xs font-semibold text-gray-700 transition hover:bg-gray-50 disabled:opacity-60 dark:border-gray-700 dark:text-gray-200 dark:hover:bg-gray-800"
          >
            <RefreshCw
              className={`h-3.5 w-3.5 ${activityFetching ? "animate-spin" : ""}`}
              aria-hidden
            />
            Refresh
          </button>
        </div>

        {activityLoading && (
          <p className="px-5 py-8 text-sm text-gray-500 dark:text-gray-400">
            {t("notifications.loading")}
          </p>
        )}

        {activityError && !activityLoading && (
          <p className="px-5 py-8 text-sm text-rose-600 dark:text-rose-400">
            Could not load activity. Try refreshing.
          </p>
        )}

        {!activityLoading && !activityError && events.length === 0 && (
          <div className="px-5 py-10 text-center">
            <Activity className="mx-auto h-8 w-8 text-gray-300 dark:text-gray-600" aria-hidden />
            <p className="mt-3 text-sm font-medium text-gray-700 dark:text-gray-300">
              No recent activity
            </p>
            <p className="mt-1 text-xs text-gray-500 dark:text-gray-400">
              New enrollments, submissions, and questions will show up here automatically.
            </p>
          </div>
        )}

        {!activityLoading && !activityError && events.length > 0 && (
          <ul className="divide-y divide-gray-100 dark:divide-gray-800" role="list">
            {events.map((event) => {
              const Icon = eventIcon(event.type);
              const styles = priorityStyles(event.priority);

              return (
                <li
                  key={event.id}
                  className={`flex flex-col gap-3 px-4 py-4 sm:flex-row sm:items-center sm:justify-between sm:px-5 ${event.priority === "urgent" ? "bg-rose-50/60 dark:bg-rose-950/15" : ""}`}
                >
                  <div className="flex min-w-0 items-start gap-3">
                    <span
                      className={`mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-xl ring-1 ${styles.ring} ${styles.icon}`}
                    >
                      <Icon className="h-4 w-4" aria-hidden />
                    </span>
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-gray-900 dark:text-white">
                          {event.title}
                        </p>
                        {event.priority === "urgent" && (
                          <span
                            className={`rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wide ${styles.badge}`}
                          >
                            Soon
                          </span>
                        )}
                      </div>
                      <p className="mt-0.5 text-sm text-gray-600 dark:text-gray-300">
                        {event.message}
                      </p>
                      <p className="mt-1 text-xs tabular-nums text-gray-400">
                        {timeAgo(event.occurredAt, t, i18n)}
                      </p>
                    </div>
                  </div>
                  {event.action?.path && event.action?.label && (
                    <div className="shrink-0 sm:ps-2">
                      <ActivityAction action={event.action} />
                    </div>
                  )}
                </li>
              );
            })}
          </ul>
        )}
      </section>
    </div>
  );
}
