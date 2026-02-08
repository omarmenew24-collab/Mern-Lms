import Course from "../models/course.model.js";
import User from "../models/user.model.js"; // so you can find the teacher
import Enrollment from "../models/enrollment.model.js"
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { updateUnifiedProgress } from "../lib/utils.js";

export const createcourse = async (req, res) => {
  const { title, teacher, description, category } = req.body;

  try {
    if (!title || !teacher || !description || !category) {
      return res.status(400).json({ message: "All fields are required" });
    }

    // Find the teacher by name
    const teacherDoc = await User.findOne({ name: teacher, role: "teacher" });
    if (!teacherDoc) {
      return res.status(404).json({ message: "Teacher not found" });
    }

    // Check if course already exists
    const existingCourse = await Course.findOne({ title, description });
    if (existingCourse) {
      return res.status(400).json({ message: "Course already exists" });
    }

    // Create the course with teacher's ObjectId
    const newCourse = new Course({
      title,
      teacher: teacherDoc._id, // store ObjectId here
      description,
      category,
      price:200
    });

    await newCourse.save();

    res.status(201).json({
      _id: newCourse._id,
      title: newCourse.title,
      description: newCourse.description
    });

  } catch (error) {
    console.error("Error in creating course", error.message);
    res.status(500).json({ message: "Internal Server Error" });
  }
};
export const deletecourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) 
      return res.status(404).json({ message: "Course not found" });

    // Check if requester is either the teacher of the course or an admin
    if (
      course.teacher.toString() !== req.user._id.toString() && 
      req.user.role !== "admin"
    ) {
      return res.status(403).json({ message: "You are not allowed to delete this course" });
    }

    // Optional: delete all related lectures/tasks if needed
    await Lecture.deleteMany({ course: courseId });
    await Task.deleteMany({ course: courseId });

    // Delete the course
    await course.deleteOne();

    res.status(200).json({ message: "Course deleted successfully" });
  } catch (error) {
    console.error("Error deleting course:", error);
    res.status(500).json({ message: "Server error" });
  }
};


export const getstudentcourses = async (req, res) => {
  try {
    // 1. Take ID from req.user (provided by your protect/auth middleware)
    const studentId = req.user._id; 

    // 2. Find enrollments where THIS user is the student
    const enrollments = await Enrollment.find({ 
      student: studentId,
      status: "active" // Only show active enrollments
    })
      .populate({
        path: "course",
        populate: { path: "teacher", select: "name email" },
      })
      .populate("student", "name email");

    // 3. Extract courses and filter out any "null" courses (in case a course was deleted)
    const enrolledCourses = enrollments
      .filter((enrollment) => enrollment.course !== null)
      .map((enrollment) => enrollment.course);

    return res.status(200).json({
      success: true,
      count: enrolledCourses.length,
      courses: enrolledCourses,
    });
  } catch (err) {
    console.error("Error fetching student courses:", err);
    return res.status(500).json({
      success: false,
      message: "Server error. Could not fetch courses.",
    });
  }
};


export const getStudentsByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    const enrollments = await Enrollment.find({ course: courseId, status: "active" })
      .populate("student", "name email");

    const students = enrollments.map(e => e.student);

    res.json({ courseId, students });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getTeacherEnrollments = async (req, res) => {
  try {
    const teacherId = req.params.teacherId;

    const enrollments = await Enrollment.find({ status: "active" })
      .populate({
        path: "course",
        match: { student: teacherId },
        select: "title"
      })
      .populate("student", "name email");

    // IMPORTANT: remove enrollments not belonging to this teacher
    const filtered = enrollments.filter(e => e.course);

    res.json({ enrollments: filtered });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const getStudentSubmissionsByCourse = async (req, res) => {
  try {
    const { courseId, studentId } = req.params;

    // 1️⃣ Get all tasks of the course
    const course = await Course.findById(courseId).populate("tasks");
    if (!course) return res.status(404).json({ message: "Course not found" });

    const taskIds = course.tasks.map((task) => task._id);

    // 2️⃣ Get all submissions by this student for these tasks
    const submissions = await Submission.find({
      taskId: { $in: taskIds },
      studentId,
    })
      .populate("taskId", "title type dueDate examDetails") // populate task info
      .sort({ submittedAt: -1 });

    res.json({ studentId, courseId, submissions });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};



export const getCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;
    
    // ✅ Logic: Prioritize the studentId from query (for Teacher view)
    // Fallback to req.user._id (for Student's own view)
    const studentId = req.query.studentId || req.user._id;

    if (!studentId) {
      return res.status(400).json({ message: "Student ID is required." });
    }

    const progress = await CourseCompletion.findOne({ 
      student: studentId, 
      course: courseId 
    });

    if (!progress) {
      return res.status(200).json({
        progress: 0,
        completedLectures: [],
        completedTasks: [],
        isCompleted: false,
        certificateApproved: false // Ensure this is returned for your frontend logic
      });
    }

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: "Error fetching progress", error: error.message });
  }
};

export const getBulkCourseProgress = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find all records for this course
    // This returns: [{ student: "ID1", progress: 80 }, { student: "ID2", progress: 45 }]
    const allProgressRecords = await CourseCompletion.find({ 
      course: courseId 
    }).select("student progress isCompleted");

    // Return the array directly
    res.status(200).json(allProgressRecords);
  } catch (error) {
    res.status(500).json({ message: "Error fetching bulk progress", error: error.message });
  }
};

export const toggleCertificatePermission = async (req, res) => {
  try {
    const { courseId , studentId} = req.params;

    
    const progress = await CourseCompletion.findOne({ 
      course: courseId, 
      student: studentId 
    });

    if (!progress) return res.status(404).json({ message: "Progress not found" });

    // Toggle the value (true becomes false, false becomes true)
    progress.certificateApproved = !progress.certificateApproved;
    await progress.save();

    res.status(200).json(progress);
  } catch (error) {
    res.status(500).json({ message: "Error", error: error.message });
  }
};