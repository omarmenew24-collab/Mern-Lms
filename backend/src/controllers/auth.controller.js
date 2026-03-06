import User from "../models/user.model.js";
import bcrypt from "bcrypt"; // or "bcrypt"
import { cookieOptions , generateAccessToken, generateRefreshToken } from "../lib/utils.js";
import { OAuth2Client } from "google-auth-library";
import jwt from "jsonwebtoken";
import Course from "../models/course.model.js";
import axios from "axios";


export const signup = async (req, res) => {
  const { name, password, email } = req.body;

  try {
    // 1️⃣ Validate input
    if (!name || !password || !email) {
      return res.status(400).json({ message: "All fields are required" });
    }

    if (password.length < 6) {
      return res
        .status(400)
        .json({ message: "Password must be at least 6 characters" });
    }

    // 2️⃣ Check if user exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return res.status(400).json({ message: "User already exists" });
    }

    // 3️⃣ Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // 4️⃣ Create new user
    const newUser = await User.create({
      name,
      email,
      password: hashedPassword,
      role: "student",
    });

    // 5️⃣ Generate tokens
    const accessToken = generateAccessToken(newUser);
    const refreshToken = generateRefreshToken(newUser);

    // 6️⃣ Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in prod
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 7️⃣ Send response
    res.status(201).json({
      message: "Signup successful",
      accessToken,
      userResponse: {
        _id: newUser._id,
        name: newUser.name,
        role: newUser.role,
        email: newUser.email || "",
        picture: newUser.picture || "",
      },
    });
  } catch (error) {
    console.error("Signup error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



export const login = async (req, res) => {
  try {
    const { name, password } = req.body;

    // 1️⃣ Validate input
    if (!name || !password) {
      return res.status(400).json({
        message: "Name and password are required",
      });
    }

    // 2️⃣ Find user
    const user = await User.findOne({ name });

    if (!user) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 3️⃣ Check password
    const isPasswordCorrect = await bcrypt.compare(password, user.password);

    if (!isPasswordCorrect) {
      return res.status(401).json({
        message: "Invalid credentials",
      });
    }

    // 4️⃣ Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 5️⃣ Set refresh token in HTTP-only cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production", // HTTPS in production
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 6️⃣ Build safe user response
    const userResponse = {
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email || "",
      picture: user.picture || "",
    };

    // 7️⃣ Send response
    return res.status(200).json({
      message: "Login successful",
      accessToken,
      userResponse,
    });

  } catch (error) {
    console.error("Login error:", error);
    return res.status(500).json({
      message: "Internal Server Error",
    });
  }
};

export const logout = (req, res) => {
  try {
    // Nothing to clear on server
    return res.status(200).json({ message: "Logged out successfully" });
  } catch (error) {
    console.error("Error in logout controller", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};


export const checkAuth = (req, res, next) => {
  const authHeader = req.headers.authorization;
  console.log("Authorization header:", authHeader);

  if (!authHeader || !authHeader.startsWith("Bearer ")) {
    return res
      .status(401)
      .json({ message: "Unauthorized - No Token Provided" });
  }

  const token = authHeader.split(" ")[1];

  try {
    const decoded = jwt.verify(token, process.env.ACCESS_TOKEN_SECRET);
    req.user = decoded; // contains _id and role
    console.log("req.user from checkAuth:", req.user);
    next();
  } catch (error) {
    console.error("JWT verify failed:", error.message);
    return res
      .status(403)
      .json({ message: "Invalid or expired token" });
  }
};



export const updateuserprofile = async (req, res) => {
  try {
    // or
    const { userId } = req.params;
    const { name, picture } = req.body; // make sure frontend sends userId

    // Find and update user
    const updatedUser = await User.findByIdAndUpdate(
      userId,
      { name, picture },
      { new: true }, // return updated user
    ); // don’t send password back

    if (!updatedUser) {
      return res.status(404).json({ message: "User not found" });
    }

    res.json({
      message: "Profile updated successfully",
      user: updatedUser,
    });
  } catch (error) {
    console.error("Update profile error:", error);
    res.status(500).json({ message: "Server error while updating profile" });
  }
};

export const getuserpicture = async (req, res) => {
  const user = await User.findById(req.params.id);
  if (!user || !user.picture) return res.status(404).send("No picture");

  const response = await axios.get(user.picture, {
    responseType: "arraybuffer",
  });
  res.set("Content-Type", "image/jpeg");
  res.send(response.data);
};

export const getteachers = async (req, res) => {
  try {
    const { searchquery } = req.query; // take from query params
    let filter = { role: "teacher" };

    if (searchquery) {
      filter.name = { $regex: searchquery, $options: "i" }; // case-insensitive
    }

    const teachers = await User.find(filter).select("_id name");
    res.status(200).json(teachers);
    console.log("teachers are:", teachers);
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const getcourses = async (req, res) => {
  try {
    const courses = await Course.find().populate("teacher", "name");
    // populate will replace teacher ObjectId with teacher's name

    res.status(200).json(courses);
  } catch (error) {
    console.error("Error fetching courses:", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};



const client = new OAuth2Client(process.env.GOOGLE_CLIENT_ID);

export const googleauth = async (req, res) => {
  try {
    const { token } = req.body;

    // 1️⃣ Verify Google token
    const ticket = await client.verifyIdToken({
      idToken: token,
      audience: process.env.GOOGLE_CLIENT_ID,
    });

    const payload = ticket.getPayload();
    const { sub, email, name, picture } = payload;

    // 2️⃣ Find or create user
    let user = await User.findOne({ email });

    if (!user) {
      user = new User({
        googleId: sub,
        email,
        name,
        picture,
        role: "student",
      });

      await user.save();
    }

    // 3️⃣ Generate tokens
    const accessToken = generateAccessToken(user);
    const refreshToken = generateRefreshToken(user);

    // 4️⃣ Store refresh token in httpOnly cookie
    res.cookie("refreshToken", refreshToken, {
      httpOnly: true,
      secure: false, // change to true in production
      sameSite: "lax",
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // 5️⃣ Send response
    const userResponse = {
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email || "",
      picture: user.picture || "",
    };

    return res.status(200).json({
      message: "Login successful",
      accessToken,
      userResponse,
    });

  } catch (err) {
    console.error("Google login error:", err);
    res.status(401).json({ message: "Invalid Google token" });
  }
};

export const refreshController = async (req, res) => {
  const refreshToken = req.cookies.refreshToken;

  if (!refreshToken) {
    return res.status(401).json({ message: "No refresh token" });
  }

  try {
    const decoded = jwt.verify(
      refreshToken,
      process.env.REFRESH_TOKEN_SECRET
    );

    const user = await User.findById(decoded._id);

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    const accessToken = generateAccessToken(user);

    res.status(200).json({ accessToken });

  } catch (error) {
    return res.status(403).json({ message: "Invalid refresh token" });
  }
};

export const authme = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    if (!user) return res.status(404).json({ message: "User not found" });

    // Unified response
    const userResponse = {
      _id: user._id,
      name: user.name,
      role: user.role,
      email: user.email || "",
      picture: user.picture || "",
    };
    console.log("user from authme", userResponse);
    res.status(200).json(userResponse);
  } catch (error) {
    console.error("/auth/me error:", error);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
