import { useState, useRef, useEffect } from "react";
import { useNavigate, Link } from "react-router-dom";
import { Moon, Sun, LogOut, User, ChevronDown, LayoutTemplate, ShoppingCart, Bell } from "lucide-react";
import { useTranslation } from "react-i18next";
import { useUnreadNotificationCount } from "../../api/notifications";
import useCartStore from "../../store/cartStore";
import GoogleSignIn from "../GoogleSignIn";
import LanguageSwitcher from "../LanguageSwitcher";
import useUserStore from "../../store/userstore";
import { useDarkMode } from "../../store/darkmode";
import { useLogout } from "../../api/auth";
import { paths } from "../../config/paths";

const HeaderRightSide = () => {
  const { t } = useTranslation();
  const { darkMode, onToggleDarkMode } = useDarkMode();
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state.hasHydrated);
  const cartCount = useCartStore((s) => s.itemCount());
  const { data: notifUnread = 0 } = useUnreadNotificationCount();
  const { logout, isPending } = useLogout();
  const navigate = useNavigate();

  const handleClickProfile = () => {
    navigate(paths.profile);
    setOpen(false);
  };

  const handleClickAdminWorkspace = () => {
    navigate(paths.adminSettings);
    setOpen(false);
  };

  const handleClickNotifications = () => {
    navigate(paths.notifications);
    setOpen(false);
  };

  const handleLogout = async () => {
    try {
      await logout();
      setOpen(false);
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div className="flex items-center gap-1 sm:gap-2 md:shrink-0">
      <div className="hidden md:block">
        <LanguageSwitcher />
      </div>

      <button
        onClick={onToggleDarkMode}
        className="hidden md:inline-flex p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={darkMode ? t("nav.lightMode") : t("nav.darkMode")}
      >
        {darkMode ? <Sun className="w-5 h-5" /> : <Moon className="w-5 h-5" />}
      </button>

      <Link
        to={paths.cart}
        className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
        title={t("nav.cart")}
        aria-label={cartCount ? `${t("nav.cart")}, ${cartCount} items` : t("nav.cart")}
      >
        <ShoppingCart className="w-5 h-5" />
        {cartCount > 0 && (
          <span className="absolute -top-0.5 -end-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-brand-600 text-[10px] font-bold text-white">
            {cartCount > 9 ? "9+" : cartCount}
          </span>
        )}
      </Link>

      {user && hasHydrated && (
        <Link
          to={paths.notifications}
          className="relative p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          title={t("nav.notifications")}
          aria-label={
            notifUnread
              ? `${t("nav.notifications")}, ${notifUnread} unread`
              : t("nav.notifications")
          }
        >
          <Bell className="w-5 h-5" />
          {notifUnread > 0 && (
            <span className="absolute -top-0.5 -end-0.5 min-w-5 h-5 px-1 flex items-center justify-center rounded-full bg-gray-900 dark:bg-amber-500 text-[10px] font-bold text-white">
              {notifUnread > 9 ? "9+" : notifUnread}
            </span>
          )}
        </Link>
      )}

      {user && hasHydrated ? (
        <div className="relative hidden md:block" ref={dropdownRef}>
          <button
            onClick={() => setOpen(!open)}
            className="flex items-center gap-2 ps-1 pe-2 py-1 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
          >
            <img
              src={user.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff`}
              alt={user.name}
              className="w-8 h-8 rounded-full object-cover"
            />
            <ChevronDown className={`w-3.5 h-3.5 text-gray-400 transition-transform ${open ? "rotate-180" : ""}`} />
          </button>

          {open && (
            <div className="absolute end-0 top-full mt-2 w-56 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-950 shadow-xl py-1 animate-in fade-in slide-in-from-top-1 z-50">
              <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800">
                <p className="text-sm font-semibold text-gray-800 dark:text-gray-100 truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">
                  {user.email}
                </p>
                <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                  {user.role}
                </span>
              </div>

              <button
                onClick={handleClickProfile}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <User className="w-4 h-4" />
                {t("nav.editProfile")}
              </button>

              <button
                type="button"
                onClick={handleClickNotifications}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
              >
                <Bell className="w-4 h-4" />
                {t("nav.notifications")}
                {notifUnread > 0 && (
                  <span className="ms-auto text-[10px] font-bold bg-brand-600 text-white min-w-5 h-5 rounded-full flex items-center justify-center">
                    {notifUnread > 9 ? "9+" : notifUnread}
                  </span>
                )}
              </button>

              {user.role === "admin" && (
                <button
                  type="button"
                  onClick={handleClickAdminWorkspace}
                  className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-900 transition-colors"
                >
                  <LayoutTemplate className="w-4 h-4 text-violet-500" />
                  {t("nav.adminWorkspace")}
                </button>
              )}

              <button
                onClick={handleLogout}
                disabled={isPending}
                className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
              >
                <LogOut className="w-4 h-4" />
                {isPending ? t("nav.loggingOut") : t("nav.logout")}
              </button>
            </div>
          )}
        </div>
      ) : (
        <div className="hidden md:flex items-center gap-2">
          <GoogleSignIn />
          <button
            onClick={() => navigate("/login")}
            className="text-sm font-semibold text-gray-700 dark:text-gray-200 hover:text-brand-600 dark:hover:text-brand-400 transition-colors px-3 py-2"
          >
            {t("nav.login")}
          </button>
          <button
            onClick={() => navigate(paths.signUp)}
            className="text-sm font-semibold px-4 py-2 rounded-lg bg-brand-600 text-white hover:bg-brand-700 transition-colors"
          >
            {t("nav.signUp")}
          </button>
        </div>
      )}
    </div>
  );
};

export default HeaderRightSide;
