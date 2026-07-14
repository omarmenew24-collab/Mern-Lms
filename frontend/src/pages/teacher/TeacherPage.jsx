import { useMemo } from "react";
import { useTranslation } from "react-i18next";
import { Navigate, useNavigate } from "react-router-dom";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import { useTeacherDashboard } from "../../api/course";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import TeacherHubDashboard from "../../components/teacher/TeacherHubDashboard";

function timeGreeting() {
  const hour = new Date().getHours();
  if (hour < 12) return "Good morning";
  if (hour < 17) return "Good afternoon";
  return "Good evening";
}

const Teacher = () => {
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();

  const { data: dashboard, isLoading } = useTeacherDashboard(user?._id);

  const greeting = useMemo(() => {
    const name = user?.name?.split(" ")?.[0] || t("learning.studentFallback");
    return `${timeGreeting()}, ${name} 👋`;
  }, [user?.name, t]);

  const handleCourseClick = (course) => {
    navigate(paths.courseWorkspaceTab(course._id, "overview"), { state: course });
  };

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <AccountSettingsLayout
      title={greeting}
      subtitle="Here's what's happening with your courses today."
      navItems={getAccountNavItems(user)}
    >
      {isLoading ? (
        <div className="flex justify-center py-24">
          <div className="h-8 w-8 animate-spin rounded-full border-2 border-brand-600 border-t-transparent" />
        </div>
      ) : (
        <div className="max-w-[min(80rem,calc(100vw-3rem))]">
          <TeacherHubDashboard dashboard={dashboard} onOpenCourse={handleCourseClick} />
        </div>
      )}
    </AccountSettingsLayout>
  );
};

export default Teacher;
