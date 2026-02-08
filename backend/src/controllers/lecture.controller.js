import Course from "../models/course.model.js";
import User from "../models/user.model.js"; // so you can find the teacher
import Enrollment from "../models/enrollment.model.js"
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { updateUnifiedProgress } from "../lib/utils.js";

export const createLecture = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Extract lecture data from request body
    const { title, description, videoUrl, level, duration, order, createdBy } = req.body;

    if (!title || !videoUrl || !level?.number || !level?.title) {
      return res.status(400).json({ message: "Missing required lecture fields" });
    }

    // Create the lecture
    const lecture = await Lecture.create({
      course: course._id,
      title,
      description,
      videoUrl,
      level,
      duration,
      order,
      createdBy,
    });

    // Add lecture to the course's lectures array
    course.lectures.push(lecture._id);
    await course.save();

    // Return the newly created lecture
    res.status(201).json({ message: "Lecture added successfully", lecture });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const getLecturesByCourse = async (req, res) => {
  try {
    const { courseId } = req.params;

    // Check if course exists
    const course = await Course.findById(courseId).populate({
      path: "lectures",
      model: "Lecture",
      populate: { path: "createdBy", select: "name email" }, // optional
    });

    if (!course) {
      return res.status(404).json({ message: "Course not found" });
    }

    // Return all lectures
    res.status(200).json({ lectures: course.lectures });
  } catch (error) {
    console.error("Error fetching lectures:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};



// --- LECTURE CONTROLLER ---
export const markLectureAsComplete = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;
    const studentId = req.user._id;

    // 1. Mark this specific lecture as done
    // $addToSet ensures we don't count the same lecture twice
    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedLectures: lectureId } },
      { upsert: true } // Creates record if student just started
    );

    // 2. Recalculate total progress
    const updatedRecord = await updateUnifiedProgress(studentId, courseId);

    res.status(200).json({
      message: "Lecture marked as complete",
      completedLectures: updatedRecord.completedLectures, // Return this for UI checkmarks
      progress: updatedRecord.progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};

export const deleteLecture = async (req, res) => {
  try {
    const { courseId, lectureId } = req.params;

    // Delete the lecture document directly
    const lecture = await Lecture.findByIdAndDelete(lectureId);
    if (!lecture) {
      return res.status(404).json({ message: "Lecture not found" });
    }

    // Remove lecture reference from the course using atomic $pull
    const courseUpdate = await Course.updateOne(
      { _id: courseId },
      { $pull: { lectures: lectureId } }
    );

    if (courseUpdate.modifiedCount === 0) {
      return res.status(400).json({ message: "Lecture does not belong to this course" });
    }

    res.status(200).json({ message: "Lecture deleted successfully" });
  } catch (error) {
    console.error("Error deleting lecture:", error);
    res.status(500).json({ message: "Server error" });
  }
};



