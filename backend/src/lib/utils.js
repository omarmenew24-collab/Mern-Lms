import jwt from "jsonwebtoken";
import Course from "../models/course.model.js";
import CourseCompletion from "../models/courseCompletion.model.js";

export const cookieOptions = {
  httpOnly: true,
  sameSite: "lax",
  secure: false, // true in prod
  path: "/",
};

export const generateToken = (user,  res) => {
  const token = jwt.sign({ _id:user._id, role:user.role }, process.env.JWT_SECRET, {
    expiresIn: "7d",
  });



if (process.env.NODE_ENV === "production") cookieOptions.secure = true;
  res.cookie("jwt", token,cookieOptions);
  

  console.log("token from generate token",token)
  return token;
};

/**
 * Unified function to calculate and update progress
 * Works for Lectures, Tasks, and future Exams
 */
export const updateUnifiedProgress = async (studentId, courseId) => {
  // 1. Fetch the completion record and the course blueprint
  // Note: Populate "tasks" and "lectures" to get their counts accurately
  const [completion, course] = await Promise.all([
    CourseCompletion.findOne({ student: studentId, course: courseId }),
    Course.findById(courseId).populate("lectures tasks")
  ]);

  if (!completion || !course) {
    throw new Error("Progress record or Course not found");
  }

  // 2. Count TOTAL items from the Course Blueprint
  const totalLectures = course.lectures?.length || 0;
  const totalTasks = course.tasks?.length || 0;
  // If your Course model has an 'exams' array, count it; otherwise default to 0
  const totalExams = course.exams?.length || 0; 
  
  const totalRequiredItems = totalLectures + totalTasks + totalExams;

  // Safety: If there's nothing in the course yet, progress is 0
  if (totalRequiredItems === 0) {
    completion.progress = 0;
    return await completion.save();
  }

  // 3. Count COMPLETED items from the Student's Progress Record
  const completedLecturesCount = completion.completedLectures?.length || 0;
  const completedTasksCount = completion.completedTasks?.length || 0;
  
  // Ensure we handle the completedExams count (even if the array doesn't exist yet)
  const completedExamsCount = completion.completedExams?.length || 0; 

  const totalCompletedItems = completedLecturesCount + completedTasksCount + completedExamsCount;

  // 4. Calculate Percentage (Ensure it never exceeds 100)
  const rawProgress = (totalCompletedItems / totalRequiredItems) * 100;
  completion.progress = Math.min(Math.round(rawProgress), 100);

  // 5. Handle Completion Status & Logic
  // We check if it's 100 and transition it to completed
  if (completion.progress === 100) {
    if (!completion.isCompleted) {
      completion.isCompleted = true;
      completion.completedAt = new Date();
    }
  } else {
    // If the teacher adds a new task LATER, the student might drop below 100%
    // This resets the status if the course grows
    completion.isCompleted = false;
    completion.completedAt = null;
  }

  return await completion.save();
};