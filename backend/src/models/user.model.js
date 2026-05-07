import mongoose from "mongoose";

const userSchema = new mongoose.Schema(
  {
    name: {
      type: String,
      required: true,
    },

    email: {
      type: String,
      required: true,
      unique: true,
      lowercase: true,
      trim: true,
    },

    password: {
      type: String,
      minlength: 6,
    },

    role: {
      type: String,
      enum: ["student", "teacher", "admin"],
      default: "student",
      required: true,
    },

    googleId: {
      type: String,
    },

    picture: {
      type: String,
      default:
        "https://cdn-icons-png.flaticon.com/512/149/149071.png",
    },

    // ✅ NEW FEATURES (Admin Control)

    status: {
      type: String,
      enum: ["active", "suspended"],
      default: "active",
    },
    isDeleted: { type: Boolean, default: false },

    lastLogin: {
      type: Date,
    },

    /** Password signups require verification when SMTP is configured (`false` until link clicked). */
    emailVerified: {
      type: Boolean,
      default: true,
    },

    /**
     * Public “about me” (teachers: shown on course page + /u/:id; students: edit on /profile only).
     * Not collected at sign-up.
     */
    publicAbout: { type: String, default: "", maxlength: 4000, trim: true },
    /** Optional portfolio / project links (https only), max 10 */
    publicProjectLinks: {
      type: [String],
      default: () => [],
      validate: {
        validator: (a) => !a || a.length <= 10,
        message: "At most 10 project links",
      },
    },

    /** In-app + optional email notifications */
    notificationEmailEnabled: { type: Boolean, default: true },
    /** all = every email-eligible notif; important = success|warning only */
    notificationLevel: {
      type: String,
      enum: ["all", "important"],
      default: "all",
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
