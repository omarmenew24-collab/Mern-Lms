import { Link, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { ArrowLeft, ExternalLink, BookOpen, GraduationCap } from "lucide-react";
import { useQuery } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import { paths } from "../config/paths";

async function fetchPublicUser(userId) {
  const res = await axiosInstance.get(`/public/user/${userId}`);
  return res.data;
}

export default function PublicUserProfilePage() {
  const { t, i18n } = useTranslation();
  const { userId } = useParams();
  const { data, isLoading, isError } = useQuery({
    queryKey: ["public-user", userId],
    queryFn: () => fetchPublicUser(userId),
    enabled: Boolean(userId),
  });

  const u = data?.user;
  const courses = data?.publishedCourses || [];

  if (isLoading) {
    return (
      <div className="min-h-[50vh] flex items-center justify-center bg-white dark:bg-gray-950">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError || !u) {
    return (
      <div className="min-h-[50vh] max-w-lg mx-auto px-4 py-16 text-center">
        <p className="text-gray-600 dark:text-gray-400">{t("publicProfile.unavailable")}</p>
        <Link to={paths.home} className="mt-4 inline-block text-sm font-medium text-brand-600 dark:text-brand-400 hover:underline">
          {t("aboutPage.backHome")}
        </Link>
      </div>
    );
  }

  const roleLabel = u.role === "teacher" ? t("publicProfile.instructor") : u.role === "admin" ? t("publicProfile.admin") : t("publicProfile.learner");

  return (
    <div className="min-h-screen bg-white dark:bg-gray-950">
      <div className="max-w-3xl mx-auto px-4 sm:px-6 py-8 sm:py-12">
        <Link
          to={paths.home}
          className="inline-flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-8"
        >
          <ArrowLeft className="w-4 h-4 rtl-flip" />
          {t("publicProfile.home")}
        </Link>

        <div className="flex flex-col sm:flex-row sm:items-start gap-6">
          <img
            src={u.picture || `https://ui-avatars.com/api/?name=${encodeURIComponent(u.name || "U")}&background=7c3aed&color=fff&size=128`}
            alt=""
            className="w-24 h-24 sm:w-28 sm:h-28 rounded-2xl object-cover border border-gray-200 dark:border-gray-800 shrink-0"
          />
          <div className="min-w-0 flex-1">
            <h1 className="text-2xl sm:text-3xl font-extrabold text-gray-900 dark:text-white tracking-tight">
              {u.name}
            </h1>
            <p className="mt-1 flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400">
              {u.role === "teacher" ? (
                <BookOpen className="w-4 h-4 text-emerald-500 shrink-0" />
              ) : (
                <GraduationCap className="w-4 h-4 text-violet-500 shrink-0" />
              )}
              {roleLabel}
            </p>
            {u.createdAt && (
              <p className="text-xs text-gray-400 dark:text-gray-500 mt-1">
                {t("publicProfile.memberSince", { date: new Date(u.createdAt).toLocaleDateString(i18n.language, { year: "numeric", month: "long" }) })}
              </p>
            )}
          </div>
        </div>

        {u.publicAbout?.trim() ? (
          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">{t("publicProfile.about")}</h2>
            <p className="text-gray-700 dark:text-gray-300 leading-relaxed whitespace-pre-wrap">{u.publicAbout.trim()}</p>
          </section>
        ) : (
          <p className="mt-10 text-sm text-gray-400 dark:text-gray-500 italic">{t("publicProfile.noDescription")}</p>
        )}

        {u.publicProjectLinks && u.publicProjectLinks.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">{t("publicProfile.links")}</h2>
            <ul className="space-y-2">
              {u.publicProjectLinks.map((url, i) => (
                <li key={i}>
                  <a
                    href={url}
                    target="_blank"
                    rel="nofollow noopener noreferrer"
                    className="inline-flex items-center gap-2 text-brand-600 dark:text-brand-400 font-medium hover:underline break-all"
                  >
                    {url}
                    <ExternalLink className="w-3.5 h-3.5 shrink-0" />
                  </a>
                </li>
              ))}
            </ul>
          </section>
        )}

        {u.role === "teacher" && courses.length > 0 && (
          <section className="mt-10">
            <h2 className="text-sm font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">{t("publicProfile.courses")}</h2>
            <ul className="rounded-xl border border-gray-200 dark:border-gray-800 divide-y divide-gray-200 dark:divide-gray-800">
              {courses.map((c) => (
                <li key={c._id}>
                  <Link
                    to={paths.course(c._id)}
                    className="block px-4 py-3 text-sm font-semibold text-gray-900 dark:text-white hover:bg-gray-50 dark:hover:bg-gray-900/50 transition-colors"
                  >
                    {c.title}
                  </Link>
                </li>
              ))}
            </ul>
          </section>
        )}
      </div>
    </div>
  );
}
