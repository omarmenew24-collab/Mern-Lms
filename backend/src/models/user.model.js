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
      unique: true,   // no duplicate emails allowed
      lowercase: true, // store in lowercase for consistency
      trim: true,      // remove whitespace
    },
    password: {
      type: String,
      minlength: 6,
    },
    role: {
      type: String,
      enum: ["student", "teacher", "admin"], // allowed roles
      default: "student", // default role
      required: true,
    },
    googleId: {
      type: String, // for users who log in with Google
    },
    picture: {
      type: String, // store image URL (e.g., Cloudinary or S3 link)
      default: "https://cdn-icons-png.flaticon.com/512/149/149071.png", // default avatar
    },
  },
  { timestamps: true }
);

const User = mongoose.model("User", userSchema);

export default User;
