import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";

import Stripe from "stripe";
import dotenv from "dotenv";
dotenv.config(); 

// Your Secret Test Key
const stripe = new Stripe(process.env.STRIPE_SECRET_KEY);


export const paymentIntent = async (req, res) => {

  console.log("--- Payment Intent Request Started ---");
  try {

    const studentId = req.user.id; // from JWT auth

    const { courseId} = req.body;

    // 1. Log incoming arguments
    console.log("📥 Incoming Arguments:", { 
        courseId: courseId || "MISSING", 
        studentId: studentId || "MISSING" 
    });

    if (!courseId || !studentId) {
        console.error("❌ Aborting: studentId or courseId is undefined/null");
        return res.status(400).json({ message: "Missing required IDs" });
    }

    // Fetch course from DB
    const course = await Course.findById(courseId);
    if (!course) {
        console.error(`❌ Course not found in DB for ID: ${courseId}`);
        return res.status(404).json({ message: "Course not found" });
    }

    // Calculate amount
    const amount = Math.round(Number(course.price) * 100);
    if (isNaN(amount) || amount <= 0) {
        console.error(`❌ Invalid Amount calculated: ${amount} from price: ${course.price}`);
        return res.status(400).json({ message: "Invalid course price" });
    }

    console.log(`💰 Attempting to create Stripe Intent. Amount: ${amount} cents`);

    // 2. Create the Intent with a Try/Catch specifically for Stripe
    const paymentIntent = await stripe.paymentIntents.create({
      amount,
      currency: "usd",
      automatic_payment_methods: { enabled: true },
      metadata: {
        studentId: String(studentId),
        courseId: String(courseId),
      },
    });

    // 3. Log Success
    console.log("✅ Stripe Intent Created Successfully!");
    console.log("🆔 Intent ID:", paymentIntent.id);
    console.log("🔑 Client Secret generated:", paymentIntent.client_secret.substring(0, 15) + "...");

    res.json({ clientSecret: paymentIntent.client_secret });

  } catch (error) {
    // 4. Log specific Stripe errors
    console.error("❌ ERROR in paymentIntent Controller:");
    console.error("Type:", error.type); // e.g. 'StripeInvalidRequestError'
    console.error("Message:", error.message);
    
    res.status(500).json({ message: error.message });
  }
  console.log("--- Payment Intent Request Ended ---");
};

export const enrollatcourse =  async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // Validate course
    const course = await Course.findById(courseId);
    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Validate student
    const student = await User.findById(studentId);
    if (!student) {
      return res.status(404).json({ message: "Student not found" });
    }

    // Check if student is already enrolled
    const existingEnrollment = await Enrollment.findOne({
      course: courseId,
      student: studentId,
    });
    if (existingEnrollment) {
      return res.status(400).json({ message: "Student already enrolled" });
    }

    // Create new enrollment
    const enrollment = await Enrollment.create({
      course: courseId,
      student: studentId,
      status: "active", // default is "active" in schema, optional here
    });

    res.status(201).json({
      message: "Enrollment successful",
      enrollment,
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
}

export const checkenrollment = async (req, res) => {
  try {
    const { courseId , studentId } = req.params;
   

    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
    });

    if (enrollment) {
      return res.json({ enrolled: true, status: enrollment.status });
    } else {
      return res.json({ enrolled: false });
    }
  } catch (err) {
    console.error(err);
    res.status(500).json({ enrolled: false, message: "Server error" });
  }
}