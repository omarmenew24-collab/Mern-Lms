import Course from "../models/course.model.js";
import User from "../models/user.model.js"; // so you can find the teacher
import Enrollment from "../models/enrollment.model.js"
import Task from "../models/task.model.js";
import Submission from "../models/submission.model.js";
import Lecture from "../models/lecture.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";
import { updateUnifiedProgress } from "../lib/utils.js";

export const createtask = async (req, res) => {
  try {
    const { courseId } = req.params;
    const { title, description, type, dueDate, examDetails } = req.body;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Only the teacher of the course can create tasks
    if (course.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the teacher can create tasks" });

    // Create the task document
    const task = await Task.create({
      title,
      description,
      type,
      dueDate: type === "assignment" ? dueDate : undefined, // only for assignments
      examDetails: type === "exam" ? examDetails : undefined, // only for exams
      createdBy: req.user._id,
    });

    // Add task reference to course
    course.tasks.push(task._id);
    await course.save();

    res.status(201).json({ message: "Task created successfully", task });
  } catch (err) {
    console.error(err);
    res.status(500).json({ message: "Server error" });
  }
};

export const gettasks = async (req, res) => {
  try {
    const { courseId } = req.params;

    const course = await Course.findById(courseId).populate("tasks");
    if (!course) return res.status(404).json({ message: "Course not found" });

    res.status(200).json({
      message: "Tasks fetched successfully",
      tasks: course.tasks // now includes full task objects
    });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error" });
  }
};

export const deletetask = async (req, res) => {
  try {
    const { courseId, taskId } = req.params;

    // Find the course
    const course = await Course.findById(courseId);
    if (!course) return res.status(404).json({ message: "Course not found" });

    // Find the index of the task to delete
    const taskIndex = course.tasks.findIndex(task => task._id.toString() === taskId);
    if (taskIndex === -1) return res.status(404).json({ message: "Task not found" });

    if (course.teacher.toString() !== req.user._id.toString())
      return res.status(403).json({ message: "Only the teacher can delete tasks" });

    // Remove the task from the array
    course.tasks.splice(taskIndex, 1);

    // Save the updated course
    await course.save();

    return res.status(200).json({ message: "Task deleted successfully", tasks: course.tasks });
  } catch (error) {
    console.error("Error deleting task:", error);
    return res.status(500).json({ message: "Server error while deleting task" });
  }
};

export const updatetask = async (req, res) => {
  try {
    const { courseId, taskId } = req.params;
    const { title, description, type, dueDate, examDetails } = req.body;

    // 1. Find the task directly by its ID
    const task = await Task.findById(taskId);
    if (!task) {
      return res.status(404).json({ message: "Task not found" });
    }

    // 2. Security Check: Ensure the user updating is the teacher of the course
    const course = await Course.findById(courseId);
    if (!course || course.teacher.toString() !== req.user._id.toString()) {
      return res.status(403).json({ message: "Not authorized to update this task" });
    }

    // 3. Update the fields on the Task document
    if (title) task.title = title;
    if (description) task.description = description;
    if (type) task.type = type;
    if (dueDate) task.dueDate = dueDate;
    if (examDetails) task.examDetails = examDetails;

    // 4. Save the task document
    await task.save();

    res.status(200).json({ message: "Task updated successfully", task });
  } catch (error) {
    console.error(error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const gradesubmission = async (req, res) => {
  try {
    const { taskId, studentId } = req.params;
    const { grade } = req.body; // grade from request body

    const submission = await Submission.findOne({
      taskId: taskId,
      studentId: studentId
    });

    if (!submission) {
      return res.status(404).json({
        message: "Submission not found"
      });
    }

    submission.grade = grade;
    await submission.save();

    res.status(200).json({
      message: "Task graded successfully",
      submission
    });

  } catch (error) {
    console.error(error);
    res.status(500).json({
      message: "Server error"
    });
  }
};

export const submissions = async (req, res) => {
  try {
    const { taskId } = req.params;

    // Find all submissions for this task
    const studentSubmissions = await Submission.find({ taskId:taskId })
      .populate("studentId", "name email") // populate student info if you have refs
      .populate("taskId", "title dueDate"); // optional: populate task info

    if (!studentSubmissions || studentSubmissions.length === 0) {
      return res.status(404).json({ message: "No submissions found for this task" });
    }

    res.status(200).json(studentSubmissions);

  } catch (error) {
    console.error("Error fetching submissions:", error);
    res.status(500).json({ message: "Server error", error: error.message });
  }
};

export const markTaskAsComplete = async (req, res) => {
  try {
    const { courseId, taskId } = req.params;
    const studentId = req.user._id;

    // 1. Mark this specific task as done
    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedTasks: taskId } },
      { upsert: true }
    );

    // 2. Recalculate total progress
    const updatedRecord = await updateUnifiedProgress(studentId, courseId);

    res.status(200).json({
      message: "Task marked as complete",
      completedTasks: updatedRecord.completedTasks, // Return this for UI checkmarks
      progress: updatedRecord.progress
    });
  } catch (error) {
    res.status(500).json({ message: error.message });
  }
};