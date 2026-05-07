import { Link } from "react-router-dom";
import { Bell, Trash2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import {
  useRecentNotifications,
  useUnreadNotificationCount,
  useMarkNotificationRead,
  useDeleteNotification,
} from "../../api/notifications";

function timeAgo(iso, t, i18n) {
  if (!iso) return "";
  const d = new Date(iso);
  const s = Math.floor((Date.now() - d.getTime()) / 1000);
  if (s < 60) return t("notifications.justNow");
  if (s < 3600) return t("notifications.minutesAgo", { count: Math.floor(s / 60) });
  if (s < 86400) return t("notifications.hoursAgo", { count: Math.floor(s / 3600) });
  return d.toLocaleDateString(i18n.language);
}

export default function AccountNotificationsPanel() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { data, isLoading } = useRecentNotifications(5);
  const { data: unread = 0 } = useUnreadNotificationCount();
  const { mutate: markRead } = useMarkNotificationRead();
  const { mutate: removeNotif } = useDeleteNotification();

  const list = data?.notifications ?? [];

  if (!user) {
    return (
      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm px-2.5 py-3 text-center text-[11px] text-gray-500">
        <Link to={paths.login} className="text-brand-600 font-medium hover:underline">
          {t("billing.checkout.signIn")}
        </Link>{" "}
        {t("notifications.signInPromptSuffix")}
      </div>
    );
  }

  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 shadow-sm overflow-hidden">
      <div className="flex items-center justify-between gap-2 px-2.5 py-2 border-b border-gray-100 dark:border-gray-800">
        <div className="flex items-center gap-1.5 min-w-0">
          <Bell className="h-3.5 w-3.5 text-gray-500 shrink-0" aria-hidden />
          <span className="text-xs font-semibold text-gray-800 dark:text-gray-100">{t("notifications.activity")}</span>
        </div>
        <div className="flex items-center gap-1.5 shrink-0">
          {unread > 0 && (
            <span className="text-[10px] font-bold text-white bg-brand-600 min-w-5 h-5 px-1 flex items-center justify-center rounded-full">
              {unread > 9 ? "9+" : unread}
            </span>
          )}
          <Link
            to={paths.notifications}
            className="text-[10px] font-medium text-brand-600 dark:text-brand-400 hover:underline"
          >
            {t("notifications.all")}
          </Link>
        </div>
      </div>
      {isLoading && (
        <p className="p-2.5 text-[11px] text-gray-400">{t("notifications.loading")}</p>
      )}
      {!isLoading && list.length === 0 && (
        <p className="p-2.5 text-[11px] text-gray-500 dark:text-gray-400">{t("notifications.noUpdates")}</p>
      )}
      <ul className="p-1.5 space-y-0.5" role="list">
        {list.map((n) => (
          <li key={n._id} className="group flex items-start gap-1 rounded-md px-1 py-0.5 hover:bg-gray-50 dark:hover:bg-gray-800/50">
            <Link
              to={{ pathname: paths.notifications, search: `?id=${n._id}` }}
              state={{ n }}
              onClick={() => {
                if (!n.isRead) markRead(n._id);
              }}
              className={[
                "flex-1 min-w-0 text-start rounded-md px-1.5 py-1 text-[11px] leading-snug transition-colors",
                n.isRead
                  ? "text-gray-600 dark:text-gray-300"
                  : "text-gray-800 dark:text-gray-100 font-medium bg-brand-50/60 dark:bg-brand-950/30",
              ].join(" ")}
            >
              <span className="line-clamp-2">{n.title}</span>
              <span className="block text-[10px] text-gray-400 mt-0.5 font-normal tabular-nums">
                {timeAgo(n.createdAt, t, i18n)}
              </span>
            </Link>
            <button
              type="button"
              title={t("commonActions.remove")}
              aria-label={t("notifications.deleteAria")}
              onClick={(e) => {
                e.stopPropagation();
                removeNotif(n._id);
              }}
              className="shrink-0 p-1 rounded text-gray-400 sm:opacity-0 sm:group-hover:opacity-100 sm:focus:opacity-100 hover:text-red-600 hover:bg-red-50 dark:hover:bg-red-950/30"
            >
              <Trash2 className="h-3 w-3" />
            </button>
          </li>
        ))}
      </ul>
    </div>
  );
}
