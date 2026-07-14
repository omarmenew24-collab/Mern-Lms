import { Eye, EyeOff, Loader2 } from "lucide-react";
import { useTranslation } from "react-i18next";
import useUserStore from "../store/userstore";
import { usePatchSiteSettings } from "../api/admin";

/**
 * Admin-only: quick hide/show for the public home platform stats strip
 * (mirrors Site settings → homePlatformStatsEnabled).
 */
export default function AdminHomeStatsQuickToggle({ statsVisible }) {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { patchSiteSettings, isPending } = usePatchSiteSettings();
  const isAdmin = user?.role === "admin";

  if (!isAdmin) return null;

  if (statsVisible) {
    return (
      <button
        type="button"
        onClick={() => patchSiteSettings({ homePlatformStatsEnabled: false })}
        disabled={isPending}
        className="absolute end-5 top-5 z-20 flex h-9 w-9 items-center justify-center rounded-full border border-amber-200/90 bg-white/95 text-amber-700 shadow-md backdrop-blur-sm transition hover:border-amber-300 hover:bg-amber-50 hover:shadow-lg disabled:opacity-60 dark:border-amber-800/80 dark:bg-gray-900/95 dark:text-amber-300 dark:hover:bg-amber-950/50"
        title={t("workspace.adminStatsToggle.hide")}
        aria-label={t("workspace.adminStatsToggle.hide")}
      >
        {isPending ? (
          <Loader2 className="h-4 w-4 animate-spin" aria-hidden />
        ) : (
          <EyeOff className="h-4 w-4" strokeWidth={2} aria-hidden />
        )}
      </button>
    );
  }

  return (
    <div className="border-b border-amber-200/60 bg-gradient-to-r from-amber-50/90 via-white to-amber-50/90 dark:border-amber-900/40 dark:from-amber-950/30 dark:via-gray-950 dark:to-amber-950/30">
      <div className="mx-auto flex max-w-6xl items-center justify-end gap-2 px-6 py-2">
        <span className="hidden text-[11px] font-medium text-amber-800/80 sm:inline dark:text-amber-200/70">{t("workspace.adminStatsToggle.admin")}</span>
        <button
          type="button"
          onClick={() => patchSiteSettings({ homePlatformStatsEnabled: true })}
          disabled={isPending}
          className="inline-flex items-center gap-1.5 rounded-full border border-amber-300/80 bg-white/90 px-3 py-1.5 text-xs font-semibold text-amber-900 shadow-sm transition hover:bg-amber-50 disabled:opacity-60 dark:border-amber-700/60 dark:bg-gray-900/90 dark:text-amber-100 dark:hover:bg-amber-950/50"
          title={t("workspace.adminStatsToggle.show")}
          aria-label={t("workspace.adminStatsToggle.show")}
        >
          {isPending ? (
            <Loader2 className="h-3.5 w-3.5 animate-spin shrink-0" aria-hidden />
          ) : (
            <Eye className="h-3.5 w-3.5 shrink-0" strokeWidth={2} aria-hidden />
          )}
          <span className="max-sm:sr-only">{t("workspace.adminStatsToggle.showStrip")}</span>
        </button>
      </div>
    </div>
  );
}
