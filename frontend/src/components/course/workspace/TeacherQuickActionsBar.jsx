import { Link } from "react-router-dom";
import { Video, FileUp, Link2, Type, ListChecks, Megaphone, Plus } from "lucide-react";
import { paths } from "../../../config/paths";

const CONTENT_TYPES = [
  {
    value: "video",
    icon: Video,
    label: "Video",
    hint: "Upload or paste link",
    classes:
      "text-brand-700 dark:text-brand-300 bg-brand-50 dark:bg-brand-950/40 border-brand-200 dark:border-brand-800/60 hover:border-brand-400 dark:hover:border-brand-500 hover:bg-brand-100/60 dark:hover:bg-brand-900/40",
    iconClasses: "text-brand-500",
  },
  {
    value: "file",
    icon: FileUp,
    label: "PDF / File",
    hint: "Upload a document",
    classes:
      "text-amber-700 dark:text-amber-300 bg-amber-50 dark:bg-amber-950/30 border-amber-200 dark:border-amber-800/60 hover:border-amber-400 dark:hover:border-amber-500 hover:bg-amber-100/60 dark:hover:bg-amber-900/30",
    iconClasses: "text-amber-500",
  },
  {
    value: "link",
    icon: Link2,
    label: "Zoom / Link",
    hint: "Meeting or any URL",
    classes:
      "text-sky-700 dark:text-sky-300 bg-sky-50 dark:bg-sky-950/30 border-sky-200 dark:border-sky-800/60 hover:border-sky-400 dark:hover:border-sky-500 hover:bg-sky-100/60 dark:hover:bg-sky-900/30",
    iconClasses: "text-sky-500",
  },
  {
    value: "text",
    icon: Type,
    label: "Text / Notes",
    hint: "Written material",
    classes:
      "text-violet-700 dark:text-violet-300 bg-violet-50 dark:bg-violet-950/30 border-violet-200 dark:border-violet-800/60 hover:border-violet-400 dark:hover:border-violet-500 hover:bg-violet-100/60 dark:hover:bg-violet-900/30",
    iconClasses: "text-violet-500",
  },
];

/**
 * Content creation hub — always visible regardless of course status.
 * Lets instructors quickly start any lecture type or create a task.
 */
export default function TeacherQuickActionsBar({ courseId, lectureCount = 0, taskCount = 0 }) {
  return (
    <div
      id="workspace-quick-actions"
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden scroll-mt-20"
    >
      {/* Header */}
      <div className="px-5 py-3.5 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between">
        <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
          <Plus className="w-4 h-4 text-brand-500" />
          Add content
        </h2>
        <Link
          to={paths.sendAnnouncement}
          className="inline-flex items-center gap-1.5 text-xs font-semibold text-brand-600 dark:text-brand-400 hover:text-brand-700 dark:hover:text-brand-300 transition-colors"
        >
          <Megaphone className="w-3.5 h-3.5" />
          Message students
        </Link>
      </div>

      <div className="p-4">
        {/* Lecture type cards */}
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5">
          New lecture
        </p>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-2 mb-4">
          {CONTENT_TYPES.map(({ value, icon: Icon, label, hint, classes, iconClasses }) => (
            <Link
              key={value}
              to={paths.courseNewLecture(courseId)}
              state={{ prefillContentType: value }}
              className={`group flex items-center gap-3 p-3 rounded-xl border transition-all duration-150 ${classes}`}
            >
              <div className={`shrink-0 ${iconClasses}`}>
                <Icon className="w-5 h-5" />
              </div>
              <div className="min-w-0">
                <div className="text-xs font-bold leading-tight">{label}</div>
                <div className="text-[10px] opacity-60 mt-0.5 truncate hidden sm:block">{hint}</div>
              </div>
            </Link>
          ))}
        </div>

        {/* Task row */}
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-2.5">
          New task
        </p>
        <Link
          to={paths.courseNewTask(courseId)}
          className="group flex items-center gap-3 px-4 py-3 rounded-xl border border-gray-200 dark:border-gray-700 bg-gray-50 dark:bg-gray-800/50 hover:border-gray-400 dark:hover:border-gray-500 hover:bg-gray-100/60 dark:hover:bg-gray-800 transition-all duration-150"
        >
          <ListChecks className="w-5 h-5 text-gray-500 dark:text-gray-400 shrink-0" />
          <div>
            <div className="text-xs font-bold text-gray-700 dark:text-gray-200">Assignment, exam, or resource</div>
            <div className="text-[10px] text-gray-400 dark:text-gray-500 mt-0.5">
              {taskCount === 0 ? "No tasks yet — add one to collect student work" : `${taskCount} task${taskCount !== 1 ? "s" : ""} · Add another`}
            </div>
          </div>
        </Link>
      </div>
    </div>
  );
}
