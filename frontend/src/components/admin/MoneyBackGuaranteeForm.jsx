import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { useGetSiteSettings, usePatchSiteSettings } from "../../api/admin";

const inputClass =
  "w-full min-h-[2.5rem] px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500";

/**
 * Optional platform copy for “money-back” style trust messaging. Does not change refund rules;
 * refunds are configured in Refund policy.
 */
export default function MoneyBackGuaranteeForm() {
  const { t } = useTranslation();
  const { siteSettings, isLoading } = useGetSiteSettings();
  const { patchSiteSettings, isPending } = usePatchSiteSettings();
  const [form, setForm] = useState({
    moneyBackGuaranteeEnabled: false,
    moneyBackGuaranteeTitle: "",
    moneyBackGuaranteeBody: "",
    moneyBackGuaranteeLinkUrl: "",
  });

  useEffect(() => {
    if (!siteSettings) return;
    setForm({
      moneyBackGuaranteeEnabled: Boolean(siteSettings.moneyBackGuaranteeEnabled),
      moneyBackGuaranteeTitle: siteSettings.moneyBackGuaranteeTitle || "",
      moneyBackGuaranteeBody: siteSettings.moneyBackGuaranteeBody || "",
      moneyBackGuaranteeLinkUrl: siteSettings.moneyBackGuaranteeLinkUrl || "",
    });
  }, [siteSettings]);

  const save = async (e) => {
    e.preventDefault();
    await patchSiteSettings({
      moneyBackGuaranteeEnabled: form.moneyBackGuaranteeEnabled,
      moneyBackGuaranteeTitle: form.moneyBackGuaranteeTitle.trim(),
      moneyBackGuaranteeBody: form.moneyBackGuaranteeBody.trim(),
      moneyBackGuaranteeLinkUrl: form.moneyBackGuaranteeLinkUrl.trim(),
    });
  };

  if (isLoading) {
    return <div className="h-24 rounded-xl bg-gray-100 dark:bg-gray-800 animate-pulse" />;
  }

  return (
    <form onSubmit={save} className="space-y-5 max-w-xl">
      <p className="text-xs text-gray-500 dark:text-gray-400 leading-relaxed">
        {t("moneyBack.intro")}
      </p>

      <div className="flex items-center justify-between gap-4">
        <div>
          <p className="text-sm font-bold text-gray-900 dark:text-white">{t("moneyBack.show")}</p>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("moneyBack.offHint")}
          </p>
        </div>
        <button
          type="button"
          role="switch"
          aria-checked={form.moneyBackGuaranteeEnabled}
          onClick={() => setForm((f) => ({ ...f, moneyBackGuaranteeEnabled: !f.moneyBackGuaranteeEnabled }))}
          className={`relative h-7 w-12 rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-brand-500 ${
            form.moneyBackGuaranteeEnabled ? "bg-brand-600" : "bg-gray-300 dark:bg-gray-600"
          }`}
        >
          <span className={`toggle-thumb ${form.moneyBackGuaranteeEnabled ? "toggle-thumb-on" : "toggle-thumb-off"}`} />
        </button>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="mbg-title">
          {t("moneyBack.headline")}
        </label>
        <input
          id="mbg-title"
          type="text"
          className={inputClass}
          placeholder={t("moneyBack.headlinePlaceholder")}
          value={form.moneyBackGuaranteeTitle}
          onChange={(e) => setForm((f) => ({ ...f, moneyBackGuaranteeTitle: e.target.value }))}
          maxLength={120}
        />
        <p className="text-xs text-gray-500 mt-0.5">{t("moneyBack.emptyHint")}</p>
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="mbg-body">
          {t("moneyBack.policyShort")}
        </label>
        <textarea
          id="mbg-body"
          rows={4}
          className={inputClass}
          placeholder={t("moneyBack.policyPlaceholder")}
          value={form.moneyBackGuaranteeBody}
          onChange={(e) => setForm((f) => ({ ...f, moneyBackGuaranteeBody: e.target.value }))}
          maxLength={600}
        />
      </div>

      <div>
        <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5" htmlFor="mbg-link">
          {t("moneyBack.optionalLink")}
        </label>
        <input
          id="mbg-link"
          type="url"
          className={inputClass}
          placeholder="https://yoursite.com/refund-policy"
          value={form.moneyBackGuaranteeLinkUrl}
          onChange={(e) => setForm((f) => ({ ...f, moneyBackGuaranteeLinkUrl: e.target.value }))}
        />
        <p className="text-xs text-gray-500 mt-0.5">{t("moneyBack.linkHint")}</p>
      </div>

      <button
        type="submit"
        disabled={isPending}
        className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50"
      >
        {isPending ? t("commonActions.saving") : t("moneyBack.save")}
      </button>
    </form>
  );
}
