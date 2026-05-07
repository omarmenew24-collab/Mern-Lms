import { NavLink } from "react-router-dom";
import { ShoppingBag } from "lucide-react";
import { useTranslation } from "react-i18next";
import { paths } from "../../config/paths";
import useCartStore from "../../store/cartStore";
import AccountNotificationsPanel from "./AccountNotificationsPanel";

/**
 * Account area: narrow sidebar (same card pattern as course / catalog) + main column.
 */
export default function AccountSettingsLayout({ title, subtitle, navItems, children }) {
  const { t } = useTranslation();
  const cartCount = useCartStore((s) => s.itemCount());

  return (
    <div className="min-h-[calc(100vh-4rem)] bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <header className="mb-5 sm:mb-6">
          <h1 className="text-xl sm:text-2xl font-semibold text-gray-900 dark:text-white tracking-tight">
            {title}
          </h1>
          {subtitle ? (
            <p className="mt-1.5 text-sm text-gray-600 dark:text-gray-400 leading-relaxed max-w-2xl">
              {subtitle}
            </p>
          ) : null}
        </header>

        <div className="flex flex-col md:flex-row gap-5 md:gap-6 md:items-start">
          <aside
            className="w-full md:w-52 shrink-0"
            aria-label={t("profile.accountAria")}
          >
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm p-2.5 space-y-1">
              <nav className="space-y-0.5" role="navigation">
                {navItems.map((item) => {
                  const Icon = item.icon;
                  return (
                    <NavLink
                      key={item.to + (item.end ? "-end" : "")}
                      to={item.to}
                      end={item.end}
                      className={({ isActive }) =>
                        [
                          "flex items-center gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium leading-tight transition-colors",
                          isActive
                            ? "bg-brand-600 text-white"
                            : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80",
                        ].join(" ")
                      }
                    >
                      {Icon ? <Icon className="h-3.5 w-3.5 shrink-0 opacity-90" aria-hidden /> : null}
                      <span className="min-w-0 break-words">{item.label}</span>
                    </NavLink>
                  );
                })}
              </nav>

              <div className="border-t border-gray-100 dark:border-gray-800 pt-1.5 mt-1.5" />

              <NavLink
                to={paths.cart}
                end
                className={({ isActive }) =>
                  [
                    "flex items-center justify-between gap-2 rounded-lg px-2.5 py-2 text-[13px] font-medium transition-colors",
                    isActive
                      ? "bg-brand-50 dark:bg-brand-950/40 text-brand-800 dark:text-brand-200"
                      : "text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800/80",
                  ].join(" ")
                }
              >
                <span className="flex items-center gap-2 min-w-0">
                  <ShoppingBag className="h-3.5 w-3.5 shrink-0" aria-hidden />
                  <span>{t("nav.cart")}</span>
                </span>
                {cartCount > 0 && (
                  <span className="shrink-0 min-w-5 h-5 flex items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
                    {cartCount > 9 ? "9+" : cartCount}
                  </span>
                )}
              </NavLink>
            </div>

            <div className="mt-3">
              <AccountNotificationsPanel />
            </div>
          </aside>

          <main className="flex-1 min-w-0 min-h-[8rem]">{children}</main>
        </div>
      </div>
    </div>
  );
}
