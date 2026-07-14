import { forwardRef, useMemo } from "react";
import { ClipboardList, MessageCircleQuestion, CircleDollarSign, TrendingUp } from "lucide-react";
import { useTranslation } from "react-i18next";

const TABS = [
  { id: "progress", labelKey: "workspace.studentTabs.progress", icon: TrendingUp },
  { id: "assignments", labelKey: "workspace.studentTabs.assignments", icon: ClipboardList },
  { id: "refunds", labelKey: "workspace.studentTabs.refunds", icon: CircleDollarSign },
  { id: "qa", labelKey: "workspace.studentTabs.qa", icon: MessageCircleQuestion },
];

/**
 * Student workspace: tabbed panels below the sticky video area.
 */
const StudentCourseWorkspaceTabs = forwardRef(function StudentCourseWorkspaceTabs(
  { activeTab, onTabChange, progressPanel, assignmentsPanel, refundsPanel, qaPanel },
  ref,
) {
  const { t } = useTranslation();
  const panels = useMemo(
    () => ({
      progress: progressPanel,
      assignments: assignmentsPanel,
      refunds: refundsPanel,
      qa: qaPanel,
    }),
    [progressPanel, assignmentsPanel, refundsPanel, qaPanel],
  );

  return (
    <div
      ref={ref}
      id="student-course-workspace-tabs"
      className="w-full scroll-mt-[140px] rounded-2xl border border-gray-200 dark:border-gray-800 bg-white shadow-sm dark:bg-gray-950 dark:shadow-none overflow-hidden"
    >
      <div
        className="border-b border-gray-200 dark:border-gray-700 bg-gray-50/60 dark:bg-gray-950/50"
        role="tablist"
        aria-label={t("workspace.studentTabs.sectionsAria")}
      >
        <div className="flex w-full min-h-[3.25rem] sm:min-h-[3.5rem]">
          {TABS.map(({ id, labelKey, icon: Icon }) => {
            const selected = activeTab === id;
            const label = t(labelKey);
            return (
              <button
                key={id}
                type="button"
                role="tab"
                aria-selected={selected}
                onClick={() => onTabChange(id)}
                className={[
                  "group relative flex min-w-0 flex-1 items-center justify-center gap-2 px-3 py-3.5 sm:px-5 sm:py-4 text-sm sm:text-[0.9375rem] font-semibold tracking-tight transition-colors",
                  selected
                    ? "text-gray-950 dark:text-white"
                    : "text-gray-600 hover:text-gray-900 dark:text-gray-400 dark:hover:text-gray-100",
                ].join(" ")}
              >
                <span
                  className={[
                    "pointer-events-none absolute inset-x-2 bottom-0 h-0.5 rounded-full transition-colors sm:inset-x-3",
                    selected
                      ? "bg-gray-950 dark:bg-white"
                      : "bg-transparent group-hover:bg-gray-200 group-hover:dark:bg-gray-600",
                  ].join(" ")}
                  aria-hidden
                />
                <Icon
                  className={[
                    "w-4 h-4 shrink-0 sm:w-[1.125rem] sm:h-[1.125rem]",
                    selected ? "opacity-100" : "opacity-70 group-hover:opacity-100",
                  ].join(" ")}
                  aria-hidden
                />
                <span className="truncate">{label}</span>
              </button>
            );
          })}
        </div>
      </div>
      <div className="p-5 sm:p-6 lg:p-8 min-h-[12rem]">{panels[activeTab]}</div>
    </div>
  );
});

export default StudentCourseWorkspaceTabs;
