import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ImagePlus, Save, AlertCircle, Link2, Plus, X } from "lucide-react";
import useUserStore from "../../store/userstore";
import { useUpdateUser } from "../../api/auth";

const inputClass =
  "w-full h-11 px-4 text-sm rounded-xl border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/80 focus:border-brand-500 transition-shadow";

/**
 * Profile fields + save — used on /profile and /admin/settings.
 * @param {string} [onSavedNavigateTo] — if set, navigate here after successful save (otherwise stay on page).
 */
export default function ProfileSettingsForm({ onSavedNavigateTo }) {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { updateuser, isPending } = useUpdateUser();
  const navigate = useNavigate();

  const [form, setForm] = useState({ name: "", email: "", picture: "" });
  const [publicAbout, setPublicAbout] = useState("");
  const [linkInputs, setLinkInputs] = useState([""]);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");

  useEffect(() => {
    if (user) {
      setForm({ name: user.name || "", email: user.email || "", picture: user.picture || "" });
      setImagePreview(user.picture || "");
      setPublicAbout(typeof user.publicAbout === "string" ? user.publicAbout : "");
      const links = Array.isArray(user.publicProjectLinks) ? user.publicProjectLinks : [];
      setLinkInputs(links.length ? [...links, ""] : [""]);
    }
  }, [user]);

  const handleChange = (e) => setForm((f) => ({ ...f, [e.target.name]: e.target.value }));

  const handleImageChange = (e) => {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : form.picture || "");
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;
    const publicProjectLinks = linkInputs
      .map((s) => s.trim())
      .filter(Boolean)
      .slice(0, 10);
    try {
      await updateuser({
        userId: user._id,
        updatedFields: {
          name: form.name,
          picture: form.picture,
          image: imageFile,
          publicAbout: publicAbout.trim(),
          publicProjectLinks,
        },
      });
      if (onSavedNavigateTo) navigate(onSavedNavigateTo);
    } catch (err) {
      console.error("Update failed:", err);
    }
  };

  if (!user) {
    return (
      <p className="text-sm text-gray-500 dark:text-gray-400">{t("profile.signInToEdit")}</p>
    );
  }

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800/90 bg-white dark:bg-gray-900/80 shadow-sm dark:shadow-none overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800/80">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("profile.photo")}</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {t("profile.photoHint")}
          </p>
          <div className="mt-4 flex flex-col sm:flex-row sm:items-center gap-4">
            <label className="cursor-pointer group inline-flex">
              {imagePreview ? (
                <img
                  src={imagePreview}
                  alt=""
                  className="w-20 h-20 rounded-2xl object-cover ring-2 ring-brand-500/30 ring-offset-2 dark:ring-offset-gray-900"
                />
              ) : (
                <div className="w-20 h-20 rounded-2xl bg-gray-100 dark:bg-gray-800 flex items-center justify-center group-hover:bg-brand-50 dark:group-hover:bg-brand-900/20 transition-colors">
                  <ImagePlus className="w-7 h-7 text-gray-400 group-hover:text-brand-500" />
                </div>
              )}
              <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
            </label>
            <div>
              <p className="text-sm font-medium text-gray-800 dark:text-gray-200">{t("profile.updatePicture")}</p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t("profile.imageHint")}</p>
            </div>
          </div>
        </div>

        <div className="p-5 sm:p-6 space-y-5">
          <div
            className="flex gap-3 p-3 rounded-xl border border-amber-200/80 dark:border-amber-800/50 bg-amber-50/80 dark:bg-amber-950/30 text-amber-900 dark:text-amber-200/90"
            role="status"
          >
            <AlertCircle className="w-5 h-5 shrink-0 text-amber-600 dark:text-amber-400 mt-0.5" />
            <p className="text-sm leading-relaxed">
              <span className="font-semibold">{t("profile.identityTitle")}</span>
              {t("profile.identityHint")}
            </p>
          </div>

          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              {t("profile.name")}
            </label>
            <input type="text" name="name" value={form.name} onChange={handleChange} className={inputClass} required />
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                {t("profile.email")}
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                className={`${inputClass} opacity-60 cursor-not-allowed`}
                disabled
                readOnly
              />
            </div>
            <div>
              <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
                {t("profile.pictureUrl")}
              </label>
              <input
                type="text"
                name="picture"
                value={form.picture}
                onChange={handleChange}
                placeholder="https://…"
                className={inputClass}
              />
            </div>
          </div>
        </div>
      </div>

      <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800/90 bg-white dark:bg-gray-900/80 shadow-sm dark:shadow-none overflow-hidden">
        <div className="p-5 sm:p-6 border-b border-gray-100 dark:border-gray-800/80">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("profile.publicProfile")}</h2>
          <p className="mt-0.5 text-xs text-gray-500 dark:text-gray-400">
            {user?.role === "student" ? t("profile.publicHintStudent") : t("profile.publicHintTeacher")}
          </p>
        </div>
        <div className="p-5 sm:p-6 space-y-4">
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-1.5">
              {t("profile.aboutYou")}
            </label>
            <textarea
              value={publicAbout}
              onChange={(e) => setPublicAbout(e.target.value.slice(0, 4000))}
              rows={5}
              className="w-full px-3 py-2.5 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500/80 min-h-[100px] resize-y"
              placeholder={t("profile.aboutPlaceholder")}
            />
            <p className="text-[10px] text-gray-400 text-end mt-0.5">{publicAbout.length}/4000</p>
          </div>
          <div>
            <label className="block text-xs font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-2">
              {t("profile.portfolioLinks")}
            </label>
            <div className="space-y-2">
              {linkInputs.map((val, i) => (
                <div key={i} className="flex gap-2">
                  <input
                    type="url"
                    value={val}
                    onChange={(e) => {
                      const next = [...linkInputs];
                      next[i] = e.target.value.slice(0, 500);
                      setLinkInputs(next);
                    }}
                    className="flex-1 h-10 px-3 text-sm rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-900"
                    placeholder="https://"
                  />
                  {linkInputs.length > 1 && (
                    <button
                      type="button"
                      onClick={() => setLinkInputs((rows) => rows.filter((_, j) => j !== i))}
                      className="p-2 rounded-lg text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
                      aria-label={t("profile.removeLink")}
                    >
                      <X className="w-4 h-4" />
                    </button>
                  )}
                </div>
              ))}
            </div>
            {linkInputs.length < 10 && (
              <button
                type="button"
                onClick={() => setLinkInputs((rows) => (rows.length < 10 ? [...rows, ""] : rows))}
                className="mt-2 inline-flex items-center gap-1 text-xs font-medium text-brand-600 dark:text-brand-400 hover:underline"
              >
                <Plus className="w-3.5 h-3.5" />
                {t("profile.addLink")}
              </button>
            )}
            <p className="mt-2 text-[10px] text-gray-500 dark:text-gray-400 flex items-center gap-1">
              <Link2 className="w-3 h-3" />
              {t("profile.linksHint")}
            </p>
          </div>
        </div>
      </div>

      <div className="flex flex-col-reverse sm:flex-row sm:items-center sm:justify-between gap-3 pt-1">
        <p className="text-xs text-gray-400 dark:text-gray-500">{t("profile.unsaved")}</p>
        <button
          type="submit"
          disabled={isPending}
          className="inline-flex items-center justify-center gap-2 min-h-11 px-6 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-bold hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed transition-opacity shadow-sm"
        >
          <Save className="w-4 h-4" />
          {isPending ? t("commonActions.saving") : t("profile.saveChanges")}
        </button>
      </div>
    </form>
  );
}
