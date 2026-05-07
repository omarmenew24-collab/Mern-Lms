import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import { Mail, ArrowLeft, RefreshCw } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { paths } from "../../config/paths";
import { useTranslation } from "react-i18next";

export default function VerifyEmailPendingPage() {
  const { t } = useTranslation();
  const location = useLocation();
  const navigate = useNavigate();
  const email = location.state?.email || "";
  const [resendEmail, setResendEmail] = useState(email);
  const [sending, setSending] = useState(false);

  const handleResend = async (e) => {
    e.preventDefault();
    const to = resendEmail.trim().toLowerCase();
    if (!to) {
      toast.error(t("auth.verifyPending.enterEmail"));
      return;
    }
    setSending(true);
    try {
      const res = await axiosInstance.post("/resend-verification", { email: to });
      toast.success(res.data?.message || t("auth.verifyPending.resendSuccess"));
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.verifyPending.resendError"));
    } finally {
      setSending(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(paths.signUp)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("auth.verifyPending.backToSignup")}
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center shadow-sm">
          <div className="mx-auto w-14 h-14 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-4">
            <Mail className="w-7 h-7 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-xl font-bold text-gray-900 dark:text-white">{t("auth.verifyPending.title")}</h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("auth.verifyPending.sentPrefix")}
            {email ? (
              <>
                {" "}
                {t("auth.verifyPending.sentTo")}{" "}
                <span className="font-medium text-gray-700 dark:text-gray-300">{email}</span>
              </>
            ) : (
              ` ${t("auth.verifyPending.sentFallback")}`
            )}
            {t("auth.verifyPending.sentSuffix")}{" "}
            <strong className="text-gray-800 dark:text-gray-200">{t("auth.verifyPending.verifyEmailStrong")}</strong>,{" "}
            {t("auth.verifyPending.sentSuffix2")}
          </p>
          <p className="mt-3 text-xs text-gray-500 dark:text-gray-500">
            {t("auth.verifyPending.spamHint")}
          </p>

          <form onSubmit={handleResend} className="mt-6 text-start space-y-3">
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400">
              {t("auth.verifyPending.resendLabel")}
            </label>
            <input
              type="email"
              value={resendEmail}
              onChange={(e) => setResendEmail(e.target.value)}
              placeholder={t("auth.verifyPending.emailPlaceholder")}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            />
            <button
              type="submit"
              disabled={sending}
              className="w-full h-10 flex items-center justify-center gap-2 rounded-lg bg-gray-100 dark:bg-gray-800 text-gray-800 dark:text-gray-200 text-sm font-semibold hover:bg-gray-200 dark:hover:bg-gray-700 disabled:opacity-50"
            >
              <RefreshCw className={`w-4 h-4 ${sending ? "animate-spin" : ""}`} />
              {sending ? t("auth.verifyPending.sending") : t("auth.verifyPending.resendButton")}
            </button>
          </form>

          <p className="mt-6 text-sm text-gray-500 dark:text-gray-400">
            {t("auth.verifyPending.alreadyVerified")}{" "}
            <Link to={paths.login} className="text-brand-600 dark:text-brand-400 font-medium hover:underline">
              {t("auth.verifyPending.goLogin")}
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
}
