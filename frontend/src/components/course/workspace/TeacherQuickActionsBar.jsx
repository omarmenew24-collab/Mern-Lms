import { useEffect, useRef, useState } from "react";
import { Link } from "react-router-dom";
import { Video, FileUp, Link2, Type, ListChecks, Megaphone, Plus, ChevronDown } from "lucide-react";
import { useTranslation } from "react-i18next";
import { paths } from "../../../config/paths";
import { getNewLecturePrefillFromLectures } from "../../../lib/newLecturePrefillFromCourse";

const CONTENT_TYPES = [
  {
    value: "video",
    icon: Video,
    labelKey: "workspace.quickActions.videoLesson",
    classes:
      "text-brand-800 dark:text-brand-200 hover:bg-brand-50 dark:hover:bg-brand-950/35",
    iconClasses: "text-brand-500",
  },
  {
    value: "file",
    icon: FileUp,
    labelKey: "workspace.quickActions.pdfFile",
    classes:
      "text-amber-800 dark:text-amber-200 hover:bg-amber-50 dark:hover:bg-amber-950/25",
    iconClasses: "text-amber-500",
  },
  {
    value: "link",
    icon: Link2,
    labelKey: "workspace.quickActions.zoomLink",
    classes: "text-sky-800 dark:text-sky-200 hover:bg-sky-50 dark:hover:bg-sky-950/25",
    iconClasses: "text-sky-500",
  },
  {
    value: "text",
    icon: Type,
    labelKey: "workspace.quickActions.textNotes",
    classes:
      "text-violet-800 dark:text-violet-200 hover:bg-violet-50 dark:hover:bg-violet-950/25",
    iconClasses: "text-violet-500",
  },
];

/**
 * Compact teacher shortcuts — contextual adds live in each curriculum section below.
 */
export default function TeacherQuickActionsBar({
  courseId,
  taskCount = 0,
  /** Sorted lectures list — used to prefill module (level) + order for the next lesson. */
  sortedLectures = [],
}) {
  const { t } = useTranslation();
  const lecturePrefill = getNewLecturePrefillFromLectures(sortedLectures);
  const [menuOpen, setMenuOpen] = useState(false);
  const wrapRef = useRef(null);

  useEffect(() => {
    if (!menuOpen) return;
    const onDoc = (e) => {
      if (!wrapRef.current?.contains(e.target)) setMenuOpen(false);
    };
    document.addEventListener("mousedown", onDoc);
    return () => document.removeEventListener("mousedown", onDoc);
  }, [menuOpen]);

  return (
    <div
      id="workspace-quick-actions"
      className="flex scroll-mt-20 flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 bg-white px-4 py-3 dark:border-gray-800 dark:bg-gray-900"
    >
      <div className="flex flex-wrap items-center gap-2">
        <div className="relative" ref={wrapRef}>
          <button
            type="button"
            aria-expanded={menuOpen}
            onClick={() => setMenuOpen((o) => !o)}
            className="inline-flex items-center gap-2 rounded-xl border border-gray-200 bg-gray-50/90 px-3.5 py-2 text-sm font-bold text-gray-900 shadow-sm transition hover:border-brand-300 hover:bg-brand-50/70 dark:border-gray-700 dark:bg-gray-800/70 dark:text-white dark:hover:border-brand-500/40 dark:hover:bg-brand-950/40"
          >
            <Plus className="h-4 w-4 shrink-0 text-brand-600 dark:text-brand-400" />
            {t("workspace.quickActions.addLecture")}
            <ChevronDown
              className={`h-4 w-4 shrink-0 text-gray-400 transition-transform ${menuOpen ? "rotate-180" : ""}`}
            />
          </button>
          {menuOpen ? (
            <div
              className="absolute start-0 top-[calc(100%+6px)] z-30 min-w-[12.5rem] overflow-hidden rounded-xl border border-gray-200 bg-white py-1 shadow-lg dark:border-gray-700 dark:bg-gray-900"
              role="menu"
            >
              {CONTENT_TYPES.map(({ value, icon: ItemIcon, labelKey, classes, iconClasses }) => (
            <Link
              key={value}
              to={paths.courseNewLecture(courseId)}
                  state={{ prefillContentType: value, ...lecturePrefill }}
                  onClick={() => setMenuOpen(false)}
                  role="menuitem"
                  className={`flex items-center gap-2.5 px-3 py-2.5 text-sm font-semibold transition-colors ${classes}`}
                >
                  <ItemIcon className={`h-4 w-4 shrink-0 ${iconClasses}`} />
                  {t(labelKey)}
            </Link>
          ))}
            </div>
          ) : null}
        </div>

        <Link
          to={paths.courseNewTask(courseId)}
          className="inline-flex items-center gap-2 rounded-xl border border-gray-200 px-3.5 py-2 text-sm font-bold text-gray-800 transition hover:bg-gray-100 dark:border-gray-700 dark:text-gray-100 dark:hover:bg-gray-800/80"
        >
          <ListChecks className="h-4 w-4 shrink-0 text-gray-500 dark:text-gray-400" />
          {t("workspace.quickActions.newTask")}
          {taskCount > 0 ? (
            <span className="ms-1 rounded-full bg-gray-100 px-2 py-0.5 text-[11px] font-bold tabular-nums text-gray-600 dark:bg-gray-800 dark:text-gray-300">
              {taskCount}
            </span>
          ) : null}
        </Link>
      </div>

      <Link
        to={paths.sendAnnouncement}
        className="inline-flex items-center gap-1.5 text-sm font-bold text-brand-700 transition hover:text-brand-800 dark:text-brand-300 dark:hover:text-brand-200"
      >
        <Megaphone className="h-4 w-4 shrink-0" />
        {t("workspace.quickActions.messageStudents")}
      </Link>
    </div>
  );
}
