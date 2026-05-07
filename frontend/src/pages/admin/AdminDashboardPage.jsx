import React from "react";
import { useTranslation } from "react-i18next";
import { UseGetDashboardStats, useGetDashboardAnalytics } from "../../api/admin";
import { useNavigate, Link } from "react-router-dom";
import {
  ResponsiveContainer,
  LineChart,
  Line,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  AreaChart,
  Area,
  BarChart,
  Bar,
} from "recharts";
import {
  Users,
  GraduationCap,
  BookOpen,
  ClipboardList,
  Banknote,
  LayoutTemplate,
  Megaphone,
  ArrowRight,
  RefreshCcw,
  SlidersHorizontal,
  ShieldAlert,
  Sparkles,
  Landmark,
} from "lucide-react";
import { paths } from "../../config/paths";

const statValues = (d) => [
  d?.totalUsers || 0,
  d?.totalStudents || 0,
  d?.totalTeachers || 0,
  d?.totalCourses || 0,
  d?.totalEnrollments || 0,
  d?.totalPayments ?? 0,
];

const AdminDashboard = () => {
  const { t, i18n } = useTranslation();
  const navigate = useNavigate();
  const { dashboardstats, isLoading, isError } = UseGetDashboardStats();
  const { analytics, isLoading: isAnalyticsLoading, isError: isAnalyticsError } = useGetDashboardAnalytics(6);

  if (isLoading) {
    return (
      <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
        <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white mb-8">{t("admin.dashboard.title")}</h1>
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4 animate-pulse">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="h-24 rounded-xl bg-gray-200 dark:bg-gray-800" />
          ))}
        </div>
      </div>
    );
  }

  if (isError) return <div className="p-6 min-h-screen bg-gray-50 dark:bg-gray-950 text-red-500 font-medium">{t("admin.dashboard.loadingError")}</div>;

  const statMeta = [
    { title: t("admin.dashboard.totalUsers"), icon: Users, color: "text-blue-600 dark:text-blue-400", bg: "bg-blue-50 dark:bg-blue-900/20", link: "/admin/users" },
    { title: t("admin.dashboard.students"), icon: GraduationCap, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", link: "/admin/users" },
    { title: t("admin.dashboard.teachers"), icon: GraduationCap, color: "text-brand-600 dark:text-brand-400", bg: "bg-brand-50 dark:bg-brand-900/20", link: "/admin/users" },
    { title: t("admin.dashboard.courses"), icon: BookOpen, color: "text-amber-600 dark:text-amber-400", bg: "bg-amber-50 dark:bg-amber-900/20", link: "/admin/courses" },
    { title: t("admin.dashboard.enrollments"), icon: ClipboardList, color: "text-pink-600 dark:text-pink-400", bg: "bg-pink-50 dark:bg-pink-900/20", link: "/admin" },
    { title: t("admin.dashboard.finance"), icon: Banknote, color: "text-emerald-600 dark:text-emerald-400", bg: "bg-emerald-50 dark:bg-emerald-900/20", link: "/admin/finance" },
  ];

  const values = statValues(dashboardstats);

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 p-6">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3">
          <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t("admin.dashboard.title")}</h1>
          <div className="flex flex-wrap items-center gap-2 self-start">
            <button
              type="button"
              onClick={() => navigate(`${paths.adminSettings}#site-branding`)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-emerald-200/90 dark:border-emerald-800/60 bg-emerald-50/90 dark:bg-emerald-950/30 px-4 py-2.5 text-sm font-bold text-emerald-800 dark:text-emerald-200 hover:bg-emerald-100/90 dark:hover:bg-emerald-900/40 transition-colors"
            >
              <Sparkles className="w-4 h-4" />
              {t("admin.dashboard.siteHome")}
            </button>
            <button
              type="button"
              onClick={() => navigate(paths.adminManualPayments)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-sky-200/90 dark:border-sky-800/60 bg-sky-50/90 dark:bg-sky-950/30 px-4 py-2.5 text-sm font-bold text-sky-800 dark:text-sky-200 hover:bg-sky-100/90 dark:hover:bg-sky-900/40 transition-colors"
            >
              <Landmark className="w-4 h-4" />
              {t("admin.dashboard.manualPayments")}
            </button>
            <button
              type="button"
              onClick={() => navigate(paths.adminInAppAnnouncements)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-brand-200/90 dark:border-brand-800/60 bg-brand-50/90 dark:bg-brand-950/30 px-4 py-2.5 text-sm font-bold text-brand-800 dark:text-brand-200 hover:bg-brand-100/90 dark:hover:bg-brand-900/40 transition-colors"
            >
              <Megaphone className="w-4 h-4" />
              {t("admin.dashboard.sendAnnouncement")}
            </button>
            <button
              type="button"
              onClick={() => navigate(paths.adminSettings)}
              className="inline-flex items-center justify-center gap-2 rounded-xl border border-violet-200/90 dark:border-violet-800/60 bg-violet-50/90 dark:bg-violet-950/30 px-4 py-2.5 text-sm font-bold text-violet-800 dark:text-violet-200 hover:bg-violet-100/90 dark:hover:bg-violet-900/40 transition-colors"
            >
              <LayoutTemplate className="w-4 h-4" />
              {t("admin.dashboard.accountProfile")}
            </button>
          </div>
        </div>

        {/* Stats */}
        <div className="grid grid-cols-2 lg:grid-cols-3 gap-4">
          {statMeta.map((s, i) => {
            const Icon = s.icon;
            return (
              <div
                key={i}
                onClick={() => navigate(s.link)}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 cursor-pointer hover:shadow-md transition-shadow flex items-center justify-between"
              >
                <div>
                  <p className="text-xs font-medium text-gray-500 dark:text-gray-400 mb-1">{s.title}</p>
                  <p className="text-2xl font-extrabold text-gray-900 dark:text-white">{values[i]}</p>
                </div>
                <div className={`w-10 h-10 rounded-lg ${s.bg} flex items-center justify-center`}>
                  <Icon className={`w-5 h-5 ${s.color}`} />
                </div>
              </div>
            );
          })}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gradient-to-r from-slate-50/90 to-violet-50/40 dark:from-gray-900/80 dark:to-slate-900/80 p-4 sm:p-5">
          <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-1">{t("admin.dashboard.finance")}</h2>
          <p className="text-xs text-gray-500 dark:text-gray-400 mb-3">{t("admin.dashboard.financeHint")}</p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
            <Link
              to={paths.adminFinance}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm hover:border-emerald-300/80 dark:hover:border-emerald-800/80"
            >
              <span className="flex items-center gap-2 min-w-0">
                <Banknote className="h-3.5 w-3.5 text-emerald-500 shrink-0" aria-hidden />
                <span className="truncate">{t("admin.dashboard.revenuePayments")}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0 rtl-flip" aria-hidden />
            </Link>
            <Link
              to={paths.adminRefunds}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm hover:border-violet-300/80 dark:hover:border-violet-800/80"
            >
              <span className="flex items-center gap-2 min-w-0">
                <RefreshCcw className="h-3.5 w-3.5 text-violet-500 shrink-0" aria-hidden />
                <span className="truncate">{t("admin.dashboard.refundRequests")}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0 rtl-flip" aria-hidden />
            </Link>
            <Link
              to={paths.adminChargebacks}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm hover:border-amber-300/80 dark:hover:border-amber-800/80"
            >
              <span className="flex items-center gap-2 min-w-0">
                <ShieldAlert className="h-3.5 w-3.5 text-amber-600 shrink-0" aria-hidden />
                <span className="truncate">{t("admin.dashboard.chargebacks")}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0 rtl-flip" aria-hidden />
            </Link>
            <Link
              to={paths.adminFinancialSettings}
              className="flex items-center justify-between gap-2 rounded-lg border border-gray-200/80 dark:border-gray-800 bg-white/90 dark:bg-gray-900/90 px-3 py-2.5 text-xs font-bold text-gray-800 dark:text-gray-100 shadow-sm hover:border-emerald-300/80 dark:hover:border-emerald-800/80"
            >
              <span className="flex items-center gap-2 min-w-0">
                <SlidersHorizontal className="h-3.5 w-3.5 text-emerald-600 dark:text-emerald-400 shrink-0" aria-hidden />
                <span className="truncate">{t("admin.dashboard.policiesGuarantee")}</span>
              </span>
              <ArrowRight className="h-3.5 w-3.5 text-gray-300 shrink-0 rtl-flip" aria-hidden />
            </Link>
          </div>
        </div>

        {/* Charts */}
        {!isAnalyticsLoading && !isAnalyticsError && (
          <div className="grid grid-cols-1 xl:grid-cols-2 gap-4">
            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t("admin.dashboard.userCourseGrowth")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <LineChart data={(analytics?.usersGrowth || []).map((u, idx) => ({ month: u.month, users: u.value, courses: analytics?.coursesGrowth?.[idx]?.value || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: i18n.dir() }} />
                    <Line type="monotone" dataKey="users" stroke="#7c3aed" strokeWidth={2} dot={false} name={t("admin.dashboard.usersSeries")} />
                    <Line type="monotone" dataKey="courses" stroke="#f59e0b" strokeWidth={2} dot={false} name={t("admin.dashboard.coursesSeries")} />
                  </LineChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t("admin.dashboard.revenueTrend")}</h2>
              <div className="h-64">
                <ResponsiveContainer width="100%" height="100%">
                  <AreaChart data={analytics?.revenueGrowth || []}>
                    <defs>
                      <linearGradient id="revGrad" x1="0" y1="0" x2="0" y2="1">
                        <stop offset="5%" stopColor="#7c3aed" stopOpacity={0.3} />
                        <stop offset="95%" stopColor="#7c3aed" stopOpacity={0} />
                      </linearGradient>
                    </defs>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis tick={{ fontSize: 11 }} />
                    <Tooltip
                      contentStyle={{ borderRadius: 8, fontSize: 12, direction: i18n.dir() }}
                      formatter={(v) => [
                        new Intl.NumberFormat(i18n.language, {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(v || 0)),
                        t("admin.finance.revenueLabel"),
                      ]}
                    />
                    <Area type="monotone" dataKey="value" stroke="#7c3aed" fill="url(#revGrad)" strokeWidth={2} />
                  </AreaChart>
                </ResponsiveContainer>
              </div>
            </div>

            <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 xl:col-span-2">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">{t("admin.dashboard.enrollmentsVsPayments")}</h2>
              <div className="h-72">
                <ResponsiveContainer width="100%" height="100%">
                  <BarChart data={(analytics?.enrollmentsGrowth || []).map((e, idx) => ({ month: e.month, enrollments: e.value, payments: analytics?.paymentsGrowth?.[idx]?.value || 0 }))}>
                    <CartesianGrid strokeDasharray="3 3" stroke="#e5e7eb" />
                    <XAxis dataKey="month" tick={{ fontSize: 11 }} />
                    <YAxis allowDecimals={false} tick={{ fontSize: 11 }} />
                    <Tooltip contentStyle={{ borderRadius: 8, fontSize: 12, direction: i18n.dir() }} />
                    <Bar dataKey="enrollments" fill="#7c3aed" radius={[4, 4, 0, 0]} name={t("admin.dashboard.enrollments")} />
                    <Bar dataKey="payments" fill="#10b981" radius={[4, 4, 0, 0]} name={t("admin.dashboard.paymentsSeries")} />
                  </BarChart>
                </ResponsiveContainer>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminDashboard;
