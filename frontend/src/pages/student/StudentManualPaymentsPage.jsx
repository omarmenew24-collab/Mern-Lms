import { Link, Navigate } from "react-router-dom";
import {
  CheckCircle2,
  Clock3,
  XCircle,
  RefreshCw,
  ArrowRight,
  Landmark,
} from "lucide-react";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import useUserStore from "../../store/userstore";
import { useMyManualPaymentOrders } from "../../api/manualPayment";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import { paths } from "../../config/paths";

export default function StudentManualPaymentsPage() {
  const { t } = useTranslation();
  const { money } = useFormatter();
  const user = useUserStore((s) => s.user);
  const { data: orders = [], isLoading } = useMyManualPaymentOrders(Boolean(user?._id));

  const displayName = user?.name || user?.email || "Student";
  const statusMeta = {
    awaiting_proof: {
      label: t("student.manualPayments.awaitingProof"),
      icon: Clock3,
      className: "text-amber-600 dark:text-amber-400 bg-amber-50 dark:bg-amber-950/30",
    },
    awaiting_verification: {
      label: t("student.manualPayments.awaitingVerification"),
      icon: RefreshCw,
      className: "text-blue-600 dark:text-blue-400 bg-blue-50 dark:bg-blue-950/30",
    },
    approved: {
      label: t("student.manualPayments.approved"),
      icon: CheckCircle2,
      className: "text-emerald-600 dark:text-emerald-400 bg-emerald-50 dark:bg-emerald-950/30",
    },
    rejected: {
      label: t("student.manualPayments.rejectedResubmit"),
      icon: XCircle,
      className: "text-red-600 dark:text-red-400 bg-red-50 dark:bg-red-950/30",
    },
  };

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  return (
    <AccountSettingsLayout
      title={t("student.manualPayments.title")}
      subtitle={t("student.manualPayments.subtitle", { name: displayName })}
      navItems={getAccountNavItems(user)}
    >
      {isLoading ? (
        <div className="space-y-3">
          {[1, 2].map((i) => (
            <div
              key={i}
              className="animate-pulse rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 h-24"
            />
          ))}
        </div>
      ) : orders.length === 0 ? (
        <div className="text-center py-16 rounded-xl border border-dashed border-gray-200 dark:border-gray-800">
          <Landmark className="mx-auto text-gray-300 dark:text-gray-600 mb-3" size={36} />
          <p className="text-gray-500 dark:text-gray-400 text-sm mb-4">{t("student.manualPayments.empty")}</p>
          <Link
            to={paths.home}
            className="inline-flex items-center gap-1 text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
          >
            {t("student.manualPayments.browseCourses")} <ArrowRight className="w-4 h-4 rtl-flip" />
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {orders.map((o) => {
            const meta = statusMeta[o.status] || statusMeta.awaiting_proof;
            const Icon = meta.icon;
            const cid = o.course?._id || o.course;
            return (
              <li
                key={o._id}
                className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5"
              >
                <div className="flex flex-wrap items-start justify-between gap-3">
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      {o.course?.title || t("student.manualPayments.courseFallback")}
                    </p>
                    <p className="text-xs font-mono text-gray-500 mt-1">{o.orderNumber}</p>
                    <p className="text-sm text-gray-600 dark:text-gray-400 mt-2">
                      {o.paymentMethod?.name || t("student.manualPayments.paymentMethodFallback")} ·{" "}
                      {typeof o.amount === "number" ? money(o.amount) : ""}
                    </p>
                  </div>
                  <span
                    className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-bold ${meta.className}`}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {meta.label}
                  </span>
                </div>
                <div className="mt-4 flex flex-wrap gap-2">
                  {o.status === "awaiting_proof" || o.status === "rejected" ? (
                    <Link
                      to={paths.checkoutCourse(cid)}
                      className="inline-flex h-9 items-center rounded-lg bg-brand-600 px-4 text-xs font-semibold text-white hover:bg-brand-700"
                    >
                      {o.status === "rejected"
                        ? t("student.manualPayments.submitNewProof")
                        : t("student.manualPayments.continueCheckout")}
                    </Link>
                  ) : null}
                  {o.status === "approved" && cid ? (
                    <Link
                      to={paths.courseWorkspace(cid)}
                      className="inline-flex h-9 items-center rounded-lg border border-gray-200 dark:border-gray-700 px-4 text-xs font-semibold text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800"
                    >
                      {t("student.manualPayments.openCourse")}
                    </Link>
                  ) : null}
                </div>
              </li>
            );
          })}
        </ul>
      )}
    </AccountSettingsLayout>
  );
}
