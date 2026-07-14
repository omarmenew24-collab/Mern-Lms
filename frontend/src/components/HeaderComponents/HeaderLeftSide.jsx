import { useEffect } from "react";
import { useNavigate, useLocation, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import { usePublicSiteBranding } from "../../api/admin";

const HeaderLeftSide = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const { t } = useTranslation();
  const user = useUserStore((state) => state.user);
  const { branding } = usePublicSiteBranding();
  const siteName = branding?.siteDisplayName?.trim() || "CourseAcademy";

  useEffect(() => {
    const base = branding?.siteDisplayName?.trim();
    if (base) {
      document.title = base;
    }
  }, [branding?.siteDisplayName]);

  const handleDashboard = () => {
    if (!user) return;
    if (user.role === "student") navigate("/student");
    else if (user.role === "admin") navigate(paths.admin);
    else if (user.role === "teacher") navigate("/teacher");
  };

  const isOnMyPage =
    (user?.role === "student" && location.pathname.startsWith("/student")) ||
    (user?.role === "teacher" && location.pathname.startsWith("/teacher")) ||
    (user?.role === "admin" && location.pathname.startsWith("/admin"));

  return (
    <div className="flex items-center gap-4 shrink-0">
      <span
        onClick={() => navigate("/")}
        className="text-xl font-extrabold tracking-tight cursor-pointer text-brand-700 dark:text-brand-400 hover:opacity-80 transition-opacity max-w-[200px] sm:max-w-none truncate"
        title={siteName}
      >
        {siteName}
      </span>

      {(user?.role === "teacher" || user?.role === "admin") && (
        <button
          onClick={() => navigate(paths.teacherNewCourse)}
          className="hidden sm:inline-flex text-sm font-medium text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400 transition-colors"
        >
          {t("nav.createCourse")}
        </button>
      )}

      {user && (
        <button
          onClick={handleDashboard}
          className={`hidden sm:inline-flex text-sm font-medium transition-colors ${
            isOnMyPage
              ? "text-brand-600 dark:text-brand-400 font-semibold"
              : "text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400"
          }`}
        >
          {t("nav.myDashboard")}
        </button>
      )}

      <Link
        to={paths.about}
        className={`hidden sm:inline-flex text-sm font-medium transition-colors ${
          location.pathname === paths.about
            ? "text-brand-600 dark:text-brand-400 font-semibold"
            : "text-gray-600 dark:text-gray-300 hover:text-brand-600 dark:hover:text-brand-400"
        }`}
      >
        {t("nav.about")}
      </Link>
    </div>
  );
};

export default HeaderLeftSide;
