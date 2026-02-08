import Enrollment from "../models/enrollment.model.js";
import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config();

const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);

export const webhook = async (req, res) => {
  console.log("--- Webhook Request Start ---");
  const sig = req.headers["stripe-signature"];
  let event;

  try {
    // req.body MUST be the raw buffer from express.raw()
    event = stripe.webhooks.constructEvent(
      req.body,
      sig,
      process.env.STRIPE_WEBHOOK_SECRET
    );
    console.log("✅ Webhook Signature Verified. Event Type:", event.type);
  } catch (err) {
    console.error("❌ Webhook verification failed:", err.message);
    console.log("Current Secret used:", process.env.STRIPE_WEBHOOK_SECRET);
    return res.status(400).send(`Webhook Error: ${err.message}`);
  }

  // Handle the event
  if (event.type === "payment_intent.succeeded") {
    const paymentIntent = event.data.object;

    // 🔍 DEBUG: Check what is inside metadata
    console.log("📦 Full Metadata from Stripe:", paymentIntent.metadata);

    const { studentId, courseId } = paymentIntent.metadata || {};

    if (!studentId || !courseId) {
      console.error("⚠️  Metadata missing! Enrollment cannot be created.");
      console.log("PaymentIntent ID:", paymentIntent.id);
    } else {
      console.log(`🚀 Attempting enrollment for Student: ${studentId}, Course: ${courseId}`);

      try {
        const existingEnrollment = await Enrollment.findOne({
          student: studentId,
          course: courseId,
        });

        if (!existingEnrollment) {
          const enrollment = await Enrollment.create({ 
            student: studentId, 
            course: courseId 
          });
          console.log("✨ Enrollment successfully created in MongoDB:", enrollment._id);
        } else {
          console.log("ℹ️ Student is already enrolled in this course.");
        }
      } catch (dbErr) {
        console.error("❌ Database Error during enrollment:", dbErr.message);
      }
    }
  } else if (event.type === "payment_intent.created") {
      console.log("⏳ Payment Intent was created, waiting for success...");
  } else {
    console.log("❓ Unhandled event type:", event.type);
  }

  console.log("--- Webhook Request End ---");
  res.status(200).json({ received: true });
};