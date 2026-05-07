import { Link, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ShoppingBag, Trash2, CreditCard, ArrowRight } from "lucide-react";
import useUserStore from "../../store/userstore";
import useCartStore from "../../store/cartStore";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import { paths } from "../../config/paths";

const FALLBACK_IMG =
  "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='64' height='64'%3E%3Crect width='64' height='64' fill='%23f1f0fb'/%3E%3C/svg%3E";

function CartPage() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const items = useCartStore((s) => s.items);
  const removeItem = useCartStore((s) => s.removeItem);
  const navigate = useNavigate();

  const subtotal = items.reduce((sum, i) => sum + (Number.isFinite(i.price) ? i.price : 0), 0);
  const nav = getAccountNavItems(user);
  const money = (value) =>
    new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));
  const title = t("cart.title");
  const subtitle =
    items.length === 0
      ? t("cart.emptySubtitle")
      : t("cart.countSubtitle", { count: items.length });

  return (
    <AccountSettingsLayout title={title} subtitle={subtitle} navItems={nav}>
      {items.length === 0 ? (
        <div className="rounded-2xl border border-dashed border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/60 px-6 py-16 sm:px-10 text-center max-w-2xl mx-auto">
          <div className="inline-flex h-16 w-16 items-center justify-center rounded-2xl bg-gray-100 dark:bg-gray-800 mb-6">
            <ShoppingBag className="h-7 w-7 text-gray-400" aria-hidden />
          </div>
          <h2 className="text-lg font-semibold text-gray-900 dark:text-white">{t("cart.emptyTitle")}</h2>
          <p className="mt-2 text-sm text-gray-500 dark:text-gray-400 max-w-sm mx-auto leading-relaxed">
            {t("cart.emptyHint")}
          </p>
          <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center items-center">
            <Link
              to={paths.home}
              className="inline-flex items-center justify-center h-11 px-6 rounded-xl border border-gray-200 dark:border-gray-700 text-sm font-semibold text-gray-800 dark:text-gray-100 bg-white dark:bg-gray-800/80 hover:bg-gray-50 dark:hover:bg-gray-800"
            >
              {t("cart.backHome")}
            </Link>
            <Link
              to={paths.home}
              className="inline-flex items-center gap-2 justify-center h-11 px-6 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
            >
              {t("cart.browseCourses")}
              <ArrowRight className="h-4 w-4 rtl-flip" />
            </Link>
          </div>
        </div>
      ) : (
        <div className="space-y-8 max-w-3xl">
          <ul className="space-y-4" role="list">
            {items.map((it) => (
              <li
                key={it.courseId}
                className="flex flex-col sm:flex-row gap-4 sm:gap-6 p-4 sm:p-5 rounded-2xl border border-gray-200/90 dark:border-gray-800/90 bg-white dark:bg-gray-900/80 shadow-sm"
              >
                <div className="shrink-0 w-full sm:w-36 h-20 rounded-xl overflow-hidden bg-gray-100 dark:bg-gray-800 self-start">
                  <img
                    src={it.image || FALLBACK_IMG}
                    alt=""
                    className="w-full h-full object-cover"
                    onError={(e) => {
                      e.target.onerror = null;
                      e.target.src = FALLBACK_IMG;
                    }}
                  />
                </div>
                <div className="flex-1 min-w-0 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
                  <div className="min-w-0 space-y-1.5 pe-0 sm:pe-4">
                    <Link
                      to={paths.course(it.courseId)}
                      className="text-base font-semibold text-gray-900 dark:text-white hover:text-brand-600 dark:hover:text-brand-400 line-clamp-2 leading-snug"
                    >
                      {it.title}
                    </Link>
                    {it.listPrice != null && it.listPrice > (it.price ?? 0) + 0.001 && (
                      <p className="text-sm text-gray-400 line-through tabular-nums">
                        {money(it.listPrice)}
                      </p>
                    )}
                    <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                      {Number.isFinite(it.price) ? money(it.price) : "—"}
                    </p>
                  </div>
                  <div className="flex sm:flex-col gap-2 shrink-0 w-full sm:w-44 sm:items-stretch">
                    <button
                      type="button"
                      onClick={() => navigate(paths.checkoutCourse(it.courseId))}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl bg-gray-900 dark:bg-white text-white dark:text-gray-900 text-sm font-semibold hover:opacity-90"
                    >
                      <CreditCard className="h-4 w-4" />
                      {t("cart.checkout")}
                    </button>
                    <button
                      type="button"
                      onClick={() => removeItem(it.courseId)}
                      className="inline-flex items-center justify-center gap-2 h-10 px-4 rounded-xl border border-gray-200 dark:border-gray-700 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-800/60"
                    >
                      <Trash2 className="h-4 w-4" />
                      {t("cart.remove")}
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>

          <div className="rounded-2xl border border-gray-200/90 dark:border-gray-800 bg-gray-50/90 dark:bg-gray-900/50 p-5 sm:p-6 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest text-gray-400 dark:text-gray-500 mb-1.5">
                {t("cart.subtotal")}
              </p>
              <p className="text-2xl font-bold text-gray-900 dark:text-white tabular-nums">
                {money(subtotal)}
              </p>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 max-w-sm leading-relaxed">
                {t("cart.subtotalHint")}
              </p>
            </div>
            {items[0] && (
              <button
                type="button"
                onClick={() => navigate(paths.checkoutCourse(items[0].courseId))}
                className="w-full sm:w-auto shrink-0 inline-flex items-center justify-center h-12 px-8 rounded-xl bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
              >
                {t("cart.checkoutFirst")}
              </button>
            )}
          </div>
        </div>
      )}
    </AccountSettingsLayout>
  );
}

export default CartPage;
