import { Navigate } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import ProfileSettingsForm from "../../components/profile/ProfileSettingsForm";
import { getAccountNavItems } from "../../config/accountNav";
import { paths } from "../../config/paths";

const UpdateProfilePage = () => {
  const { t } = useTranslation();
  const user = useUserStore((s) => s.user);

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <AccountSettingsLayout
      title={t("workspace.pagesMisc.myAccount")}
      subtitle={t("workspace.pagesMisc.myAccountSub")}
      navItems={getAccountNavItems(user)}
    >
      <ProfileSettingsForm />
    </AccountSettingsLayout>
  );
};

export default UpdateProfilePage;
