import React, { useEffect, useState } from "react";
import { useTranslation } from "react-i18next";
import { Star } from "lucide-react";

export function StarsDisplay({ average, count, size = "md" }) {
  const { t } = useTranslation();
  const full = Math.round(Number(average) || 0);
  const sizeClass = size === "sm" ? "w-3.5 h-3.5" : "w-5 h-5";
  const ratingCount = count || 0;

  return (
    <div className="flex items-center gap-2 flex-wrap">
      <div className="flex">
        {[1, 2, 3, 4, 5].map((n) => (
          <Star
            key={n}
            className={`${sizeClass} ${
              n <= full ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"
            }`}
          />
        ))}
      </div>
      <span className="text-xs text-gray-500 dark:text-gray-400">
        {Number(average || 0).toFixed(1)} ({t("rating.count", { count: ratingCount })})
      </span>
    </div>
  );
}

/**
 * viewerState:
 * - "guest" — not signed in
 * - "owner" — course instructor
 * - "checking" — loading enrollment for signed-in non-owner
 * - "need_enrollment" — signed in but not enrolled
 * - "rating_blocked" — disabled globally or for this course
 * - "can_rate" — enrolled learner (not owner); may submit stars
 */
export function CourseRatingForm({ viewerState, myRating, onSubmit, isPending }) {
  const { t } = useTranslation();
  const [hover, setHover] = useState(0);
  const [selected, setSelected] = useState(myRating || 0);

  useEffect(() => { setSelected(myRating || 0); }, [myRating]);

  if (viewerState === "owner") {
    return <p className="text-xs text-gray-500 dark:text-gray-400 italic">{t("rating.ownerCannotRate")}</p>;
  }
  if (viewerState === "guest") {
    return <p className="text-xs text-gray-500 dark:text-gray-400">{t("rating.signInToRate")}</p>;
  }
  if (viewerState === "checking") {
    return <p className="text-xs text-gray-500 dark:text-gray-400">{t("rating.checkingEnrollment")}</p>;
  }
  if (viewerState === "need_enrollment") {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        {t("rating.enrollToRate")}
      </p>
    );
  }
  if (viewerState === "rating_blocked") {
    return (
      <p className="text-xs text-gray-500 dark:text-gray-400">
        Ratings are disabled for this course.
      </p>
    );
  }

  return (
    <div className="mt-3">
      <p className="text-xs font-medium text-gray-600 dark:text-gray-400 mb-2">{t("rating.yourRating")}</p>
      <div className="flex items-center gap-0.5">
        {[1, 2, 3, 4, 5].map((n) => (
          <button
            key={n}
            type="button"
            disabled={isPending}
            onMouseEnter={() => setHover(n)}
            onMouseLeave={() => setHover(0)}
            onClick={() => { setSelected(n); onSubmit(n); }}
            className="p-0.5 rounded hover:bg-amber-50 dark:hover:bg-amber-900/20 transition disabled:opacity-50"
            aria-label={t("rating.rateNStars", { count: n })}
          >
            <Star className={`w-7 h-7 ${n <= (hover || selected) ? "text-amber-400 fill-amber-400" : "text-gray-300 dark:text-gray-600"}`} />
          </button>
        ))}
      </div>
      {myRating ? <p className="text-[11px] text-gray-400 mt-1">{t("rating.youRated", { count: myRating })}</p> : null}
    </div>
  );
}
