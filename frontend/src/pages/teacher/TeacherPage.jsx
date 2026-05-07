import React, { useState } from "react";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import { useNavigate, Navigate } from "react-router-dom";
import { BookOpen, PlusCircle, GraduationCap } from "lucide-react";
import { useGetCoursesByTeacher, useGetCoursesByStudent } from "../../api/course";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";

const statusStyle = (s) => {
  switch (s) {
    case "published": return "bg-emerald-100 dark:bg-emerald-900/30 text-emerald-700 dark:text-emerald-300";
    case "pending_review": return "bg-amber-100 dark:bg-amber-900/30 text-amber-700 dark:text-amber-300";
    default: return "bg-gray-100 dark:bg-gray-800 text-gray-500 dark:text-gray-400";
  }
};

const Teacher = () => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("teaching");

  const { coursesbyteacher = [], isLoading: loadingTeacher } = useGetCoursesByTeacher(user?._id);
  const { coursesbystudent = [], isLoading: loadingStudent } = useGetCoursesByStudent();
  const loading = loadingTeacher || loadingStudent;

  const handleCourseClick = (course) => {
    navigate(paths.courseWorkspace(course._id), { state: course });
  };

  const tabs = [
    { id: "teaching", label: t("learning.coursesYouTeach") },
    { id: "enrolled", label: t("learning.enrolledCourses") },
  ];

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <AccountSettingsLayout
      title={t("learning.teachingHub")}
      subtitle={t("learning.teachingSubtitle", { name: user.name || t("learning.studentFallback") })}
      navItems={getAccountNavItems(user)}
    >
      <div className="rounded-lg border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="flex border-b border-gray-200 dark:border-gray-800 px-1 sm:px-2">
          {tabs.map((tab) => (
            <button
              key={tab.id}
              type="button"
              onClick={() => setActiveTab(tab.id)}
              className={`px-4 py-3 text-sm font-medium border-b-2 -mb-px transition-colors ${
                activeTab === tab.id
                  ? "border-brand-600 text-brand-600 dark:text-brand-400 dark:border-brand-400"
                  : "border-transparent text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-gray-200"
              }`}
            >
              {tab.label}
            </button>
          ))}
        </div>

        <div className="p-4 sm:p-6">
        {loading ? (
          <div className="flex justify-center py-20">
            <div className="w-7 h-7 border-2 border-brand-600 border-t-transparent rounded-full animate-spin" />
          </div>
        ) : activeTab === "teaching" ? (
          <div>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {coursesbyteacher.length === 0 ? (
                <p className="col-span-full text-center text-gray-400 dark:text-gray-500 py-16">
                  {t("learning.noCreated")}
                </p>
              ) : (
                coursesbyteacher.map((course) => (
                  <div
                    key={course._id}
                    onClick={() => handleCourseClick(course)}
                    className="rounded-lg border border-gray-200/90 dark:border-gray-700/80 bg-gray-50/90 dark:bg-gray-800/40 p-5 cursor-pointer hover:border-brand-500/30 hover:shadow-sm transition-all"
                  >
                    <div className="flex items-center gap-3 mb-3">
                      <div className="w-9 h-9 rounded-lg bg-white dark:bg-gray-900/80 border border-gray-200/80 dark:border-gray-700 flex items-center justify-center">
                        <BookOpen className="w-4 h-4 text-brand-600 dark:text-brand-400" />
                      </div>
                      <span className={`text-[10px] font-bold uppercase tracking-wider px-2 py-0.5 rounded ${statusStyle(course.status || (course.isPublished ? "published" : "draft"))}`}>
                        {t(`admin.coursesAdmin.statuses.${course.status || (course.isPublished ? "published" : "draft")}`)}
                      </span>
                    </div>
                    <h3 className="font-bold text-gray-900 dark:text-white text-[15px] leading-snug mb-1">
                      {course.title}
                    </h3>
                    <p className="text-xs text-gray-500 dark:text-gray-400 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-center mt-8">
              <button
                onClick={() => navigate(paths.teacherNewCourse)}
                className="inline-flex items-center gap-2 px-5 py-2.5 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors"
              >
                <PlusCircle className="w-4 h-4" /> {t("learning.createNewCourse")}
              </button>
            </div>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 min-h-[12rem]">
            {coursesbystudent.length === 0 ? (
              <div className="col-span-full text-center py-20">
                <GraduationCap className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={40} />
                <p className="text-gray-400 dark:text-gray-500">{t("learning.noEnrolled")}</p>
              </div>
            ) : (
              coursesbystudent.map((course) => (
                <div
                  key={course?._id}
                  onClick={() => handleCourseClick(course)}
                  className="rounded-lg border border-gray-200/90 dark:border-gray-700/80 bg-gray-50/90 dark:bg-gray-800/40 p-5 cursor-pointer hover:border-brand-500/30 hover:shadow-sm transition-all border-s-4 border-s-brand-500"
                >
                  <span className="text-[10px] font-bold text-brand-600 dark:text-brand-400 uppercase tracking-wider">
                    {course?.category}
                  </span>
                  <h3 className="font-bold text-gray-900 dark:text-white text-[15px] mt-1 mb-2">
                    {course?.title}
                  </h3>
                  <p className="text-xs text-gray-500 dark:text-gray-400">
                    {course?.teacher?.name}
                  </p>
                </div>
              ))
            )}
          </div>
        )}
        </div>
      </div>
    </AccountSettingsLayout>
  );
};

export default Teacher;
