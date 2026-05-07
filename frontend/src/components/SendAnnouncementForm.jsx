import { useMemo, useState } from "react";
import { Megaphone } from "lucide-react";
import useUserStore from "../store/userstore";
import { useAuthStore } from "../store/useauthstore";
import { useGetAllCoursesForAdmin, useGetCoursesByTeacher } from "../api/course";
import { useSendAnnouncement } from "../api/notifications";

const TARGETS = [
  { value: "all_users", label: "Everyone (all users)", description: "All active accounts on the platform" },
  { value: "students", label: "All students", description: "Users with the student role" },
  { value: "instructors", label: "All instructors", description: "Users with the teacher role" },
  { value: "course", label: "One course", description: "Enrolled students in a single course" },
];

/**
 * In-app notification broadcast (admin + teacher). No layout — embed in a page.
 */
export default function SendAnnouncementForm() {
  const user = useUserStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  const [title, setTitle] = useState("");
  const [message, setMessage] = useState("");
  const [targetType, setTargetType] = useState("students");
  const [courseId, setCourseId] = useState("");
  const [isImportant, setIsImportant] = useState(false);

  const { allcourses, isLoading: loadingAdminCourses } = useGetAllCoursesForAdmin(
    isAdmin && Boolean(accessToken),
  );
  const { coursesbyteacher = [], isLoading: loadingTeacherCourses } = useGetCoursesByTeacher(
    isTeacher ? user?._id : null,
  );

  const { mutateAsync: sendAnnouncement, isPending } = useSendAnnouncement();

  const courseOptions = useMemo(() => {
    const raw = isAdmin ? allcourses : coursesbyteacher;
    if (!raw?.length) return [];
    return [...raw]
      .filter((c) => c && !c.isDeleted)
      .sort((a, b) => (a.title || "").localeCompare(b.title || ""));
  }, [isAdmin, allcourses, coursesbyteacher]);

  const showCourseSelect = (isAdmin && targetType === "course") || isTeacher;

  const handleSubmit = async (e) => {
    e.preventDefault();
    try {
      if (isTeacher) {
        await sendAnnouncement({
          title: title.trim(),
          message: message.trim(),
          targetType: "course",
          courseId: courseId || undefined,
          isImportant,
        });
      } else {
        const payload = {
          title: title.trim(),
          message: message.trim(),
          targetType,
          isImportant,
        };
        if (targetType === "course") {
          payload.courseId = courseId;
        }
        await sendAnnouncement(payload);
      }
      setTitle("");
      setMessage("");
      setIsImportant(false);
      if (isAdmin && targetType === "course") {
        setCourseId("");
      }
      if (isTeacher) {
        setCourseId("");
      }
    } catch {
      /* toast from useSendAnnouncement */
    }
  };

  if (!isAdmin && !isTeacher) {
    return null;
  }

  const needsCourse = isTeacher || (isAdmin && targetType === "course");
  const canSubmit = Boolean(
    title.trim() && message.trim() && (!needsCourse || courseId) && !isPending,
  );

  return (
    <div className="space-y-4">
      <div className="flex items-start gap-3 p-3.5 rounded-lg border border-brand-200/80 dark:border-brand-800/50 bg-brand-50/50 dark:bg-brand-950/20">
        <Megaphone className="w-5 h-5 text-brand-600 dark:text-brand-400 shrink-0 mt-0.5" />
        <p className="text-sm text-gray-700 dark:text-gray-300 leading-relaxed">
          {isAdmin ? (
            <span>
              Send an <strong className="text-gray-900 dark:text-white">in-app</strong> notification to chosen users.
              Not a chat—recipients see it in their notification list; important items are highlighted.
            </span>
          ) : (
            <span>
              Message <strong className="text-gray-900 dark:text-white">students enrolled</strong> in one of your
              courses.
            </span>
          )}
        </p>
      </div>

      <form
        onSubmit={handleSubmit}
        className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900/40 p-4 sm:p-5 space-y-4"
      >
        {isAdmin && (
          <div>
            <label className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2">Audience</label>
            <div className="space-y-2">
              {TARGETS.map((t) => (
                <label
                  key={t.value}
                  className={`flex gap-3 p-2.5 sm:p-3 rounded-lg border cursor-pointer transition-colors ${
                    targetType === t.value
                      ? "border-brand-500 bg-brand-50/80 dark:bg-brand-950/30 dark:border-brand-600"
                      : "border-gray-200 dark:border-gray-700 hover:border-gray-300 dark:hover:border-gray-600"
                  }`}
                >
                  <input
                    type="radio"
                    name="target"
                    className="mt-1"
                    value={t.value}
                    checked={targetType === t.value}
                    onChange={() => {
                      setTargetType(t.value);
                      if (t.value !== "course") setCourseId("");
                    }}
                  />
                  <div>
                    <div className="text-sm font-medium text-gray-900 dark:text-white">{t.label}</div>
                    <div className="text-xs text-gray-500 dark:text-gray-400 mt-0.5">{t.description}</div>
                  </div>
                </label>
              ))}
            </div>
          </div>
        )}

        {showCourseSelect && (
          <div>
            <label
              htmlFor="announcement-course-embed"
              className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-2"
            >
              Course
            </label>
            <select
              id="announcement-course-embed"
              required
              value={courseId}
              onChange={(e) => setCourseId(e.target.value)}
              disabled={isAdmin ? loadingAdminCourses : loadingTeacherCourses}
              className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            >
              <option value="">Select a course…</option>
              {courseOptions.map((c) => (
                <option key={c._id} value={c._id}>
                  {c.title}
                </option>
              ))}
            </select>
            <p className="text-xs text-gray-500 dark:text-gray-400 mt-1.5">
              Only students with an active enrollment in this course are included.
            </p>
          </div>
        )}

        <div>
          <label
            htmlFor="announcement-title-embed"
            className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5"
          >
            Title <span className="text-gray-400 font-normal">(max 200)</span>
          </label>
          <input
            id="announcement-title-embed"
            type="text"
            maxLength={200}
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            required
            className="w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white"
            placeholder="e.g. Holiday break schedule"
          />
          <p className="text-[10px] text-gray-400 mt-1 text-end">{title.length}/200</p>
        </div>

        <div>
          <label
            htmlFor="announcement-body-embed"
            className="block text-sm font-semibold text-gray-800 dark:text-gray-200 mb-1.5"
          >
            Message <span className="text-gray-400 font-normal">(max 2000)</span>
          </label>
          <textarea
            id="announcement-body-embed"
            rows={5}
            maxLength={2000}
            value={message}
            onChange={(e) => setMessage(e.target.value)}
            required
            className="w-full px-3 py-2 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white resize-y min-h-[100px]"
            placeholder="Write the announcement. Keep it short and clear."
          />
          <p className="text-[10px] text-gray-400 mt-1 text-end">{message.length}/2000</p>
        </div>

        <label className="flex items-start gap-2.5 cursor-pointer">
          <input
            type="checkbox"
            className="mt-0.5 rounded border-gray-300"
            checked={isImportant}
            onChange={(e) => setIsImportant(e.target.checked)}
          />
          <span className="text-sm text-gray-800 dark:text-gray-200">
            <span className="font-semibold">Mark as important</span>
            <span className="block text-xs text-gray-500 dark:text-gray-400 mt-0.5">
              Shown with higher emphasis in the recipient&apos;s notification list.
            </span>
          </span>
        </label>

        <div className="flex justify-end pt-1 border-t border-gray-100 dark:border-gray-800">
          <button
            type="submit"
            disabled={!canSubmit}
            className="min-h-[40px] px-5 py-2 rounded-lg text-sm font-bold bg-brand-600 text-white hover:bg-brand-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
          >
            {isPending ? "Sending…" : "Send notification"}
          </button>
        </div>
      </form>
    </div>
  );
}
