import React, { useMemo } from "react";
import { useNavigate, Link, useSearchParams } from "react-router-dom";
import { PlusCircle, Trash2, Search, X, Star, SlidersHorizontal } from "lucide-react";
import { toast } from "react-hot-toast";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../lib/i18nFormatters";
import useUserStore from "../store/userstore";
import { useDeleteCourse, useGetCourses } from "../api/course";
import { paths } from "../config/paths";

const CourseCategories = () => {
  const { t } = useTranslation();
  const { money } = useFormatter();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [searchParams, setSearchParams] = useSearchParams();

  const searchQuery = searchParams.get("q") || "";
  const selectedCategory = searchParams.get("cat") || "all";
  const sortMode = searchParams.get("sort") || "default";

  const { allcourses = [], isLoading, isError } = useGetCourses();
  const { deletemycourse } = useDeleteCourse();

  const applyListParams = (overrides) => {
    const q = overrides.q !== undefined ? overrides.q : searchQuery;
    const cat = overrides.cat !== undefined ? overrides.cat : selectedCategory;
    const sort = overrides.sort !== undefined ? overrides.sort : sortMode;
    const params = {};
    if (q && String(q).trim()) params.q = String(q).trim();
    if (cat && cat !== "all") params.cat = cat;
    if (sort && sort !== "default") params.sort = sort;
    setSearchParams(params);
  };

  const filteredCourses = useMemo(() => {
    let courses = allcourses;
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      courses = courses.filter((c) =>
        (c.title || "").toLowerCase().includes(q),
      );
    }
    if (selectedCategory !== "all") {
      courses = courses.filter(
        (c) => c.category?.toLowerCase() === selectedCategory.toLowerCase(),
      );
    }
    return courses;
  }, [allcourses, searchQuery, selectedCategory]);

  const sortedCourses = useMemo(() => {
    const arr = [...filteredCourses];
    const getPrice = (c) => Number(c.effectivePrice ?? c.listPrice ?? c.price ?? 0);
    const getEnrolled = (c) => (Array.isArray(c.students) ? c.students.length : 0);
    const getDate = (c) => new Date(c.createdAt || 0).getTime();
    const qv = searchQuery.trim().toLowerCase();

    switch (sortMode) {
      case "newest":
        return arr.sort((a, b) => getDate(b) - getDate(a));
      case "rating": {
        return arr.sort((a, b) => {
          const ra = Number(a.averageRating) || 0;
          const rb = Number(b.averageRating) || 0;
          if (rb !== ra) return rb - ra;
          return getDate(b) - getDate(a);
        });
      }
      case "popular":
        return arr.sort((a, b) => {
          const d = getEnrolled(b) - getEnrolled(a);
          if (d !== 0) return d;
          return getDate(b) - getDate(a);
        });
      case "price_asc":
        return arr.sort((a, b) => getPrice(a) - getPrice(b));
      case "price_desc":
        return arr.sort((a, b) => getPrice(b) - getPrice(a));
      case "relevance": {
        if (!qv) {
          return arr.sort((a, b) => getDate(b) - getDate(a));
        }
        return arr.sort((a, b) => {
          const at = (a.title || "").toLowerCase();
          const bt = (b.title || "").toLowerCase();
          const aStarts = at.startsWith(qv) ? 0 : 1;
          const bStarts = bt.startsWith(qv) ? 0 : 1;
          if (aStarts !== bStarts) return aStarts - bStarts;
          const aIdx = at.indexOf(qv);
          const bIdx = bt.indexOf(qv);
          if (aIdx !== bIdx) return aIdx - bIdx;
          return at.localeCompare(bt, undefined, { sensitivity: "base" });
        });
      }
      default:
        return arr;
    }
  }, [filteredCourses, sortMode, searchQuery]);

  const categoryPills = useMemo(() => {
    const labels = new Set();
    for (const c of allcourses) {
      const cat = (c.category || "").trim();
      if (cat) labels.add(cat);
    }
    return [
      "all",
      ...Array.from(labels).sort((a, b) =>
        a.localeCompare(b, undefined, { sensitivity: "base" }),
      ),
    ];
  }, [allcourses]);

  const handleCategoryChange = (cat) => {
    applyListParams({ cat, q: searchQuery, sort: sortMode });
  };

  const clearSearch = () => {
    applyListParams({ q: "", cat: selectedCategory, sort: sortMode });
  };

  const handleCourseClick = (course) => {
    navigate(paths.course(course._id), { state: course });
  };

  const DEFAULT_COURSE_IMG =
    "data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='600' height='400'%3E%3Crect width='600' height='400' fill='%23f1f0fb'/%3E%3Ctext x='50%25' y='50%25' dominant-baseline='middle' text-anchor='middle' font-family='system-ui,sans-serif' font-size='42' fill='%239b8ec4'%3E%F0%9F%93%9A%3C/text%3E%3C/svg%3E";

  const getCourseImage = (course) => course?.image || DEFAULT_COURSE_IMG;

  if (isLoading) {
    return (
      <div className="flex justify-center py-32">
        <div className="w-8 h-8 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  if (isError) {
    return (
      <p className="text-center py-20 text-red-500 font-medium">
        {t("home.courses.loadError")}
      </p>
    );
  }

  return (
    <section id="courses-section" className="py-16 px-6">
      <div className="max-w-7xl mx-auto">
        {/* Section header */}
        <div className="text-center max-w-2xl mx-auto mb-10">
          <h2 className="text-3xl font-extrabold tracking-tight text-gray-900 dark:text-white">
            {t("home.courses.title")}
          </h2>
          <p className="mt-3 text-gray-500 dark:text-gray-400">
            {t("home.courses.subtitle")}
          </p>
        </div>

        {/* Inline search */}
        <div className="max-w-xl mx-auto mb-8">
          <div className="flex items-center h-11 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-4 transition-colors focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => {
                const val = e.target.value;
                applyListParams({ q: val, cat: selectedCategory, sort: sortMode });
              }}
              placeholder={t("home.courses.searchPlaceholder")}
              className="flex-1 ms-3 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none"
            />
            {searchQuery && (
              <button onClick={clearSearch} className="ms-1 p-1 text-gray-400 hover:text-gray-600 dark:hover:text-gray-200">
                <X className="w-3.5 h-3.5" />
              </button>
            )}
          </div>
          {searchQuery.trim() && (
            <p className="mt-2 text-xs text-center text-gray-500 dark:text-gray-400">
              {t("home.courses.searchResults", { count: sortedCourses.length })}&nbsp;
              <span className="font-semibold">"{searchQuery.trim()}"</span>
            </p>
          )}
        </div>

        {/* Category tabs */}
        <div className="flex flex-wrap justify-center gap-2 mb-6">
          {categoryPills.map((cat) => (
            <button
              key={cat === "all" ? "all" : cat}
              type="button"
              onClick={() => handleCategoryChange(cat)}
              className={`px-5 py-2 rounded-lg text-sm font-medium transition-colors ${
                (cat === "all" && selectedCategory === "all") ||
                (cat !== "all" && selectedCategory.toLowerCase() === cat.toLowerCase())
                  ? "bg-brand-600 text-white shadow-md"
                  : "text-gray-600 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-800"
              }`}
            >
              {cat === "all" ? t("home.courses.all") : cat}
            </button>
          ))}
        </div>

        {/* Sort */}
        <div className="max-w-3xl mx-auto mb-10 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
            <SlidersHorizontal className="w-4 h-4 text-brand-500 shrink-0" aria-hidden />
            <span className="font-medium">{t("home.courses.sortBy")}</span>
          </div>
          <div className="flex flex-1 min-w-0 sm:justify-end">
            <label htmlFor="course-sort" className="sr-only">
              {t("home.courses.sortCourses")}
            </label>
            <select
              id="course-sort"
              value={sortMode}
              onChange={(e) => applyListParams({ sort: e.target.value, q: searchQuery, cat: selectedCategory })}
              className="w-full sm:max-w-xs h-10 ps-3 pe-8 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 text-sm text-gray-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-brand-500/40 focus:border-brand-500"
            >
              <option value="default">{t("home.courses.sortDefault")}</option>
              <option value="relevance">{t("home.courses.sortRelevance")}</option>
              <option value="newest">{t("home.courses.sortNewest")}</option>
              <option value="rating">{t("home.courses.sortRating")}</option>
              <option value="popular">{t("home.courses.sortPopular")}</option>
              <option value="price_asc">{t("home.courses.sortPriceAsc")}</option>
              <option value="price_desc">{t("home.courses.sortPriceDesc")}</option>
            </select>
          </div>
        </div>

        {/* Course grid */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
          {sortedCourses.length > 0 ? (
            sortedCourses.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course)}
                className="group cursor-pointer rounded-lg overflow-hidden border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 hover:shadow-lg transition-shadow duration-200"
              >
                {/* Image */}
                <div className="relative aspect-video overflow-hidden bg-gray-100 dark:bg-gray-800">
                  <img
                    src={getCourseImage(course)}
                    alt={course.title}
                    onError={(e) => { e.target.onerror = null; e.target.src = DEFAULT_COURSE_IMG; }}
                    className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                  />
                </div>

                {/* Body */}
                <div className="p-4 space-y-2">
                  <h3 className="font-bold text-gray-900 dark:text-white leading-snug line-clamp-2 text-[15px]">
                    {course.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {course.teacher?.name || t("home.courses.unknownInstructor")}
                  </p>

                  {/* Rating row */}
                  <div className="flex items-center gap-1.5">
                    {course.averageRating ? (
                      <>
                        <span className="text-sm font-bold text-amber-700 dark:text-amber-400">
                          {Number(course.averageRating).toFixed(1)}
                        </span>
                        <div className="flex">
                          {[1, 2, 3, 4, 5].map((s) => (
                            <Star
                              key={s}
                              className={`w-3.5 h-3.5 ${
                                s <= Math.round(course.averageRating)
                                  ? "text-amber-400 fill-amber-400"
                                  : "text-gray-300 dark:text-gray-600"
                              }`}
                            />
                          ))}
                        </div>
                        {course.totalRatings && (
                          <span className="text-xs text-gray-400">({course.totalRatings})</span>
                        )}
                      </>
                    ) : (
                      <span className="text-xs text-gray-400 italic">{t("home.courses.noRatings")}</span>
                    )}
                  </div>

                  {/* Price — match public page: from → now when on sale */}
                  <div className="pt-1">
                    {course.promotionActive &&
                    typeof course.listPrice === "number" &&
                    typeof course.effectivePrice === "number" &&
                    course.effectivePrice < course.listPrice - 0.001 ? (
                      <div className="flex flex-wrap items-baseline gap-x-2 gap-y-1">
                        <span className="text-sm font-semibold text-gray-400 dark:text-gray-500 line-through tabular-nums">
                          {money(course.listPrice)}
                        </span>
                        <span className="text-xs font-bold text-amber-700 dark:text-amber-300 rtl-flip">→</span>
                        <span className="text-lg font-black text-emerald-600 dark:text-emerald-400 tabular-nums">
                          {money(course.effectivePrice)}
                        </span>
                        <span className="text-[9px] font-extrabold uppercase tracking-wider text-white bg-gradient-to-r from-rose-500 to-orange-500 px-1.5 py-0.5 rounded">
                          {t("home.courses.sale")}
                        </span>
                      </div>
                    ) : (
                      <span className="text-lg font-extrabold text-gray-900 dark:text-white tabular-nums">
                        {money(course.effectivePrice ?? (course.price || 0))}
                      </span>
                    )}
                  </div>

                  {/* Category pill */}
                  <div>
                    <span className="inline-block text-[10px] font-semibold uppercase tracking-wider px-2 py-0.5 rounded bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400">
                      {course.category}
                    </span>
                  </div>

                  {/* Teacher action buttons */}
                  {user?.role === "teacher" && course.teacher?._id === user._id && (
                    <Link
                      to={paths.courseNewTask(course._id)}
                      onClick={(e) => e.stopPropagation()}
                      className="mt-2 w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-semibold rounded-lg bg-brand-50 dark:bg-brand-900/20 text-brand-700 dark:text-brand-300 hover:bg-brand-100 dark:hover:bg-brand-900/40 transition-colors"
                    >
                      <PlusCircle className="w-3.5 h-3.5" /> {t("home.courses.createTask")}
                    </Link>
                  )}

                  {(user?.role === "admin" ||
                    (user?.role === "teacher" && course.teacher?._id === user._id)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        toast((t) => (
                          <div className="flex flex-col gap-2">
                            <span className="text-sm font-medium">{t("home.courses.deletePrompt")}</span>
                            <div className="flex gap-2 justify-end">
                              <button
                                className="px-3 py-1 text-xs rounded-md bg-gray-100 hover:bg-gray-200 dark:bg-gray-700 dark:hover:bg-gray-600 transition-colors"
                                onClick={() => toast.dismiss(t.id)}
                              >
                                {t("home.courses.cancel")}
                              </button>
                              <button
                                className="px-3 py-1 text-xs rounded-md bg-red-600 text-white hover:bg-red-700 transition-colors"
                                onClick={async () => {
                                  toast.dismiss(t.id);
                                  try {
                                    await deletemycourse(course._id);
                                  } catch (err) {
                                    console.error(err);
                                    toast.error(t("home.courses.deleteError"));
                                  }
                                }}
                              >
                                {t("home.courses.delete")}
                              </button>
                            </div>
                          </div>
                        ));
                      }}
                      className="mt-1 w-full flex items-center justify-center gap-2 px-4 py-2 text-xs font-medium rounded-lg text-red-600 dark:text-red-400 hover:bg-red-50 dark:hover:bg-red-950/30 transition-colors"
                    >
                      <Trash2 className="w-3.5 h-3.5" /> {t("home.courses.delete")}
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p className="col-span-full text-center py-16 text-gray-400 dark:text-gray-500">
              {searchQuery.trim()
                ? t("home.courses.noSearchResults")
                : t("home.courses.noCategoryResults")}
            </p>
          )}

        </div>
      </div>
    </section>
  );
};

export default CourseCategories;
