import React, { useState } from "react";
import useUserStore from "../store/userstore";
import { useNavigate } from "react-router-dom";
import { BookOpen, PlusCircle, Smile, GraduationCap } from "lucide-react";
import { useGetCoursesByTeacher, useGetCoursesByStudent } from "../api/course";

const Teacher = () => {
  const user = useUserStore((state) => state.user);

  const navigate = useNavigate();
  const [activeTab, setActiveTab] = useState("teaching");

  // 1. Get courses this user TEACHES (using user._id)
  const { coursesbyteacher = [], isLoading: loadingTeacher } =
    useGetCoursesByTeacher(user?._id);

  // 2. Get courses this user IS ENROLLED IN (using the token/hook)
  const { coursesbystudent = [], isLoading: loadingStudent } =
    useGetCoursesByStudent();

  console.log("courses enrolled", coursesbystudent);

  const loading = loadingTeacher || loadingStudent;

  const handleCourseClick = (course, type) => {
    if (type === "teacher")
      navigate(`/course/teacher/${course._id}`, { state: course });
    else navigate(`/course/student/${course._id}`, { state: course });
  };

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-900">
      <div className="pt-20 px-6 max-w-6xl mx-auto">
        {/* Welcome Header */}
        <div className="flex items-center gap-3 mb-8">
          <Smile className="w-8 h-8 text-indigo-600" />
          <h2 className="text-2xl font-semibold dark:text-white">
            Welcome back, <span className="text-indigo-600">{user?.name}</span>
          </h2>
        </div>

        {/* Tab Switcher */}
        <div className="flex justify-center mb-10">
          <div className="bg-white dark:bg-gray-800 shadow-md rounded-full flex p-1 border dark:border-gray-700">
            <button
              onClick={() => setActiveTab("teaching")}
              className={`px-8 py-2 rounded-full font-bold transition ${
                activeTab === "teaching"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500"
              }`}
            >
              Courses You Teach
            </button>
            <button
              onClick={() => setActiveTab("enrolled")}
              className={`px-8 py-2 rounded-full font-bold transition ${
                activeTab === "enrolled"
                  ? "bg-indigo-600 text-white"
                  : "text-gray-500"
              }`}
            >
              Courses You're Enrolled In
            </button>
          </div>
        </div>

        {loading ? (
          <p className="text-center text-gray-500">Loading your dashboard...</p>
        ) : activeTab === "teaching" ? (
          /* ================= TAB: TEACHING ================= */
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coursesbyteacher.length === 0 ? (
                <p className="col-span-3 text-center text-gray-500 italic py-10">
                  You haven't created any courses yet.
                </p>
              ) : (
                coursesbyteacher.map((course) => (
                  <div
                    key={course._id}
                    onClick={() => handleCourseClick(course, "teacher")}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border border-gray-100 dark:border-gray-700 cursor-pointer hover:shadow-md transition"
                  >
                    <BookOpen className="text-indigo-600 mb-3" />
                    <h4 className="font-bold text-lg dark:text-white">
                      {course.title}
                    </h4>
                    <p className="text-sm text-gray-500 mt-2 line-clamp-2">
                      {course.description}
                    </p>
                  </div>
                ))
              )}
            </div>
            <div className="flex justify-center mt-10">
              <button
                onClick={() => navigate("/createcourse")}
                className="flex items-center gap-2 bg-indigo-600 text-white px-6 py-3 rounded-xl hover:bg-indigo-700 shadow-lg transition"
              >
                <PlusCircle size={20} /> Create a New Course
              </button>
            </div>
          </div>
        ) : (
          /* ================= TAB: ENROLLED ================= */
          <div className="animate-in fade-in duration-500">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {coursesbystudent.length === 0 ? (
                <div className="col-span-3 text-center py-20">
                  <GraduationCap
                    className="mx-auto text-gray-300 mb-4"
                    size={48}
                  />
                  <p className="text-gray-500">
                    You are not enrolled in any courses as a student.
                  </p>
                </div>
              ) : (
                coursesbystudent.map((course) => (
                  <div
                    key={course?._id}
                    onClick={() => handleCourseClick(course, "student")}
                    className="bg-white dark:bg-gray-800 p-6 rounded-2xl shadow-sm border-l-4 border-indigo-600 cursor-pointer hover:shadow-md transition"
                  >
                    <span className="text-[10px] font-bold text-indigo-500 uppercase">
                      {course?.category}
                    </span>
                    <h4 className="font-bold text-lg mt-1 dark:text-white">
                      {course?.title}
                    </h4>
                    <p className="text-xs text-gray-400 mt-4">
                      Teacher: {course?.teacher?.name}
                    </p>
                  </div>
                ))
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default Teacher;
