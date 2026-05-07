import { Users, Gauge, PlayCircle, Star } from "lucide-react";

function formatTotalHours(totalSeconds = 0) {
  const hours = Number(totalSeconds || 0) / 3600;
  if (hours <= 0) return "0h";
  if (hours < 1) return "<1h";
  return `${hours.toFixed(hours >= 10 ? 0 : 1)}h`;
}

const toneClasses = {
  brand:
    "text-brand-600 dark:text-brand-300 bg-brand-100 dark:bg-brand-900/30",
  emerald:
    "text-emerald-600 dark:text-emerald-300 bg-emerald-100 dark:bg-emerald-900/30",
  amber:
    "text-amber-600 dark:text-amber-300 bg-amber-100 dark:bg-amber-900/30",
};

function StatCard({ icon: Icon, label, value, hint, tone = "brand" }) {
  return (
    <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-4 flex items-start justify-between gap-3">
      <div className="min-w-0">
        <p className="text-[10px] font-bold uppercase tracking-wider text-gray-500 dark:text-gray-400">
          {label}
        </p>
        <p className="mt-1.5 text-2xl font-extrabold text-gray-900 dark:text-white leading-none tracking-tight">
          {value}
        </p>
        {hint && (
          <p className="mt-1 text-xs text-gray-500 dark:text-gray-400 truncate">
            {hint}
          </p>
        )}
      </div>
      <div
        className={`h-10 w-10 shrink-0 rounded-xl flex items-center justify-center ${toneClasses[tone] ?? toneClasses.brand}`}
      >
        <Icon className="w-5 h-5" />
      </div>
    </div>
  );
}

export default function TeacherCourseStatsStrip({
  studentsCount = 0,
  overallCompletionPercent = 0,
  lecturesCount = 0,
  totalLectureSeconds = 0,
  ratingAvg = 0,
  ratingCount = 0,
}) {
  const safeCompletion = Number.isFinite(Number(overallCompletionPercent))
    ? Math.max(0, Math.min(100, Math.round(Number(overallCompletionPercent))))
    : 0;

  const safeRating = Number.isFinite(Number(ratingAvg)) ? Number(ratingAvg) : 0;

  return (
    <section
      aria-label="Course performance overview"
      className="grid grid-cols-2 xl:grid-cols-4 gap-3"
    >
      <StatCard
        icon={Users}
        label="Students"
        value={studentsCount}
        hint={studentsCount === 1 ? "1 learner enrolled" : `${studentsCount} learners enrolled`}
        tone="brand"
      />
      <StatCard
        icon={Gauge}
        label="Avg. completion"
        value={`${safeCompletion}%`}
        hint="Average student progress"
        tone="emerald"
      />
      <StatCard
        icon={PlayCircle}
        label="Lectures"
        value={lecturesCount}
        hint={`${formatTotalHours(totalLectureSeconds)} of content`}
        tone="brand"
      />
      <StatCard
        icon={Star}
        label="Rating"
        value={ratingCount > 0 ? safeRating.toFixed(1) : "—"}
        hint={ratingCount > 0 ? `${ratingCount} review${ratingCount !== 1 ? "s" : ""}` : "No reviews yet"}
        tone="amber"
      />
    </section>
  );
}
