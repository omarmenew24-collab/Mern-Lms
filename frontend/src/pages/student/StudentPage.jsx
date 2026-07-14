import { useMemo } from "react";
import { Navigate, useNavigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import { useStudentDashboard } from "../../api/course";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import StudentHubDashboard from "../../components/student/StudentHubDashboard";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const Student = () => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  const { data: dashboard, isLoading, isError } = useStudentDashboard();

  const greeting = useMemo(() => {
    const name =
      user?.name?.split(" ")?.[0] ||
      user?.email?.split("@")?.[0] ||
      t("learning.studentFallback");
    return `${timeGreeting()}, ${name} 👋`;
  }, [user?.name, user?.email, t]);

  const handleCourseClick = (course) => {
    const full =
      dashboard?.courses?.find((c) => String(c._id) === String(course._id)) || course;
    navigate(paths.courseWorkspace(full._id), { state: full });
  };

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <AccountSettingsLayout
      title={greeting}
      subtitle="Here's your learning progress across all enrolled courses."
      navItems={getAccountNavItems(user)}
    >
      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : isError ? (
        <div className="rounded-2xl border border-rose-200 bg-rose-50 px-6 py-10 text-center dark:border-rose-900/50 dark:bg-rose-950/30">
          <p className="text-sm font-medium text-rose-800 dark:text-rose-200">
            Could not load your courses. Try refreshing the page.
          </p>
        </div>
      ) : (
        <div className="max-w-[min(80rem,calc(100vw-3rem))]">
          <StudentHubDashboard dashboard={dashboard} onOpenCourse={handleCourseClick} />
        </div>
      )}
    </AccountSettingsLayout>
  );
};

export default Student;
