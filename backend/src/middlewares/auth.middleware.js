import jwt from "jsonwebtoken";
import User from "../models/user.model.js";

export const protectRoute = async (req, res, next) => {
  try {
    // 1️⃣ Get token from Authorization header
    const authHeader = req.headers.authorization;

    if (!authHeader || !authHeader.startsWith("Bearer ")) {
            console.log("no token here")

      return res.status(401).json({ message: "Unauthorized - No Token Provided" });
    }

    const token = authHeader.split(" ")[1]; // Remove "Bearer "

    console.log("token", token)

    // 2️⃣ Verify token
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);

    console.log("decoded",decoded)

    if (!decoded) {
            console.log("invalid token")

      return res.status(401).json({ message: "Unauthorized - Invalid Token" });
    }

    // 3️⃣ Find user
    const user = await User.findById(decoded._id).select("-password");

    if (!user) {
            console.log("user not found")

      return res.status(404).json({ message: "User not found" });

    }

    req.user = user;

    next();
  } catch (error) {
    console.log("Error in protectRoute middleware:", error.message);
    res.status(401).json({ message: "Unauthorized - Invalid or Expired Token" });
  }
};

export const adminOnly = (req, res, next) => {
  try {
    if (!req.user) {
      return res.status(401).json({ message: "Unauthorized" });
    }

    if (req.user.role !== "admin") {
      return res.status(403).json({ message: "Access denied - Admins only" });
    }

    next();
  } catch (error) {
    console.log("Error in adminOnly middleware:", error.message);
    res.status(500).json({ message: "Server error" });
  }
};
