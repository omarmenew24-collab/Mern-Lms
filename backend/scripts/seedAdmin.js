import mongoose from "mongoose";
import bcrypt from "bcrypt";
import dotenv from "dotenv";
import User from "../src/models/user.model.js";

dotenv.config();

const ADMIN_NAME = process.env.ADMIN_NAME || "admin";
const ADMIN_EMAIL = process.env.ADMIN_EMAIL || "admin@platform.com";
const ADMIN_PASSWORD = process.env.ADMIN_PASSWORD;

async function seedAdmin() {
  if (!ADMIN_PASSWORD) {
    console.error("ADMIN_PASSWORD is required. Set it in .env or as an environment variable.");
    process.exit(1);
  }

  if (ADMIN_PASSWORD.length < 6) {
    console.error("ADMIN_PASSWORD must be at least 6 characters.");
    process.exit(1);
  }

  try {
    await mongoose.connect(process.env.MONGODB_URI);
    console.log("Connected to MongoDB.");

    const existing = await User.findOne({ role: "admin" });
    if (existing) {
      console.log(`Admin already exists: ${existing.email} — skipping.`);
      process.exit(0);
    }

    const hashedPassword = await bcrypt.hash(ADMIN_PASSWORD, 10);

    const admin = await User.create({
      name: ADMIN_NAME,
      email: ADMIN_EMAIL.toLowerCase().trim(),
      password: hashedPassword,
      role: "admin",
      status: "active",
      emailVerified: true,
    });

    console.log(`Admin created successfully.`);
    console.log(`  Name:  ${admin.name}`);
    console.log(`  Email: ${admin.email}`);
    console.log(`  Role:  ${admin.role}`);
    console.log("\nYou can now log in with these credentials.");
  } catch (err) {
    if (err.code === 11000) {
      console.error("A user with that email already exists. Update their role manually or use a different email.");
    } else {
      console.error("Seed failed:", err.message);
    }
    process.exit(1);
  } finally {
    await mongoose.disconnect();
  }
}

seedAdmin();
