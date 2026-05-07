import { X } from "lucide-react";
import { useDeleteCourseCategory } from "../../api/course";

/**
 * Lets users remove saved picker labels (CourseCategory docs). Entries without `_id` come only
 * from existing courses — those cannot be deleted here; courses are never modified.
 */
export default function SavedCourseCategoryChips({ categories = [], disabled }) {
  const { mutateAsync: removeLabel, isPending } = useDeleteCourseCategory();
  const saved = categories.filter((c) => c._id);

  if (saved.length === 0) return null;

  return (
    <div className="mt-2 space-y-1.5">
      <p className="text-[10px] text-gray-500 dark:text-gray-500 leading-snug">
        Remove a <span className="font-medium">saved</span> suggestion only — your courses stay as they are.
      </p>
      <div className="flex flex-wrap gap-1.5">
        {saved.map((c) => (
          <span
            key={c._id}
            className="inline-flex items-center gap-1 ps-2 pe-1 py-0.5 rounded-md text-xs font-medium bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-200 dark:border-gray-700"
          >
            {c.name}
            <button
              type="button"
              disabled={disabled || isPending}
              onClick={() => removeLabel(c._id)}
              className="p-0.5 rounded hover:bg-red-100 dark:hover:bg-red-950/50 text-gray-500 hover:text-red-600 disabled:opacity-40"
              aria-label={`Remove saved label ${c.name}`}
            >
              <X className="w-3.5 h-3.5" />
            </button>
          </span>
        ))}
      </div>
    </div>
  );
}
