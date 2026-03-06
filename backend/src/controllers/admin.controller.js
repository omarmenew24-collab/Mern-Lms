import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js";

export const getDashboardStats = async (req, res) => {
  try {
    const totalUsers = await User.countDocuments();
    const totalCourses = await Course.countDocuments();
    const totalEnrollments = await Enrollment.countDocuments();

    const totalStudents = await User.countDocuments({ role: "student" });
    const totalTeachers = await User.countDocuments({ role: "teachers" });

    res.json({
      totalUsers,
      totalCourses,
      totalEnrollments,
      totalStudents,
      totalTeachers,
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const getAllUsers = async (req, res) => {
  try {
    const users = await User.find({
      $or: [{ isDeleted: false }, { isDeleted: { $exists: false } }],
    });

    res.status(200).json(users);
  } catch (error) {
    console.log("Error fetching users:", error.message);
    res.status(500).json({ message: "Failed to fetch users" });
  }
};

// Soft delete a user
export const softDeleteUser = async (req, res) => {
  try {
    const { id } = req.params;

    // 1️⃣ Find user
    const user = await User.findById(id);
    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    // 2️⃣ Protect admin from deleting themselves
    if (user.role === "admin") {
      return res.status(403).json({ message: "Cannot delete an admin" });
    }

    // 3️⃣ Soft delete
    user.isDeleted = true;
    user.status = "suspended"; // optional: suspend immediately
    await user.save();

    res
      .status(200)
      .json({ message: "User deleted successfully (soft delete)" });
  } catch (error) {
    console.log("Soft delete error:", error.message);
    res.status(500).json({ message: "Failed to delete user" });
  }
};


export const changeUserRole = async (req, res) => {
  try {
    const { id } = req.params;
    const { role } = req.body; // expected: "student" | "teacher" | "admin"

    if (!["student", "teacher", "admin"].includes(role)) {
      return res.status(400).json({ message: "Invalid role" });
    }

    const user = await User.findById(id);
    if (!user) return res.status(404).json({ message: "User not found" });

    user.role = role;
    await user.save();

    res.status(200).json({ message: "Role updated successfully", user });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};


// Get a single user by ID
export const getUserById = async (req, res) => {
  try {
    const { userId } = req.params;

    // Find user by ID and not deleted
    const user = await User.findOne({ _id: userId})
      .select("-password"); // exclude password

    if (!user) {
      return res.status(404).json({ message: "User not found" });
    }

    res.status(200).json({ user });
  } catch (error) {
    console.error("Error fetching user by ID:", error.message);
    res.status(500).json({ message: "Server Error" });
  }
};
