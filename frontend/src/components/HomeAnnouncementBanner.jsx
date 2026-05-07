import { useEffect, useState } from "react";
import { X } from "lucide-react";
import { usePublicHomeAnnouncement } from "../api/admin";
import { useTranslation } from "react-i18next";

const LS = "dismissedHomeAnnouncementAt";

export default function HomeAnnouncementBanner() {
  const { t } = useTranslation();
  const { text, updatedAt, isLoading } = usePublicHomeAnnouncement();
  const [closed, setClosed] = useState(false);

  useEffect(() => {
    setClosed(false);
  }, [updatedAt]);

  useEffect(() => {
    if (!updatedAt) return;
    try {
      if (localStorage.getItem(LS) === updatedAt) {
        setClosed(true);
      }
    } catch {
      /* private mode / SSR */
    }
  }, [updatedAt]);

  const trimmedText = text?.trim();
  if (isLoading || !trimmedText || closed) {
    return null;
  }

  return (
    <div
      role="region"
      aria-label={t("home.announcement.regionLabel")}
      className="border-b border-amber-200/90 dark:border-amber-800/50 bg-amber-50 dark:bg-amber-950/40"
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 py-2.5 flex items-start gap-3">
        <p className="flex-1 text-sm text-amber-950 dark:text-amber-100 leading-relaxed min-w-0">
          {trimmedText}
        </p>
        <button
          type="button"
          onClick={() => {
            try {
              if (updatedAt) localStorage.setItem(LS, updatedAt);
            } catch {
              /* noop */
            }
            setClosed(true);
          }}
          className="shrink-0 p-1 rounded-md text-amber-800/80 dark:text-amber-200/90 hover:bg-amber-200/50 dark:hover:bg-amber-900/50"
          aria-label={t("home.announcement.dismiss")}
        >
          <X className="h-4 w-4" />
        </button>
      </div>
    </div>
  );
}
