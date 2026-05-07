import { Navigate } from "react-router-dom";
import useUserStore from "../../store/userstore";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import ProfileSettingsForm from "../../components/profile/ProfileSettingsForm";
import { getAccountNavItems } from "../../config/accountNav";
import { paths } from "../../config/paths";

const UpdateProfilePage = () => {
  const user = useUserStore((s) => s.user);

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <AccountSettingsLayout
      title="My account"
      subtitle="Your name, photo, and optional public bio — used on your profile page, course pages (instructors), and certificates where applicable. Bio and project links are not part of sign-up."
      navItems={getAccountNavItems(user)}
    >
      <ProfileSettingsForm />
    </AccountSettingsLayout>
  );
};

export default UpdateProfilePage;
