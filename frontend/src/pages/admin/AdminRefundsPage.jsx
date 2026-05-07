import { useState, useEffect } from "react";
import { Link } from "react-router-dom";
import { ArrowLeft, RefreshCcw } from "lucide-react";
import { useTranslation } from "react-i18next";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import {
  useAdminRefundRequests,
  useAdminRefundRequest,
  useUpdateAdminRefundRequest,
} from "../../api/refunds";
import { useGetSiteSettings } from "../../api/admin";
import ExportCsvButton from "../../components/admin/ExportCsvButton";

const STATUS_OPTIONS = [
  { value: "all", label: "All" },
  { value: "pending", label: "Pending" },
  { value: "approved", label: "Approved" },
  { value: "processing", label: "Processing" },
  { value: "completed", label: "Completed" },
  { value: "rejected", label: "Rejected" },
  { value: "failed", label: "Failed" },
];

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

export default function AdminRefundsPage() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const [filter, setFilter] = useState("all");
  const [selectedId, setSelectedId] = useState(null);
  const { data, isLoading } = useAdminRefundRequests(filter);
  const { data: detail, isLoading: detailLoading } = useAdminRefundRequest(selectedId);
  const { mutateAsync: updateRefund, isPending: isUpdating } = useUpdateAdminRefundRequest();
  const { siteSettings } = useGetSiteSettings();
  const policyMaxPct = Math.min(100, Math.max(1, siteSettings?.refundPercent ?? 100));
  const [approvePercent, setApprovePercent] = useState(100);

  const requests = data?.requests || [];

  useEffect(() => {
    if (detail?.request?.refundPercent != null) {
      setApprovePercent(detail.request.refundPercent);
    }
  }, [selectedId, detail?.request?._id, detail?.request?.refundPercent]);

  const onApprove = () => {
    if (!selectedId) return;
    const rp = Math.min(policyMaxPct, Math.max(1, Math.round(Number(approvePercent) || 1)));
    return updateRefund({ id: selectedId, body: { action: "approve", refundPercent: rp } });
  };
  const onReject = () => {
    if (!selectedId) return;
    const note = window.prompt(t("admin.refunds.optionalNote"));
    return updateRefund({
      id: selectedId,
      body: { action: "reject", rejectionNote: note || "" },
    });
  };
  const onRetry = () => {
    if (!selectedId) return;
    const rp = Math.min(policyMaxPct, Math.max(1, Math.round(Number(approvePercent) || 1)));
    return updateRefund({ id: selectedId, body: { action: "retry", refundPercent: rp } });
  };
  const onSaveNotes = (internalNotes) => {
    if (!selectedId) return;
    return updateRefund({ id: selectedId, body: { action: "add_note", internalNotes } });
  };

  return (
    <AccountSettingsLayout
      title={t("accountNav.refunds")}
      subtitle={t("admin.refunds.subtitle")}
      navItems={getAccountNavItems(user)}
    >
      <Link
        to={paths.admin}
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        {t("accountNav.overview")}
      </Link>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 overflow-hidden">
          <div className="px-4 py-3 border-b border-gray-100 dark:border-gray-800 flex items-center justify-between gap-3 flex-wrap">
            <div className="flex items-center gap-2">
              <RefreshCcw className="w-4 h-4 text-brand-500" />
              <span className="font-bold text-gray-900 dark:text-white">{t("admin.dashboard.refundRequests")}</span>
            </div>
            <div className="flex items-center gap-2 flex-wrap justify-end">
              <ExportCsvButton exportKey="refunds" params={{ status: filter }} label={t("admin.refunds.exportCsv")} />
              <select
              value={filter}
              onChange={(e) => setFilter(e.target.value)}
              className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-2 py-1"
            >
              {STATUS_OPTIONS.map((o) => (
                <option key={o.value} value={o.value}>
                  {o.label}
                </option>
              ))}
            </select>
          </div>
          </div>
          {isLoading ? (
            <div className="p-8 text-center text-gray-500 text-sm">{t("commonActions.loading")}</div>
          ) : requests.length === 0 ? (
            <div className="p-8 text-center text-gray-500 text-sm">{t("admin.refunds.noRequests")}</div>
          ) : (
            <div className="overflow-x-auto max-h-[min(70vh,520px)] overflow-y-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 dark:bg-gray-900/60 border-b border-gray-100 dark:border-gray-800 sticky top-0 z-10">
                  <tr>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.finance.date")}</th>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.finance.student")}</th>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300 min-w-[140px]">{t("admin.finance.course")}</th>
                    <th className="text-end p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.finance.amount")}</th>
                    <th className="text-start p-3 font-semibold text-gray-600 dark:text-gray-300">{t("admin.refunds.status")}</th>
                  </tr>
                </thead>
                <tbody>
                  {requests.map((r) => {
                    const isSelected = selectedId === r._id;
                    const cur = (r.currency || "usd").toUpperCase();
                    const fmtAmount = () => {
                      const n = Number(r.refundAmount);
                      if (Number.isNaN(n)) return `${r.refundAmount} ${r.currency || ""}`.trim();
                      try {
                        return new Intl.NumberFormat(i18n.language, {
                          style: "currency",
                          currency: cur.length === 3 ? cur : "USD",
                        }).format(n);
                      } catch {
                        return `${r.refundAmount} ${r.currency || ""}`.trim();
                      }
                    };
                    return (
                      <tr
                        key={r._id}
                        tabIndex={0}
                        onClick={() => setSelectedId(r._id)}
                        onKeyDown={(e) => {
                          if (e.key === "Enter" || e.key === " ") {
                            e.preventDefault();
                            setSelectedId(r._id);
                          }
                        }}
                        className={`border-b border-gray-100 dark:border-gray-800 cursor-pointer hover:bg-gray-50 dark:hover:bg-gray-800/40 ${
                          isSelected ? "bg-brand-50/70 dark:bg-brand-900/15" : ""
                        }`}
                      >
                        <td className="p-3 whitespace-nowrap text-gray-700 dark:text-gray-200 align-top">
                          {r.createdAt ? new Date(r.createdAt).toLocaleString(i18n.language) : t("admin.finance.na")}
                        </td>
                        <td className="p-3 align-top">
                          <div className="font-medium text-gray-800 dark:text-white">
                            {r.student?.name || t("admin.finance.na")}
                          </div>
                          {r.student?.email && (
                            <div className="text-xs text-gray-400 dark:text-gray-500 truncate max-w-[200px]">
                              {r.student.email}
                            </div>
                          )}
                        </td>
                        <td className="p-3 align-top">
                          <span className="text-brand-700 dark:text-brand-300 font-medium line-clamp-2">
                            {r.course?.title || t("student.refunds.courseFallback")}
                          </span>
                        </td>
                        <td className="p-3 text-end font-semibold text-gray-900 dark:text-white whitespace-nowrap align-top">
                          {fmtAmount()}
                        </td>
                        <td className="p-3 align-top whitespace-nowrap">
                          <StatusBadge status={r.status} />
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>

        <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 min-h-[240px]">
          {!selectedId && (
            <p className="text-sm text-gray-500 dark:text-gray-400">{t("admin.refunds.selectRequest")}</p>
          )}
          {selectedId && detailLoading && <p className="text-sm text-gray-500">{t("admin.refunds.loadingDetail")}</p>}
          {selectedId && !detailLoading && detail?.request && (
            <div className="space-y-4">
              <div>
                <h3 className="text-lg font-bold text-gray-900 dark:text-white">
                  {detail.request.course?.title || t("student.refunds.courseFallback")}
                </h3>
                <p className="text-sm text-gray-500 mt-0.5">
                  {detail.request.student?.name}
                  {detail.request.student?.email
                    ? ` · ${detail.request.student.email}`
                    : ""}
                </p>
                <div className="mt-2 flex flex-wrap gap-2 items-center">
                  <StatusBadge status={detail.request.status} />
                  <span className="text-sm text-gray-600 dark:text-gray-300">
                    {detail.request.refundAmount} {detail.request.currency} ({detail.request.refundPercent}
                    %)
                  </span>
                </div>
              </div>

              <div className="text-sm space-y-1">
                <p>
                  <span className="text-gray-500">{t("admin.refunds.progressAtRequest")}</span>{" "}
                  {detail.request.progressAtRequest}%
                </p>
                {detail.request.payment?.paidAt && (
                  <p>
                    <span className="text-gray-500">{t("admin.refunds.paid")}</span>{" "}
                    {new Date(detail.request.payment.paidAt).toLocaleString(i18n.language)}
                  </p>
                )}
                {detail.request.payment?.stripePaymentIntentId && (
                  <p className="text-xs font-mono break-all text-gray-500">
                    PI: {detail.request.payment.stripePaymentIntentId}
                  </p>
                )}
                {detail.request.reason && (
                  <p>
                    <span className="text-gray-500">{t("admin.refunds.studentReason")}</span> {detail.request.reason}
                  </p>
                )}
                {detail.request.failureMessage && (
                  <p className="text-red-600 dark:text-red-400 text-sm">{detail.request.failureMessage}</p>
                )}
              </div>

              <div>
                <p className="text-xs font-medium text-gray-500 mb-1">{t("admin.refunds.internalNotes")}</p>
                <textarea
                  key={selectedId}
                  defaultValue={detail.request.internalNotes || ""}
                  rows={3}
                  className="w-full text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                  onBlur={(e) => {
                    const v = e.target.value;
                    if (v !== (detail.request.internalNotes || "")) onSaveNotes(v);
                  }}
                />
              </div>

              {(detail.request.status === "pending" || detail.request.status === "failed") && (
                <div className="max-w-xs">
                  <label
                    className="block text-xs font-medium text-gray-500 mb-1"
                    htmlFor="admin-refund-pct"
                  >
                    {t("admin.refunds.refundPercentCap", { cap: policyMaxPct })}
                  </label>
                  <input
                    id="admin-refund-pct"
                    type="number"
                    min={1}
                    max={policyMaxPct}
                    value={approvePercent}
                    onChange={(e) => setApprovePercent(e.target.value)}
                    className="w-full h-9 px-2 text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900"
                  />
                </div>
              )}

              <div className="flex flex-wrap gap-2 pt-2">
                {detail.request.status === "pending" && (
                  <>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onApprove()}
                      className="px-3 py-1.5 rounded-lg bg-emerald-600 text-white text-sm font-medium hover:bg-emerald-700 disabled:opacity-50"
                    >
                      {t("admin.refunds.approveRefund")}
                    </button>
                    <button
                      type="button"
                      disabled={isUpdating}
                      onClick={() => onReject()}
                      className="px-3 py-1.5 rounded-lg border border-red-200 text-red-700 dark:text-red-300 text-sm font-medium hover:bg-red-50 dark:hover:bg-red-900/20 disabled:opacity-50"
                    >
                      {t("admin.refunds.reject")}
                    </button>
                  </>
                )}
                {detail.request.status === "failed" && (
                  <button
                    type="button"
                    disabled={isUpdating}
                    onClick={() => onRetry()}
                    className="px-3 py-1.5 rounded-lg bg-brand-600 text-white text-sm font-medium hover:bg-brand-700 disabled:opacity-50"
                  >
                    {t("admin.refunds.retry")}
                  </button>
                )}
              </div>

              {Array.isArray(detail.auditLogs) && detail.auditLogs.length > 0 && (
                <div className="border-t border-gray-100 dark:border-gray-800 pt-3 mt-2">
                  <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">{t("admin.refunds.audit")}</p>
                  <ul className="space-y-2 text-xs text-gray-600 dark:text-gray-400 max-h-40 overflow-y-auto">
                    {detail.auditLogs.map((log) => (
                      <li key={log._id}>
                        <span className="text-gray-400">
                          {log.createdAt ? new Date(log.createdAt).toLocaleString(i18n.language) : ""}
                        </span>{" "}
                        <span className="font-medium text-gray-700 dark:text-gray-200">{log.action}</span>
                        {log.details ? ` — ${log.details}` : ""}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </AccountSettingsLayout>
  );
}
