import { useState } from "react";
import { Link, useNavigate } from "react-router-dom";
import { ArrowLeft, Mail } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { paths } from "../../config/paths";
import { useTranslation } from "react-i18next";

const inputClass =
  "w-full h-11 px-4 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

export default function ForgotPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    const trimmed = email.trim().toLowerCase();
    if (!trimmed) {
      toast.error(t("auth.forgot.emailRequired"));
      return;
    }
    setLoading(true);
    try {
      await axiosInstance.post("/forgot-password", { email: trimmed });
      setDone(true);
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.forgot.sendError"));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(paths.login)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("auth.forgot.backToLogin")}
        </button>

        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t("auth.forgot.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("auth.forgot.subtitle")}
          </p>
        </div>

        {done ? (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-center shadow-sm">
            <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 dark:bg-emerald-900/30 flex items-center justify-center mb-4">
              <Mail className="w-6 h-6 text-emerald-600 dark:text-emerald-400" />
            </div>
            <p className="text-sm text-gray-600 dark:text-gray-300">
              {t("auth.forgot.successHint")}
            </p>
            <Link
              to={paths.login}
              className="mt-6 inline-block text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
            >
              {t("auth.forgot.returnToLogin")}
            </Link>
          </div>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 space-y-5 shadow-sm"
            noValidate
          >
            <div>
              <label htmlFor="forgot-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
                {t("auth.forgot.email")}
              </label>
              <input
                id="forgot-email"
                type="email"
                autoComplete="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder={t("auth.forgot.emailPlaceholder")}
                className={inputClass}
                required
              />
            </div>
            <button
              type="submit"
              disabled={loading}
              className="w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading ? t("auth.forgot.sending") : t("auth.forgot.send")}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
