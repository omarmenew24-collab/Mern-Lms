import { useTranslation } from "react-i18next";
import {
  CurriculumStatsRail,
  CurriculumTrailingColumn,
} from "./CurriculumAnalyticsMetrics";

const LABEL =
  "text-[9px] font-bold uppercase tracking-[0.12em] text-gray-400 dark:text-gray-500";

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

function getTypeTone(rate = 0) {
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
      <div
        className={`mx-auto mt-1.5 max-w-[4.5rem] overflow-hidden rounded-full ${tone.track} ${
          dense ? "h-1.5" : "h-2"
        }`}
      >
        <div className={`h-full rounded-full ${tone.bar}`} style={{ width: `${safe}%` }} />
      </div>
      <p className={`mt-1 text-center ${LABEL}`}>{t("workspace.curriculum.dropOff")}</p>
    </div>
  );
}

function TypeCompletionCell({ percent = 0, dense = false }) {
  const { t } = useTranslation();
  const safe = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  const tone = getTypeTone(safe);

  return (
    <div className="min-w-0" title={t("workspace.curriculum.groupFinishTitle")}>
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
      <p className={`mt-1 text-center ${LABEL}`}>{t("workspace.curriculum.group")}</p>
    </div>
  );
}

export function TaskStatsHeader({ dense = false }) {
  const { t } = useTranslation();
  return (
    <CurriculumStatsRail dense={dense} className="items-center">
      <p className={`${LABEL} text-center`}>{t("workspace.curriculum.turnedIn")}</p>
      <p className={`${LABEL} text-center`}>{t("workspace.curriculum.avgGrade")}</p>
      <p className={`${LABEL} text-center`}>{t("workspace.curriculum.finish")}</p>
    </CurriculumStatsRail>
  );
}

export function TaskAnalyticsStrip({ stats, dense = false }) {
  const { t } = useTranslation();
  if (!stats) return null;

  const avgGrade =
    stats.avgGrade != null && Number.isFinite(Number(stats.avgGrade))
      ? `${Math.round(Number(stats.avgGrade))}`
      : "—";

  return (
    <CurriculumStatsRail dense={dense}>
      <AnalyticsMetricCell
        value={stats.turnedInCount ?? 0}
        label={t("workspace.curriculum.turnedIn")}
        dense={dense}
      />
      <AnalyticsMetricCell value={avgGrade} label={t("workspace.curriculum.avgGrade")} dense={dense} />
      <AnalyticsFinishCell finishRate={stats.finishRate} dense={dense} />
    </CurriculumStatsRail>
  );
}

export function TaskTypeAnalyticsRail({ percent = 0, taskCount = 0, dense = false }) {
  const { t } = useTranslation();
  return (
    <CurriculumStatsRail dense={dense}>
      <div className="col-span-2 min-w-0 pb-0.5 text-end">
        <span
          className={`whitespace-nowrap font-semibold tabular-nums text-gray-500 dark:text-gray-400 ${
            dense ? "text-[11px]" : "text-xs"
          }`}
        >
          {t("workspace.curriculum.taskCount", { count: taskCount })}
        </span>
      </div>
      <TypeCompletionCell percent={percent} dense={dense} />
    </CurriculumStatsRail>
  );
}

export { CurriculumTrailingColumn as TaskTrailingColumn };
