import {
  BookOpen,
  Video,
  ListChecks,
  MessageSquare,
  Users,
  Settings,
  BarChart2,
  Zap,
  RefreshCcw,
} from "lucide-react";
import { useTranslation } from "react-i18next";

const itemClass =
  "flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";

/**
 * In-page jump links for the course workspace. Desktop: vertical rail; mobile: wrap row.
 */
export default function CourseWorkspaceSideNav({ isInstructor = false, courseStatus }) {
  const { t } = useTranslation();
  const hideQuickActionsLink = isInstructor && courseStatus === "published";
  return (
    <nav
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-2 lg:py-3 lg:sticky lg:top-20 lg:max-h-[calc(100vh-6rem)] lg:overflow-y-auto"
      aria-label={t("workspace.sideNav.onThisPage")}
    >
      <p className="hidden lg:block px-3 py-1 text-[10px] font-bold uppercase tracking-wider text-gray-400">
        {t("workspace.sideNav.onThisPage")}
      </p>
      <ul className="flex flex-wrap lg:flex-col gap-1">
        <li className="lg:w-full">
          <a href="#workspace-overview" className={itemClass}>
            <BookOpen className="w-4 h-4 shrink-0 text-brand-500" />
            <span>{t("workspace.sideNav.overview")}</span>
          </a>
        </li>
        {!isInstructor && (
          <li className="lg:w-full">
            <a href="#workspace-progress" className={itemClass}>
              <BarChart2 className="w-4 h-4 shrink-0 text-brand-500" />
              <span>{t("workspace.sideNav.progress")}</span>
            </a>
          </li>
        )}
        {isInstructor && !hideQuickActionsLink && (
          <li className="lg:w-full">
            <a href="#workspace-quick-actions" className={itemClass}>
              <Zap className="w-4 h-4 shrink-0 text-amber-500" />
              <span>{t("workspace.sideNav.quickActions")}</span>
            </a>
          </li>
        )}
        {isInstructor && (
          <li className="lg:w-full">
            <a href="#course-settings" className={itemClass}>
              <Settings className="w-4 h-4 shrink-0 text-brand-500" />
              <span>{t("workspace.sideNav.courseSettings")}</span>
            </a>
          </li>
        )}
        {isInstructor && (
          <li className="lg:w-full">
            <a href="#workspace-students" className={itemClass}>
              <Users className="w-4 h-4 shrink-0 text-brand-500" />
              <span>{t("workspace.sideNav.students")}</span>
            </a>
          </li>
        )}
        <li className="lg:w-full">
          <a href="#workspace-lectures" className={itemClass}>
            <Video className="w-4 h-4 shrink-0 text-brand-500" />
            <span>{t("workspace.sideNav.lectures")}</span>
          </a>
        </li>
        <li className="lg:w-full">
          <a href="#workspace-tasks" className={itemClass}>
            <ListChecks className="w-4 h-4 shrink-0 text-brand-500" />
            <span>{t("workspace.sideNav.tasks")}</span>
          </a>
        </li>
        {!isInstructor && (
          <li className="lg:w-full">
            <a href="#workspace-refund" className={itemClass}>
              <RefreshCcw className="w-4 h-4 shrink-0 text-brand-500" />
              <span>{t("workspace.sideNav.refund")}</span>
            </a>
          </li>
        )}
        <li className="lg:w-full">
          <a href="#workspace-comments" className={itemClass}>
            <MessageSquare className="w-4 h-4 shrink-0 text-brand-500" />
            <span>{t("workspace.sideNav.comments")}</span>
          </a>
        </li>
      </ul>
    </nav>
  );
}
