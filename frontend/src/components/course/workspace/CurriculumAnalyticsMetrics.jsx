import { useTranslation } from "react-i18next";

function getLevelTone(rate = 0) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(rate) || 0)));
  if (safe >= 75) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      track: "bg-emerald-100/90 dark:bg-emerald-950/60",
    };
  }
  if (safe >= 45) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      track: "bg-amber-100/90 dark:bg-amber-950/60",
    };
  }
  return {
    bar: "bg-sky-500",
    text: "text-sky-600 dark:text-sky-400",
    track: "bg-sky-100/90 dark:bg-sky-950/60",
  };
}

function getFinishTone(rate = 0) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(rate) || 0)));
  if (safe >= 90) {
    return {
      bar: "bg-emerald-500",
      text: "text-emerald-600 dark:text-emerald-400",
      track: "bg-emerald-100/90 dark:bg-emerald-950/60",
    };
  }
  if (safe >= 60) {
    return {
      bar: "bg-amber-500",
      text: "text-amber-600 dark:text-amber-400",
      track: "bg-amber-100/90 dark:bg-amber-950/60",
    };
  }
  return {
    bar: "bg-rose-500",
    text: "text-rose-600 dark:text-rose-400",
    track: "bg-rose-100/90 dark:bg-rose-950/60",
  };
}

export function formatDetailedDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  if (total <= 0) return "—";
  const h = Math.floor(total / 3600);
  const m = Math.floor((total % 3600) / 60);
  const s = total % 60;
  if (h > 0) return `${h}h ${m}m`;
  if (m > 0) return s > 0 ? `${m}m ${s}s` : `${m}m`;
  return `${s}s`;
}

const LABEL =
  "text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500";

export const CURRICULUM_RAIL_WIDTH = {
  dense: "w-[11rem]",
  default: "w-[13rem]",
};

export const CURRICULUM_TRAILING_COL = {
  dense: "w-8",
  default: "w-9",
};

/** Shared 3-column rail — section and lecture rows use identical widths. */
export function CurriculumStatsRail({ dense = false, children, className = "" }) {
  return (
    <div
      className={[
        "grid shrink-0 grid-cols-3 items-end",
        dense ? `${CURRICULUM_RAIL_WIDTH.dense} gap-x-2.5` : `${CURRICULUM_RAIL_WIDTH.default} gap-x-3.5`,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}

export function CurriculumStatsHeader({ dense = false }) {
  const { t } = useTranslation();
  return (
    <CurriculumStatsRail dense={dense} className="items-center">
      <p className={`${LABEL} text-center`}>{t("workspace.curriculum.views")}</p>
      <p className={`${LABEL} text-center`}>{t("workspace.curriculum.avgWatch")}</p>
      <p className={`${LABEL} text-center`}>{t("workspace.curriculum.finish")}</p>
    </CurriculumStatsRail>
  );
}

function AnalyticsMetricCell({ value, label, dense = false }) {
  return (
    <div className="min-w-0 text-center">
      <p
        className={`truncate font-bold tabular-nums leading-none text-gray-900 dark:text-white ${
          dense ? "text-xs" : "text-sm"
        }`}
      >
        {value}
      </p>
      <p className={`mt-1 ${LABEL}`}>{label}</p>
    </div>
  );
}

function AnalyticsFinishCell({ finishRate, dense = false }) {
  const { t } = useTranslation();
  const safe = Math.max(0, Math.min(100, Math.round(Number(finishRate) || 0)));
  const tone = getFinishTone(safe);

  return (
    <div className="min-w-0">
      <p
        className={`truncate text-center font-bold tabular-nums leading-none ${tone.text} ${
          dense ? "text-[11px]" : "text-xs"
        }`}
      >
        {t("workspace.curriculum.finishPct", { percent: safe })}
      </p>
      <div className={`mx-auto mt-1.5 max-w-[4.5rem] overflow-hidden rounded-full ${tone.track} ${dense ? "h-1.5" : "h-2"}`}>
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${safe}%` }} />
      </div>
      <p className={`mt-1 text-center ${LABEL}`}>{t("workspace.curriculum.dropOff")}</p>
    </div>
  );
}

function LevelCompletionCell({ percent = 0, dense = false }) {
  const { t } = useTranslation();
  const safe = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const tone = getLevelTone(safe);

  return (
    <div className="min-w-0" title={t("workspace.curriculum.sectionFinishTitle")}>
      <div className="flex items-center justify-center gap-1">
        <div
          className={`overflow-hidden rounded-full ${tone.track} ${
            dense ? "h-2 w-[3.25rem]" : "h-2.5 w-[3.75rem]"
          }`}
        >
          <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${safe}%` }} />
        </div>
        <span
          className={`shrink-0 font-extrabold tabular-nums ${tone.text} ${
            dense ? "text-[11px]" : "text-xs"
          }`}
        >
          {safe}%
        </span>
      </div>
      <p className={`mt-1 text-center ${LABEL}`}>{t("workspace.curriculum.section")}</p>
    </div>
  );
}

export function LectureAnalyticsStrip({ stats, dense = false }) {
  const { t } = useTranslation();
  if (!stats) return null;

  return (
    <CurriculumStatsRail dense={dense}>
      <AnalyticsMetricCell value={stats.views ?? 0} label={t("workspace.curriculum.views")} dense={dense} />
      <AnalyticsMetricCell
        value={formatDetailedDuration(stats.avgWatchSeconds)}
        label={t("workspace.curriculum.avgWatch")}
        dense={dense}
      />
      <AnalyticsFinishCell finishRate={stats.finishRate} dense={dense} />
    </CurriculumStatsRail>
  );
}

export function SectionAnalyticsRail({
  percent = 0,
  lectureCount = 0,
  durationLabel = "",
  canReorder = false,
  dense = false,
}) {
  const { t } = useTranslation();
  return (
    <CurriculumStatsRail dense={dense}>
      <div className="col-span-2 min-w-0 pb-0.5 text-end">
        <div
          className={`flex flex-col items-end gap-0.5 text-gray-500 dark:text-gray-400 ${
            dense ? "text-[11px]" : "text-xs"
          }`}
        >
          {canReorder ? (
            <span className={`hidden sm:inline ${LABEL}`}>{t("workspace.curriculum.dragReorder")}</span>
          ) : null}
          <span className="whitespace-nowrap font-semibold tabular-nums">
            {t("workspace.curriculum.lectureCount", { count: lectureCount })}
            {durationLabel ? ` · ${durationLabel}` : ""}
          </span>
        </div>
      </div>
      <LevelCompletionCell percent={percent} dense={dense} />
    </CurriculumStatsRail>
  );
}

/** Fixed-width column for row menus / hover actions — keeps stats rail aligned. */
export function CurriculumTrailingColumn({ dense = false, children, className = "" }) {
  return (
    <div
      className={[
        "flex shrink-0 items-center justify-end",
        dense ? CURRICULUM_TRAILING_COL.dense : CURRICULUM_TRAILING_COL.default,
        className,
      ].join(" ")}
    >
      {children}
    </div>
  );
}
