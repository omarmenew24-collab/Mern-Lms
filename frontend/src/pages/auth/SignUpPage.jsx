import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSignup } from "../../api/auth";
import { paths } from "../../config/paths";
import PasswordInput from "../../components/auth/PasswordInput";
import { UserPlus, ImagePlus } from "lucide-react";
import { useTranslation } from "react-i18next";

const SignUp = () => {
  const { t } = useTranslation();
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    password: "",
    confirmPassword: "",
  });
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const { signup, isPending } = useSignup();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.name.trim()) {
      toast.error(t("auth.signup.fullNameRequired"));
      return false;
    }
    if (!formData.email.trim()) {
      toast.error(t("auth.signup.emailRequired"));
      return false;
    }
    if (!formData.password) {
      toast.error(t("auth.signup.passwordRequired"));
      return false;
    }
    if (formData.password.length < 6) {
      toast.error(t("auth.signup.passwordMin"));
      return false;
    }
    if (formData.password !== formData.confirmPassword) {
      toast.error(t("auth.signup.passwordMismatch"));
      return false;
    }
    return true;
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validateForm()) return;
    try {
      const { confirmPassword: _c, ...payload } = formData;
      const newUser = await signup({
        ...payload,
        image: imageFile,
      });
      if (newUser?.needsVerification) {
        const msg =
          newUser.message ||
          t("auth.signup.verifySent", { email: newUser.email });
        toast.success(msg, { duration: 8000 });
        navigate(paths.verifyEmailPending, {
          replace: true,
          state: { email: newUser.email },
        });
        return;
      }
      if (newUser?.userResponse) {
        const role = newUser.userResponse.role;
        if (role === "student") navigate("/student");
        else if (role === "teacher") navigate("/teacher");
        else navigate("/");
      }
    } catch (error) {
      console.error("Signup navigation error:", error);
    }
  };

  const inputClass =
    "w-full h-11 px-4 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 dark:bg-gray-950 px-4 py-10">
      <div className="w-full max-w-md">
        <div className="text-center mb-8">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">
            {t("auth.signup.title")}
          </h1>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400">
            {t("auth.signup.subtitle")}
          </p>
        </div>

        <form
          onSubmit={handleSubmit}
          className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 space-y-5 shadow-sm"
          noValidate
        >
          <div className="flex flex-col items-center gap-3">
            <label className="cursor-pointer group">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt=""
                  className="w-20 h-20 rounded-full object-cover ring-2 ring-brand-500 ring-offset-2 dark:ring-offset-gray-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-full bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 transition-colors">
                  <ImagePlus className="w-6 h-6 text-gray-400 group-hover:text-brand-500 transition-colors" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            <span className="text-xs text-gray-500 dark:text-gray-400">{t("auth.signup.profilePhotoOptional")}</span>
          </div>

          <div>
            <label htmlFor="signup-name" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("auth.signup.fullName")}
            </label>
            <input
              id="signup-name"
              type="text"
              name="name"
              autoComplete="name"
              value={formData.name}
              onChange={handleChange}
              className={inputClass}
              placeholder={t("auth.signup.fullNamePlaceholder")}
              required
            />
          </div>

          <div>
            <label htmlFor="signup-email" className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1.5">
              {t("auth.signup.email")}
            </label>
            <input
              id="signup-email"
              type="email"
              name="email"
              autoComplete="email"
              value={formData.email}
              onChange={handleChange}
              className={inputClass}
              placeholder={t("auth.signup.emailPlaceholder")}
              required
            />
          </div>

          <div className="space-y-1">
            <PasswordInput
              id="signup-password"
              name="password"
              label={t("auth.signup.password")}
              value={formData.password}
              onChange={handleChange}
              autoComplete="new-password"
              placeholder={t("auth.signup.passwordPlaceholder")}
            />
            <p className="text-xs text-gray-500 dark:text-gray-400 ps-0.5">{t("auth.signup.passwordHint")}</p>
          </div>

          <PasswordInput
            id="signup-confirm"
            name="confirmPassword"
            label={t("auth.signup.confirmPassword")}
            value={formData.confirmPassword}
            onChange={handleChange}
            autoComplete="new-password"
            placeholder={t("auth.signup.confirmPasswordPlaceholder")}
          />

          <button
            type="submit"
            disabled={isPending}
            className="w-full h-11 flex items-center justify-center gap-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            <UserPlus className="w-4 h-4" />
            {isPending ? t("auth.signup.submitting") : t("auth.signup.submit")}
          </button>

          <p className="text-center text-sm text-gray-500 dark:text-gray-400">
            {t("auth.signup.haveAccount")}{" "}
            <button
              type="button"
              onClick={() => navigate("/login")}
              className="text-brand-600 dark:text-brand-400 font-medium hover:underline"
            >
              {t("auth.signup.goLogin")}
            </button>
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;
