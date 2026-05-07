import React, { useState } from "react";
import { Link, Navigate, useParams } from "react-router-dom";
import { useTranslation } from "react-i18next";
import { useFormatter } from "../../lib/i18nFormatters";
import { ArrowLeft, FileDown, RotateCcw } from "lucide-react";
import AccountSettingsLayout from "../../components/layout/AccountSettingsLayout";
import { getAccountNavItems } from "../../config/accountNav";
import useUserStore from "../../store/userstore";
import { paths } from "../../config/paths";
import {
  useAdminChargeback,
  usePatchChargeback,
  useRefreshChargebackEvidence,
  downloadChargebackEvidencePdf,
} from "../../api/chargebacks";

const STATUSES = ["open", "submitted", "won", "lost"];

function Section({ title, children }) {
  return (
    <section className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
      <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">{title}</h3>
      <div className="text-sm text-gray-800 dark:text-gray-200 space-y-2">{children}</div>
    </section>
  );
}

export default function AdminChargebackDetailPage() {
  const { t } = useTranslation();
  const { dateTime } = useFormatter();
  const { id } = useParams();
  const user = useUserStore((s) => s.user);
  const { data, isLoading, isError } = useAdminChargeback(id);
  const { mutateAsync: patchStatus, isPending: isPatching } = usePatchChargeback();
  const { mutateAsync: refreshEv, isPending: isRefreshing } = useRefreshChargebackEvidence();
  const [exportBusy, setExportBusy] = useState(false);

  if (!user) {
    return <Navigate to={paths.login} replace />;
  }

  const c = data?.chargeback;
  const timeline = data?.timeline || [];
  const snap = c?.evidenceSnapshot || {};

  const onExport = async () => {
    setExportBusy(true);
    try {
      await downloadChargebackEvidencePdf(id);
    } finally {
      setExportBusy(false);
    }
  };

  const onStatus = async (e) => {
    const status = e.target.value;
    await patchStatus({ id, status });
  };

  return (
    <AccountSettingsLayout
      title="Chargeback detail"
      subtitle="Review captured evidence and export one PDF for your processor."
      navItems={getAccountNavItems(user)}
    >
      <Link
        to={paths.adminChargebacks}
        className="inline-flex items-center gap-2 text-sm text-gray-500 dark:text-gray-400 hover:text-brand-600 dark:hover:text-brand-400 mb-4"
      >
        <ArrowLeft className="w-4 h-4 rtl-flip" />
        All chargebacks
      </Link>

      {isLoading && <p className="text-sm text-gray-500">Loading…</p>}
      {isError && <p className="text-sm text-red-600">Could not load this case.</p>}
      {!isLoading && c && (
        <div className="space-y-6 max-w-3xl">
          <div className="rounded-xl border border-amber-200/80 dark:border-amber-900/50 bg-amber-50/40 dark:bg-amber-950/20 p-4">
            <div className="flex flex-col sm:flex-row sm:items-start sm:justify-between gap-4">
              <div>
                <p className="text-xs text-gray-500 dark:text-gray-400">Order (Stripe PaymentIntent)</p>
                <p className="font-mono text-sm font-bold text-gray-900 dark:text-white break-all">{c.orderLabel}</p>
                {c.stripeDisputeId && (
                  <p className="text-xs text-gray-500 mt-1 font-mono">Dispute: {c.stripeDisputeId}</p>
                )}
                <p className="mt-2 text-lg font-bold text-gray-900 dark:text-white">
                  {c.amount} {(c.currency || "usd").toUpperCase()}{" "}
                  <span className="text-sm font-normal text-gray-500">· {c.user?.name}</span>
                </p>
                <p className="text-sm text-gray-600 dark:text-gray-300">{c.user?.email}</p>
                <p className="text-sm text-gray-600 dark:text-gray-300 mt-1">{c.course?.title}</p>
              </div>
              <div className="flex flex-col gap-2 min-w-[200px]">
                <label className="text-xs font-medium text-gray-500" htmlFor="st">
                  Status
                </label>
                <select
                  id="st"
                  value={c.status}
                  onChange={onStatus}
                  disabled={isPatching}
                  className="text-sm rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-900 px-3 py-2"
                >
                  {STATUSES.map((s) => (
                    <option key={s} value={s}>
                      {s}
                    </option>
                  ))}
                </select>
                <button
                  type="button"
                  onClick={onExport}
                  disabled={exportBusy}
                  className="inline-flex items-center justify-center gap-2 rounded-lg bg-gray-900 dark:bg-gray-100 text-white dark:text-gray-900 px-4 py-2.5 text-sm font-semibold hover:opacity-90 disabled:opacity-50"
                >
                  <FileDown className="w-4 h-4" />
                  {exportBusy ? "Preparing…" : "Export evidence PDF"}
                </button>
                <button
                  type="button"
                  onClick={() => refreshEv(id)}
                  disabled={isRefreshing}
                  className="inline-flex items-center justify-center gap-2 rounded-lg border border-gray-300 dark:border-gray-600 px-4 py-2 text-sm font-medium text-gray-800 dark:text-gray-200 hover:bg-gray-50 dark:hover:bg-gray-800 disabled:opacity-50"
                >
                  <RotateCcw className="w-4 h-4" />
                  {isRefreshing ? "Refreshing…" : "Re-capture evidence from LMS"}
                </button>
              </div>
            </div>
            {c.evidenceCapturedAt && (
              <p className="text-xs text-gray-500 mt-3">
                Last evidence capture: {dateTime(c.evidenceCapturedAt)}
              </p>
            )}
          </div>

          <div className="rounded-xl border border-gray-200 dark:border-gray-800 bg-white dark:bg-gray-900 p-4">
            <h3 className="text-xs font-bold uppercase tracking-wide text-gray-500 dark:text-gray-400 mb-3">Timeline</h3>
            <ol className="space-y-2 text-sm">
              {timeline.map((row, idx) => (
                <li key={`${row.key}-${idx}`} className="flex gap-3">
                  <span className="text-gray-400 whitespace-nowrap text-xs w-40 shrink-0">
                    {row.at ? dateTime(row.at) : "—"}
                  </span>
                  <span className="text-gray-800 dark:text-gray-200">{row.label}</span>
                </li>
              ))}
            </ol>
          </div>

          <Section title="Payment evidence">
            <p>
              <span className="text-gray-500">Transaction ID: </span>
              {snap.payment?.transactionId || "—"}
            </p>
            <p>
              <span className="text-gray-500">Provider reference: </span>
              {snap.payment?.providerReference || "—"}
            </p>
            <p>
              <span className="text-gray-500">Paid at: </span>
              {snap.payment?.paidAt ? dateTime(snap.payment.paidAt) : "—"}
            </p>
            <p>
              <span className="text-gray-500">Amount: </span>
              {snap.payment?.amount} {(snap.payment?.currency || "").toUpperCase()}
            </p>
          </Section>

          <Section title="User identity">
            <p>
              <span className="text-gray-500">Email: </span>
              {snap.identity?.email || "—"}
            </p>
            <p>
              <span className="text-gray-500">IP at purchase: </span>
              {snap.identity?.ipAtPurchase || "Not recorded by platform"}
            </p>
          </Section>

          <Section title="Platform policy (snapshot)">
            <p className="text-xs text-gray-500 dark:text-gray-400 mb-2">
              Refund settings as configured in admin (helps show access / refund context for digital goods).
            </p>
            <p>
              <span className="text-gray-500">Refunds for students: </span>
              {snap.policy?.refundsEnabled ? "Enabled" : "Disabled"}
            </p>
            <p>
              <span className="text-gray-500">Window / progress cap / max %: </span>
              {snap.policy?.refundWindowDays ?? "—"} days · progress ≤{" "}
              {snap.policy?.maxCompletionPercentForRefund ?? "—"}% · up to {snap.policy?.refundPercentCap ?? "—"}
              % refund
            </p>
            {snap.policy?.moneyBackGuaranteeLinkUrl && (
              <p>
                <span className="text-gray-500">Public policy link: </span>
                <span className="break-all">{snap.policy.moneyBackGuaranteeLinkUrl}</span>
              </p>
            )}
            <p className="text-xs text-gray-600 dark:text-gray-300 mt-2">{snap.policy?.summaryLine}</p>
          </Section>

          <Section title="Product (course)">
            <p>
              <span className="text-gray-500">Title: </span>
              {snap.product?.courseTitle || snap.usage?.courseTitle || "—"}
            </p>
            <p>
              <span className="text-gray-500">Category: </span>
              {snap.product?.category || "—"}
            </p>
            <p>
              <span className="text-gray-500">List price: </span>
              {snap.product?.listPrice != null ? snap.product.listPrice : "—"}
            </p>
            <p>
              <span className="text-gray-500">Instructor: </span>
              {snap.product?.instructorName || "—"}
              {snap.product?.instructorEmail ? (
                <span className="text-gray-500"> ({snap.product.instructorEmail})</span>
              ) : null}
            </p>
            <p>
              <span className="text-gray-500">Course structure: </span>
              {snap.product?.lectureCountPublished ?? "—"} lectures · {snap.product?.taskCountPublished ?? "—"} tasks
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400 whitespace-pre-wrap mt-2">
              {snap.product?.descriptionExcerpt || "—"}
            </p>
          </Section>

          <Section title="Course access">
            <p>
              <span className="text-gray-500">Enrollment: </span>
              {snap.access?.enrollmentDate
                ? dateTime(snap.access.enrollmentDate)
                : "—"}
            </p>
            <p className="text-gray-500 text-xs mb-1">Login session timestamps (sample)</p>
            <ul className="font-mono text-xs text-gray-700 dark:text-gray-300 max-h-40 overflow-y-auto space-y-0.5">
              {(snap.access?.sessionTimestamps || []).slice(0, 30).map((t) => (
                <li key={t}>{dateTime(t)}</li>
              ))}
              {(snap.access?.sessionTimestamps || []).length === 0 && <li>—</li>}
            </ul>
          </Section>

          <Section title="Usage & coursework">
            <p>
              <span className="text-gray-500">Course progress: </span>
              {snap.usage?.completionPercent != null ? `${snap.usage.completionPercent}%` : "—"}
            </p>
            <p>
              <span className="text-gray-500">Lectures completed / total: </span>
              {snap.usage?.lecturesCompletedCount ?? "—"} / {snap.usage?.lecturesTotalCount ?? "—"}
            </p>
            <p>
              <span className="text-gray-500">Tasks marked complete: </span>
              {snap.usage?.tasksMarkedCompleteCount ?? "—"}
            </p>
            <p>
              <span className="text-gray-500">Assignment submissions: </span>
              {snap.usage?.assignmentSubmissionsTotal ?? 0} total · {snap.usage?.assignmentSubmissionsAfterPurchase ?? 0}{" "}
              on or after payment
            </p>
            <p>
              <span className="text-gray-500">First / last submission: </span>
              {snap.engagement?.firstSubmissionAt
                ? dateTime(snap.engagement.firstSubmissionAt)
                : "—"}{" "}
              ·{" "}
              {snap.engagement?.lastSubmissionAt
                ? dateTime(snap.engagement.lastSubmissionAt)
                : "—"}
            </p>
            <p>
              <span className="text-gray-500">Last activity (derived): </span>
              {snap.usage?.lastActivityAt ? dateTime(snap.usage.lastActivityAt) : "—"}
            </p>
            <p className="text-gray-500 text-xs mb-1 mt-2">Submission sample</p>
            <ul className="text-xs font-mono text-gray-700 dark:text-gray-300 max-h-48 overflow-y-auto space-y-1">
              {(snap.engagement?.submissionSamples || []).map((s, i) => (
                <li key={i}>
                  {s.at ? dateTime(s.at) : "—"} — {s.taskTitle || "Task"}
                </li>
              ))}
              {(snap.engagement?.submissionSamples || []).length === 0 && <li>—</li>}
            </ul>
          </Section>

          <Section title="Refund history">
            <p>
              <span className="text-gray-500">Requested: </span>
              {snap.refunds?.refundRequested ? "Yes" : "No"}
            </p>
            <p>
              <span className="text-gray-500">Processed: </span>
              {snap.refunds?.refundProcessed ? "Yes" : "No"}
            </p>
            <p className="text-xs text-gray-600 dark:text-gray-400">{snap.refunds?.summary}</p>
          </Section>
        </div>
      )}
    </AccountSettingsLayout>
  );
}
