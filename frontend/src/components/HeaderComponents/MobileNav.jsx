import { useEffect, useRef } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import {
  X,
  Home,
  LayoutDashboard,
  PlusCircle,
  Info,
  User,
  Bell,
  LayoutTemplate,
  LogOut,
  Moon,
  Sun,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import { useUnreadNotificationCount } from "../../api/notifications";
import { useDarkMode } from "../../store/darkmode";
import { useLogout } from "../../api/auth";
import { paths } from "../../config/paths";
import LanguageSwitcher from "../LanguageSwitcher";
import GoogleSignIn from "../GoogleSignIn";

const linkClass =
  "flex items-center gap-3 rounded-lg px-3 py-2.5 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors";

/**
 * Slide-in navigation drawer for mobile (< md). Surfaces the links and actions that the
 * desktop header keeps inline, which are otherwise unreachable on a phone.
 */
export default function MobileNav({ open, onClose }) {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const location = useLocation();
  const panelRef = useRef(null);

  const user = useUserStore((s) => s.user);
  const hasHydrated = useUserStore((s) => s.hasHydrated);
  const { data: notifUnread = 0 } = useUnreadNotificationCount();
  const { darkMode, onToggleDarkMode } = useDarkMode();
  const { logout, isPending } = useLogout();

  const dashboardPath =
    user?.role === "admin"
      ? paths.admin
      : user?.role === "teacher"
        ? paths.teacher
        : paths.student;

  const isOnMyPage =
    (user?.role === "student" && location.pathname.startsWith("/student")) ||
    (user?.role === "teacher" && location.pathname.startsWith("/teacher")) ||
    (user?.role === "admin" && location.pathname.startsWith("/admin"));

  // Close automatically whenever the route changes (every nav link navigates).
  useEffect(() => {
    if (open) onClose?.();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [location.pathname]);

  // Escape to close + lock body scroll while open.
  useEffect(() => {
    if (!open) return;
    const onKey = (e) => {
      if (e.key === "Escape") onClose?.();
    };
    window.addEventListener("keydown", onKey);
    const prevOverflow = document.body.style.overflow;
    document.body.style.overflow = "hidden";
    const focusTimer = window.setTimeout(() => panelRef.current?.focus(), 0);
    return () => {
      window.removeEventListener("keydown", onKey);
      document.body.style.overflow = prevOverflow;
      window.clearTimeout(focusTimer);
    };
  }, [open, onClose]);

  const go = (to) => {
    navigate(to);
    onClose?.();
  };

  const handleLogout = async () => {
    try {
      await logout();
      onClose?.();
      navigate("/");
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  return (
    <div
      className={`fixed inset-0 z-[70] md:hidden ${open ? "" : "pointer-events-none"}`}
      aria-hidden={!open}
    >
      {/* Backdrop */}
      <button
        type="button"
        aria-label={t("nav.closeMenu")}
        onClick={onClose}
        className={`absolute inset-0 bg-black/60 backdrop-blur-[1px] transition-opacity duration-200 ${
          open ? "opacity-100" : "opacity-0"
        }`}
        tabIndex={open ? 0 : -1}
      />

      {/* Panel */}
      <div
        ref={panelRef}
        tabIndex={-1}
        role="dialog"
        aria-modal="true"
        aria-label={t("nav.menu")}
        className={`drawer-panel ${
          open ? "drawer-panel-open" : ""
        } absolute inset-y-0 start-0 w-[82%] max-w-xs flex flex-col bg-white dark:bg-gray-950 border-e border-gray-200 dark:border-gray-800 shadow-2xl outline-none`}
      >
        {/* Header row */}
        <div className="flex items-center justify-between gap-2 px-4 h-16 shrink-0 border-b border-gray-100 dark:border-gray-800">
          <span className="text-lg font-extrabold tracking-tight text-brand-700 dark:text-brand-400">
            {t("nav.menu")}
          </span>
          <button
            type="button"
            onClick={onClose}
            aria-label={t("nav.closeMenu")}
            className="rounded-lg p-2 text-gray-500 hover:bg-gray-100 dark:hover:bg-gray-800 hover:text-gray-900 dark:hover:text-white transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <div className="flex-1 overflow-y-auto px-3 py-3">
          {/* User identity */}
          {user && hasHydrated && (
            <div className="mb-3 flex items-center gap-3 rounded-xl bg-gray-50 dark:bg-gray-900 px-3 py-3">
              <img
                src={
                  user.picture ||
                  `https://ui-avatars.com/api/?name=${encodeURIComponent(user.name)}&background=7c3aed&color=fff`
                }
                alt=""
                className="w-10 h-10 rounded-full object-cover shrink-0"
              />
              <div className="min-w-0">
                <p className="text-sm font-semibold text-gray-900 dark:text-white truncate">
                  {user.name}
                </p>
                <p className="text-xs text-gray-500 dark:text-gray-400 truncate">{user.email}</p>
                <span className="mt-1 inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded-full bg-brand-100 dark:bg-brand-900/40 text-brand-700 dark:text-brand-300">
                  {user.role}
                </span>
              </div>
            </div>
          )}

          {/* Primary navigation */}
          <nav className="space-y-0.5" aria-label={t("nav.menu")}>
            <button type="button" onClick={() => go(paths.home)} className={`${linkClass} w-full`}>
              <Home className="w-4 h-4 shrink-0 text-brand-500" />
              <span>{t("accountNav.home")}</span>
            </button>

            {user && (
              <button
                type="button"
                onClick={() => go(dashboardPath)}
                className={`${linkClass} w-full ${
                  isOnMyPage ? "text-brand-600 dark:text-brand-400 font-semibold" : ""
                }`}
              >
                <LayoutDashboard className="w-4 h-4 shrink-0 text-brand-500" />
                <span>{t("nav.myDashboard")}</span>
              </button>
            )}

            {(user?.role === "teacher" || user?.role === "admin") && (
              <button
                type="button"
                onClick={() => go(paths.teacherNewCourse)}
                className={`${linkClass} w-full`}
              >
                <PlusCircle className="w-4 h-4 shrink-0 text-brand-500" />
                <span>{t("nav.createCourse")}</span>
              </button>
            )}

            <Link to={paths.about} onClick={onClose} className={linkClass}>
              <Info className="w-4 h-4 shrink-0 text-brand-500" />
              <span>{t("nav.about")}</span>
            </Link>

            {user && hasHydrated && (
              <>
                <button
                  type="button"
                  onClick={() => go(paths.notifications)}
                  className={`${linkClass} w-full`}
                >
                  <Bell className="w-4 h-4 shrink-0 text-brand-500" />
                  <span>{t("nav.notifications")}</span>
                  {notifUnread > 0 && (
                    <span className="ms-auto text-[10px] font-bold bg-brand-600 text-white min-w-5 h-5 px-1 rounded-full flex items-center justify-center">
                      {notifUnread > 9 ? "9+" : notifUnread}
                    </span>
                  )}
                </button>

                <button
                  type="button"
                  onClick={() => go(paths.profile)}
                  className={`${linkClass} w-full`}
                >
                  <User className="w-4 h-4 shrink-0 text-brand-500" />
                  <span>{t("nav.editProfile")}</span>
                </button>

                {user.role === "admin" && (
                  <button
                    type="button"
                    onClick={() => go(paths.adminSettings)}
                    className={`${linkClass} w-full`}
                  >
                    <LayoutTemplate className="w-4 h-4 shrink-0 text-violet-500" />
                    <span>{t("nav.adminWorkspace")}</span>
                  </button>
                )}
              </>
            )}
          </nav>

          {/* Preferences */}
          <div className="my-3 border-t border-gray-100 dark:border-gray-800" />
          <div className="flex items-center justify-between gap-2 px-1">
            <LanguageSwitcher />
            <button
              type="button"
              onClick={onToggleDarkMode}
              className="inline-flex items-center gap-2 rounded-lg px-3 py-2 text-sm text-gray-600 dark:text-gray-300 hover:bg-gray-100 dark:hover:bg-gray-800 transition-colors"
            >
              {darkMode ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
              <span>{darkMode ? t("nav.lightMode") : t("nav.darkMode")}</span>
            </button>
          </div>
        </div>

        {/* Auth actions */}
        <div className="shrink-0 border-t border-gray-100 dark:border-gray-800 p-3">
          {user && hasHydrated ? (
            <button
              type="button"
              onClick={handleLogout}
              disabled={isPending}
              className="w-full flex items-center justify-center gap-2 rounded-lg px-4 py-2.5 text-sm font-semibold text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors disabled:opacity-50"
            >
              <LogOut className="w-4 h-4" />
              {isPending ? t("nav.loggingOut") : t("nav.logout")}
            </button>
          ) : (
            <div className="space-y-2">
              <div className="flex justify-center">
                <GoogleSignIn />
              </div>
              <div className="grid grid-cols-2 gap-2">
                <button
                  type="button"
                  onClick={() => go(paths.login)}
                  className="rounded-lg border border-gray-300 dark:border-gray-700 px-4 py-2.5 text-sm font-semibold text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 transition-colors"
                >
                  {t("nav.login")}
                </button>
                <button
                  type="button"
                  onClick={() => go(paths.signUp)}
                  className="rounded-lg bg-brand-600 px-4 py-2.5 text-sm font-semibold text-white hover:bg-brand-700 transition-colors"
                >
                  {t("nav.signUp")}
                </button>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
