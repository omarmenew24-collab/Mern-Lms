import React from "react";
import { useNavigate, Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { BookOpen, ArrowRight, GraduationCap } from "lucide-react";
import { useGetCoursesByStudent } from "../../api/course";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";

const Student = () => {
  const { t } = useTranslation();
  const { coursesbystudent = [], isLoading } = useGetCoursesByStudent();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  const handleCourseClick = (course) =>
    navigate(paths.courseWorkspace(course._id), { state: course });
  const displayName = user?.name || user?.email || t("learning.studentFallback");
  const firstName = displayName.split(" ")[0];

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <AccountSettingsLayout
      title={t("learning.myLearning")}
      subtitle={t("learning.learningSubtitle", { name: firstName })}
      navItems={getAccountNavItems(user)}
    >
      {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {[1, 2, 3].map((s) => (
              <div key={s} className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
                <div className="h-4 bg-gray-200 dark:bg-gray-700 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-full mb-2" />
                <div className="h-3 bg-gray-200 dark:bg-gray-700 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : coursesbystudent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {coursesbystudent.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course)}
                className="group rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 cursor-pointer hover:shadow-md transition-shadow"
              >
                <div className="flex items-center gap-3 mb-3">
                  <div className="w-9 h-9 rounded-lg bg-brand-50 dark:bg-brand-900/20 flex items-center justify-center">
                    <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                  </div>
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    {course.category}
                  </span>
                </div>
                <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug mb-1">{course.title}</h3>
                <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2 mb-3">{course.description || t("learning.noDescription")}</p>
                <div className="flex items-center justify-between">
                  <span className="text-xs text-gray-500 dark:text-gray-400">{course.teacher?.name}</span>
                  <span className="text-xs font-medium text-brand-600 dark:text-brand-400 ltr:group-hover:translate-x-0.5 rtl:group-hover:-translate-x-0.5 transition-transform flex items-center gap-1">
                    {t("learning.open")} <ArrowRight className="w-3 h-3 rtl-flip" />
                  </span>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <GraduationCap className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
            <p className="text-gray-400 dark:text-gray-500 mb-4">{t("learning.noEnrolled")}</p>
            <button onClick={() => navigate(paths.home)} className="px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
              {t("cart.browseCourses")}
            </button>
          </div>
        )}
    </AccountSettingsLayout>
  );
};

export default Student;
