import { useEffect, useState } from "react";
import { useParams, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { CheckCircle, XCircle, ShieldAlert } from "lucide-react";
import { axiosInstance } from "../lib/axios";
import { paths } from "../config/paths";
import { useFormatter } from "../lib/i18nFormatters";

export default function CertificateVerifyPage() {
  const { t } = useTranslation();
  const { date } = useFormatter();
  const { code } = useParams();
  const [state, setState] = useState({ loading: true, data: null, error: null });

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const res = await axiosInstance.get(`/public/certificate-verify/${encodeURIComponent(code || "")}`);
        if (!cancelled) setState({ loading: false, data: res.data, error: null });
      } catch (e) {
        if (!cancelled) setState({ loading: false, data: null, error: e });
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [code]);

  if (state.loading) {
    return (
      <div className="mx-auto max-w-lg px-6 py-24 text-center text-gray-500 dark:text-gray-400">
        {t("workspace.certVerify.verifying")}
      </div>
    );
  }

  if (state.error || !state.data) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <XCircle className="mx-auto h-14 w-14 text-rose-500 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("workspace.certVerify.unavailable")}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">{t("workspace.certVerify.tryLater")}</p>
        <Link to={paths.home} className="mt-6 inline-block text-sm font-semibold text-brand-600 dark:text-brand-400">
          {t("workspace.certVerify.home")}
        </Link>
      </div>
    );
  }

  const d = state.data;

  if (!d.valid) {
    return (
      <div className="mx-auto max-w-lg px-6 py-16 text-center">
        <XCircle className="mx-auto h-14 w-14 text-gray-400 mb-4" />
        <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("workspace.certVerify.notFound")}</h1>
        <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
          {t("workspace.certVerify.notFoundDesc")}
        </p>
        <Link to={paths.home} className="mt-6 inline-block text-sm font-semibold text-brand-600 dark:text-brand-400">
          {t("workspace.certVerify.home")}
        </Link>
      </div>
    );
  }

  const issued = d.issuedAt ? date(d.issuedAt, { dateStyle: "long" }) : "—";

  return (
    <div className="mx-auto max-w-lg px-6 py-12">
      <div className="rounded-2xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-lg p-8 text-center">
        {d.revoked ? (
          <>
            <ShieldAlert className="mx-auto h-14 w-14 text-amber-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("workspace.certVerify.revoked")}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t("workspace.certVerify.revokedDesc")}
            </p>
          </>
        ) : (
          <>
            <CheckCircle className="mx-auto h-14 w-14 text-emerald-500 mb-4" />
            <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("workspace.certVerify.verified")}</h1>
            <p className="mt-2 text-sm text-gray-600 dark:text-gray-400">
              {t("workspace.certVerify.verifiedDesc")}
            </p>
          </>
        )}

        <dl className="mt-8 space-y-3 text-start text-sm">
          <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            <dt className="text-gray-500 dark:text-gray-400">{t("workspace.certVerify.credentialId")}</dt>
            <dd className="font-mono font-semibold text-gray-900 dark:text-white">{d.certificateCode}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            <dt className="text-gray-500 dark:text-gray-400">{t("workspace.certVerify.recipient")}</dt>
            <dd className="font-medium text-gray-900 dark:text-white text-end">{d.studentName}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            <dt className="text-gray-500 dark:text-gray-400">{t("workspace.certVerify.course")}</dt>
            <dd className="font-medium text-gray-900 dark:text-white text-end">{d.courseTitle}</dd>
          </div>
          <div className="flex justify-between gap-4 border-b border-gray-100 dark:border-gray-800 pb-2">
            <dt className="text-gray-500 dark:text-gray-400">{t("workspace.certVerify.issued")}</dt>
            <dd className="text-gray-900 dark:text-white">{issued}</dd>
          </div>
          <div className="flex justify-between gap-4 pt-1">
            <dt className="text-gray-500 dark:text-gray-400">{t("workspace.certVerify.issuer")}</dt>
            <dd className="font-medium text-gray-900 dark:text-white text-end">{d.issuerLegalName}</dd>
          </div>
        </dl>

        <Link
          to={paths.home}
          className="mt-8 inline-block text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
        >
          {t("workspace.certVerify.backToHome")}
        </Link>
      </div>
    </div>
  );
}
