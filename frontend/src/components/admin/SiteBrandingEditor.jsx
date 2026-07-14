import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Sparkles } from "lucide-react";
import { useGetSiteSettings, usePatchSiteSettings } from "../../api/admin";

const EMPTY = {
  siteDisplayName: "",
  heroBadgeText: "",
  heroTitleLine1: "",
  heroTitleHighlight: "",
  heroSubtitle: "",
  heroImageUrl: "",
  heroPrimaryCtaLabel: "",
  heroSecondaryCtaLabel: "",
  heroTrustLine1: "",
  heroTrustLine2: "",
  heroTrustLine3: "",
  homePlatformStatsEnabled: true,
};

/**
 * Admin: site name (header), hero headline, CTAs, trust bullets, hero image URL.
 */
export default function SiteBrandingEditor() {
  const { t } = useTranslation();
  const { siteSettings, isLoading } = useGetSiteSettings();
  const { patchSiteSettings, isPending } = usePatchSiteSettings();
  const [form, setForm] = useState(EMPTY);
  const defaults = siteSettings?.defaultBranding || {};

  useEffect(() => {
    if (!siteSettings) return;
    setForm({
      siteDisplayName: typeof siteSettings.siteDisplayName === "string" ? siteSettings.siteDisplayName : "",
      heroBadgeText: typeof siteSettings.heroBadgeText === "string" ? siteSettings.heroBadgeText : "",
      heroTitleLine1: typeof siteSettings.heroTitleLine1 === "string" ? siteSettings.heroTitleLine1 : "",
      heroTitleHighlight: typeof siteSettings.heroTitleHighlight === "string" ? siteSettings.heroTitleHighlight : "",
      heroSubtitle: typeof siteSettings.heroSubtitle === "string" ? siteSettings.heroSubtitle : "",
      heroImageUrl: typeof siteSettings.heroImageUrl === "string" ? siteSettings.heroImageUrl : "",
      heroPrimaryCtaLabel: typeof siteSettings.heroPrimaryCtaLabel === "string" ? siteSettings.heroPrimaryCtaLabel : "",
      heroSecondaryCtaLabel:
        typeof siteSettings.heroSecondaryCtaLabel === "string" ? siteSettings.heroSecondaryCtaLabel : "",
      heroTrustLine1: typeof siteSettings.heroTrustLine1 === "string" ? siteSettings.heroTrustLine1 : "",
      heroTrustLine2: typeof siteSettings.heroTrustLine2 === "string" ? siteSettings.heroTrustLine2 : "",
      heroTrustLine3: typeof siteSettings.heroTrustLine3 === "string" ? siteSettings.heroTrustLine3 : "",
      homePlatformStatsEnabled: siteSettings.homePlatformStatsEnabled !== false,
    });
  }, [siteSettings]);

  const set = (key, v) => setForm((f) => ({ ...f, [key]: v }));

  const onSave = async () => {
    await patchSiteSettings({ ...form });
  };

  const input =
    "w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white";

  return (
    <div id="site-branding" className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 scroll-mt-24">
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-brand-50 dark:bg-brand-950/40 flex items-center justify-center shrink-0">
          <Sparkles className="w-5 h-5 text-brand-600 dark:text-brand-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.siteBranding.heading")}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("workspace.siteBranding.intro")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">{t("workspace.siteBranding.loading")}</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1" htmlFor="site-name">
              {t("workspace.siteBranding.siteName")}
            </label>
            <input
              id="site-name"
              className={input}
              value={form.siteDisplayName}
              onChange={(e) => set("siteDisplayName", e.target.value)}
              placeholder={defaults.siteDisplayName || "CourseAcademy"}
              maxLength={48}
            />
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("workspace.siteBranding.heroBadge")}</label>
              <input
                className={input}
                value={form.heroBadgeText}
                onChange={(e) => set("heroBadgeText", e.target.value)}
                placeholder={defaults.heroBadgeText}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("workspace.siteBranding.heroImageUrl")}
              </label>
              <input
                className={input}
                value={form.heroImageUrl}
                onChange={(e) => set("heroImageUrl", e.target.value)}
                placeholder={(defaults.heroImageUrl && defaults.heroImageUrl.slice(0, 56) + "…") || "https://…"}
                maxLength={500}
              />
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("workspace.siteBranding.headlineBefore")}
              </label>
              <input
                className={input}
                value={form.heroTitleLine1}
                onChange={(e) => set("heroTitleLine1", e.target.value)}
                placeholder={defaults.heroTitleLine1}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("workspace.siteBranding.accentWords")}
              </label>
              <input
                className={input}
                value={form.heroTitleHighlight}
                onChange={(e) => set("heroTitleHighlight", e.target.value)}
                placeholder={defaults.heroTitleHighlight}
                maxLength={80}
              />
            </div>
          </div>

          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("workspace.siteBranding.subtitle")}</label>
            <textarea
              className={`${input} min-h-[72px]`}
              value={form.heroSubtitle}
              onChange={(e) => set("heroSubtitle", e.target.value)}
              placeholder={defaults.heroSubtitle}
              maxLength={600}
              rows={3}
            />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">{t("workspace.siteBranding.primaryButton")}</label>
              <input
                className={input}
                value={form.heroPrimaryCtaLabel}
                onChange={(e) => set("heroPrimaryCtaLabel", e.target.value)}
                placeholder={defaults.heroPrimaryCtaLabel}
                maxLength={40}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("workspace.siteBranding.secondaryButton")}
              </label>
              <input
                className={input}
                value={form.heroSecondaryCtaLabel}
                onChange={(e) => set("heroSecondaryCtaLabel", e.target.value)}
                placeholder={defaults.heroSecondaryCtaLabel}
                maxLength={40}
              />
            </div>
          </div>

          <div>
            <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t("workspace.siteBranding.trustRow")}</p>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
              {["heroTrustLine1", "heroTrustLine2", "heroTrustLine3"].map((key) => (
                <input
                  key={key}
                  className={input}
                  value={form[key] || ""}
                  onChange={(e) => set(key, e.target.value)}
                  placeholder={defaults[key] || ""}
                  maxLength={80}
                />
              ))}
            </div>
          </div>

          <label className="flex cursor-pointer items-start gap-3 rounded-lg border border-gray-200 bg-gray-50/80 p-3 dark:border-gray-700 dark:bg-gray-800/50">
            <input
              type="checkbox"
              className="mt-0.5 h-4 w-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500"
              checked={form.homePlatformStatsEnabled}
              onChange={(e) => set("homePlatformStatsEnabled", e.target.checked)}
            />
            <span>
              <span className="block text-sm font-semibold text-gray-900 dark:text-white">{t("workspace.siteBranding.statsLabel")}</span>
              <span className="mt-0.5 block text-xs text-gray-500 dark:text-gray-400">
                {t("workspace.siteBranding.statsDesc")}
              </span>
            </span>
          </label>

          <button
            type="button"
            onClick={() => onSave()}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? t("workspace.siteBranding.savingShort") : t("workspace.siteBranding.saveBranding")}
          </button>
        </div>
      )}
    </div>
  );
}
