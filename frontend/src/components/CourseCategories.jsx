import React, { useState } from "react";
import { useNavigate, Link } from "react-router-dom";
import { PlusCircle, Trash2 } from "lucide-react";
import { toast } from "react-hot-toast";
import { useDarkMode } from "../store/darkmode";
import useUserStore from "../store/userstore";
import { useDeleteCourse, useGetCourses } from "../api/course";

const CourseCategories = () => {
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();

  const [selectedCategory, setSelectedCategory] = useState("all");

  // Fetch all courses
  const { allcourses = [], isLoading, isError } = useGetCourses();
  const { deletemycourse } = useDeleteCourse();

  const filteredCourses =
    selectedCategory === "all"
      ? allcourses
      : allcourses.filter(
          (c) => c.category?.toLowerCase() === selectedCategory.toLowerCase()
        );

  const handleCourseClick = (course) => {
    navigate(`/course/${course._id}`, { state: course });
  };

  if (isLoading) return <p className="text-center mt-10">Loading courses...</p>;
  if (isError)
    return (
      <p className="text-center mt-10 text-red-500">
        Failed to load courses
      </p>
    );

  return (
    <div>
      <div className="p-6 mt-6 max-w-7xl mx-auto">
        <h1
          className={`text-4xl font-bold text-center mb-12 ${
            darkMode ? "text-white" : "text-gray-800"
          }`}
        >
          Welcome to Course Academy!
        </h1>

        {/* Category Buttons */}
        <div className="flex justify-center space-x-6 mb-10">
          {["all", "science", "culture", "programming"].map((cat) => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className={`px-6 py-2 rounded-full font-semibold text-sm uppercase transition duration-200 
              ${
                selectedCategory === cat
                  ? "bg-blue-600 text-white shadow-lg scale-105"
                  : darkMode
                  ? "bg-gray-700 text-white border border-gray-600 hover:bg-gray-600"
                  : "bg-white text-gray-700 border border-gray-300 hover:bg-gray-100"
              }`}
            >
              {cat === "all"
                ? "All"
                : cat === "science"
                ? "🧪 Science"
                : cat === "culture"
                ? "🎭 Culture"
                : "💻 Programming"}
            </button>
          ))}
        </div>

        {/* Courses Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-8 mb-16 transition-all duration-300">
          {filteredCourses.length > 0 ? (
            filteredCourses.map((course) => (
              <div
                key={course._id}
                onClick={() => handleCourseClick(course)}
                className={`rounded-2xl shadow-md hover:shadow-xl transition transform hover:-translate-y-2 cursor-pointer overflow-hidden ${
                  darkMode ? "bg-gray-800 border border-gray-700" : "bg-white"
                }`}
              >
                <div className="bg-gradient-to-r from-blue-500 to-purple-500 p-4">
                  <h2 className="text-xl font-bold text-white">
                    {course.title}
                  </h2>
                </div>

                <div className="p-5 space-y-3">
                  <p
                    className={`font-medium ${
                      darkMode ? "text-gray-200" : "text-gray-700"
                    }`}
                  >
                    👨‍🏫 Teacher:{" "}
                    <span className="font-semibold">
                      {course.teacher?.name || course.teacher || "N/A"}
                    </span>
                  </p>

                  <p className={darkMode ? "text-gray-300" : "text-gray-600"}>
                    {course.description || "No description provided."}
                  </p>

                  <p
                    className={`text-sm italic ${
                      darkMode ? "text-gray-400" : "text-gray-500"
                    }`}
                  >
                    📂 Category: {course.category}
                  </p>

                  {/* Teacher Create Task Button */}
                  {user?.role === "teacher" &&
                    course.teacher?._id === user._id && (
                      <Link
                        to={`/course/${course._id}/task`}
                        onClick={(e) => e.stopPropagation()}
                      >
                        <button className="mt-4 w-full flex items-center justify-center gap-2 px-6 py-3 bg-indigo-600 text-white font-semibold rounded-xl hover:bg-indigo-700 shadow transition">
                          <PlusCircle className="w-5 h-5" /> + Create Task
                        </button>
                      </Link>
                    )}

                  {/* Delete Course Button (Admin or Teacher) */}
                  {(user?.role === "admin" ||
                    (user?.role === "teacher" &&
                      course.teacher?._id === user._id)) && (
                    <button
                      onClick={(e) => {
                        e.stopPropagation(); // prevent navigation
                        toast((t) => (
                          <div className="flex flex-col gap-2">
                            <span>
                              Are you sure you want to delete this course?
                            </span>
                            <div className="flex gap-2 justify-end mt-1">
                              <button
                                className="px-3 py-1 bg-gray-200 rounded hover:bg-gray-300 text-sm"
                                onClick={() => toast.dismiss(t.id)}
                              >
                                Cancel
                              </button>
                              <button
                                className="px-3 py-1 bg-red-600 rounded text-white text-sm hover:bg-red-700 flex items-center gap-1"
                                onClick={async () => {
                                  toast.dismiss(t.id);
                                  try {
                                    await deletemycourse(course._id);
                                    
                                  } catch (err) {
                                    console.error(err);
                                    toast.error("Failed to delete course");
                                  }
                                }}
                              >
                                <Trash2 size={16} /> Delete
                              </button>
                            </div>
                          </div>
                        ));
                      }}
                      className="mt-3 w-full flex items-center justify-center gap-2 px-4 py-2 bg-red-50 text-red-600 font-semibold rounded-xl hover:bg-red-100 shadow transition"
                    >
                      <Trash2 size={16} /> Delete Course
                    </button>
                  )}
                </div>
              </div>
            ))
          ) : (
            <p
              className={`text-center col-span-full ${
                darkMode ? "text-gray-400" : "text-gray-600"
              }`}
            >
              No courses available in this category.
            </p>
          )}
        </div>
      </div>
    </div>
  );
};

export default CourseCategories;
