import { useState, useEffect, useRef } from "react";
import { useNavigate, useSearchParams } from "react-router-dom";
import { useLogin } from "../../api/auth";
import { paths } from "../../config/paths";
import PasswordInput from "../../components/auth/PasswordInput";
import { LogIn } from "lucide-react";
import toast from "react-hot-toast";
import { useTranslation } from "react-i18next";

const Login = () => {
  const { t } = useTranslation();
  const { login, isPending } = useLogin();
  const [formData, setFormData] = useState({ name: "", password: "" });
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();
  const verifyBannerHandled = useRef(false);

  useEffect(() => {
    const v = searchParams.get("verify");
    if (!v) {
      verifyBannerHandled.current = false;
      return;
    }
    if (!verifyBannerHandled.current) {
      verifyBannerHandled.current = true;
      if (v === "success") {
        toast.success(t("auth.login.verifySuccess"));
      } else if (v === "error") {
        toast.error(t("auth.login.verifyError"));
      }
    }
    const next = new URLSearchParams(searchParams);
    next.delete("verify");
    setSearchParams(next, { replace: true });
  }, [searchParams, setSearchParams, t]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      const data = await login(formData);
      const role = data?.userResponse?.role;
      if (role === "student") navigate("/student");
      else if (role === "teacher") navigate("/teacher");
      else navigate("/");
    } catch {
      /* error toast from useLogin */
    }
  };

  const inputClass =
    "w-full h-11 px-4 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t("auth.login.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("auth.login.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 space-y-5 shadow-sm"
          noValidate
        >
          <div>
            <label htmlFor="login-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("auth.login.fullName")}
            </label>
            <input
              type="text"
              id="login-name"
              name="name"
              autoComplete="username"
              placeholder={t("auth.login.fullNamePlaceholder")}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              className={inputClass}
              required
            />
          </div>

          <PasswordInput
            id="login-password"
            name="password"
            label={t("auth.login.password")}
            value={formData.password}
            onChange={(e) => setFormData({ ...formData, password: e.target.value })}
            autoComplete="current-password"
            placeholder={t("auth.login.passwordPlaceholder")}
          />

          <div className="flex justify-end -mt-1">
            <button
              type="button"
              onClick={() => navigate(paths.forgotPassword)}
              className="text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
            >
              {t("auth.login.forgotPassword")}
            </button>
          </div>

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <LogIn className="w-4 h-4" />
            {isPending ? t("auth.login.submitting") : t("auth.login.submit")}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t("auth.login.noAccount")}{" "}
            <button
              type="button"
              onClick={() => navigate(paths.signUp)}
              className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
            >
              {t("auth.login.goSignUp")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default Login;
