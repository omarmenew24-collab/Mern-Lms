import { useMemo, useState } from "react";
import { Link, Navigate, useLocation, useSearchParams, useNavigate } from "react-router-dom";
import { Bell, CheckCheck, ChevronLeft, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import { paths } from "../../config/paths";
import {
  useNotificationsList,
  useMarkAllNotificationsRead,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useDeleteNotification,
} from "../../api/notifications";

function typeStyle(t) {
  switch (t) {
    case "success":
      return "text-emerald-600 dark:text-emerald-400";
    case "warning":
      return "text-amber-600 dark:text-amber-400";
    case "important":
      return "text-rose-600 dark:text-rose-400 font-semibold";
    default:
      return "text-gray-500 dark:text-gray-400";
  }
}

function timeAgo(iso, t, i18n) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return t("notifications.justNow");
  if (s < 3600) return t("notifications.minutesAgo", { count: Math.floor(s / 60) });
  if (s < 86400) return t("notifications.hoursAgo", { count: Math.floor(s / 3600) });
  return d.toLocaleDateString(i18n.language);
}

function courseIdForLink(n) {
  const c = n?.course;
  if (!c) return null;
  return typeof c === "object" && c?._id != null ? c._id : c;
}

export default function NotificationsPage() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const [searchParams, setSearchParams] = useSearchParams();
  const { state: locState } = useLocation();
  const navigate = useNavigate();
  const idParam = searchParams.get("id");
  const seedN = locState?.n;

  const [page, setPage] = useState(1);
  const limit = 20;
  const { data, isLoading, isError } = useNotificationsList(page, limit);
  const { data: unreadCount = 0 } = useUnreadNotificationCount();
  const { mutate: markAll, isPending: markingAll } = useMarkAllNotificationsRead();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: removeNotif } = useDeleteNotification();

  const items = data?.notifications ?? [];
  const totalPages = data?.totalPages ?? 0;

  const focused = useMemo(() => {
    if (!idParam) return null;
    const fromList = items.find((x) => String(x._id) === idParam);
    if (fromList) return fromList;
    if (seedN && String(seedN._id) === idParam) return seedN;
    return null;
  }, [idParam, items, seedN]);

  const singleView = Boolean(idParam && focused);
  const displayItems = singleView ? [focused] : items;

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  const clearFocus = () => {
    setSearchParams({}, { replace: true });
    navigate(paths.notifications, { replace: true, state: null });
  };

  return (
    <AccountSettingsLayout
      title={t("notifications.title")}
      subtitle={t("notifications.subtitle")}
      navItems={getAccountNavItems(user)}
    >
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
        <div className="min-w-0">
          {singleView && (
            <button
              type="button"
              onClick={clearFocus}
              className="inline-flex items-center gap-1.5 text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline mb-1"
            >
              <ChevronLeft className="h-4 w-4 rtl-flip" />
              {t("notifications.all")}
            </button>
          )}
          <p className="text-sm text-gray-500 dark:text-gray-400">
            {isLoading
              ? t("notifications.loading")
              : singleView
                ? t("notifications.showingOne")
                : t("notifications.total", { count: data?.total ?? 0 })}
          </p>
        </div>
        {!singleView && items.length > 0 && (
          <button
            type="button"
            onClick={() => markAll()}
            disabled={markingAll || unreadCount === 0}
            className="inline-flex items-center justify-center gap-2 h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm font-medium text-gray-700 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
          >
            <CheckCheck className="h-4 w-4" />
            {t("notifications.markAllRead")}
          </button>
        )}
      </div>

      {isError && (
        <p className="text-sm text-red-600 dark:text-red-400">{t("notifications.loadError")}</p>
      )}

      {isLoading && (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div
              key={i}
              className="h-16 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 animate-pulse"
            />
          ))}
        </div>
      )}

      {idParam && !isLoading && !focused && (
        <p className="text-sm text-amber-800 dark:text-amber-200 mb-3">
          {t("notifications.missingFocused")}{" "}
          <button type="button" onClick={clearFocus} className="font-medium underline">
            {t("notifications.viewAll")}
          </button>
        </p>
      )}

      {!isLoading && displayItems.length === 0 && !idParam && (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-800 bg-white/80 dark:bg-gray-900/60 px-6 py-12 text-center">
          <Bell className="h-10 w-10 mx-auto text-gray-300 dark:text-gray-600 mb-3" />
          <p className="text-sm text-gray-600 dark:text-gray-400">{t("notifications.allCaughtUp")}</p>
          <p className="text-xs text-gray-400 mt-1">{t("notifications.allCaughtUpHint")}</p>
        </div>
      )}

      <ul className="space-y-2">
        {displayItems.map((n) => (
          <li
            key={n._id}
            className={[
              "rounded-xl border p-4 text-start transition-colors",
              n.isRead
                ? "border-gray-200/90 dark:border-gray-800 bg-white dark:bg-gray-900/50"
                : "border-brand-200/80 dark:border-brand-900/50 bg-brand-50/40 dark:bg-brand-950/20",
            ].join(" ")}
          >
            <div className="flex items-start justify-between gap-3">
              <div
                role="button"
                tabIndex={0}
                className="min-w-0 flex-1 cursor-pointer"
                onClick={() => {
                  if (!n.isRead) markRead(n._id);
                }}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    if (!n.isRead) markRead(n._id);
                  }
                }}
              >
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {n.title}
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-0.5 leading-relaxed">
                  {n.message}
                </p>
                <p className={`text-xs mt-2 font-medium ${typeStyle(n.type)}`}>{n.type}</p>
                {courseIdForLink(n) && (
                  <Link
                    to={paths.course(courseIdForLink(n))}
                    onClick={(e) => e.stopPropagation()}
                    className="text-xs font-medium text-brand-600 dark:text-brand-400 mt-2 inline-block hover:underline"
                  >
                    {t("notifications.viewCourse")}
                  </Link>
                )}
              </div>
              <div className="flex flex-col items-end gap-1 shrink-0">
                <span className="text-[11px] text-gray-400 tabular-nums">
                  {timeAgo(n.createdAt, t, i18n)}
                </span>
                <button
                  type="button"
                  title={t("notifications.delete")}
                  aria-label={t("notifications.deleteAria")}
                  onClick={() => {
                    removeNotif(n._id, {
                      onSuccess: () => {
                        if (singleView) clearFocus();
                      },
                    });
                  }}
                  className="p-1.5 rounded-lg text-gray-400 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                >
                  <Trash2 className="h-4 w-4" />
                </button>
              </div>
            </div>
          </li>
        ))}
      </ul>

      {totalPages > 1 && !singleView && (
        <div className="flex justify-center gap-2 mt-6">
          <button
            type="button"
            disabled={page <= 1}
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40"
          >
            {t("notifications.previous")}
          </button>
          <span className="self-center text-sm text-gray-500">
            {page} / {totalPages}
          </span>
          <button
            type="button"
            disabled={page >= totalPages}
            onClick={() => setPage((p) => p + 1)}
            className="h-9 px-3 rounded-lg border border-gray-200 dark:border-gray-700 text-sm disabled:opacity-40"
          >
            {t("notifications.next")}
          </button>
        </div>
      )}
    </AccountSettingsLayout>
  );
}
