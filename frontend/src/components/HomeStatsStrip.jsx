import { useTranslation } from "react-i18next";
import { GraduationCap, BookOpen, Users, Layers } from "lucide-react";
import { usePublicPlatformStats } from "../api/admin";
import { useFormatter } from "../lib/i18nFormatters";

function StatCard({ icon: Icon, label, value }) {
  return (
    <div className="rounded-xl border border-gray-200 bg-white px-4 py-5 text-center shadow-sm transition-shadow duration-200 hover:border-brand-200 hover:shadow-md dark:border-gray-800 dark:bg-gray-900 dark:hover:border-brand-800/60 sm:px-5 sm:py-6">
      <div
        className="mx-auto mb-3 flex h-10 w-10 items-center justify-center rounded-lg bg-brand-100 text-brand-600 dark:bg-brand-900/40 dark:text-brand-300 sm:h-11 sm:w-11 sm:rounded-xl"
        aria-hidden
      >
        <Icon className="h-5 w-5" strokeWidth={2} />
      </div>
      <p className="text-2xl font-extrabold tabular-nums tracking-tight text-gray-900 dark:text-white sm:text-3xl">{value}</p>
      <p className="mt-2 text-[11px] font-semibold uppercase tracking-wide text-gray-500 dark:text-gray-400">{label}</p>
    </div>
  );
}

export default function HomeStatsStrip() {
  const { t } = useTranslation();
  const { number } = useFormatter();
  const { stats, isLoading, isError } = usePublicPlatformStats();

  const fmt = (n) => (typeof n === "number" && Number.isFinite(n) ? number(n) : "—");

  const items = [
    {
      key: "students",
      label: t("home.stats.students"),
      value: fmt(stats?.students),
      icon: GraduationCap,
    },
    {
      key: "courses",
      label: t("home.stats.courses"),
      value: fmt(stats?.publishedCourses),
      icon: BookOpen,
    },
    {
      key: "teachers",
      label: t("home.stats.teachers"),
      value: fmt(stats?.teachers),
      icon: Users,
    },
    {
      key: "enrollments",
      label: t("home.stats.enrollments"),
      value: fmt(stats?.activeEnrollments),
      icon: Layers,
    },
  ];

  return (
    <section
      className="relative border-b border-gray-100 bg-gradient-to-b from-white via-brand-50/30 to-gray-50/80 dark:border-gray-800 dark:from-gray-950 dark:via-gray-950 dark:to-gray-900/80"
      aria-labelledby="home-stats-heading"
    >
      <div
        className="pointer-events-none absolute inset-0 bg-[radial-gradient(ellipse_85%_55%_at_50%_-10%,rgba(124,58,237,0.06),transparent)] dark:bg-[radial-gradient(ellipse_85%_55%_at_50%_-10%,rgba(124,58,237,0.12),transparent)]"
        aria-hidden
      />
      <div className="relative mx-auto max-w-6xl px-6 py-12 sm:py-14">
        <div className="mx-auto mb-8 max-w-2xl text-center sm:mb-10">
          <p className="text-xs font-bold uppercase tracking-wide text-brand-600 dark:text-brand-400">
            {t("home.stats.tagline")}
          </p>
          <h2
            id="home-stats-heading"
            className="mt-2 text-2xl font-extrabold tracking-tight text-gray-900 dark:text-white sm:text-3xl"
          >
            {t("home.stats.subtitle")}
          </h2>
        </div>

        {isLoading ? (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {[1, 2, 3, 4].map((i) => (
              <div
                key={i}
                className="h-36 animate-pulse rounded-xl border border-gray-100 bg-gray-100/80 dark:border-gray-800 dark:bg-gray-800/80 sm:h-40"
              />
            ))}
          </div>
        ) : (
          <div className="grid grid-cols-2 gap-4 sm:gap-5 lg:grid-cols-4">
            {items.map((item) => (
              <StatCard key={item.key} icon={item.icon} label={item.label} value={isError ? "—" : item.value} />
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
