import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useRefundEligibility, useCreateRefundRequest, usePublicRefundPolicy } from "../../api/refunds";

/**
 * Shown to learners on the course workspace when they are not the instructor.
 */
export default function CourseRefundCard({ courseId }) {
  const { t, i18n } = useTranslation();
  const { data: el, isLoading, isError } = useRefundEligibility(courseId);
  const { data: publicPolicy } = usePublicRefundPolicy();
  const { mutateAsync: submit, isPending } = useCreateRefundRequest();
  const [reason, setReason] = useState("");
  const [requestedPercent, setRequestedPercent] = useState(100);

  useEffect(() => {
    if (isLoading || isError || !el) return;
    const policy = el.policy || publicPolicy;
    const maxPct = Math.min(100, Math.max(1, policy?.refundPercent ?? 100));
    setRequestedPercent(maxPct);
  }, [isLoading, isError, el, publicPolicy, courseId]);

  if (isLoading) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 animate-pulse h-24" />
    );
  }
  if (isError || !el) {
    return null;
  }

  const policy = el.policy || publicPolicy;
  const maxPct = Math.min(100, Math.max(1, policy?.refundPercent ?? 100));
  const hasExisting = el.existingRequest;
  const canSubmit = el.eligible && !hasExisting;
  const needReason = policy?.refundReasonRequired !== false;

  return (
    <div
      id="workspace-refund"
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 scroll-mt-20"
    >
      <h3 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t("refundsCard.title")}</h3>
      <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">
        {policy?.refundsEnabled
          ? t("refundsCard.policyEnabled", {
              days: new Intl.NumberFormat(i18n.language).format(policy.refundWindowDays),
              progress: new Intl.NumberFormat(i18n.language).format(policy.maxCompletionPercentForRefund),
            })
          : t("refundsCard.disabled")}
      </p>

      {el.progress != null && (
        <p className="text-xs text-gray-600 dark:text-gray-300 mb-2">
          {t("refundsCard.progress")} <span className="font-semibold">{new Intl.NumberFormat(i18n.language).format(el.progress)}%</span>
          {el.daysRemaining != null && el.daysRemaining > 0 && (
            <span className="ms-2">· {t("refundsCard.daysLeft", { count: new Intl.NumberFormat(i18n.language).format(el.daysRemaining) })}</span>
          )}
          {el.daysRemaining === 0 && <span className="ms-2 text-amber-600">· {t("refundsCard.windowEnded")}</span>}
        </p>
      )}

      {hasExisting && (
        <div className="rounded-lg bg-gray-50 dark:bg-gray-800/50 border border-gray-100 dark:border-gray-700 p-3 text-sm">
          <p className="font-medium text-gray-800 dark:text-gray-200">{t("refundsCard.existing")} {el.existingRequest.status}</p>
          {el.existingRequest.refundPercent != null && el.existingRequest.refundAmount != null && (
            <p className="text-xs text-gray-600 dark:text-gray-400 mt-0.5">
              {new Intl.NumberFormat(i18n.language).format(el.existingRequest.refundPercent)}% {t("refundsCard.ofPrice")} ({t("refundsCard.amountLabel")} {el.existingRequest.refundAmount})
            </p>
          )}
          {el.existingRequest.failureMessage && (
            <p className="text-xs text-red-600 dark:text-red-400 mt-1">{el.existingRequest.failureMessage}</p>
          )}
        </div>
      )}

      {!hasExisting && !el.eligible && el.reasonCodes?.length > 0 && (
        <ul className="text-xs text-gray-600 dark:text-gray-400 space-y-1 mb-2">
          {el.reasonCodes.map((c) => (
            <li key={c}>{t(`refundsCard.reasons.${c}`, c)}</li>
          ))}
        </ul>
      )}

      {canSubmit && (
        <form
          className="space-y-2 mt-2"
          onSubmit={async (e) => {
            e.preventDefault();
            if (needReason && !reason.trim()) return;
            const rp = Math.min(maxPct, Math.max(1, Math.round(Number(requestedPercent) || 1)));
            await submit({ courseId, reason: reason.trim(), refundPercent: rp });
            setReason("");
          }}
        >
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1" htmlFor="refund-pct">
              {t("refundsCard.amountPercent", { max: new Intl.NumberFormat(i18n.language).format(maxPct) })}
            </label>
            <input
              id="refund-pct"
              type="number"
              min={1}
              max={maxPct}
              className="w-32 h-9 px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
              value={requestedPercent}
              onChange={(e) => setRequestedPercent(e.target.value)}
            />
          </div>
          {needReason && (
            <textarea
              value={reason}
              onChange={(e) => setReason(e.target.value)}
              rows={3}
              placeholder={t("refundsCard.reasonPlaceholder")}
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            />
          )}
          <button
            type="submit"
            disabled={isPending || (needReason && !reason.trim())}
            className="px-4 py-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? t("refundsCard.submitting") : t("refundsCard.request")}
          </button>
        </form>
      )}
    </div>
  );
}
