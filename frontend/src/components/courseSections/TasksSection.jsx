import { useMemo, useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { formatDate } from "../../lib/i18nFormatters";
import {
  FileText,
  Trash2,
  ChevronDown,
  ClipboardCheck,
  Calendar,
  BookOpenCheck,
  Upload,
  Eye,
  CheckCircle,
  Download,
  Plus,
  ExternalLink,
} from "lucide-react";
import { paths } from "../../config/paths";
import {
  TaskAnalyticsStrip,
  TaskStatsHeader,
  TaskTypeAnalyticsRail,
  TaskTrailingColumn,
} from "../course/workspace/TaskAnalyticsMetrics";

const TASK_GROUPS = [
  { type: "assignment", label: "Assignments", icon: FileText },
  { type: "exam", label: "Exams", icon: BookOpenCheck },
  { type: "resource", label: "Resources", icon: Download },
];

const ICON_ACTION_BRAND =
  "rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-brand-50 hover:text-brand-600 dark:text-gray-500 dark:hover:bg-brand-950/40 dark:hover:text-brand-400";

const ICON_ACTION_DANGER =
  "rounded-lg p-1.5 text-gray-400 transition-colors hover:bg-red-50 hover:text-red-500 dark:text-gray-500 dark:hover:bg-red-950/40 dark:hover:text-red-400";

function normalizeTaskType(type) {
  if (type === "exam") return "exam";
  if (type === "resource") return "resource";
  return "assignment";
}

function TaskTitleBlock({
  task,
  t,
  i18n,
  showTaskAnalytics,
  taskStatus,
  taskGrade,
  stats,
}) {
  const isExam = task.type === "exam";
  const isResource = task.type === "resource";

  return (
    <div className="min-w-0 flex-1">
      <div className="flex min-w-0 items-center gap-1.5">
        <p
          className={`truncate font-semibold text-gray-800 dark:text-gray-100 ${
            showTaskAnalytics
              ? "text-[0.955rem] leading-snug sm:text-[0.9825rem]"
              : "text-sm leading-snug"
          }`}
        >
          {task.title}
        </p>
        {!showTaskAnalytics && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              isExam
                ? "bg-amber-100 text-amber-700 dark:bg-amber-900/40 dark:text-amber-300"
                : isResource
                  ? "bg-emerald-100 text-emerald-700 dark:bg-emerald-900/40 dark:text-emerald-300"
                  : "bg-brand-100 text-brand-700 dark:bg-brand-900/40 dark:text-brand-300"
            }`}
          >
            {isExam ? t("taskForm.exam") : isResource ? "Resource" : t("tasks.taskBadge", "Task")}
          </span>
        )}
        {taskStatus && (
          <span
            className={`shrink-0 rounded px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide ${
              taskStatus.tone === "success"
                ? "bg-green-100 text-green-700 dark:bg-green-900/40 dark:text-green-300"
                : taskStatus.tone === "danger"
                  ? "bg-red-100 text-red-700 dark:bg-red-900/40 dark:text-red-300"
                  : "bg-gray-100 text-gray-700 dark:bg-gray-700 dark:text-gray-300"
            }`}
          >
            {taskStatus.label}
          </span>
        )}
        {taskGrade != null && taskGrade !== "" && (
          <span className="shrink-0 rounded bg-brand-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-brand-700 dark:bg-brand-900/40 dark:text-brand-300">
            Grade: {taskGrade}
          </span>
        )}
        {showTaskAnalytics && stats?.ungradedCount > 0 && (
          <span className="shrink-0 rounded bg-amber-100 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide text-amber-800 dark:bg-amber-950/50 dark:text-amber-200">
            {stats.ungradedCount} to grade
          </span>
        )}
      </div>
      {task.description && (
        <p className="mt-0.5 line-clamp-1 text-xs text-gray-400 dark:text-gray-500">
          {task.description}
        </p>
      )}
      {task.dueDate && (
        <p className="mt-1 flex items-center gap-1 text-xs text-gray-400 dark:text-gray-500">
          <Calendar className="h-3 w-3" />
          {t("tasks.due", "Due")}: {formatDate(task.dueDate, i18n.language)}
        </p>
      )}
      {task.referenceLink?.url && (
        <a
          href={task.referenceLink.url}
          target="_blank"
          rel="noreferrer"
          className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-gray-500 hover:text-brand-600 hover:underline dark:text-gray-400 dark:hover:text-brand-400"
        >
          <ExternalLink className="h-3 w-3" />
          {task.referenceLink.label || "Open link"}
        </a>
      )}
    </div>
  );
}

function TaskTypeIcon({ task }) {
  if (task.type === "exam") {
    return <BookOpenCheck className="h-3.5 w-3.5 shrink-0 text-amber-500" />;
  }
  if (task.type === "resource") {
    return <Download className="h-3.5 w-3.5 shrink-0 text-emerald-500" />;
  }
  return <FileText className="h-3.5 w-3.5 shrink-0 text-brand-400" />;
}

function TaskRowActions({
  task,
  t,
  canDelete,
  onDeleteTask,
  getAssignmentAction,
  getExamAction,
  getInstructorAction,
  getResourceAction,
  showTaskAnalytics,
  compact = false,
}) {
  const isExam = task.type === "exam";
  const isResource = task.type === "resource";
  const assignmentAction = !isExam && !isResource ? getAssignmentAction?.(task) : null;
  const examAction = isExam ? getExamAction?.(task) : null;
  const resourceAction = isResource ? getResourceAction?.(task) : null;
  const instructorAction = canDelete ? getInstructorAction?.(task) : null;

  if (showTaskAnalytics || compact) {
    return (
      <>
        {instructorAction?.href && (
          <Link
            to={instructorAction.href}
            className={ICON_ACTION_BRAND}
            title={instructorAction.label || "View submissions"}
          >
            <Eye className="h-3.5 w-3.5" aria-hidden />
          </Link>
        )}
        {canDelete && (
          <button
            type="button"
            onClick={() => onDeleteTask?.(task._id)}
            className={ICON_ACTION_DANGER}
            title={t("commonActions.remove")}
          >
            <Trash2 className="h-3.5 w-3.5" aria-hidden />
          </button>
        )}
      </>
    );
  }

  return (
    <>
      {instructorAction?.href && (
        <Link
          to={instructorAction.href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50"
        >
          <Eye className="h-3.5 w-3.5" />
          {instructorAction.label || "View submissions"}
        </Link>
      )}
      {assignmentAction?.href && !assignmentAction?.disabled && (
        <Link
          to={assignmentAction.href}
          className="inline-flex items-center gap-1.5 rounded-lg bg-brand-50 px-3 py-1.5 text-xs font-semibold text-brand-600 transition hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50"
        >
          <Upload className="h-3.5 w-3.5" />
          {assignmentAction.label}
        </Link>
      )}
      {assignmentAction?.label && assignmentAction?.disabled && (
        <span className="inline-flex cursor-not-allowed items-center gap-1.5 rounded-lg bg-gray-100 px-3 py-1.5 text-xs font-semibold text-gray-500 dark:bg-gray-700 dark:text-gray-400">
          <Upload className="h-3.5 w-3.5" />
          {assignmentAction.label}
        </span>
      )}
      {examAction?.onClick && (
        <button
          type="button"
          onClick={examAction.onClick}
          disabled={examAction.disabled}
          className={`inline-flex items-center gap-1.5 rounded-lg px-3 py-1.5 text-xs font-semibold transition ${
            examAction.disabled
              ? "cursor-not-allowed bg-gray-100 text-gray-500 dark:bg-gray-700 dark:text-gray-400"
              : "bg-brand-50 text-brand-600 hover:bg-brand-100 dark:bg-brand-900/30 dark:text-brand-400 dark:hover:bg-brand-900/50"
          }`}
        >
          <CheckCircle className="h-3.5 w-3.5" />
          {examAction.label || "Mark complete"}
        </button>
      )}
      {resourceAction?.href && (
        <a
          href={resourceAction.href}
          target="_blank"
          rel="noreferrer"
          download={resourceAction.download || undefined}
          className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-50 px-3 py-1.5 text-xs font-semibold text-emerald-600 transition hover:bg-emerald-100 dark:bg-emerald-900/30 dark:text-emerald-400 dark:hover:bg-emerald-900/50"
        >
          <Download className="h-3.5 w-3.5" />
          {resourceAction.label || "Download"}
        </a>
      )}
      {canDelete && (
        <button
          type="button"
          onClick={() => onDeleteTask?.(task._id)}
          className="shrink-0 rounded-lg p-1.5 text-red-500 transition hover:bg-red-50 dark:hover:bg-red-900/30"
          title={t("commonActions.remove")}
        >
          <Trash2 size={14} />
        </button>
      )}
    </>
  );
}

function AnalyticsTaskRow({ task, stats, ...rowProps }) {
  const { t, i18n, getTaskStatus, getTaskGrade, showTaskAnalytics } = rowProps;

  return (
    <li className="group/taskrow flex items-center gap-2 px-4 py-3 transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40">
      <TaskTypeIcon task={task} />
      <TaskTitleBlock
        task={task}
        t={t}
        i18n={i18n}
        showTaskAnalytics={showTaskAnalytics}
        taskStatus={getTaskStatus?.(task)}
        taskGrade={getTaskGrade?.(task)}
        stats={stats}
      />
      <TaskAnalyticsStrip stats={stats} />
      <TaskTrailingColumn className="min-w-[4.25rem] gap-0.5 border-s border-gray-200/70 ps-2 dark:border-gray-700/70">
        <TaskRowActions task={task} showTaskAnalytics {...rowProps} compact />
      </TaskTrailingColumn>
    </li>
  );
}

function StandardTaskRow({ task, ...rowProps }) {
  const { t, i18n, getTaskStatus, getTaskGrade, showTaskAnalytics } = rowProps;
  const isExam = task.type === "exam";
  const isResource = task.type === "resource";

  return (
    <li className="flex items-start gap-3 px-5 py-3.5 transition-colors hover:bg-gray-50 dark:hover:bg-gray-700/40">
      <div className="mt-0.5 shrink-0">
        {isExam ? (
          <BookOpenCheck className="h-4 w-4 text-amber-500" />
        ) : isResource ? (
          <Download className="h-4 w-4 text-emerald-500" />
        ) : (
          <FileText className="h-4 w-4 text-brand-400" />
        )}
      </div>
      <TaskTitleBlock
        task={task}
        t={t}
        i18n={i18n}
        showTaskAnalytics={showTaskAnalytics}
        taskStatus={getTaskStatus?.(task)}
        taskGrade={getTaskGrade?.(task)}
      />
      <div className="flex shrink-0 items-center gap-2">
        <TaskRowActions task={task} showTaskAnalytics={false} {...rowProps} />
      </div>
    </li>
  );
}

function TaskTypeSection({
  group,
  typeAnalytics,
  showTaskAnalytics,
  openSections,
  onToggleSection,
  taskAnalytics,
  ...rowProps
}) {
  const isOpen = openSections[group.type] !== false;

  return (
    <div className="border-b border-gray-100 last:border-b-0 dark:border-gray-800">
      <div className="group/taskhdr relative flex min-h-[3.25rem] items-center bg-gray-50 dark:bg-gray-800/80">
        <button
          type="button"
          onClick={() => onToggleSection(group.type)}
          className="flex min-w-0 flex-1 items-center gap-3 px-4 py-3 text-start transition-colors hover:bg-gray-100 dark:hover:bg-gray-700/60"
        >
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
          <div className="min-w-0">
            <span className="block truncate text-[15px] font-bold tracking-tight text-gray-900 dark:text-white">
              {group.label}
            </span>
            <span className="text-[13px] font-semibold text-gray-500 dark:text-gray-400">
              {group.tasks.length} task{group.tasks.length !== 1 ? "s" : ""}
            </span>
          </div>
        </button>
        {showTaskAnalytics && typeAnalytics ? (
          <TaskTypeAnalyticsRail
            percent={typeAnalytics.completionPercent}
            taskCount={typeAnalytics.taskCount}
          />
        ) : null}
        <TaskTrailingColumn className="pe-3" />
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        <ul className="divide-y divide-gray-100 dark:divide-gray-800/80">
          {group.tasks.map((task) => (
            <AnalyticsTaskRow
              key={task._id}
              task={task}
              stats={taskAnalytics?.tasks?.[String(task._id)]}
              showTaskAnalytics={showTaskAnalytics}
              {...rowProps}
            />
          ))}
        </ul>
      </div>
    </div>
  );
}

export default function TasksSection({
  tasks = [],
  onDeleteTask,
  canDelete = false,
  isLoading = false,
  emptyText,
  getAssignmentAction,
  getExamAction,
  getTaskStatus,
  getTaskGrade,
  getInstructorAction,
  getResourceAction,
  courseId,
  taskAnalytics,
}) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);
  const [openSections, setOpenSections] = useState({
    assignment: true,
    exam: true,
    resource: true,
  });

  const showTaskAnalytics = Boolean(canDelete && taskAnalytics);

  const groupedTasks = useMemo(() => {
    const buckets = { assignment: [], exam: [], resource: [] };
    for (const task of tasks) {
      buckets[normalizeTaskType(task.type)].push(task);
    }
    return TASK_GROUPS.filter((group) => buckets[group.type].length > 0).map((group) => ({
      ...group,
      tasks: buckets[group.type],
    }));
  }, [tasks]);

  const examCount = tasks.filter((task) => task.type === "exam").length;
  const resourceCount = tasks.filter((task) => task.type === "resource").length;
  const assignmentCount = tasks.length - examCount - resourceCount;

  const rowProps = {
    t,
    i18n,
    canDelete,
    courseId,
    onDeleteTask,
    getAssignmentAction,
    getExamAction,
    getTaskStatus,
    getTaskGrade,
    getInstructorAction,
    getResourceAction,
    showTaskAnalytics,
  };

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 bg-white p-5 shadow dark:border-gray-700 dark:bg-gray-800">
        <div className="h-6 w-48 animate-pulse rounded-lg bg-gray-100 dark:bg-gray-700" />
        <div className="mt-5 space-y-3">
          <div className="h-14 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700" />
          <div className="h-14 animate-pulse rounded-lg bg-gray-50 dark:bg-gray-700" />
        </div>
      </div>
    );
  }

  return (
    <div className="mt-4 overflow-hidden rounded-xl border border-gray-200 bg-white dark:border-gray-800 dark:bg-gray-900">
      <div className="border-b border-gray-100 dark:border-gray-800">
        <button
          type="button"
          onClick={() => setIsOpen((prev) => !prev)}
          className="flex w-full items-center gap-2 px-5 py-4 text-start transition-colors hover:bg-gray-50 dark:hover:bg-gray-800/40"
        >
          <h3 className="flex min-w-0 flex-1 items-center gap-2.5 text-lg font-bold text-gray-900 dark:text-white">
            <ClipboardCheck className="h-5 w-5 shrink-0 text-brand-500" />
            {t("tasks.title", "Tasks & Exams")}
          </h3>
          {showTaskAnalytics ? (
            <>
              <TaskStatsHeader />
              <TaskTrailingColumn />
            </>
          ) : (
            <div className="hidden items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400 sm:flex">
              {assignmentCount > 0 && (
                <span className="flex items-center gap-1">
                  <FileText className="h-3.5 w-3.5" />
                  {t("coursePublic.assignmentCount", { count: assignmentCount })}
                </span>
              )}
              {examCount > 0 && (
                <span className="flex items-center gap-1">
                  <BookOpenCheck className="h-3.5 w-3.5" />
                  {t("tasks.examCount", { count: examCount })}
                </span>
              )}
            </div>
          )}
          {canDelete && courseId && (
            <Link
              to={paths.courseNewTask(courseId)}
              onClick={(e) => e.stopPropagation()}
              className="inline-flex shrink-0 items-center gap-1 rounded-lg border border-gray-200 px-2.5 py-1.5 text-xs font-semibold text-gray-600 transition-colors hover:border-brand-200 hover:bg-brand-50 hover:text-brand-700 dark:border-gray-700 dark:text-gray-300 dark:hover:border-brand-800 dark:hover:bg-brand-950/40 dark:hover:text-brand-300"
            >
              <Plus className="h-3.5 w-3.5" />
              Add task
            </Link>
          )}
          <ChevronDown
            className={`h-5 w-5 shrink-0 text-gray-400 transition-transform duration-200 dark:text-gray-500 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </button>
        {showTaskAnalytics ? (
          <div className="flex flex-wrap items-center gap-3 px-5 pb-3 text-[12px] font-semibold text-gray-500 dark:text-gray-400">
            {assignmentCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="h-3.5 w-3.5" />
                {assignmentCount} assignment{assignmentCount !== 1 ? "s" : ""}
              </span>
            )}
            {examCount > 0 && (
              <span className="flex items-center gap-1">
                <BookOpenCheck className="h-3.5 w-3.5" />
                {examCount} exam{examCount !== 1 ? "s" : ""}
              </span>
            )}
            {resourceCount > 0 && (
              <span className="flex items-center gap-1">
                <Download className="h-3.5 w-3.5" />
                {resourceCount} resource{resourceCount !== 1 ? "s" : ""}
              </span>
            )}
          </div>
        ) : null}
      </div>

      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[4000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <ClipboardCheck className="mx-auto mb-2 h-10 w-10 text-gray-300 dark:text-gray-600" />
            <p className="text-sm text-gray-400 dark:text-gray-500">
              {emptyText || t("tasks.empty", "No tasks yet.")}
            </p>
          </div>
        ) : showTaskAnalytics ? (
          <div>
            {groupedTasks.map((group) => (
              <TaskTypeSection
                key={group.type}
                group={group}
                typeAnalytics={taskAnalytics?.types?.[group.type]}
                showTaskAnalytics={showTaskAnalytics}
                openSections={openSections}
                onToggleSection={(type) =>
                  setOpenSections((prev) => ({ ...prev, [type]: !prev[type] }))
                }
                taskAnalytics={taskAnalytics}
                {...rowProps}
              />
            ))}
          </div>
        ) : (
          <ul className="divide-y dark:divide-gray-700">
            {tasks.map((task) => (
              <StandardTaskRow key={task._id} task={task} {...rowProps} />
            ))}
          </ul>
        )}

        {canDelete && courseId && (
          <Link
            to={paths.courseNewTask(courseId)}
            className="flex w-full items-center justify-center gap-1.5 border-t border-dashed border-gray-200 px-4 py-2.5 text-xs font-medium text-gray-400 transition-colors hover:bg-brand-50/50 hover:text-brand-600 dark:border-gray-700 dark:text-gray-500 dark:hover:bg-brand-900/20 dark:hover:text-brand-400"
          >
            <Plus className="h-3.5 w-3.5" />
            Add task
          </Link>
        )}
      </div>
    </div>
  );
}
