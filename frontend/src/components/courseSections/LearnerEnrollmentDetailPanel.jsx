import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ExternalLink, CheckCircle } from "lucide-react";
import { paths } from "../../config/paths";
import { useFormatter } from "../../lib/i18nFormatters";

/**
 * Staff-facing learner summary. Typography matches roster / dashboard cards.
 */
export default function LearnerEnrollmentDetailPanel({
  snapshot,
  omitCourseHeading = false,
  suppressProgress = false,
}) {
  const { t } = useTranslation();
  const { date } = useFormatter();
  const fmtDate = (iso) => (iso ? date(iso) : "—");

  if (!snapshot) {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("workspace.learnerPanel.unavailable")}
      </p>
    );
  }

  const purchaseLabel = snapshot.purchaseRecorded
    ? fmtDate(snapshot.purchaseDate)
    : snapshot.enrollmentDate
      ? t("workspace.learnerPanel.noPurchase", { date: fmtDate(snapshot.enrollmentDate) })
      : "—";

  const instructorLink =
    snapshot.instructorId != null ? paths.userPublic(snapshot.instructorId) : null;
  const catalogHref =
    snapshot.courseId != null ? paths.course(snapshot.courseId) : snapshot.coursePublicPath;

  const visitCount =
    typeof snapshot.workspaceVisitCount === "number" ? snapshot.workspaceVisitCount : 0;

  return (
    <div className="text-sm space-y-3">
      {!suppressProgress && typeof snapshot.completionPercent === "number" ? (
        <div>
          <div className="flex justify-between items-center mb-1">
            <span className="text-[10px] font-bold uppercase tracking-wider text-gray-400">
              {t("workspace.learnerPanel.completion")}
            </span>
            <span className="text-xs font-bold text-gray-800 dark:text-white tabular-nums">
              {snapshot.completionPercent}%
            </span>
          </div>
          <div className="w-full bg-gray-200 dark:bg-gray-700 rounded-full h-1.5 overflow-hidden">
            <div
              className={`h-full rounded-full transition-all bg-brand-500 ${
                snapshot.completionPercent >= 100 ? "!bg-emerald-500" : ""
              }`}
              style={{
                width: `${Math.min(100, snapshot.completionPercent)}%`,
              }}
            />
          </div>
        </div>
      ) : null}

      <div className="grid gap-3 sm:grid-cols-2">
        {!omitCourseHeading ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
              {t("workspace.learnerPanel.course")}
            </p>
            <p className="font-medium text-gray-900 dark:text-white">
              {snapshot.courseTitle || "—"}
            </p>
          </div>
        ) : null}

        <div className={omitCourseHeading ? "sm:col-span-2" : ""}>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            {t("workspace.learnerPanel.instructor")}
          </p>
          <div className="text-gray-800 dark:text-gray-200 inline-flex flex-wrap items-center gap-2">
            <span>{snapshot.instructorName || "—"}</span>
            {instructorLink ? (
              <Link
                to={instructorLink}
                className="text-xs font-semibold text-brand-600 dark:text-brand-400 hover:underline inline-flex items-center gap-1"
              >
                {t("workspace.learnerPanel.profile")} <ExternalLink className="w-3 h-3" aria-hidden />
              </Link>
            ) : null}
          </div>
        </div>

        {catalogHref ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
              {t("workspace.learnerPanel.coursePage")}
            </p>
            <Link
              to={catalogHref}
              className="inline-flex items-center gap-1 text-brand-600 dark:text-brand-400 font-semibold hover:underline text-sm"
            >
              {t("workspace.learnerPanel.openCatalog")} <ExternalLink className="w-3.5 h-3.5" aria-hidden />
            </Link>
          </div>
        ) : null}

        {snapshot.studentName ? (
          <div className={!catalogHref ? "sm:col-span-2" : ""}>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
              {t("workspace.learnerPanel.learner")}
            </p>
            <div>
              <span className="font-medium text-gray-900 dark:text-white">
                {snapshot.studentName}
              </span>
              {snapshot.studentEmail ? (
                <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
                  {snapshot.studentEmail}
                </p>
              ) : null}
            </div>
          </div>
        ) : null}

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            {t("workspace.learnerPanel.purchaseDate")}
          </p>
          <p className="text-gray-800 dark:text-gray-100">{purchaseLabel}</p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            {t("workspace.learnerPanel.firstVisit")}
          </p>
          <p className="text-gray-800 dark:text-gray-100">
            {fmtDate(snapshot.firstCourseAccessAt)}
          </p>
        </div>

        <div>
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            {t("workspace.learnerPanel.workspaceVisits")}
          </p>
          <p className="text-gray-800 dark:text-gray-100">
            {t("workspace.learnerPanel.visitCount", { count: visitCount })}
          </p>
          <p className="text-[10px] text-gray-400 dark:text-gray-500 mt-1">
            {t("workspace.learnerPanel.visitsNote")}
          </p>
        </div>

        {suppressProgress ? (
          <div>
            <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
              {t("workspace.learnerPanel.completion")}
            </p>
            <p className="text-gray-800 dark:text-gray-100 tabular-nums">
              {typeof snapshot.completionPercent === "number"
                ? `${snapshot.completionPercent}%`
                : "—"}
            </p>
          </div>
        ) : null}

        <div className="sm:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            {t("workspace.learnerPanel.lastLesson")}
          </p>
          <p className="text-gray-800 dark:text-gray-100">{snapshot.lastLessonLabel || "—"}</p>
        </div>

        <div className="sm:col-span-2">
          <p className="text-[10px] font-bold uppercase tracking-wider text-gray-400 dark:text-gray-500 mb-0.5">
            {t("workspace.learnerPanel.refundAccepted")}
          </p>
          {snapshot.refundPolicyAcceptedAt != null ? (
            <span className="inline-flex items-center gap-1.5 text-emerald-700 dark:text-emerald-300 font-medium">
              <CheckCircle className="w-4 h-4 shrink-0" aria-hidden />{" "}
              {fmtDate(snapshot.refundPolicyAcceptedAt)}
            </span>
          ) : (
            <span className="text-gray-500 dark:text-gray-400">{t("workspace.learnerPanel.notRecorded")}</span>
          )}
        </div>
      </div>
    </div>
  );
}
