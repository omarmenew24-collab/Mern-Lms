import { useState } from "react";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft } from "lucide-react";
import { useCreateTeachingRequest } from "../../api/teaching";
import { paths } from "../../config/paths";

const BecomeTeacherForm = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const [form, setForm] = useState({
    fullName: "", email: "", subject: "", bio: "",
    profilePicture: "", paymentMethod: "", portfolioLink: "", termsAccepted: false,
  });
  const { createteachingrequest, isPending } = useCreateTeachingRequest();

  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({ ...prev, [name]: type === "checkbox" ? checked : value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.termsAccepted) {
      toast.error(t("teachingApply.acceptTermsError"));
      return;
    }
    try {
      await createteachingrequest(form);
      navigate(paths.student);
    } catch {
      /* toast from useCreateTeachingRequest */
    }
  };

  const inputClass = "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 rtl-flip" /> {t("commonActions.back")}
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">{t("teachingApply.title")}</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">{t("teachingApply.subtitle")}</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-4">
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("teachingApply.fullName")}</label>
              <input type="text" name="fullName" value={form.fullName} onChange={handleChange} placeholder={t("teachingApply.fullNamePlaceholder")} className={inputClass} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("teachingApply.email")}</label>
              <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="you@example.com" className={inputClass} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("teachingApply.subject")}</label>
              <input type="text" name="subject" value={form.subject} onChange={handleChange} placeholder={t("teachingApply.subjectPlaceholder")} className={inputClass} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("teachingApply.bio")}</label>
              <textarea name="bio" value={form.bio} onChange={handleChange} placeholder={t("teachingApply.bioPlaceholder")} rows="3" className={`${inputClass} h-auto py-2`} required />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("teachingApply.profilePicture")}</label>
              <input type="text" name="profilePicture" value={form.profilePicture} onChange={handleChange} placeholder={t("teachingApply.profilePicturePlaceholder")} className={inputClass} />
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("teachingApply.paymentMethod")}</label>
              <select name="paymentMethod" value={form.paymentMethod} onChange={handleChange} className={inputClass} required>
                <option value="">{t("teachingApply.select")}</option>
                <option value="paypal">{t("teachingApply.paypal")}</option>
                <option value="bank">{t("teachingApply.bank")}</option>
                <option value="stripe">{t("teachingApply.stripe")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">{t("teachingApply.portfolio")}</label>
              <input type="text" name="portfolioLink" value={form.portfolioLink} onChange={handleChange} placeholder={t("teachingApply.portfolioPlaceholder")} className={inputClass} />
            </div>
            <div className="flex items-center gap-2">
              <input type="checkbox" name="termsAccepted" checked={form.termsAccepted} onChange={handleChange} className="w-4 h-4 rounded border-gray-300 text-brand-600 focus:ring-brand-500" required />
              <label className="text-xs text-gray-500 dark:text-gray-400">
                {t("teachingApply.terms")}
              </label>
            </div>
            <button type="submit" disabled={isPending} className="w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 disabled:opacity-50 transition-colors">
              {isPending ? t("teachingApply.submitting") : t("teachingApply.submit")}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
};

export default BecomeTeacherForm;
