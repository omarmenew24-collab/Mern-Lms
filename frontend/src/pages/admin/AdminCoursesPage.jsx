import { useState, useEffect } from "react";
import { useGetAllCoursesForAdmin } from "../../api/course";
import { useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { paths } from "../../config/paths";
import { Search, Eye, PenLine, PlusCircle } from "lucide-react";
import ExportCsvButton from "../../components/admin/ExportCsvButton";

const statusStyle = (s) => {
  switch (s) {
    case "published": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    case "pending_review": return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    case "changes_requested": return "bg-red-100 dark:bg-red-900/30 text-red-700 dark:text-red-300";
    default: return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
  }
};

const Courses = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { allcourses, isLoading, isError } = useGetAllCoursesForAdmin();
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");
  const [filteredCourses, setFilteredCourses] = useState([]);

  useEffect(() => { const t = setTimeout(() => setDebouncedSearch(search), 400); return () => clearTimeout(t); }, [search]);
  useEffect(() => { if (!allcourses) return; setFilteredCourses(allcourses.filter((c) => c.title.toLowerCase().includes(debouncedSearch.toLowerCase()))); }, [allcourses, debouncedSearch]);

  if (isLoading) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 flex items-center justify-center"><div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" /></div>;
  const money = (value) =>
    new Intl.NumberFormat(i18n.language, {
      style: "currency",
      currency: "USD",
    }).format(Number(value || 0));
  const statusLabel = (status) => t(`admin.coursesAdmin.statuses.${status}`, status.replace("_", " "));

  if (isError) return <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6 text-red-500 font-medium">{t("admin.coursesAdmin.failedLoad")}</div>;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t("admin.coursesAdmin.title")}</h1>
          <div className="flex flex-wrap items-center gap-2">
            <ExportCsvButton exportKey="courses" label={t("admin.coursesAdmin.exportCsv")} />
            <button onClick={() => navigate(paths.teacherNewCourse)} className="inline-flex items-center gap-2 px-4 py-2 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
              <PlusCircle className="w-4 h-4" /> {t("admin.coursesAdmin.addCourse")}
            </button>
          </div>
        </div>

        {/* Search */}
        <div className="max-w-sm">
          <div className="flex items-center h-10 rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 px-3 focus-within:border-brand-500 focus-within:ring-1 focus-within:ring-brand-500">
            <Search className="w-4 h-4 text-gray-400 shrink-0" />
            <input type="text" placeholder={t("admin.coursesAdmin.search")} value={search} onChange={(e) => setSearch(e.target.value)} className="flex-1 ms-2 bg-transparent text-sm text-gray-800 dark:text-gray-100 placeholder-gray-400 focus:outline-none" />
          </div>
        </div>

        {/* Table */}
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <table className="w-full text-sm">
            <thead>
              <tr className="border-b border-gray-100 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/60">
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.coursesAdmin.courseTitle")}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.coursesAdmin.status")}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.coursesAdmin.price")}</th>
                <th className="text-start px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("admin.coursesAdmin.instructor")}</th>
                <th className="text-end px-4 py-3 font-semibold text-gray-600 dark:text-gray-400">{t("commonActions.actions")}</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-gray-100 dark:divide-gray-800">
              {filteredCourses.length > 0 ? (
                filteredCourses.map((course) => (
                  <tr key={course._id} className="hover:bg-gray-50 dark:hover:bg-gray-800/40 transition-colors">
                    <td className="px-4 py-3 font-medium text-gray-900 dark:text-white">{course.title}</td>
                    <td className="px-4 py-3">
                      <span className={`inline-block text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusStyle(course.status || (course.isPublished ? "published" : "draft"))}`}>
                        {statusLabel(course.status || (course.isPublished ? "published" : "draft"))}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">
                      {course.promotionActive && typeof course.effectivePrice === "number" ? (
                        <span>
                          <span className="line-through text-gray-400 me-1">{money(course.listPrice ?? course.price)}</span>
                          <span className="font-semibold text-gray-900 dark:text-white">{money(course.effectivePrice)}</span>
                        </span>
                      ) : (
                        money(course.effectivePrice ?? course.price ?? 0)
                      )}
                    </td>
                    <td className="px-4 py-3 text-gray-600 dark:text-gray-300">{course.teacher?.name || t("admin.coursesAdmin.unavailable")}</td>
                    <td className="px-4 py-3 text-end">
                      <div className="flex items-center justify-end gap-1">
                        <button onClick={() => navigate(paths.adminCourse(course._id))} className="p-2 rounded-lg text-gray-500 hover:bg-brand-50 hover:text-brand-600 dark:hover:bg-brand-900/20 dark:hover:text-brand-400 transition-colors" title={t("commonActions.view")}>
                          <Eye className="w-4 h-4" />
                        </button>
                        <button onClick={() => navigate(paths.adminCourse(course._id))} className="p-2 rounded-lg text-gray-500 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-900/20 dark:hover:text-amber-400 transition-colors" title={t("commonActions.edit")}>
                          <PenLine className="w-4 h-4" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))
              ) : (
                <tr>
                  <td colSpan="5" className="text-center py-12 text-gray-400 dark:text-gray-500">{t("admin.coursesAdmin.noCourses")}</td>
                </tr>
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
};

export default Courses;
