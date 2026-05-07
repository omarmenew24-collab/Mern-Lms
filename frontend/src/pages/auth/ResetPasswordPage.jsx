import { useState } from "react";
import { Link, useNavigate, useSearchParams } from "react-router-dom";
import { ArrowLeft, KeyRound } from "lucide-react";
import toast from "react-hot-toast";
import { axiosInstance } from "../../lib/axios";
import { paths } from "../../config/paths";
import PasswordInput from "../../components/auth/PasswordInput";
import useUserStore from "../../store/userstore";
import { useAuthStore } from "../../store/useauthstore";
import { useTranslation } from "react-i18next";

export default function ResetPasswordPage() {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const token = searchParams.get("token") || "";

  const [password, setPassword] = useState("");
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!token) {
      toast.error(t("auth.reset.invalidLink"));
      return;
    }
    if (password.length < 6) {
      toast.error(t("auth.reset.minPassword"));
      return;
    }
    if (password !== confirm) {
      toast.error(t("auth.reset.mismatch"));
      return;
    }
    setLoading(true);
    try {
      const res = await axiosInstance.post("/reset-password", { token, password });
      toast.success(res.data?.message || t("auth.reset.updated"));
      try {
        await axiosInstance.post("/logout", {});
      } catch {
        /* sessions already cleared server-side; cookie may be gone */
      }
      useUserStore.getState().clearUser();
      useAuthStore.getState().clearAuth();
      navigate(paths.login, { replace: true });
    } catch (err) {
      toast.error(err.response?.data?.message || t("auth.reset.resetError"));
    } finally {
      setLoading(false);
    }
  };

  if (!token) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
        <div className="w-full max-w-md text-center bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 shadow-sm">
          <p className="text-sm text-gray-600 dark:text-gray-300 mb-4">
            {t("auth.reset.invalidScreen")}
          </p>
          <Link
            to={paths.forgotPassword}
            className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            {t("auth.reset.forgotPassword")}
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md">
        <button
          type="button"
          onClick={() => navigate(paths.login)}
          className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("auth.reset.backToLogin")}
        </button>

        <div className="text-center mb-8">
          <div className="mx-auto w-12 h-12 rounded-full bg-brand-50 dark:bg-brand-900/30 flex items-center justify-center mb-3">
            <KeyRound className="w-6 h-6 text-brand-600 dark:text-brand-400" />
          </div>
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t("auth.reset.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("auth.reset.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 space-y-5 shadow-sm"
          noValidate
        >
          <PasswordInput
            id="reset-password"
            name="password"
            label={t("auth.reset.newPassword")}
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            autoComplete="new-password"
            placeholder={t("auth.reset.newPasswordPlaceholder")}
          />
          <PasswordInput
            id="reset-confirm"
            name="confirm"
            label={t("auth.reset.confirmPassword")}
            value={confirm}
            onChange={(e) => setConfirm(e.target.value)}
            autoComplete="new-password"
            placeholder={t("auth.reset.confirmPasswordPlaceholder")}
          />
          <button
            type="submit"
            disabled={loading}
            className="w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {loading ? t("auth.reset.submitting") : t("auth.reset.submit")}
          </button>
        </form>
      </div>
    </div>
  );
}
