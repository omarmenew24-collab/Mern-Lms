import mongoose from "mongoose";

const SESSION_MS = 7 * 24 * 60 * 60 * 1000;

const userSessionSchema = new mongoose.Schema(
  {
    user: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
      index: true,
    },
    /** Bumped on each refresh rotation; must match claim `rv` on the JWT. */
    refreshTokenVersion: {
      type: Number,
      default: 0,
    },
    userAgent: { type: String, default: "" },
    expiresAt: { type: Date, required: true },
  },
  { timestamps: true },
);

userSessionSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

export const sessionTtlMs = SESSION_MS;

export default mongoose.model("UserSession", userSessionSchema);
