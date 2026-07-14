import Stripe from "stripe";
import dotenv from "dotenv";
import { applySuccessfulPaymentIntent } from "./payment.controller.js";

dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

// Webhook — an endpoint Stripe calls for payment events.

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
    } else {
      const result = await applySuccessfulPaymentIntent(paymentIntent);
      if (!result.ok) {
        console.error("applySuccessfulPaymentIntent failed:", result.reason);
        return res.status(500).json({ error: result.reason });
      }
    }
  }

  return res.status(200).json({ received: true });
};
