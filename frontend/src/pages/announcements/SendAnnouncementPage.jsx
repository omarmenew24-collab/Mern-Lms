import { Navigate } from "react-router-dom";
import useUserStore from "../../store/userstore";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import { paths } from "../../config/paths";
import SendAnnouncementForm from "../../components/SendAnnouncementForm";

/**
 * Instructors: dedicated page. Admins are steered to Admin workspace (same form lives there).
 */
export default function SendAnnouncementPage() {
  const user = useUserStore((s) => s.user);
  const isAdmin = user?.role === "admin";
  const isTeacher = user?.role === "teacher";

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }
  if (isAdmin) {
    return <Navigate to={`${paths.adminSettings}#in-app-announcements`} replace />;
  }
  if (!isTeacher) {
    return <Navigate to={paths.home} replace />;
  }

  return (
    <AccountSettingsLayout
      title="Send notification"
      subtitle="In-app message to students in one of your courses."
      navItems={getAccountNavItems(user)}
    >
      <div className="max-w-2xl">
        <SendAnnouncementForm />
      </div>
    </AccountSettingsLayout>
  );
}
