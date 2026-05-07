import React, { useState } from "react";
import { Link, Navigate, useNavigate } from "react-router-dom";
import { ArrowLeft, ShieldAlert } from "lucide-react";
import { useTranslation } from "react-i18next";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import { useAdminChargebacks, useCreateChargeback } from "../../api/chargebacks";
import ExportCsvButton from "../../components/admin/ExportCsvButton";

function StatusBadge({ status }) {
  const tone =
    status === "won"
      ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-900/40 dark:text-emerald-200"
      : status === "lost"
        ? "bg-red-100 text-red-800 dark:bg-red-900/40 dark:text-red-200"
        : status === "submitted"
          ? "bg-blue-100 text-blue-800 dark:bg-blue-900/40 dark:text-blue-200"
          : "bg-amber-100 text-amber-900 dark:bg-amber-900/40 dark:text-amber-200";
  return (
    <span className={`inline-flex rounded-md px-2 py-0.5 text-xs font-semibold capitalize ${tone}`}>
      {status}
    </span>
  );
}

export default function AdminChargebacksPage() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const navigate = useNavigate();
  const [filter, setFilter] = useState("all");
  const [paymentId, setPaymentId] = useState("");
  const [stripeDisputeId, setStripeDisputeId] = useState("");
  const [dateOpened, setDateOpened] = useState(() => new Date().toISOString().slice(0, 10));

  const { data, isLoading } = useAdminChargebacks(filter);
  const { mutateAsync: createCb, isPending: isCreating } = useCreateChargeback();

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  const rows = data?.chargebacks || [];
  const statusFilters = [
    { value: "all", label: t("admin.chargebacks.allStatuses") },
    { value: "open", label: t("admin.chargebacks.statusOpen") },
    { value: "submitted", label: t("admin.chargebacks.statusSubmitted") },
    { value: "won", label: t("admin.chargebacks.statusWon") },
    { value: "lost", label: t("admin.chargebacks.statusLost") },
  ];

  const onRecord = async (e) => {
    e.preventDefault();
    if (!paymentId.trim()) return;
    const body = {
      paymentId: paymentId.trim(),
      dateOpened: dateOpened ? new Date(dateOpened).toISOString() : undefined,
    };
    if (stripeDisputeId.trim()) body.stripeDisputeId = stripeDisputeId.trim();
    const res = await createCb(body);
    const id = res?.chargeback?._id;
    if (id) navigate(paths.adminChargeback(id));
  };

  return (
    <AccountSettingsLayout
      title={t("accountNav.chargebacks")}
      subtitle={t("admin.chargebacks.subtitle")}
      navItems={getAccountNavItems(user)}
    >
      <Link
        to={paths.admin}
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        {t("accountNav.overview")}
      </Link>

      <form
        onSubmit={onRecord}
        className="rounded-xl border border-dashed border-gray-300 dark:border-gray-700 bg-gray-50/80 dark:bg-gray-900/40 p-4 mb-6 space-y-3"
      >
        <div className="flex items-center gap-2 text-sm font-bold text-gray-900 dark:text-white">
          <ShieldAlert className="w-4 h-4 text-amber-600" />
          {t("admin.chargebacks.recordManual")}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400">
          {t("admin.chargebacks.recordHint")} <code className="text-xs">charge.dispute.created</code>.
        </p>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-3 items-end">
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1" htmlFor="pay-id">
              {t("admin.chargebacks.paymentId")}
            </label>
            <input
              id="pay-id"
              value={paymentId}
              onChange={(e) => setPaymentId(e.target.value)}
              placeholder={t("admin.chargebacks.paymentIdPlaceholder")}
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 font-mono"
              required
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1" htmlFor="disp-id">
              {t("admin.chargebacks.disputeId")}
            </label>
            <input
              id="disp-id"
              value={stripeDisputeId}
              onChange={(e) => setStripeDisputeId(e.target.value)}
              placeholder={t("admin.chargebacks.disputeIdPlaceholder")}
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2 font-mono"
            />
          </div>
          <div>
            <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1" htmlFor="opened">
              {t("admin.chargebacks.dateOpened")}
            </label>
            <input
              id="opened"
              type="date"
              value={dateOpened}
              onChange={(e) => setDateOpened(e.target.value)}
              className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            />
          </div>
          <button
            type="submit"
            disabled={isCreating || !paymentId.trim()}
            className="h-10 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 text-sm font-semibold px-4 hover:opacity-90 disabled:opacity-50"
          >
            {isCreating ? t("admin.chargebacks.saving") : t("admin.chargebacks.createOpen")}
          </button>
        </div>
      </form>

      <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-4 mb-4">
        <div className="flex flex-col sm:flex-row sm:items-end gap-3">
          <div>
            <label className="block text-xs font-medium text-gray-500 dark:text-gray-400 mb-1" htmlFor="cb-filter">
              {t("admin.chargebacks.filter")}
            </label>
            <select
              id="cb-filter"
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
            >
              {statusFilters.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          <ExportCsvButton exportKey="chargebacks" params={{ status: filter }} label={t("admin.chargebacks.exportCsv")} />
        </div>
      </div>

      <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
        <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center gap-2">
          <ShieldAlert className="w-4 h-4 text-amber-500" />
          <span className="font-bold text-gray-900 dark:text-white">{t("admin.chargebacks.allCases")}</span>
        </div>
        {isLoading ? (
          <div className="p-8 text-center text-gray-500 text-sm">{t("commonActions.loading")}</div>
        ) : rows.length === 0 ? (
          <div className="p-8 text-center text-gray-500 text-sm">{t("admin.chargebacks.noCases")}</div>
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800">
                <tr>
                  <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.chargebacks.opened")}</th>
                  <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.chargebacks.orderPi")}</th>
                  <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.finance.student")}</th>
                  <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.finance.course")}</th>
                  <th className="text-end p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.finance.amount")}</th>
                  <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.refunds.status")}</th>
                </tr>
              </thead>
              <tbody>
                {rows.map((r) => (
                  <tr
                    key={r._id}
                    className="border-b border-gray-100 dark:border-gray-800 hover:bg-gray-50 dark:hover:bg-gray-800/40"
                  >
                    <td className="p-3 whitespace-nowrap text-gray-700 dark:text-gray-200">
                      {r.dateOpened ? new Date(r.dateOpened).toLocaleString(i18n.language) : t("admin.finance.na")}
                    </td>
                    <td className="p-3 font-mono text-xs text-brand-700 dark:text-brand-300 max-w-[140px] truncate">
                      <Link to={paths.adminChargeback(r._id)} className="hover:underline font-semibold">
                        {r.orderLabel || t("admin.finance.na")}
                      </Link>
                    </td>
                    <td className="p-3">
                      <div className="font-medium text-gray-900 dark:text-white">{r.user?.name || t("admin.finance.na")}</div>
                      <div className="text-xs text-gray-400 truncate max-w-[180px]">{r.user?.email}</div>
                    </td>
                    <td className="p-3 text-gray-800 dark:text-gray-200 max-w-[200px] truncate">
                      {r.course?.title || t("admin.finance.na")}
                    </td>
                    <td className="p-3 text-end font-semibold whitespace-nowrap">
                      {r.amount} {(r.currency || "usd").toUpperCase()}
                    </td>
                    <td className="p-3 whitespace-nowrap">
                      <Link to={paths.adminChargeback(r._id)}>
                        <StatusBadge status={r.status} />
                      </Link>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </AccountSettingsLayout>
  );
}
