import Stripe from "stripe";
import dotenv from "dotenv";
import { applySuccessfulPaymentIntent } from "./payment.controller.js";
import Payment from "../models/payment.model.js";
import Chargeback from "../models/chargeback.model.js";
import { buildEvidenceSnapshot } from "../services/chargebackEvidence.service.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

async function findPaymentByChargeId(chargeId) {
  if (!chargeId) return null;
  const byCharge = await Payment.findOne({ stripeChargeId: String(chargeId) });
  if (byCharge) return byCharge;
  try {
    const ch = await stripe.charges.retrieve(String(chargeId));
    const pi = ch?.payment_intent;
    const piId = typeof pi === "string" ? pi : pi?.id;
    if (piId) {
      return await Payment.findOne({ stripePaymentIntentId: piId });
    }
  } catch (e) {
    console.error("findPaymentByChargeId:", e.message);
  }
  return null;
}

//Webhook = an endpoint on your server that Stripe calls

export const webhook = async (req, res) => {
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET,
    );
  } catch (err) {
    console.error("❌ Webhook verification failed:", err.message);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;
    const { studentId, courseId } = paymentIntent.metadata || {};

    if (!studentId || !courseId) {
      console.error("Webhook: missing metadata on PI", paymentIntent.id);
      // 200: bad metadata will not fix itself on retry
    } else {
      const result = await applySuccessfulPaymentIntent(paymentIntent);
      if (!result.ok) {
        console.error("applySuccessfulPaymentIntent failed:", result.reason);
        // 500 so Stripe retries (handler is idempotent on stripePaymentIntentId)
        return res.status(500).json({ error: result.reason });
      }
    }
  }

  if (event.type === "charge.dispute.created") {
    const dispute = event.data.object;
    const chargeId = typeof dispute.charge === "string" ? dispute.charge : dispute.charge?.id;
    try {
      const payment = await findPaymentByChargeId(chargeId);
      if (!payment) {
        console.warn("charge.dispute.created: no local Payment for charge", chargeId);
      } else {
        const evidence = await buildEvidenceSnapshot(payment._id);
        const amountMajor = (dispute.amount || 0) / 100;
        const cur = (dispute.currency || "usd").toLowerCase();
        const dateOpened = new Date((dispute.created || 0) * 1000);
        const existing = await Chargeback.findOne({ payment: payment._id });
        if (!existing) {
          await Chargeback.create({
            payment: payment._id,
            user: payment.student,
            course: payment.course,
            orderLabel: payment.stripePaymentIntentId || String(payment._id),
            amount: amountMajor,
            currency: cur,
            dateOpened,
            status: "open",
            provider: "stripe",
            stripeDisputeId: dispute.id,
            evidenceSnapshot: evidence,
            evidenceCapturedAt: new Date(),
          });
        } else {
          await Chargeback.updateOne(
            { _id: existing._id },
            {
              $set: {
                stripeDisputeId: dispute.id,
                evidenceSnapshot: evidence,
                evidenceCapturedAt: new Date(),
                amount: amountMajor,
                currency: cur,
              },
            },
          );
        }
      }
    } catch (e) {
      console.error("charge.dispute.created handler:", e);
      return res.status(500).json({ error: "dispute_handler_failed" });
    }
  }

  return res.status(200).json({ received: true });
};
