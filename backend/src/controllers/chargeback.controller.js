import Chargeback, { CHARGEBACK_STATUSES } from "../models/chargeback.model.js";
import Payment from "../models/payment.model.js";
import {
  buildEvidenceSnapshot,
  buildTimeline,
} from "../services/chargebackEvidence.service.js";
import { streamChargebackPdf } from "../lib/chargebackPdf.js";

export const listChargebacks = async (req, res) => {
  try {
    const { status } = req.query;
    const q = {};
    if (status && String(status) !== "all" && CHARGEBACK_STATUSES.includes(String(status))) {
      q.status = String(status);
    }
    const rows = await Chargeback.find(q)
      .populate("user", "name email")
      .populate("course", "title")
      .sort({ dateOpened: -1 })
      .limit(300)
      .lean();

    return res.status(200).json({
      chargebacks: rows.map((c) => ({
        _id: c._id,
        orderLabel: c.orderLabel,
        amount: c.amount,
        currency: c.currency,
        dateOpened: c.dateOpened,
        status: c.status,
        provider: c.provider,
        stripeDisputeId: c.stripeDisputeId,
        evidenceCapturedAt: c.evidenceCapturedAt,
        user: c.user,
        course: c.course,
        payment: c.payment,
      })),
    });
  } catch (e) {
    console.error("listChargebacks:", e);
    return res.status(500).json({ message: e.message || "Failed to list chargebacks" });
  }
};

export const getChargeback = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await Chargeback.findById(id)
      .populate("user", "name email")
      .populate("course", "title")
      .populate("payment")
      .lean();
    if (!c) {
      return res.status(404).json({ message: "Chargeback not found" });
    }
    const timeline = buildTimeline(c, c.evidenceSnapshot);
    return res.status(200).json({ chargeback: c, timeline });
  } catch (e) {
    console.error("getChargeback:", e);
    return res.status(500).json({ message: e.message || "Failed to load chargeback" });
  }
};

export const createChargeback = async (req, res) => {
  try {
    const { paymentId, dateOpened, stripeDisputeId, amount, currency } = req.body || {};
    if (!paymentId) {
      return res.status(400).json({ message: "paymentId is required" });
    }
    const payment = await Payment.findById(paymentId).lean();
    if (!payment) {
      return res.status(404).json({ message: "Payment not found" });
    }

    const existing = await Chargeback.findOne({ payment: payment._id }).lean();
    if (existing) {
      return res.status(409).json({ message: "A chargeback already exists for this payment" });
    }

    const evidence = await buildEvidenceSnapshot(payment._id);

    const doc = await Chargeback.create({
      payment: payment._id,
      user: payment.student,
      course: payment.course,
      orderLabel: payment.stripePaymentIntentId || String(payment._id),
      amount: amount != null ? Number(amount) : Number(payment.amount),
      currency: (currency || payment.currency || "usd").toLowerCase(),
      dateOpened: dateOpened ? new Date(dateOpened) : new Date(),
      status: "open",
      provider: "stripe",
      stripeDisputeId: stripeDisputeId || null,
      evidenceSnapshot: evidence,
      evidenceCapturedAt: new Date(),
    });

    const populated = await Chargeback.findById(doc._id)
      .populate("user", "name email")
      .populate("course", "title")
      .populate("payment")
      .lean();

    return res.status(201).json({ chargeback: populated });
  } catch (e) {
    console.error("createChargeback:", e);
    if (e.code === 11000) {
      return res.status(409).json({ message: "Duplicate chargeback or dispute id" });
    }
    return res.status(500).json({ message: e.message || "Failed to create chargeback" });
  }
};

export const patchChargeback = async (req, res) => {
  try {
    const { id } = req.params;
    const { status } = req.body || {};
    if (!status || !CHARGEBACK_STATUSES.includes(String(status))) {
      return res.status(400).json({ message: "Valid status is required" });
    }
    const c = await Chargeback.findByIdAndUpdate(
      id,
      { $set: { status: String(status) } },
      { new: true },
    )
      .populate("user", "name email")
      .populate("course", "title")
      .populate("payment")
      .lean();
    if (!c) {
      return res.status(404).json({ message: "Chargeback not found" });
    }
    return res.status(200).json({ chargeback: c });
  } catch (e) {
    console.error("patchChargeback:", e);
    return res.status(500).json({ message: e.message || "Update failed" });
  }
};

/** Re-capture evidence from current DB state (no manual field edits). */
export const refreshChargebackEvidence = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await Chargeback.findById(id).lean();
    if (!c) {
      return res.status(404).json({ message: "Chargeback not found" });
    }
    const evidence = await buildEvidenceSnapshot(c.payment);
    const updated = await Chargeback.findByIdAndUpdate(
      id,
      { $set: { evidenceSnapshot: evidence, evidenceCapturedAt: new Date() } },
      { new: true },
    )
      .populate("user", "name email")
      .populate("course", "title")
      .populate("payment")
      .lean();
    const timeline = buildTimeline(updated, updated.evidenceSnapshot);
    return res.status(200).json({ chargeback: updated, timeline });
  } catch (e) {
    console.error("refreshChargebackEvidence:", e);
    return res.status(500).json({ message: e.message || "Refresh failed" });
  }
};

export const exportChargebackPdf = async (req, res) => {
  try {
    const { id } = req.params;
    const c = await Chargeback.findById(id).lean();
    if (!c) {
      return res.status(404).json({ message: "Chargeback not found" });
    }
    streamChargebackPdf(c, res);
  } catch (e) {
    console.error("exportChargebackPdf:", e);
    if (!res.headersSent) {
      return res.status(500).json({ message: e.message || "PDF failed" });
    }
  }
};
