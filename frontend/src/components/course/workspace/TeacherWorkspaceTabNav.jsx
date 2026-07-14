import { NavLink } from "react-router-dom";
import { BookOpen, Users, ListChecks, Settings, CircleHelp, LayoutDashboard } from "lucide-react";
import { useTranslation } from "react-i18next";
import { paths } from "../../../config/paths";

const TABS = [
  { id: "overview", labelKey: "workspace.teacherTabs.overview", icon: LayoutDashboard, showEventBadge: true },
  { id: "curriculum", labelKey: "workspace.teacherTabs.curriculum", icon: BookOpen },
  { id: "students", labelKey: "workspace.teacherTabs.students", icon: Users },
  { id: "tasks", labelKey: "workspace.teacherTabs.tasks", icon: ListChecks },
  { id: "settings", labelKey: "workspace.teacherTabs.settings", icon: Settings },
  { id: "comments", labelKey: "workspace.teacherTabs.qa", icon: CircleHelp },
];

export const TEACHER_WORKSPACE_TAB_IDS = TABS.map((t) => t.id);

function TabIconWithBadge({ icon: Icon, count, isActive, ariaLabel }) {
  const display = count > 99 ? "99+" : String(count);

  return (
    <span className="relative inline-flex shrink-0">
      <Icon className="h-4 w-4 opacity-90" aria-hidden />
      {count > 0 && (
        <>
          {!isActive && (
            <span
              className="absolute -end-1 -top-1 h-4 w-4 animate-ping rounded-full bg-rose-400 opacity-50"
              aria-hidden
            />
          )}
          <span
            className={[
              "absolute -end-2 -top-2 flex h-[18px] min-w-[18px] items-center justify-center rounded-full px-1 text-[10px] font-bold leading-none tabular-nums shadow-sm",
              isActive
                ? "bg-white text-brand-600 ring-2 ring-brand-400/50"
                : "bg-rose-500 text-white ring-2 ring-white dark:ring-gray-900",
            ].join(" ")}
            aria-label={ariaLabel}
          >
            {display}
          </span>
        </>
      )}
    </span>
  );
}

/**
 * Horizontal primary navigation for the instructor course workspace (route-based tabs).
 */
export default function TeacherWorkspaceTabNav({ courseId, courseStatus, tabBadges = {} }) {
  const { t } = useTranslation();
  return (
    <div className="overflow-hidden rounded-xl border border-gray-200 bg-white shadow-sm dark:border-gray-800 dark:bg-gray-900 dark:shadow-none">
      <div className="border-b border-gray-100 px-3 py-3 dark:border-gray-800 sm:px-4">
        <p className="mb-2 hidden px-1 text-[11px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 sm:block">
          {t("workspace.teacherTabs.sectionLabel")}
        </p>
        <nav
          className="flex flex-wrap gap-1.5 sm:gap-2"
          aria-label={t("workspace.teacherTabs.sectionsAria")}
        >
          {TABS.map(({ id, labelKey, icon: Icon, showEventBadge }) => {
            const to = paths.courseWorkspaceTab(courseId, id);
            const badge = tabBadges[id] ?? 0;
            const label = t(labelKey);
            return (
              <NavLink
                key={id}
                to={to}
                className={({ isActive }) =>
                  [
                    "inline-flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-semibold transition-all sm:px-5 sm:py-3",
                    isActive
                      ? "bg-brand-600 text-white shadow-sm ring-1 ring-brand-500/30 dark:bg-brand-500 dark:text-white dark:ring-brand-400/40"
                      : "text-gray-600 hover:bg-gray-100 hover:text-gray-900 dark:text-gray-300 dark:hover:bg-gray-800 dark:hover:text-white",
                  ].join(" ")
                }
              >
                {({ isActive }) => (
                  <>
                    {showEventBadge ? (
                      <TabIconWithBadge
                        icon={Icon}
                        count={badge}
                        isActive={isActive}
                        ariaLabel={t("workspace.teacherTabs.newEventsAria", {
                          count: badge,
                          label,
                        })}
                      />
                    ) : (
                      <Icon className="h-4 w-4 shrink-0 opacity-90" aria-hidden />
                    )}
                    <span>{label}</span>
                  </>
                )}
              </NavLink>
            );
          })}
        </nav>
      </div>
      {courseStatus === "draft" && (
        <p className="border-t border-amber-100 bg-amber-50/80 px-4 py-2.5 text-xs text-amber-800 dark:border-amber-900/40 dark:bg-amber-950/25 dark:text-amber-200/90">
          {t("workspace.teacherTabs.draftNotice")}
        </p>
      )}
    </div>
  );
}
