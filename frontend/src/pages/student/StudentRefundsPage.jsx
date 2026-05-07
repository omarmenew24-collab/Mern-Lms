import { Link, Navigate } from "react-router-dom";
import { ArrowRight, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import { useMyRefundRequests } from "../../api/refunds";

function StatusBadge({ status }) {
  const tone =
    status === "completed"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : status === "failed" || status === "rejected"
        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
        : status === "pending"
          ? "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200"
          : "bg-gray-100 text-gray-800 dark:bg-gray-800 dark:text-gray-200";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}

export default function StudentRefundsPage() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const { data, isLoading } = useMyRefundRequests();

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  const requests = data?.requests || [];

  return (
    <AccountSettingsLayout
      title={t("student.refunds.title")}
      subtitle={t("student.refunds.subtitle")}
      navItems={getAccountNavItems(user)}
    >
      <p className="text-sm text-gray-600 dark:text-gray-400 mb-6">
        {t("student.refunds.intro")}
      </p>

      {isLoading ? (
        <div className="text-sm text-gray-500">{t("student.refunds.loading")}</div>
      ) : requests.length === 0 ? (
        <div className="rounded-xl border border-dashed border-gray-200 dark:border-gray-700 p-8 text-center">
          <RefreshCcw className="w-8 h-8 text-gray-300 dark:text-gray-600 mx-auto mb-2" />
          <p className="text-sm text-gray-500">{t("student.refunds.empty")}</p>
          <Link
            to={paths.student}
            className="inline-flex items-center gap-1 text-sm font-medium text-brand-600 mt-3 hover:underline"
          >
            {t("student.refunds.goCourses")} <ArrowRight className="w-3.5 h-3.5 rtl-flip" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {requests.map((r) => (
            <li
              key={r._id}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 px-4 py-3 flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2"
            >
              <div>
                <p className="text-sm font-semibold text-gray-900 dark:text-white">
                  {r.course?.title || t("student.refunds.courseFallback")}
                </p>
                <p className="text-xs text-gray-500">
                  {r.createdAt ? new Date(r.createdAt).toLocaleString(i18n.language) : ""} · {r.refundPercent ?? 100}
                  % {t("student.refunds.ofPrice")} (≈ {r.refundAmount} {r.currency || ""})
                </p>
                {r.failureMessage && (
                  <p className="text-xs text-red-600 dark:text-red-400 mt-1">{r.failureMessage}</p>
                )}
              </div>
              <div className="flex items-center gap-3">
                <StatusBadge status={r.status} />
                {r.course?._id && (
                  <Link
                    to={paths.courseWorkspace(r.course._id)}
                    className="text-sm font-medium text-brand-600 hover:underline"
                  >
                    {t("student.refunds.openCourse")}
                  </Link>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </AccountSettingsLayout>
  );
}
