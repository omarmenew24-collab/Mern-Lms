import { useNavigate, Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import { Banknote, ArrowLeft, RefreshCcw, SlidersHorizontal, ChevronRight, ShieldCheck, ShieldAlert } from "lucide-react";
import { useGetAdminFinancePayments } from "../../api/payment";
import { useGetFinanceOverview } from "../../api/admin";
import { paths } from "../../config/paths";
import ExportCsvButton from "../../components/admin/ExportCsvButton";
import {
  ResponsiveContainer,
  AreaChart,
  Area,
  CartesianGrid,
  XAxis,
  YAxis,
  Tooltip,
  BarChart,
  Bar,
  PieChart,
  Pie,
  Cell,
  Legend,
} from "recharts";

export default function AdminFinance() {
  const { t, i18n } = useTranslation();
  const { dateTime } = useFormatter();
  const navigate = useNavigate();
  const { payments, isLoading, isError, error } = useGetAdminFinancePayments(200);
  const {
    financeOverview,
    isLoading: isOverviewLoading,
    isError: isOverviewError,
  } = useGetFinanceOverview(12, 8);

  const summary = financeOverview?.summary || {
    totalRevenue: 0,
    totalTransactions: 0,
    avgOrderValue: 0,
  };
  const monthlySeries = financeOverview?.monthlySeries || [];
  const topCourses = financeOverview?.topCourses || [];
  const COLORS = ["#2563eb", "#10b981", "#f59e0b", "#8b5cf6", "#ef4444", "#06b6d4", "#f97316", "#84cc16"];

  return (
    <div className="min-h-screen p-6 bg-gray-50 dark:bg-gray-950">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center gap-4">
          <button
            type="button"
            onClick={() => navigate(paths.admin)}
            className="p-2 rounded-lg bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
            aria-label={t("commonActions.back")}
          >
            <ArrowLeft className="w-5 h-5 text-gray-700 dark:text-gray-200 rtl-flip" />
          </button>
          <div className="flex items-center gap-3">
            <Banknote className="text-emerald-600" size={32} />
            <div>
              <h1 className="text-2xl font-extrabold text-gray-900 dark:text-white tracking-tight">{t("admin.dashboard.finance")}</h1>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t("admin.finance.recentPayments")}
              </p>
            </div>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Link
            to={paths.adminRefunds}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 text-start shadow-sm hover:border-brand-300 dark:hover:border-brand-700 hover:shadow-md transition-all"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-violet-50 dark:bg-violet-950/40 text-violet-600 dark:text-violet-300">
              <RefreshCcw className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("admin.dashboard.refundRequests")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {t("admin.finance.refundQueueHint")}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-brand-500 shrink-0 mt-0.5 rtl-flip" aria-hidden />
          </Link>
          <Link
            to={paths.adminFinancialSettings}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 text-start shadow-sm hover:border-emerald-300 dark:hover:border-emerald-800 hover:shadow-md transition-all"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-emerald-50 dark:bg-emerald-950/40 text-emerald-600 dark:text-emerald-300">
              <div className="flex items-center gap-0.5" aria-hidden>
                <SlidersHorizontal className="h-4 w-4" />
                <ShieldCheck className="h-4 w-4 -ms-1" />
              </div>
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("accountNav.financialPolicy")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {t("admin.finance.policyHint")}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-emerald-500 shrink-0 mt-0.5 rtl-flip" aria-hidden />
          </Link>
          <Link
            to={paths.adminChargebacks}
            className="group flex items-start gap-4 rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4 sm:p-5 text-start shadow-sm hover:border-amber-300 dark:hover:border-amber-800 hover:shadow-md transition-all"
          >
            <div className="flex h-11 w-11 shrink-0 items-center justify-center rounded-xl bg-amber-50 dark:bg-amber-950/40 text-amber-700 dark:text-amber-300">
              <ShieldAlert className="h-5 w-5" aria-hidden />
            </div>
            <div className="min-w-0 flex-1">
              <h2 className="text-sm font-bold text-gray-900 dark:text-white">{t("admin.dashboard.chargebacks")}</h2>
              <p className="text-xs text-gray-500 dark:text-gray-400 mt-1 leading-relaxed">
                {t("admin.finance.chargebackHint")}
              </p>
            </div>
            <ChevronRight className="h-5 w-5 text-gray-300 group-hover:text-amber-500 shrink-0 mt-0.5 rtl-flip" aria-hidden />
          </Link>
        </div>

        {!isOverviewLoading && !isOverviewError && (
          <>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("admin.finance.totalRevenue")}
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {new Intl.NumberFormat(i18n.language, {
                    style: "currency",
                    currency: "USD",
                  }).format(Number(summary.totalRevenue || 0))}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("admin.finance.totalTransactions")}
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {new Intl.NumberFormat(i18n.language).format(summary.totalTransactions || 0)}
                </p>
              </div>
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-4">
                <p className="text-xs uppercase tracking-wide text-gray-500 dark:text-gray-400">
                  {t("admin.finance.averageOrderValue")}
                </p>
                <p className="text-2xl font-black text-gray-900 dark:text-white mt-1">
                  {new Intl.NumberFormat(i18n.language, {
                    style: "currency",
                    currency: "USD",
                  }).format(Number(summary.avgOrderValue || 0))}
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                  {t("admin.finance.monthlyRevenue")}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <AreaChart data={monthlySeries}>
                      <defs>
                        <linearGradient id="financeRev" x1="0" y1="0" x2="0" y2="1">
                          <stop offset="5%" stopColor="#10b981" stopOpacity={0.7} />
                          <stop offset="95%" stopColor="#10b981" stopOpacity={0.05} />
                        </linearGradient>
                      </defs>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="month" />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ direction: i18n.dir(), borderRadius: 8 }}
                        formatter={(value) => [
                          new Intl.NumberFormat(i18n.language, {
                            style: "currency",
                            currency: "USD",
                          }).format(Number(value || 0)),
                          t("admin.finance.revenueLabel"),
                        ]}
                      />
                      <Area
                        type="monotone"
                        dataKey="revenue"
                        stroke="#10b981"
                        fill="url(#financeRev)"
                        strokeWidth={3}
                      />
                    </AreaChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                  {t("admin.finance.topCoursesRevenue")}
                </h2>
                <div className="h-72">
                  <ResponsiveContainer width="100%" height="100%">
                    <BarChart data={topCourses}>
                      <CartesianGrid strokeDasharray="3 3" />
                      <XAxis dataKey="courseTitle" hide />
                      <YAxis />
                      <Tooltip
                        contentStyle={{ direction: i18n.dir(), borderRadius: 8 }}
                        formatter={(value) => [
                          new Intl.NumberFormat(i18n.language, {
                            style: "currency",
                            currency: "USD",
                          }).format(Number(value || 0)),
                          t("admin.finance.revenueLabel"),
                        ]}
                        labelFormatter={(label, payload) =>
                          payload?.[0]?.payload?.courseTitle || label
                        }
                      />
                      <Legend />
                      <Bar dataKey="revenue" fill="#2563eb" name={t("admin.finance.revenueLabel")} />
                    </BarChart>
                  </ResponsiveContainer>
                </div>
              </div>

              <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-5 xl:col-span-2">
                <h2 className="text-sm font-bold text-gray-900 dark:text-white mb-4">
                  {t("admin.finance.revenueShare")}
                </h2>
                <div className="h-80">
                  <ResponsiveContainer width="100%" height="100%">
                    <PieChart>
                      <Pie
                        data={topCourses}
                        dataKey="revenue"
                        nameKey="courseTitle"
                        outerRadius={120}
                        label
                      >
                        {topCourses.map((entry, index) => (
                          <Cell key={`${entry.courseId}-${index}`} fill={COLORS[index % COLORS.length]} />
                        ))}
                      </Pie>
                      <Tooltip
                        contentStyle={{ direction: i18n.dir(), borderRadius: 8 }}
                        formatter={(value) => new Intl.NumberFormat(i18n.language, {
                          style: "currency",
                          currency: "USD",
                        }).format(Number(value || 0))}
                      />
                      <Legend />
                    </PieChart>
                  </ResponsiveContainer>
                </div>
              </div>
            </div>
          </>
        )}

        {isOverviewLoading && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-gray-500 dark:text-gray-400">
            {t("admin.finance.loadingCharts")}
          </div>
        )}
        {isOverviewError && (
          <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 rounded-xl p-6 text-red-600">
            {t("admin.finance.failedCharts")}
          </div>
        )}

        {isLoading && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl p-8 text-gray-500 dark:text-gray-400">
            {t("admin.finance.loadingPayments")}
          </div>
        )}
        {isError && (
          <div className="bg-white dark:bg-gray-900 border border-red-200 dark:border-red-900 rounded-xl p-6 text-red-600">
            {error?.response?.data?.message || t("admin.finance.failedPayments")}
          </div>
        )}

        {!isLoading && !isError && (
          <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
            <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2 px-4 py-3 border-b border-gray-100 dark:border-gray-800 bg-gray-50/80 dark:bg-gray-900/60">
              <p className="text-xs text-gray-500 dark:text-gray-400 max-w-xl">
                {t("admin.finance.tableHint")}
              </p>
              <div className="flex flex-wrap gap-2 justify-end">
                <ExportCsvButton exportKey="payments" params={{ limit: 5000 }} label={t("admin.finance.paymentsCsv")} />
                <ExportCsvButton exportKey="enrollments" label={t("admin.finance.enrollmentsCsv")} />
              </div>
            </div>
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                  <tr>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300 max-w-[100px]">
                      {t("admin.finance.paymentId")}
                    </th>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">
                      {t("admin.finance.date")}
                    </th>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">
                      {t("admin.finance.student")}
                    </th>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">
                      {t("admin.finance.course")}
                    </th>
                    <th className="text-end p-3 font-semibold text-gray-600 dark:text-gray-300">
                      {t("admin.finance.amount")}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {payments.length === 0 ? (
                    <tr>
                      <td
                        colSpan={5}
                        className="p-8 text-center text-gray-400 dark:text-gray-500 italic"
                      >
                        {t("admin.finance.noPayments")}
                      </td>
                    </tr>
                  ) : (
                    payments.map((p) => (
                      <tr key={p._id || p.paymentIntentId} className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40">
                        <td className="p-3 align-top max-w-[140px]">
                          <code className="text-[10px] leading-tight text-gray-600 dark:text-gray-400 break-all select-all">
                            {p._id || t("admin.finance.na")}
                          </code>
                        </td>
                        <td className="p-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                          {p.paidAt
                            ? dateTime(p.paidAt)
                            : t("admin.finance.na")}
                        </td>
                        <td className="p-3">
                          <div className="font-medium text-gray-800 dark:text-white">
                            {p.studentName}
                          </div>
                          {p.studentEmail && (
                            <div className="text-xs text-gray-400 dark:text-gray-500">
                              {p.studentEmail}
                            </div>
                          )}
                        </td>
                        <td className="p-3">
                          <button
                            type="button"
                            onClick={() =>
                              navigate(paths.adminCourse(p.courseId))
                            }
                            className="text-start text-brand-600 dark:text-brand-400 font-medium hover:underline"
                          >
                            {p.courseTitle}
                          </button>
                        </td>
                        <td className="p-3 text-end font-semibold text-gray-900 dark:text-white">
                          {new Intl.NumberFormat(i18n.language, {
                            style: "currency",
                            currency: (p.currency || "usd").toUpperCase(),
                          }).format(Number(p.amount || 0))}
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
