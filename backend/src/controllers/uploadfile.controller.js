import Submission from "../models/submission.model.js";
import { uploadFile } from "../lib/cloudinaryupload.js";
import { updateUnifiedProgress } from "../lib/utils.js";
import Enrollment from "../models/enrollment.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";

export const uploadfile = async (req, res) => {
  try {
    // 1. Must be logged in
    if (!req.user) {
      return res.status(403).json({ message: "Only students can upload files" });
    }

    const studentId = req.user._id;
    const { taskId, courseId } = req.body;

    if (!req.file) {
      return res.status(400).json({ message: "No file provided" });
    }

    // 2. Check enrollment and populate the 'course' field (as named in your model)
    const enrollment = await Enrollment.findOne({
      student: studentId,
      course: courseId,
      $or: [{ status: "active" }, { status: { $exists: false } }],
    }).populate("course");

    if (!enrollment || !enrollment.course) {
      return res.status(403).json({ message: "You are not enrolled in this course or course not found" });
    }

    // 3. Verify the task belongs to the course
    const taskBelongsToCourse = enrollment.course.tasks.some(
      (id) => id.toString() === taskId
    );

    if (!taskBelongsToCourse) {
      return res.status(400).json({ message: "Task does not belong to this course" });
    }

    // 4. Upload file to Cloudinary
    const fileUrl = await uploadFile(req.file.path);

    // 5. Save or Update submission (Uses findOneAndUpdate to avoid E11000 errors)
    const submission = await Submission.findOneAndUpdate(
      { taskId, studentId }, 
      { 
        fileUrl, 
        submittedAt: new Date() 
      },
      { upsert: true, new: true, setDefaultsOnInsert: true }
    );

    // 6. Mark task as complete
    await CourseCompletion.findOneAndUpdate(
      { student: studentId, course: courseId },
      { $addToSet: { completedTasks: taskId } },
      { upsert: true, new: true }
    );

    await updateUnifiedProgress(studentId, courseId);

    res.status(201).json({
      message: "File uploaded and task marked complete!",
      url: fileUrl,
      submission,
    });

  } catch (error) {
    console.error("Upload error:", error);
    res.status(500).json({ message: "Upload failed", error: error.message });
  }
};