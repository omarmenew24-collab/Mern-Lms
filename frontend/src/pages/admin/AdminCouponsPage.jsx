import { useState, useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Link } from "react-router-dom";
import { Percent, ArrowLeft } from "lucide-react";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import { useAdminCoupons, useCreateCoupon, usePatchCoupon } from "../../api/coupon";

const emptyForm = () => ({
  code: "",
  description: "",
  discountType: "percent",
  value: "",
  maxRedemptions: "",
  validFrom: "",
  validUntil: "",
  courseIds: "",
  oncePerUser: true,
  active: true,
});

export default function AdminCouponsPage() {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { data: coupons = [], isLoading } = useAdminCoupons();
  const { mutateAsync: createCoupon, isPending: creating } = useCreateCoupon();
  const { mutateAsync: patchCoupon, isPending: patching } = usePatchCoupon();
  const [form, setForm] = useState(emptyForm);

  const sorted = useMemo(
    () => [...coupons].sort((a, b) => new Date(b.createdAt) - new Date(a.createdAt)),
    [coupons],
  );

  const parseCourseIds = (raw) => {
    if (!raw || !String(raw).trim()) return [];
    return String(raw)
      .split(/[,;\s]+/)
      .map((s) => s.trim())
      .filter(Boolean);
  };

  const onCreate = async (e) => {
    e.preventDefault();
    const value = Number(form.value);
    if (!Number.isFinite(value) || value < 0) return;
    await createCoupon({
      code: form.code,
      description: form.description,
      discountType: form.discountType,
      value,
      active: form.active,
      maxRedemptions: form.maxRedemptions === "" ? null : Number(form.maxRedemptions),
      validFrom: form.validFrom || null,
      validUntil: form.validUntil || null,
      courseIds: parseCourseIds(form.courseIds),
      oncePerUser: form.oncePerUser,
    });
    setForm(emptyForm());
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t("manualPaymentsAdmin.accessDenied")}</p>
      </div>
    );
  }

  return (
    <AccountSettingsLayout
      title={t("couponsAdmin.title")}
      subtitle={t("couponsAdmin.subtitle")}
      navItems={getAccountNavItems(user)}
    >
      <Link
        to={paths.admin}
        className="inline-flex items-center gap-1 text-sm text-gray-500 hover:text-gray-800 dark:hover:text-white mb-4"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        {t("commonActions.back")}
      </Link>

      <div className="grid lg:grid-cols-2 gap-8">
        <form
          onSubmit={onCreate}
          className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4"
        >
          <h2 className="text-sm font-bold text-gray-900 dark:text-white flex items-center gap-2">
            <Percent className="w-4 h-4 text-brand-500" />
            {t("couponsAdmin.createTitle")}
          </h2>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.code")}</label>
            <input
              required
              minLength={3}
              value={form.code}
              onChange={(e) => setForm((f) => ({ ...f, code: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm uppercase"
              placeholder="WELCOME10"
            />
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.description")}</label>
            <input
              value={form.description}
              onChange={(e) => setForm((f) => ({ ...f, description: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.discountType")}</label>
              <select
                value={form.discountType}
                onChange={(e) => setForm((f) => ({ ...f, discountType: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
              >
                <option value="percent">{t("couponsAdmin.percent")}</option>
                <option value="fixed">{t("couponsAdmin.fixed")}</option>
              </select>
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.value")}</label>
              <input
                required
                type="number"
                min="0"
                step={form.discountType === "percent" ? "1" : "0.01"}
                max={form.discountType === "percent" ? "100" : undefined}
                value={form.value}
                onChange={(e) => setForm((f) => ({ ...f, value: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.maxUses")}</label>
            <input
              type="number"
              min="1"
              value={form.maxRedemptions}
              onChange={(e) => setForm((f) => ({ ...f, maxRedemptions: e.target.value }))}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
            />
          </div>
          <div className="grid sm:grid-cols-2 gap-3">
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.validFrom")}</label>
              <input
                type="datetime-local"
                value={form.validFrom}
                onChange={(e) => setForm((f) => ({ ...f, validFrom: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
              />
            </div>
            <div>
              <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.validUntil")}</label>
              <input
                type="datetime-local"
                value={form.validUntil}
                onChange={(e) => setForm((f) => ({ ...f, validUntil: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm"
              />
            </div>
          </div>
          <div>
            <label className="block text-xs font-semibold text-gray-500 mb-1">{t("couponsAdmin.courseIds")}</label>
            <textarea
              rows={2}
              value={form.courseIds}
              onChange={(e) => setForm((f) => ({ ...f, courseIds: e.target.value }))}
              placeholder={t("couponsAdmin.courseIdsHint")}
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 bg-white dark:bg-gray-950 px-3 py-2 text-sm font-mono"
            />
            <p className="text-[11px] text-gray-400 mt-1">{t("couponsAdmin.courseIdsHint")}</p>
          </div>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.oncePerUser}
              onChange={(e) => setForm((f) => ({ ...f, oncePerUser: e.target.checked }))}
            />
            {t("couponsAdmin.oncePerUser")}
          </label>
          <label className="flex items-center gap-2 text-sm text-gray-700 dark:text-gray-300">
            <input
              type="checkbox"
              checked={form.active}
              onChange={(e) => setForm((f) => ({ ...f, active: e.target.checked }))}
            />
            {t("couponsAdmin.active")}
          </label>
          <button
            type="submit"
            disabled={creating}
            className="w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-bold hover:bg-brand-700 disabled:opacity-50"
          >
            {creating ? "…" : t("couponsAdmin.create")}
          </button>
        </form>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t("couponsAdmin.listTitle")}</h2>
          {isLoading ? (
            <p className="text-sm text-gray-500">{t("commonActions.loading")}</p>
          ) : sorted.length === 0 ? (
            <p className="text-sm text-gray-500">{t("couponsAdmin.empty")}</p>
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead>
                  <tr className="border-b border-gray-100 dark:border-gray-800 text-start">
                    <th className="pb-2 font-semibold text-gray-600 dark:text-gray-400">{t("couponsAdmin.code")}</th>
                    <th className="pb-2 font-semibold text-gray-600 dark:text-gray-400">{t("couponsAdmin.discountType")}</th>
                    <th className="pb-2 font-semibold text-gray-600 dark:text-gray-400">{t("couponsAdmin.uses")}</th>
                    <th className="pb-2 font-semibold text-gray-600 dark:text-gray-400">{t("couponsAdmin.status")}</th>
                    <th className="pb-2 w-24" />
                  </tr>
                </thead>
                <tbody>
                  {sorted.map((c) => (
                    <tr key={c._id} className="border-b border-gray-50 dark:border-gray-800/80">
                      <td className="py-2 font-mono font-semibold">{c.code}</td>
                      <td className="py-2 text-gray-600 dark:text-gray-300">
                        {c.discountType === "fixed" ? `$${c.value}` : `${c.value}%`}
                      </td>
                      <td className="py-2 text-gray-600 dark:text-gray-300">
                        {c.redeemedCount || 0}
                        {c.maxRedemptions != null ? ` / ${c.maxRedemptions}` : ""}
                      </td>
                      <td className="py-2">{c.active ? t("couponsAdmin.on") : t("couponsAdmin.off")}</td>
                      <td className="py-2 text-end">
                        <button
                          type="button"
                          disabled={patching}
                          onClick={() => patchCoupon({ id: c._id, payload: { active: !c.active } })}
                          className="text-xs font-bold text-brand-600 dark:text-brand-400 hover:underline disabled:opacity-50"
                        >
                          {t("couponsAdmin.toggle")}
                        </button>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </AccountSettingsLayout>
  );
}
