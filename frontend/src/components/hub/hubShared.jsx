export function completionTone(percent) {
  const safe = Math.max(0, Math.min(100, Math.round(Number(percent) || 0)));
  if (safe >= 75) {
    return { bar: "bg-emerald-500", text: "text-emerald-600 dark:text-emerald-400" };
  }
  if (safe >= 45) {
    return { bar: "bg-amber-500", text: "text-amber-600 dark:text-amber-400" };
  }
  return { bar: "bg-sky-500", text: "text-sky-600 dark:text-sky-400" };
}

export function iconAccent(category) {
  const value = String(category || "").toLowerCase();
  if (value.includes("data")) {
    return "bg-violet-50 text-violet-600 dark:bg-violet-950/50 dark:text-violet-300";
  }
  if (value.includes("program") || value.includes("code") || value.includes("dev")) {
    return "bg-sky-50 text-sky-600 dark:bg-sky-950/50 dark:text-sky-300";
  }
  if (value.includes("design")) {
    return "bg-rose-50 text-rose-600 dark:bg-rose-950/50 dark:text-rose-300";
  }
  return "bg-brand-50 text-brand-600 dark:bg-brand-950/50 dark:text-brand-300";
}

export function timeAgo(iso, t, locale) {
  if (!iso) return "";
  const s = Math.floor((Date.now() - new Date(iso).getTime()) / 1000);
  if (s < 3600) return t("workspace.hub.minutesAgo", { count: Math.max(1, Math.floor(s / 60)) });
  if (s < 86400) return t("workspace.hub.hoursAgo", { count: Math.floor(s / 3600) });
  if (s < 604800) return t("workspace.hub.daysAgo", { count: Math.floor(s / 86400) });
  return new Date(iso).toLocaleDateString(locale);
}

export function formatDueLabel(iso, t, locale) {
  if (!iso) return "";
  const due = new Date(iso);
  const now = new Date();
  const diffDays = Math.ceil((due - now) / (24 * 60 * 60 * 1000));
  if (diffDays < 0) return t("workspace.hub.overdue");
  if (diffDays === 0) return t("workspace.hub.dueToday");
  if (diffDays === 1) return t("workspace.hub.dueTomorrow");
  if (diffDays <= 7) return t("workspace.hub.dueInDays", { count: diffDays });
  return due.toLocaleDateString(locale);
}

export function HubStatCard({ label, value, hint, tone = "neutral" }) {
  const tones = {
    neutral: "border-gray-200/90 dark:border-gray-800",
    brand: "border-brand-200/70 dark:border-brand-900/50",
    emerald: "border-emerald-200/70 dark:border-emerald-900/40",
    amber: "border-amber-200/70 dark:border-amber-900/40",
    sky: "border-sky-200/70 dark:border-sky-900/40",
  };

  return (
    <div
      className={`rounded-2xl border bg-white px-4 py-4 shadow-sm dark:bg-gray-900 ${tones[tone] ?? tones.neutral}`}
    >
      <p className="text-[11px] font-bold uppercase tracking-[0.14em] text-gray-400 dark:text-gray-500">
        {label}
      </p>
      <p className="mt-2 text-3xl font-extrabold tabular-nums tracking-tight text-gray-900 dark:text-white">
        {value}
      </p>
      {hint ? (
        <p className="mt-1 text-xs font-medium text-gray-500 dark:text-gray-400">{hint}</p>
      ) : null}
    </div>
  );
}
