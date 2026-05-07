import { useState } from "react";
import { Link } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { Check, Landmark, ListChecks, Plus, ShieldAlert, X } from "lucide-react";
import {
  useAdminManualPaymentOrders,
  useAdminManualPaymentMethods,
  useApproveManualPaymentOrder,
  useRejectManualPaymentOrder,
  useSaveManualPaymentMethod,
} from "../../api/manualPayment";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import ExportCsvButton from "../../components/admin/ExportCsvButton";

function ReceiptPreview({ url, mime }) {
  const { t } = useTranslation();
  if (!url) return <span className="text-gray-500 text-sm">—</span>;
  const isImg = typeof mime === "string" && mime.startsWith("image/");
  if (isImg) {
    return (
      <a href={url} target="_blank" rel="noopener noreferrer" className="block">
        <img src={url} alt={t("manualPaymentsAdmin.receiptAlt")} className="max-h-40 rounded-lg border border-gray-200 dark:border-gray-700 object-contain" />
      </a>
    );
  }
  return (
    <a
      href={url}
      target="_blank"
      rel="noopener noreferrer"
      className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
    >
      {t("manualPaymentsAdmin.openFile")}
    </a>
  );
}

export default function AdminManualPaymentsPage() {
  const { t, i18n } = useTranslation();
  const user = useUserStore((s) => s.user);
  const [tab, setTab] = useState("queue");
  const [filter, setFilter] = useState("pending");

  const { data: orders = [], isLoading } = useAdminManualPaymentOrders(filter);
  const { data: methods = [], isLoading: methodsLoading } = useAdminManualPaymentMethods();

  const { mutateAsync: approve, isPending: approving } = useApproveManualPaymentOrder();
  const { mutateAsync: reject, isPending: rejecting } = useRejectManualPaymentOrder();
  const { mutateAsync: saveMethod, isPending: savingMethod } = useSaveManualPaymentMethod();

  const [rejectOrderId, setRejectOrderId] = useState(null);
  const [rejectReason, setRejectReason] = useState("");

  const [methodForm, setMethodForm] = useState(null);

  const exportManualStatus =
    filter === "pending" ? "awaiting_verification" : filter;
  const filterLabels = {
    pending: t("manualPaymentsAdmin.pending"),
    all: t("manualPaymentsAdmin.all"),
    approved: t("manualPaymentsAdmin.approved"),
    rejected: t("manualPaymentsAdmin.rejected"),
  };
  const statusLabel = (status) => {
    const labels = {
      awaiting_proof: t("student.manualPayments.awaitingProof"),
      awaiting_verification: t("student.manualPayments.awaitingVerification"),
      approved: t("student.manualPayments.approved"),
      rejected: t("student.manualPayments.rejectedResubmit"),
    };
    return labels[status] || status?.replace(/_/g, " ") || "—";
  };
  const money = (value) =>
    typeof value === "number"
      ? new Intl.NumberFormat(i18n.language, { style: "currency", currency: "USD" }).format(value)
      : "—";

  const openReject = (id) => {
    setRejectOrderId(id);
    setRejectReason("");
  };

  const confirmReject = async () => {
    if (!rejectOrderId) return;
    await reject({ orderId: rejectOrderId, reason: rejectReason });
    setRejectOrderId(null);
  };

  const openNewMethod = () => {
    setMethodForm({
      id: null,
      name: "",
      accountNumber: "",
      accountHolder: "",
      instructions: "",
      active: true,
      sortOrder: 0,
    });
  };

  const openEditMethod = (m) => {
    setMethodForm({
      id: m._id,
      name: m.name || "",
      accountNumber: m.accountNumber || "",
      accountHolder: m.accountHolder || "",
      instructions: m.instructions || "",
      active: m.active !== false,
      sortOrder: m.sortOrder ?? 0,
    });
  };

  const submitMethod = async (e) => {
    e.preventDefault();
    if (!methodForm) return;
    await saveMethod({
      id: methodForm.id,
      payload: {
        name: methodForm.name,
        accountNumber: methodForm.accountNumber,
        accountHolder: methodForm.accountHolder,
        instructions: methodForm.instructions,
        active: methodForm.active,
        sortOrder: Number(methodForm.sortOrder) || 0,
      },
    });
    setMethodForm(null);
  };

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-red-500">{t("manualPaymentsAdmin.accessDenied")}</p>
      </div>
    );
  }

  return (
    <AccountSettingsLayout
      title={t("manualPaymentsAdmin.title")}
      subtitle={t("manualPaymentsAdmin.subtitle")}
      navItems={getAccountNavItems(user)}
    >
      <div className="flex gap-2 mb-6">
        <button
          type="button"
          onClick={() => setTab("queue")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === "queue"
              ? "bg-brand-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          <ListChecks className="w-4 h-4" />
          {t("manualPaymentsAdmin.reviewQueue")}
        </button>
        <button
          type="button"
          onClick={() => setTab("methods")}
          className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-bold transition-colors ${
            tab === "methods"
              ? "bg-brand-600 text-white"
              : "bg-gray-100 dark:bg-gray-800 text-gray-700 dark:text-gray-300"
          }`}
        >
          <Landmark className="w-4 h-4" />
          {t("manualPaymentsAdmin.paymentMethods")}
        </button>
      </div>

      {tab === "queue" ? (
        <div className="space-y-4">
          <div className="flex flex-wrap items-center gap-2">
            <span className="text-xs font-semibold text-gray-500 uppercase">{t("manualPaymentsAdmin.filter")}</span>
            {["pending", "all", "approved", "rejected"].map((f) => (
              <button
                key={f}
                type="button"
                onClick={() => setFilter(f)}
                className={`px-3 py-1.5 rounded-lg text-xs font-semibold capitalize ${
                  filter === f
                    ? "bg-gray-900 text-white dark:bg-white dark:text-gray-900"
                    : "bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400"
                }`}
              >
                {filterLabels[f]}
              </button>
            ))}
            <div className="w-full sm:w-auto sm:ms-auto">
              <ExportCsvButton
                exportKey="manualPayments"
                params={{ status: exportManualStatus }}
                label={t("manualPaymentsAdmin.exportCsv")}
              />
            </div>
          </div>

          {isLoading ? (
            <div className="animate-pulse h-32 rounded-xl bg-gray-200 dark:bg-gray-800" />
          ) : orders.length === 0 ? (
            <p className="text-sm text-gray-500 py-8 text-center">{t("manualPaymentsAdmin.empty")}</p>
          ) : (
            <div className="space-y-6">
              {orders.map((o) => (
                <div
                  key={o._id}
                  className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-5 space-y-4"
                >
                  <div className="flex flex-wrap gap-4 justify-between">
                    <div>
                      <p className="text-xs font-mono text-gray-500">{o.orderNumber}</p>
                      <p className="font-bold text-gray-900 dark:text-white">{o.course?.title}</p>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {o.student?.name}{" "}
                        <span className="text-gray-400">({o.student?.email})</span>
                      </p>
                    </div>
                    <div className="text-end">
                      <p className="text-lg font-bold text-gray-900 dark:text-white">
                        {money(o.amount)}
                      </p>
                      <span className="inline-block mt-1 text-[11px] font-bold uppercase px-2 py-0.5 rounded-md bg-gray-100 dark:bg-gray-800 text-gray-600 dark:text-gray-400">
                        {statusLabel(o.status)}
                      </span>
                    </div>
                  </div>

                  <div className="grid sm:grid-cols-2 gap-4 text-sm">
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">{t("manualPaymentsAdmin.paymentMethod")}</p>
                      <p className="text-gray-800 dark:text-gray-200">{o.paymentMethod?.name}</p>
                      <p className="font-mono text-xs mt-1">{o.paymentMethod?.accountNumber}</p>
                      <p className="text-xs text-gray-500">{o.paymentMethod?.accountHolder}</p>
                    </div>
                    <div>
                      <p className="text-xs text-gray-500 font-semibold mb-1">{t("manualPaymentsAdmin.studentSubmission")}</p>
                      <p>
                        <span className="text-gray-500">{t("manualPaymentsAdmin.ref")}</span>{" "}
                        <span className="font-mono">{o.transactionRef || "—"}</span>
                      </p>
                      <p>
                        <span className="text-gray-500">{t("manualPaymentsAdmin.from")}</span> {o.senderName || "—"}
                      </p>
                      <p>
                        <span className="text-gray-500">{t("manualPaymentsAdmin.date")}</span>{" "}
                        {o.paymentDate ? new Date(o.paymentDate).toLocaleDateString(i18n.language) : "—"}
                      </p>
                    </div>
                  </div>

                  <div>
                    <p className="text-xs text-gray-500 font-semibold mb-2">{t("manualPaymentsAdmin.receipt")}</p>
                    <ReceiptPreview url={o.receiptUrl} mime={o.receiptMimeType} />
                  </div>

                  {o.status === "awaiting_verification" ? (
                    <div className="flex flex-wrap gap-2 pt-2 border-t border-gray-100 dark:border-gray-800">
                      <button
                        type="button"
                        disabled={approving}
                        onClick={() => approve(o._id)}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg bg-emerald-600 text-white text-sm font-semibold hover:bg-emerald-700 disabled:opacity-50"
                      >
                        <Check className="w-4 h-4" />
                        {t("manualPaymentsAdmin.approveEnroll")}
                      </button>
                      <button
                        type="button"
                        onClick={() => openReject(o._id)}
                        className="inline-flex items-center gap-1.5 h-10 px-4 rounded-lg border border-red-200 dark:border-red-900 text-red-700 dark:text-red-300 text-sm font-semibold hover:bg-red-50 dark:hover:bg-red-950/30"
                      >
                        <X className="w-4 h-4" />
                        {t("manualPaymentsAdmin.reject")}
                      </button>
                    </div>
                  ) : null}

                  {o.auditLog?.length ? (
                    <details className="text-xs text-gray-500">
                      <summary className="cursor-pointer font-semibold text-gray-600 dark:text-gray-400">
                        Audit log ({o.auditLog.length})
                      </summary>
                      <ul className="mt-2 space-y-1 list-disc ps-4">
                        {o.auditLog.slice(-8).map((a, i) => (
                          <li key={i}>
                            {new Date(a.at).toISOString()} — {a.action}: {a.details}
                          </li>
                        ))}
                      </ul>
                    </details>
                  ) : null}
                </div>
              ))}
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          <div className="flex justify-between items-center">
            <p className="text-sm text-gray-600 dark:text-gray-400 max-w-xl">
              Students only see active methods at checkout. Put bank name, wallet ID, and any reference the payer must use.
            </p>
            <button
              type="button"
              onClick={openNewMethod}
              className="inline-flex items-center gap-2 h-10 px-4 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700"
            >
              <Plus className="w-4 h-4" />
              Add method
            </button>
          </div>

          {methodsLoading ? (
            <div className="animate-pulse h-24 rounded-xl bg-gray-200 dark:bg-gray-800" />
          ) : (
            <ul className="space-y-2">
              {methods.map((m) => (
                <li
                  key={m._id}
                  className="flex flex-wrap items-center justify-between gap-3 rounded-xl border border-gray-200 dark:border-gray-800 p-4"
                >
                  <div>
                    <p className="font-bold text-gray-900 dark:text-white">{m.name}</p>
                    <p className="text-sm font-mono text-gray-600 dark:text-gray-300">{m.accountNumber}</p>
                    <p className="text-xs text-gray-500">{m.accountHolder}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-[10px] font-bold uppercase px-2 py-0.5 rounded ${
                        m.active
                          ? "bg-emerald-100 text-emerald-800 dark:bg-emerald-950/40 dark:text-emerald-300"
                          : "bg-gray-200 text-gray-600 dark:bg-gray-700 dark:text-gray-400"
                      }`}
                    >
                      {m.active ? "Active" : "Inactive"}
                    </span>
                    <button
                      type="button"
                      onClick={() => openEditMethod(m)}
                      className="text-sm font-semibold text-brand-600 dark:text-brand-400 hover:underline"
                    >
                      Edit
                    </button>
                  </div>
                </li>
              ))}
            </ul>
          )}

          {methodForm ? (
            <form
              onSubmit={submitMethod}
              className="rounded-xl border border-gray-200 dark:border-gray-800 bg-gray-50 dark:bg-gray-900/50 p-5 space-y-3 max-w-lg"
            >
              <h3 className="font-bold text-gray-900 dark:text-white">
                {methodForm.id ? "Edit method" : "New method"}
              </h3>
              <input
                required
                placeholder="Name (e.g. Bank transfer)"
                value={methodForm.name}
                onChange={(e) => setMethodForm((f) => ({ ...f, name: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-950"
              />
              <input
                required
                placeholder="Account / wallet number"
                value={methodForm.accountNumber}
                onChange={(e) => setMethodForm((f) => ({ ...f, accountNumber: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-950"
              />
              <input
                required
                placeholder="Account holder name"
                value={methodForm.accountHolder}
                onChange={(e) => setMethodForm((f) => ({ ...f, accountHolder: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-950"
              />
              <textarea
                placeholder="Instructions (optional)"
                value={methodForm.instructions}
                onChange={(e) => setMethodForm((f) => ({ ...f, instructions: e.target.value }))}
                className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-950 min-h-[80px]"
              />
              <div className="flex items-center gap-3">
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    checked={methodForm.active}
                    onChange={(e) => setMethodForm((f) => ({ ...f, active: e.target.checked }))}
                  />
                  Active
                </label>
                <input
                  type="number"
                  placeholder="Sort order"
                  value={methodForm.sortOrder}
                  onChange={(e) => setMethodForm((f) => ({ ...f, sortOrder: e.target.value }))}
                  className="w-24 rounded-lg border border-gray-200 dark:border-gray-700 px-2 py-1 text-sm bg-white dark:bg-gray-950"
                />
              </div>
              <div className="flex gap-2 pt-2">
                <button
                  type="submit"
                  disabled={savingMethod}
                  className="h-10 px-4 rounded-lg bg-brand-600 text-white text-sm font-semibold disabled:opacity-50"
                >
                  {savingMethod ? "Saving…" : "Save"}
                </button>
                <button
                  type="button"
                  onClick={() => setMethodForm(null)}
                  className="h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold"
                >
                  Cancel
                </button>
              </div>
            </form>
          ) : null}
        </div>
      )}

      {rejectOrderId ? (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50">
          <div className="bg-white dark:bg-gray-900 rounded-xl border border-gray-200 dark:border-gray-800 p-6 max-w-md w-full shadow-xl">
            <div className="flex items-start gap-3 mb-4">
              <ShieldAlert className="w-6 h-6 text-amber-500 shrink-0" />
              <div>
                <h3 className="font-bold text-gray-900 dark:text-white">Reject submission</h3>
                <p className="text-sm text-gray-500 mt-1">
                  The student can upload new proof. Optional note is shown to them.
                </p>
              </div>
            </div>
            <textarea
              value={rejectReason}
              onChange={(e) => setRejectReason(e.target.value)}
              placeholder="Reason (optional)"
              className="w-full rounded-lg border border-gray-200 dark:border-gray-700 px-3 py-2 text-sm bg-white dark:bg-gray-950 min-h-[100px] mb-4"
            />
            <div className="flex justify-end gap-2">
              <button
                type="button"
                onClick={() => setRejectOrderId(null)}
                className="h-10 px-4 rounded-lg border border-gray-300 dark:border-gray-600 text-sm font-semibold"
              >
                Cancel
              </button>
              <button
                type="button"
                disabled={rejecting}
                onClick={confirmReject}
                className="h-10 px-4 rounded-lg bg-red-600 text-white text-sm font-semibold disabled:opacity-50"
              >
                {rejecting ? "…" : "Reject"}
              </button>
            </div>
          </div>
        </div>
      ) : null}

      <p className="text-xs text-gray-500 mt-8">
        Need WhatsApp on checkout? Set{" "}
        <code className="text-[11px]">VITE_SUPPORT_WHATSAPP</code> (digits, international format) on the frontend.{" "}
        <Link to={paths.admin} className="text-brand-600 dark:text-brand-400 hover:underline">
          Back to dashboard
        </Link>
      </p>
    </AccountSettingsLayout>
  );
}
