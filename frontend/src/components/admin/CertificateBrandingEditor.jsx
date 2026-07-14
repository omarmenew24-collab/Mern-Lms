import { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Award } from "lucide-react";
import { useGetSiteSettings, usePatchSiteSettings } from "../../api/admin";

const EMPTY = {
  certificateIssuerLegalName: "",
  certificateIssuerTagline: "",
  certificateLogoUrl: "",
  certificateSignatureImageUrl: "",
  certificateSignatoryName: "",
  certificateSignatoryTitle: "",
};

/**
 * Admin: PDF certificate issuer — legal name, logo URL, scanned signature image URL, signatory line.
 */
export default function CertificateBrandingEditor() {
  const { t } = useTranslation();
  const { siteSettings, isLoading } = useGetSiteSettings();
  const { patchSiteSettings, isPending } = usePatchSiteSettings();
  const [form, setForm] = useState(EMPTY);

  useEffect(() => {
    if (!siteSettings) return;
    setForm({
      certificateIssuerLegalName:
        typeof siteSettings.certificateIssuerLegalName === "string"
          ? siteSettings.certificateIssuerLegalName
          : "",
      certificateIssuerTagline:
        typeof siteSettings.certificateIssuerTagline === "string" ? siteSettings.certificateIssuerTagline : "",
      certificateLogoUrl: typeof siteSettings.certificateLogoUrl === "string" ? siteSettings.certificateLogoUrl : "",
      certificateSignatureImageUrl:
        typeof siteSettings.certificateSignatureImageUrl === "string"
          ? siteSettings.certificateSignatureImageUrl
          : "",
      certificateSignatoryName:
        typeof siteSettings.certificateSignatoryName === "string" ? siteSettings.certificateSignatoryName : "",
      certificateSignatoryTitle:
        typeof siteSettings.certificateSignatoryTitle === "string" ? siteSettings.certificateSignatoryTitle : "",
    });
  }, [siteSettings]);

  const set = (key, v) => setForm((f) => ({ ...f, [key]: v }));

  const input =
    "w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 text-gray-900 dark:text-white";

  return (
    <div
      id="certificate-branding"
      className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 scroll-mt-24"
    >
      <div className="flex items-start gap-3 mb-4">
        <div className="w-10 h-10 rounded-lg bg-amber-50 dark:bg-amber-950/40 flex items-center justify-center shrink-0">
          <Award className="w-5 h-5 text-amber-600 dark:text-amber-400" />
        </div>
        <div className="min-w-0 flex-1">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("workspace.certBranding.heading")}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">
            {t("workspace.certBranding.intro")}
          </p>
        </div>
      </div>

      {isLoading ? (
        <p className="text-sm text-gray-400">{t("workspace.certBranding.loading")}</p>
      ) : (
        <div className="space-y-4">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("workspace.certBranding.legalName")}
            </label>
            <input
              className={input}
              value={form.certificateIssuerLegalName}
              onChange={(e) => set("certificateIssuerLegalName", e.target.value)}
              placeholder={siteSettings?.siteDisplayName || t("workspace.certBranding.orgNamePlaceholder")}
              maxLength={160}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("workspace.certBranding.tagline")}
            </label>
            <input
              className={input}
              value={form.certificateIssuerTagline}
              onChange={(e) => set("certificateIssuerTagline", e.target.value)}
              placeholder={t("workspace.certBranding.taglinePlaceholder")}
              maxLength={240}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("workspace.certBranding.logoUrl")}
            </label>
            <input
              className={input}
              value={form.certificateLogoUrl}
              onChange={(e) => set("certificateLogoUrl", e.target.value)}
              placeholder="https://…"
              maxLength={500}
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
              {t("workspace.certBranding.signatureUrl")}
            </label>
            <input
              className={input}
              value={form.certificateSignatureImageUrl}
              onChange={(e) => set("certificateSignatureImageUrl", e.target.value)}
              placeholder={t("workspace.certBranding.signaturePlaceholder")}
              maxLength={500}
            />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("workspace.certBranding.signatoryName")}
              </label>
              <input
                className={input}
                value={form.certificateSignatoryName}
                onChange={(e) => set("certificateSignatoryName", e.target.value)}
                placeholder={t("workspace.certBranding.signatoryNamePlaceholder")}
                maxLength={120}
              />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1">
                {t("workspace.certBranding.signatoryTitle")}
              </label>
              <input
                className={input}
                value={form.certificateSignatoryTitle}
                onChange={(e) => set("certificateSignatoryTitle", e.target.value)}
                placeholder={t("workspace.certBranding.signatoryTitlePlaceholder")}
                maxLength={160}
              />
            </div>
          </div>
          <p className="text-[11px] text-gray-500 dark:text-gray-400">
            {t("workspace.certBranding.noteUses")}<code className="text-gray-700 dark:text-gray-300">PUBLIC_APP_URL</code>{t("workspace.certBranding.noteOr")}
            <code className="text-gray-700 dark:text-gray-300">FRONTEND_URL</code>{t("workspace.certBranding.noteServer")}{t("workspace.certBranding.noteBackend")}
            <code className="text-gray-700 dark:text-gray-300">.env</code>{t("workspace.certBranding.noteEnd")}
          </p>
          <button
            type="button"
            onClick={() => patchSiteSettings({ ...form })}
            disabled={isPending}
            className="inline-flex items-center justify-center rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
          >
            {isPending ? t("workspace.certBranding.savingShort") : t("workspace.certBranding.saveSettings")}
          </button>
        </div>
      )}
    </div>
  );
}
