import PDFDocument from "pdfkit";
import { buildTimeline } from "../services/chargebackEvidence.service.js";

function fmtDate(iso) {
  if (!iso) return "—";
  try {
    return new Date(iso).toLocaleString();
  } catch {
    return String(iso);
  }
}

function line(doc, x, y, w) {
  doc.moveTo(x, y).lineTo(x + w, y).strokeColor("#cccccc").stroke();
}

function ensureSpace(doc, y, minBottom = 72) {
  if (y > doc.page.height - minBottom) {
    doc.addPage();
    return 48;
  }
  return y;
}

/**
 * One standardized evidence PDF for payment provider disputes.
 */
export function streamChargebackPdf(chargeback, res) {
  const snap = chargeback.evidenceSnapshot || {};
  const title = `chargeback-evidence-${String(chargeback._id).slice(-8)}.pdf`;

  res.setHeader("Content-Type", "application/pdf");
  res.setHeader("Content-Disposition", `attachment; filename="${title}"`);

  const doc = new PDFDocument({ size: "LETTER", margin: 48, info: { Title: "Chargeback evidence" } });
  doc.pipe(res);

  const w = doc.page.width - 96;
  let y = 48;

  doc.font("Helvetica-Bold").fontSize(16).text("Chargeback evidence package", 48, y);
  y += 28;
  doc.font("Helvetica").fontSize(10).fillColor("#333333");
  doc.text(`Generated: ${fmtDate(new Date().toISOString())}`, 48, y);
  y += 14;
  doc.text(`Platform order reference (Stripe PaymentIntent): ${chargeback.orderLabel || "—"}`, 48, y);
  y += 14;
  if (chargeback.stripeDisputeId) {
    doc.text(`Stripe dispute ID: ${chargeback.stripeDisputeId}`, 48, y);
    y += 14;
  }
  doc.text(`Case status: ${chargeback.status}`, 48, y);
  y += 22;
  line(doc, 48, y, w);
  y += 16;

  doc.font("Helvetica-Bold").fontSize(12).text("1. Transaction summary", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  const pay = snap.payment || {};
  doc.text(`Transaction ID: ${pay.transactionId || "—"}`, 48, y);
  y += 13;
  doc.text(`Provider reference (charge / PI): ${pay.providerReference || "—"}`, 48, y);
  y += 13;
  doc.text(`Provider: ${pay.provider || "stripe"}`, 48, y);
  y += 13;
  doc.text(`Paid at: ${fmtDate(pay.paidAt)}`, 48, y);
  y += 13;
  doc.text(`Amount charged: ${pay.amount ?? "—"} ${(pay.currency || "").toUpperCase()}`, 48, y);
  y += 13;
  doc.text(`Ledger status: ${pay.paymentStatus || "—"}`, 48, y);
  y += 20;

  y = ensureSpace(doc, y);
  doc.font("Helvetica-Bold").fontSize(12).text("2. Customer identity", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  const idn = snap.identity || {};
  doc.text(`Name: ${idn.userName || "—"}`, 48, y);
  y += 13;
  doc.text(`Email (account / receipt): ${idn.email || "—"}`, 48, y);
  y += 13;
  doc.text(`Internal user ID: ${idn.userId || "—"}`, 48, y);
  y += 13;
  doc.text(
    `IP at purchase: ${idn.ipAtPurchase ? idn.ipAtPurchase : "Not recorded by platform (consider capturing at checkout)."}`,
    48,
    y,
    { width: w },
  );
  y = doc.y + 16;

  y = ensureSpace(doc, y);
  doc.font("Helvetica-Bold").fontSize(12).text("3. Platform refund rules (snapshot at capture)", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  const pol = snap.policy || {};
  doc.text(`Refunds enabled for students: ${pol.refundsEnabled ? "Yes" : "No"}`, 48, y);
  y += 13;
  doc.text(`Refund window: ${pol.refundWindowDays ?? "—"} days from purchase`, 48, y);
  y += 13;
  doc.text(
    `Typical eligibility cap (progress): ${pol.maxCompletionPercentForRefund ?? "—"}% of course completed`,
    48,
    y,
  );
  y += 13;
  doc.text(`Max refund per request (% of price): ${pol.refundPercentCap ?? "—"}%`, 48, y);
  y += 13;
  if (pol.moneyBackGuaranteeLinkUrl) {
    doc.text(`Public policy link (if configured): ${pol.moneyBackGuaranteeLinkUrl}`, 48, y, { width: w });
    y = doc.y + 8;
  }
  doc.text(`Summary: ${pol.summaryLine || "—"}`, 48, y, { width: w });
  y = doc.y + 16;

  y = ensureSpace(doc, y);
  doc.font("Helvetica-Bold").fontSize(12).text("4. Digital product purchased (course)", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  const prod = snap.product || {};
  doc.text(`Title: ${prod.courseTitle || snap.usage?.courseTitle || "—"}`, 48, y);
  y += 13;
  doc.text(`Category: ${prod.category || "—"}`, 48, y);
  y += 13;
  doc.text(`Catalog price (list): ${prod.listPrice != null ? prod.listPrice : "—"}`, 48, y);
  y += 13;
  doc.text(`Instructor: ${prod.instructorName || "—"}`, 48, y);
  y += 13;
  if (prod.instructorEmail) {
    doc.text(`Instructor email: ${prod.instructorEmail}`, 48, y);
    y += 13;
  }
  doc.text(`Course structure: ${prod.lectureCountPublished ?? "—"} lectures, ${prod.taskCountPublished ?? "—"} tasks`, 48, y);
  y += 13;
  doc.text("Description (excerpt):", 48, y);
  y += 12;
  doc.font("Helvetica").fontSize(9).fillColor("#444444");
  doc.text(prod.descriptionExcerpt || "—", 48, y, { width: w, align: "left" });
  doc.fillColor("#333333");
  doc.font("Helvetica").fontSize(10);
  y = doc.y + 12;

  y = ensureSpace(doc, y);
  doc.font("Helvetica-Bold").fontSize(12).text("5. Access & account sessions", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  doc.text(`Enrollment / access from: ${fmtDate(snap.access?.enrollmentDate)}`, 48, y);
  y += 13;
  const sessions = (snap.access?.sessionTimestamps || []).slice(0, 25);
  doc.text(`Recorded login session starts (sample, max 25):`, 48, y);
  y += 13;
  const sessBlock = sessions.length ? sessions.map((t) => `• ${fmtDate(t)}`).join("\n") : "—";
  doc.text(sessBlock, 48, y, { width: w });
  y = doc.y + 16;

  y = ensureSpace(doc, y, 100);
  doc.font("Helvetica-Bold").fontSize(12).text("6. Usage & coursework", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  const us = snap.usage || {};
  doc.text(`Reported course progress: ${us.completionPercent != null ? `${us.completionPercent}%` : "No record"}`, 48, y);
  y += 13;
  doc.text(
    `Lectures completed / published: ${us.lecturesCompletedCount ?? "—"} / ${us.lecturesTotalCount ?? "—"}`,
    48,
    y,
  );
  y += 13;
  doc.text(`Tasks marked complete (progress tracking): ${us.tasksMarkedCompleteCount ?? "—"}`, 48, y);
  y += 13;
  doc.text(`Assignment file submissions: ${us.assignmentSubmissionsTotal ?? 0} total`, 48, y);
  y += 13;
  doc.text(
    `Submissions on or after payment time: ${us.assignmentSubmissionsAfterPurchase ?? "—"}`,
    48,
    y,
  );
  y += 13;
  const eng = snap.engagement || {};
  doc.text(`First submission: ${fmtDate(eng.firstSubmissionAt)}`, 48, y);
  y += 13;
  doc.text(`Last submission: ${fmtDate(eng.lastSubmissionAt)}`, 48, y);
  y += 13;
  doc.text("Submission log (sample):", 48, y);
  y += 12;
  const samples = eng.submissionSamples || [];
  const sampleBlock = samples.length
    ? samples.map((s) => `• ${fmtDate(s.at)} — ${s.taskTitle || "Task"}`).join("\n")
    : "—";
  doc.text(sampleBlock, 48, y, { width: w });
  y = doc.y + 16;

  y = ensureSpace(doc, y);
  doc.font("Helvetica-Bold").fontSize(12).text("7. Refund activity for this payment", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  const ref = snap.refunds || {};
  doc.text(`Refund requested through platform: ${ref.refundRequested ? "Yes" : "No"}`, 48, y);
  y += 13;
  doc.text(`Refund completed (ledger): ${ref.refundProcessed ? "Yes" : "No"}`, 48, y);
  y += 13;
  doc.text(`Detail: ${ref.summary || "—"}`, 48, y, { width: w });
  y = doc.y + 20;

  y = ensureSpace(doc, y, 120);
  doc.font("Helvetica-Bold").fontSize(12).text("8. Timeline of key events", 48, y);
  y += 18;
  doc.font("Helvetica").fontSize(10);
  const timeline = buildTimeline(chargeback, snap);
  for (const row of timeline) {
    y = ensureSpace(doc, y, 48);
    const rowText = `${fmtDate(row.at)} — ${row.label}`;
    doc.text(rowText, 48, y, { width: w });
    y = doc.y + 4;
  }

  y += 10;
  y = ensureSpace(doc, y, 80);
  line(doc, 48, y, w);
  y += 14;
  doc.font("Helvetica-Oblique").fontSize(9).fillColor("#666666");
  doc.text(
    "This package summarizes LMS records only. Also submit Stripe’s dispute evidence form and any issuer-specific " +
      "requirements (receipts, terms acceptance, additional correspondence).",
    48,
    y,
    { width: w },
  );

  doc.end();
}
