import Course from "../models/course.model.js";
import Enrollment from "../models/enrollment.model.js";
import User from "../models/user.model.js"

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
