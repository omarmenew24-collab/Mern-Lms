import { useLocation, Link, useNavigate } from "react-router-dom";
import { useState } from "react";
import useStore from "../store/userstore";
import {
  BookOpen,
  User,
  FileText,
  PlusCircle,
  Smile,
  Video,
  CheckCircle,
  Circle,
  Trophy,
} from "lucide-react";

// Existing API imports
import { useGetTasks, useDeleteTask } from "../api/task";
import {
  useGetStudentsByCourse,
  useGetCourseProgress,
  useGetBulkProgress,
} from "../api/course";
import {
  useGetLecturesByCourse,
  useMarkLecture,
  useDeleteLecture,
} from "../api/lecture";
import CertificateTemplate from "../components/CertificateTemplate";
import { useRef } from "react";
import { useReactToPrint } from "react-to-print";
import useUserStore from "../store/userstore";
import { Trash2 } from "lucide-react"; // make sure to import at the top
import { toast } from "react-hot-toast";


const CourseDashboard = () => {
  const location = useLocation();
  const course = location.state;
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  console.log("course:", course);

  // --- API HOOKS ---
  const { tasks = [] } = useGetTasks(course?._id);
  const { deleteMyTask } = useDeleteTask(course?._id);
  const { students = [] } = useGetStudentsByCourse(course?._id);
  const { lectures = [] } = useGetLecturesByCourse(course?._id);
  const { deleteMyLecture, isPending, isError } = useDeleteLecture(course?._id);
  // ✅ Progress Hooks
  const { progressData } = useGetCourseProgress(course?._id);
  const { bulkprogressData, isbulkLoading, isbulkError } = useGetBulkProgress(
    course?._id,
  );

  const { markLecture } = useMarkLecture(course?._id);

  const is_instructor = user?._id === course?.teacher?._id;

  console.log("students",students)
  console.log("is_instructor",is_instructor)

  const isApproved = progressData?.certificateApproved; // Assuming this exists in progressData

  const certificateRef = useRef(null);

  const handlePrint = useReactToPrint({
    contentRef: certificateRef,
    documentTitle: `${user?.name}_${course?.title}_Certificate`,
  });

  // --- STATE & LOGIC ---
  const [expandedLevels, setExpandedLevels] = useState({});
  const toggleLevel = (num) =>
    setExpandedLevels((prev) => ({ ...prev, [num]: !prev[num] }));

  if (!course) return <p className="p-8 text-center">Course not found!</p>;

  // Helpers to check completion
  const isLectureDone = (id) => progressData?.completedLectures?.includes(id);
  const isTaskDone = (id) => progressData?.completedTasks?.includes(id);

  // Added logic to check for 100% completion
  const isFullProgress = progressData?.progress === 100;

const handleDelete = async (taskId) => {
  // Step 1: Confirm deletion
  const confirmed = window.confirm("Are you sure you want to delete this task?");
  if (!confirmed) {
    toast("Deletion cancelled"); // optional
    return;
  }

  // Step 2: Show loading toast
  const loadingToastId = toast.loading("Deleting task...");

  try {
    await deleteMyTask(taskId); // make sure this returns a Promise

    // Step 3: Success
    toast.dismiss(loadingToastId); // remove loading
    toast.success("Task deleted successfully!");
  } catch (error) {
    toast.dismiss(loadingToastId);
    console.log("Error deleting task:", error);
    toast.error(error.response?.data?.message || "Failed to delete task");
  }
};

const handledeletelecture = (lectureId) => {
  // Show toast confirmation
  toast((t) => (
    <div className="flex flex-col gap-2">
      <span>Are you sure you want to delete this lecture?</span>
      <div className="flex gap-2 justify-end">
        <button
          className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
          onClick={() => toast.dismiss(t.id)}
        >
          Cancel
        </button>
        <button
          className="px-3 py-1 bg-red-600 rounded text-white text-sm hover:bg-red-700"
          onClick={async () => {
            toast.dismiss(t.id); // close toast
            try {
              await deleteMyLecture(lectureId);
            } catch (err) {
              toast.error("Failed to delete lecture");
              console.error(err);
            }
          }}
        >
          Yes, Delete
        </button>
      </div>
    </div>
  ));
};


  const handleUpdate = (courseId, task) => {
    navigate(`/course/${courseId}/task`, { state: { task, mode: "update" } });
  };
  const handlesubmit = (courseId, taskId, studentId) => {
    navigate(`/uploadfile/${courseId}/${taskId}/${studentId}`);
  };

  const handleview = (taskId) => {
    navigate(`/tasksubmissions/${user._id}/${taskId}`);
  };

  return (
    <div className="min-h-screen p-8 bg-gray-50">
      <div className="max-w-5xl mx-auto">
        {/* Progress Bar for Students */}
        {!is_instructor && (
          <div
            className={`mb-8 p-5 rounded-xl border shadow-sm transition-all duration-500 ${
              isFullProgress
                ? "bg-green-50 border-green-200"
                : "bg-white border-gray-100"
            }`}
          >
            <div className="flex justify-between items-center mb-3">
              <div className="flex items-center gap-2">
                <span
                  className={`text-sm font-bold uppercase tracking-wider ${
                    isFullProgress ? "text-green-600" : "text-gray-500"
                  }`}
                >
                  {isFullProgress ? "Course Completed" : "Course Progress"}
                </span>
                {isFullProgress && (
                  <CheckCircle
                    size={18}
                    className="text-green-500 animate-bounce"
                  />
                )}
              </div>
              <span
                className={`text-sm font-black ${
                  isFullProgress ? "text-green-600" : "text-indigo-600"
                }`}
              >
                {progressData?.progress || 0}%
              </span>
            </div>

            <div className="w-full bg-gray-200 rounded-full h-3 overflow-hidden shadow-inner">
              <div
                className={`h-full rounded-full transition-all duration-1000 ease-out ${
                  isFullProgress ? "bg-green-500" : "bg-indigo-600"
                }`}
                style={{ width: `${progressData?.progress || 0}%` }}
              >
                {isFullProgress && (
                  <div className="w-full h-full opacity-30 bg-[linear-gradient(45deg,rgba(255,255,255,.2)_25%,transparent_25%,transparent_50%,rgba(255,255,255,.2)_50%,rgba(255,255,255,.2)_75%,transparent_75%,transparent)] bg-[length:20px_20px] animate-[shimmer_2s_linear_infinite]"></div>
                )}
              </div>
            </div>

            {isFullProgress && (
              <div className="mt-4 flex items-center gap-2 text-green-700 bg-white/50 p-2 rounded-lg border border-green-100">
                <Trophy size={16} className="text-yellow-500" />
                <span className="text-xs font-semibold text-green-800">
                  Congratulations! You've mastered all the materials in this
                  course.
                </span>
              </div>
            )}

            <div className="absolute -z-50 opacity-0">
              <CertificateTemplate
                ref={certificateRef}
                studentName={user?.name}
                courseTitle={course?.title}
                date={new Date().toLocaleDateString()}
              />
            </div>

            <button
              onClick={() => {
                if (isApproved) {
                  handlePrint();
                } else {
                  alert(
                    "Certificate must be approved before generating the PDF.",
                  );
                }
              }}
              disabled={!isApproved}
              className={`mt-6 px-6 py-2 rounded-xl font-bold transition flex items-center gap-2 ${
                isApproved
                  ? "bg-indigo-600 text-white hover:bg-indigo-700 cursor-pointer shadow-md shadow-indigo-200"
                  : "bg-gray-200 text-gray-500 cursor-not-allowed opacity-70"
              }`}
            >
              <FileText size={18} />
              {isApproved ? "Generate PDF Certificate" : "Certificate Locked"}
            </button>
          </div>
        )}

        {/* Welcome Section */}
        <div className="flex items-center gap-3 mb-8">
          <Smile className="text-indigo-600 w-8 h-8" />
          <h2 className="text-xl font-semibold text-gray-700">
            Welcome back,{" "}
            <span className="text-indigo-600">{user?.name || "User"}</span> 👋
          </h2>
        </div>

        {/* Course Info */}
        <div className="bg-white p-6 rounded-xl shadow mb-4 border">
          <h1 className="text-2xl font-bold flex items-center gap-2">
            <BookOpen className="text-indigo-500" /> {course.title}
          </h1>
          <p className="text-gray-600 flex items-center gap-2 mt-2">
            <User className="w-4 h-4 text-gray-400" /> Teacher:{" "}
            {course.teacher?.name}
          </p>
          <p className="text-gray-500 mt-2">{course.description}</p>
          <span className="inline-block mt-3 px-3 py-1 text-sm bg-gray-100 text-gray-600 rounded-full">
            {course.category}
          </span>
        </div>

        {/* Students Section (Teacher Only) */}
        {is_instructor && students?.length > 0 && (
          <div className="bg-white p-4 rounded-xl shadow mb-6 border">
            <h3 className="text-lg font-semibold text-gray-700 mb-3">
              Enrolled Students ({students.length})
            </h3>
            <div className="flex flex-wrap gap-4">
              {students.map((student) => {
                // ✅ Find student progress in the bulk array
                const studentRecord = bulkprogressData?.find(
                  (item) => item.student.toString() === student._id.toString(),
                );
                const percentage = studentRecord?.progress || 0;

                return (
                  <div
                    key={student._id}
                    className="flex flex-col items-center cursor-pointer transition transform hover:scale-105"
                    onClick={() =>
                      navigate(`/course/${course._id}/student/${student._id}`, {
                        state: { student, course },
                      })
                    }
                  >
                    <div className="relative">
                      <div className="w-14 h-14 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-semibold text-lg shadow-md">
                        {student.name
                          .split(" ")
                          .map((n) => n[0])
                          .join("")
                          .toUpperCase()}
                      </div>
                      {/* ✅ Progress Indicator Badge */}
                      <div className="absolute -top-1 -right-1 bg-indigo-600 text-white text-[10px] px-1.5 py-0.5 rounded-full border-2 border-white font-bold">
                        {isbulkLoading ? "..." : `${percentage}%`}
                      </div>
                    </div>
                    <span className="text-xs text-gray-600 mt-2">
                      {student.name}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        )}

        {/* Lectures Section */}
        <div className="bg-white p-4 rounded-xl shadow mb-6 border">
          <h3 className="text-lg font-semibold text-gray-700 mb-3 flex items-center gap-2">
            <Video className="text-indigo-500" /> Lectures (
            {lectures?.length || 0})
          </h3>

          {lectures.length === 0 ? (
            <p className="text-gray-400 italic">No lectures yet.</p>
          ) : (
            Object.entries(
              (lectures || []).reduce((groups, lecture) => {
                const levelNum = lecture.level?.number ?? 1;
                if (!groups[levelNum]) {
                  groups[levelNum] = {
                    title: lecture.level?.title || `Level ${levelNum}`,
                    lectures: [],
                  };
                }
                groups[levelNum].lectures.push(lecture);
                return groups;
              }, {}),
            )
              .sort(([a], [b]) => Number(a) - Number(b))
              .map(([levelNum, levelData]) => (
                <div key={levelNum} className="mb-6 border-b pb-4">
                  <button
                    onClick={() => toggleLevel(levelNum)}
                    className="w-full flex justify-between items-center px-4 py-2 bg-indigo-100 hover:bg-indigo-200 rounded-md transition"
                  >
                    <span className="font-semibold text-indigo-700 text-lg">
                      Level {levelNum}: {levelData.title}
                    </span>
                    <span className="text-sm text-indigo-600 font-medium">
                      {expandedLevels[levelNum] ? "Hide" : "Show"} Lectures
                    </span>
                  </button>

                  {expandedLevels[levelNum] && (
                    <div className="mt-4 flex flex-col gap-4">
                      {levelData.lectures
                        .sort((a, b) => (a.order ?? 0) - (b.order ?? 0))
                        .map((lecture) => (
                          <div
                            key={lecture._id}
                            className={`bg-white border rounded-lg shadow-sm overflow-hidden transition ${
                              isLectureDone(lecture._id)
                                ? "border-green-200 bg-green-50/30"
                                : ""
                            }`}
                          >
                            <div className="aspect-video bg-black relative">
                              {isLectureDone(lecture._id) && (
                                <div className="absolute top-3 right-3 z-10 bg-white rounded-full p-1 text-green-500 shadow-lg">
                                  <CheckCircle size={28} />
                                </div>
                              )}

                              {lecture.videoUrl?.includes("youtube") ? (
                                <iframe
                                  className="w-full h-full"
                                  src={lecture.videoUrl.replace(
                                    "watch?v=",
                                    "embed/",
                                  )}
                                  title={lecture.title}
                                  allowFullScreen
                                />
                              ) : (
                                <video
                                  controls
                                  className="w-full h-full"
                                  src={lecture.videoUrl}
                                  onEnded={() => markLecture(lecture._id)}
                                />
                              )}
                            </div>

                            <div className="p-3 flex justify-between items-center">
                              <div>
                                <h4
                                  className={`font-semibold text-sm ${
                                    isLectureDone(lecture._id)
                                      ? "text-green-700"
                                      : "text-gray-800"
                                  }`}
                                >
                                  {lecture.title}
                                </h4>
                                <p className="text-xs text-gray-500 mt-1 line-clamp-1">
                                  {lecture.description}
                                </p>
                              </div>
                              {isLectureDone(lecture._id) ? (
                                <span className="text-[10px] font-bold text-green-600 bg-green-100 px-2 py-1 rounded">
                                  COMPLETED
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold text-gray-400 bg-gray-100 px-2 py-1 rounded">
                                  UNWATCHED
                                </span>
                              )}
                              {/* ✅ DELETE LECTURE (Teacher Only) */}
                              {is_instructor && (
                                <button
                                  onClick={() =>
                                    handledeletelecture(lecture._id)
                                  }
                                  disabled={isPending}
                                  className="flex items-center gap-1 text-xs font-bold text-red-600 hover:text-red-700 bg-red-50 px-2 py-1 rounded transition"
                                >
                                  <Trash2 size={14} /> Delete
                                </button>
                              )}
                            </div>
                          </div>
                        ))}
                    </div>
                  )}
                </div>
              ))
          )}
        </div>

        {/* Tasks Section */}
        <div className="space-y-4">
          <h3 className="text-lg font-semibold text-gray-700 flex items-center gap-2">
            <FileText className="text-indigo-500" /> Tasks & Exams
          </h3>
          {tasks.length === 0 ? (
            <p className="text-gray-400 italic">No tasks yet.</p>
          ) : (
            tasks.map((task) => (
              <div
                key={task._id}
                className={`bg-white rounded-lg border p-4 shadow-sm hover:shadow-md transition ${
                  isTaskDone(task._id) ? "border-green-200" : ""
                }`}
              >
                <div className="flex justify-between items-start md:items-center">
                  <div className="flex-1">
                    <h2 className="text-lg font-semibold text-gray-800 flex items-center gap-2">
                      {task.title}{" "}
                      {isTaskDone(task._id) && (
                        <CheckCircle size={18} className="text-green-500" />
                      )}
                    </h2>
                    <p className="text-sm text-gray-600 line-clamp-1">
                      {task.description}
                    </p>
                    <p className="text-xs text-gray-400 mt-1 uppercase font-medium">
                      {task.type === "exam"
                        ? "Exam Mode"
                        : `Due: ${new Date(task.dueDate).toLocaleDateString()}`}
                    </p>
                  </div>

                  <div className="flex gap-2">
                    {!is_instructor && (
                      <button
                        onClick={() =>
                          handlesubmit(course?._id, task._id, user._id)
                        }
                        disabled={isTaskDone(task._id)}
                        className={`px-4 py-2 text-white font-semibold rounded-lg shadow transition ${
                          isTaskDone(task._id)
                            ? "bg-gray-400 cursor-not-allowed"
                            : "bg-green-500 hover:bg-green-600"
                        }`}
                      >
                        {isTaskDone(task._id) ? "Submitted" : "Submit Solution"}
                      </button>
                    )}
                    {is_instructor && (
                      <>
                        <button
                          onClick={() => handleview(task._id)}
                          className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 shadow transition"
                        >
                          View Submissions
                        </button>
                        <button
                          onClick={() => handleDelete(task._id)}
                          className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 shadow transition"
                        >
                          Delete Task
                        </button>
                        <button
                          onClick={() => handleUpdate(course._id, task)}
                          className="px-4 py-2 bg-indigo-500 text-white font-semibold rounded-lg hover:bg-indigo-600 shadow transition"
                        >
                          Update Task
                        </button>
                      </>
                    )}
                  </div>
                </div>
              </div>
            ))
          )}
        </div>

        {/* Teacher Controls */}
        {is_instructor && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-8">
            <Link to={`/course/${course._id}/task`}>
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow transition">
                <PlusCircle className="w-5 h-5" /> + Create Task
              </button>
            </Link>
            <Link to={`/course/${course._id}/createLecture`}>
              <button className="w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow transition">
                <PlusCircle className="w-5 h-5" /> + Create Lecture
              </button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
};

export default CourseDashboard;
