import { useState } from "react";
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
}) {
  const { t, i18n } = useTranslation();
  const [isOpen, setIsOpen] = useState(true);

  const examCount = tasks.filter((t) => t.type === "exam").length;
  const assignmentCount = tasks.length - examCount;

  if (isLoading) {
    return (
      <div className="bg-white dark:bg-gray-800 rounded-xl shadow border dark:border-gray-700 p-5">
        <div className="h-6 w-48 bg-gray-100 dark:bg-gray-700 rounded-lg animate-pulse" />
        <div className="mt-5 space-y-3">
          <div className="h-14 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse" />
          <div className="h-14 bg-gray-50 dark:bg-gray-700 rounded-lg animate-pulse" />
        </div>
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden mt-4">
      {/* Header */}
      <button
        onClick={() => setIsOpen((p) => !p)}
        className="w-full px-5 py-4 flex items-center justify-between border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors text-start"
      >
        <h3 className="text-lg font-bold text-gray-900 dark:text-white flex items-center gap-2.5">
          <ClipboardCheck className="w-5 h-5 text-brand-500" />
          {t("tasks.title", "Tasks & Exams")}
        </h3>
        <div className="flex items-center gap-4">
          <div className="flex items-center gap-3 text-xs font-medium text-gray-500 dark:text-gray-400">
            {assignmentCount > 0 && (
              <span className="flex items-center gap-1">
                <FileText className="w-3.5 h-3.5" />
                {t("coursePublic.assignmentCount", { count: assignmentCount })}
              </span>
            )}
            {examCount > 0 && (
              <span className="flex items-center gap-1">
                <BookOpenCheck className="w-3.5 h-3.5" />
                {t("tasks.examCount", { count: examCount })}
              </span>
            )}
            {canDelete && courseId && (
              <Link
                to={paths.courseNewTask(courseId)}
                onClick={(e) => e.stopPropagation()}
                className="inline-flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition-colors"
              >
                <Plus className="w-3.5 h-3.5" />
                Add task
              </Link>
            )}
          </div>
          <ChevronDown
            className={`w-5 h-5 text-gray-400 dark:text-gray-500 transition-transform duration-200 ${
              isOpen ? "rotate-180" : ""
            }`}
          />
        </div>
      </button>

      {/* Content (animated) */}
      <div
        className={`overflow-hidden transition-all duration-300 ease-in-out ${
          isOpen ? "max-h-[3000px] opacity-100" : "max-h-0 opacity-0"
        }`}
      >
        {tasks.length === 0 ? (
          <div className="px-5 py-8 text-center">
            <ClipboardCheck className="w-10 h-10 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
            <p className="text-gray-400 dark:text-gray-500 text-sm">{emptyText || t("tasks.empty", "No tasks yet.")}</p>
          </div>
        ) : (
          <ul className="divide-y dark:divide-gray-700">
            {tasks.map((task) => {
              const isExam = task.type === "exam";
              const isResource = task.type === "resource";
              const assignmentAction = !isExam && !isResource
                ? getAssignmentAction?.(task)
                : null;
              const examAction = isExam
                ? getExamAction?.(task)
                : null;
              const resourceAction = isResource
                ? getResourceAction?.(task)
                : null;
              const instructorAction = canDelete
                ? getInstructorAction?.(task)
                : null;
              const taskStatus = getTaskStatus?.(task);
              const taskGrade = getTaskGrade?.(task);
              return (
                <li
                  key={task._id}
                  className="flex items-start gap-3 px-5 py-3.5 hover:bg-gray-50 dark:hover:bg-gray-700/40 transition-colors"
                >
                  <div className="flex-shrink-0 mt-0.5">
                    {isExam ? (
                      <BookOpenCheck className="w-4 h-4 text-amber-500" />
                    ) : isResource ? (
                      <Download className="w-4 h-4 text-emerald-500" />
                    ) : (
                      <FileText className="w-4 h-4 text-brand-400" />
                    )}
                  </div>

                  <div className="flex-1 min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-medium text-gray-700 dark:text-gray-200 truncate">
                        {task.title}
                      </p>
                      <span
                        className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${
                          isExam
                            ? "bg-amber-100 dark:bg-amber-900/40 text-amber-700 dark:text-amber-300"
                            : isResource
                              ? "bg-emerald-100 dark:bg-emerald-900/40 text-emerald-700 dark:text-emerald-300"
                              : "bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300"
                        }`}
                      >
                        {isExam ? t("taskForm.exam") : isResource ? "Resource" : t("tasks.taskBadge", "Task")}
                      </span>
                      {taskStatus && (
                        <span
                          className={`flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded ${
                            taskStatus.tone === "success"
                              ? "bg-green-100 dark:bg-green-900/40 text-green-700 dark:text-green-300"
                              : taskStatus.tone === "danger"
                                ? "bg-red-100 dark:bg-red-900/40 text-red-700 dark:text-red-300"
                                : "bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300"
                          }`}
                        >
                          {taskStatus.label}
                        </span>
                      )}
                      {taskGrade != null && taskGrade !== "" && (
                        <span className="flex-shrink-0 px-1.5 py-0.5 text-[10px] font-bold uppercase tracking-wide rounded bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                          Grade: {taskGrade}
                        </span>
                      )}
                    </div>
                    {task.description && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-0.5 line-clamp-1">
                        {task.description}
                      </p>
                    )}
                    {task.dueDate && (
                      <p className="text-xs text-gray-400 dark:text-gray-500 mt-1 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {t("tasks.due", "Due")}: {formatDate(task.dueDate, i18n.language)}
                      </p>
                    )}
                    {task.referenceLink?.url && (
                      <a
                        href={task.referenceLink.url}
                        target="_blank"
                        rel="noreferrer"
                        className="mt-1 inline-flex items-center gap-1 text-xs font-semibold text-sky-600 dark:text-sky-400 hover:underline"
                      >
                        <ExternalLink className="w-3 h-3" />
                        {task.referenceLink.label || "Open link"}
                      </a>
                    )}
                  </div>

                  <div className="flex items-center gap-2 flex-shrink-0">
                    {instructorAction?.href && (
                      <Link
                        to={instructorAction.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
                      >
                        <Eye className="w-3.5 h-3.5" />
                        {instructorAction.label || "View submissions"}
                      </Link>
                    )}
                    {assignmentAction?.href && !assignmentAction?.disabled && (
                      <Link
                        to={assignmentAction.href}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50 transition"
                      >
                        <Upload className="w-3.5 h-3.5" />
                        {assignmentAction.label}
                      </Link>
                    )}
                    {assignmentAction?.label && assignmentAction?.disabled && (
                      <span className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed">
                        <Upload className="w-3.5 h-3.5" />
                        {assignmentAction.label}
                      </span>
                    )}
                    {examAction?.onClick && (
                      <button
                        type="button"
                        onClick={examAction.onClick}
                        disabled={examAction.disabled}
                        className={`inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold transition ${
                          examAction.disabled
                            ? "bg-gray-100 dark:bg-gray-700 text-gray-500 dark:text-gray-400 cursor-not-allowed"
                            : "text-brand-600 dark:text-brand-400 bg-brand-50 dark:bg-brand-900/30 hover:bg-brand-100 dark:hover:bg-brand-900/50"
                        }`}
                      >
                        <CheckCircle className="w-3.5 h-3.5" />
                        {examAction.label || "Mark complete"}
                      </button>
                    )}
                    {resourceAction?.href && (
                      <a
                        href={resourceAction.href}
                        target="_blank"
                        rel="noreferrer"
                        download={resourceAction.download || undefined}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-900/30 hover:bg-emerald-100 dark:hover:bg-emerald-900/50 transition"
                      >
                        <Download className="w-3.5 h-3.5" />
                        {resourceAction.label || "Download"}
                      </a>
                    )}
                    {canDelete && (
                      <button
                        onClick={() => onDeleteTask?.(task._id)}
                        className="flex-shrink-0 p-1.5 rounded-lg text-red-500 hover:bg-red-50 dark:hover:bg-red-900/30 transition"
                        title={t("commonActions.remove")}
                      >
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </li>
              );
            })}
          </ul>
        )}
        {canDelete && courseId && (
          <Link
            to={paths.courseNewTask(courseId)}
            className="w-full flex items-center justify-center gap-1.5 px-4 py-2.5 text-xs font-medium text-gray-400 dark:text-gray-500 hover:text-brand-600 dark:hover:text-brand-400 hover:bg-brand-50/50 dark:hover:bg-brand-900/20 transition-colors border-t border-dashed border-gray-200 dark:border-gray-700"
          >
            <Plus className="w-3.5 h-3.5" />
            Add task
          </Link>
        )}
      </div>
    </div>
  );
}
