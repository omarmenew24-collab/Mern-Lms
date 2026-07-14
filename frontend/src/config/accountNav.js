import {
  BookOpen,
  PlusCircle,
  User,
  Home,
  GraduationCap,
  LayoutDashboard,
  Users,
  Banknote,
  UserCircle,
  Megaphone,
  Info,
  RefreshCcw,
  SlidersHorizontal,
  Landmark,
  Percent,
} from "lucide-react";
import { paths } from "./paths";
import i18n from "../i18n";

/**
 * One consistent sidebar for /student, /teacher, /profile, and /cart so navigation does not
 * jump when moving between them.
 */
export function getAccountNavItems(user) {
  const t = i18n.t.bind(i18n);

  if (!user) {
    return [
      { to: paths.about, label: t("accountNav.about"), icon: Info, end: false },
      { to: paths.home, label: t("accountNav.home"), icon: Home, end: true },
    ];
  }
  if (user.role === "admin") {
    return [
      { to: paths.admin, label: t("accountNav.overview"), icon: LayoutDashboard, end: true },
      { to: paths.adminUsers, label: t("accountNav.users"), icon: Users, end: false },
      { to: paths.adminCourses, label: t("accountNav.courses"), icon: BookOpen, end: false },
      { to: paths.adminFinance, label: t("accountNav.finance"), icon: Banknote, end: false },
      { to: paths.adminManualPayments, label: t("accountNav.manualPayments"), icon: Landmark, end: false },
      { to: paths.adminCoupons, label: t("accountNav.coupons"), icon: Percent, end: false },
      { to: paths.adminRefunds, label: t("accountNav.refunds"), icon: RefreshCcw, end: false },
      { to: paths.adminFinancialSettings, label: t("accountNav.financialPolicy"), icon: SlidersHorizontal, end: false },
      { to: paths.adminInAppAnnouncements, label: t("accountNav.sendAnnouncement"), icon: Megaphone, end: false },
      { to: paths.profile, label: t("accountNav.myAccount"), icon: User, end: true },
      { to: paths.adminSettings, label: t("accountNav.adminProfile"), icon: UserCircle, end: true },
      { to: paths.home, label: t("accountNav.home"), icon: Home, end: true },
    ];
  }
  if (user.role === "teacher") {
    return [
      { to: paths.teacher, label: t("accountNav.teachingHub"), icon: BookOpen, end: true },
      { to: paths.sendAnnouncement, label: t("accountNav.sendAnnouncement"), icon: Megaphone, end: false },
      { to: paths.teacherNewCourse, label: t("accountNav.newCourse"), icon: PlusCircle, end: true },
      { to: paths.profile, label: t("accountNav.myAccount"), icon: User, end: true },
      { to: paths.about, label: t("accountNav.about"), icon: Info, end: true },
      { to: paths.home, label: t("accountNav.home"), icon: Home, end: true },
    ];
  }
  return [
    { to: paths.student, label: t("accountNav.myLearning"), icon: GraduationCap, end: true },
    { to: paths.studentManualPayments, label: t("accountNav.manualPayments"), icon: Landmark, end: false },
    { to: paths.studentRefunds, label: t("accountNav.refunds"), icon: RefreshCcw, end: false },
    { to: paths.profile, label: t("accountNav.myAccount"), icon: User, end: true },
    { to: paths.about, label: t("accountNav.about"), icon: Info, end: true },
    { to: paths.home, label: t("accountNav.home"), icon: Home, end: true },
  ];
}
