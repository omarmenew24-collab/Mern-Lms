import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetSiteSettings, usePatchSiteSettings } from "../../api/admin";

const inputClass =
  "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500";

/**
 * Platform refund policy (admin). `refundPercent` caps how much of the price a single refund can return (1–100%).
 */
export default function RefundPolicyForm() {
  const { t } = useTranslation();
  const { siteSettings, isLoading } = useGetSiteSettings();
  const { patchSiteSettings, isPending } = usePatchSiteSettings();
  const [form, setForm] = useState({
    refundsEnabled: false,
    refundWindowDays: 14,
    maxCompletionPercentForRefund: 20,
    refundPercent: 100,
    refundAutoApprove: false,
    refundReasonRequired: true,
  });

  useEffect(() => {
    if (!siteSettings) return;
    setForm({
      refundsEnabled: Boolean(siteSettings.refundsEnabled),
      refundWindowDays: siteSettings.refundWindowDays ?? 14,
      maxCompletionPercentForRefund: siteSettings.maxCompletionPercentForRefund ?? 20,
      refundPercent: siteSettings.refundPercent ?? 100,
      refundAutoApprove: Boolean(siteSettings.refundAutoApprove),
      refundReasonRequired: siteSettings.refundReasonRequired !== false,
    });
  }, [siteSettings]);

  const save = async (e) => {
    e.preventDefault();
    await patchSiteSettings({
      refundsEnabled: form.refundsEnabled,
      refundWindowDays: Number(form.refundWindowDays),
      maxCompletionPercentForRefund: Number(form.maxCompletionPercentForRefund),
      refundPercent: Math.min(100, Math.max(1, Number(form.refundPercent) || 100)),
      refundAutoApprove: form.refundAutoApprove,
      refundReasonRequired: form.refundReasonRequired,
    });
  };

  if (isLoading) {
    return <div className="h-32 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return (
    <form onSubmit={save} className="space-y-6 max-w-xl">
      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t("refundPolicy.enabled", "Refunds enabled")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("refundPolicy.enabledHint", "When off, students cannot request refunds and eligibility checks return disabled.")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.refundsEnabled}
          onClick={() => setForm((f) => ({ ...f, refundsEnabled: !f.refundsEnabled }))}
          className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            form.refundsEnabled ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span className={`toggle-thumb ${form.refundsEnabled ? "toggle-thumb-on" : "toggle-thumb-off"}`} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="refundWindowDays">
          Refund window (days)
        </label>
        <input
          id="refundWindowDays"
          type="number"
          min={1}
          max={365}
          className={inputClass}
          value={form.refundWindowDays}
          onChange={(e) => setForm((f) => ({ ...f, refundWindowDays: e.target.value }))}
        />
      </div>

      <div>
        <label
          className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5"
          htmlFor="maxCompletionPercentForRefund"
        >
          Max course completion for eligibility (%)
        </label>
        <input
          id="maxCompletionPercentForRefund"
          type="number"
          min={0}
          max={100}
          className={inputClass}
          value={form.maxCompletionPercentForRefund}
          onChange={(e) => setForm((f) => ({ ...f, maxCompletionPercentForRefund: e.target.value }))}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Students who completed more than this share of the course are not eligible.
        </p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="refundPercentMax">
          Max refund per request (% of purchase price)
        </label>
        <input
          id="refundPercentMax"
          type="number"
          min={1}
          max={100}
          className={inputClass}
          value={form.refundPercent}
          onChange={(e) => setForm((f) => ({ ...f, refundPercent: e.target.value }))}
        />
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-1">
          Students and admins cannot request more than this share in a single refund. Use 100% for “up to full
          refund” or a lower cap to allow only partial refunds.
        </p>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t("refundPolicy.autoApprove", "Automatic approval")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("refundPolicy.autoApproveHint", "If on, eligible requests go straight to payment refund without admin review.")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.refundAutoApprove}
          onClick={() => setForm((f) => ({ ...f, refundAutoApprove: !f.refundAutoApprove }))}
          className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            form.refundAutoApprove ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span className={`toggle-thumb ${form.refundAutoApprove ? "toggle-thumb-on" : "toggle-thumb-off"}`} />
        </button>
      </div>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t("refundPolicy.requireReason", "Require a reason")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("refundPolicy.requireReasonHint", "When on, students must type a reason when requesting a refund.")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.refundReasonRequired}
          onClick={() => setForm((f) => ({ ...f, refundReasonRequired: !f.refundReasonRequired }))}
          className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            form.refundReasonRequired ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span className={`toggle-thumb ${form.refundReasonRequired ? "toggle-thumb-on" : "toggle-thumb-off"}`} />
        </button>
      </div>

      <div className="pt-2">
        <button
          type="submit"
          disabled={isPending}
          className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
        >
          {isPending ? t("commonActions.saving") : t("refundPolicy.savePolicy", "Save policy")}
        </button>
      </div>
    </form>
  );
}
