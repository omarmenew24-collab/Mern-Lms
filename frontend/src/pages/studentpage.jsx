import React, { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import Navbar from "../components/Header";
import { useGetCoursesByStudent } from "../api/course";
import useUserStore from "../store/userstore";

const Student = () => {
  const { coursesbystudent = [], isLoading, isError } = useGetCoursesByStudent();
  const user = useUserStore((state) => state.user);
  const navigate = useNavigate();
   const handleCourseClick = (course) => {
    navigate(`/course/student/${course._id}`, { state: course });
  };

  // Nice display name fallback chain
  const displayName =
    user?.name || user?.fullName || user?.username || user?.email || "Student";

  return (
    <div className="min-h-screen bg-gray-50">

      {/* 
        If your Navbar is fixed (e.g. has `fixed top-0`), change the next div's padding:
        replace `pt-6 md:pt-8` with `pt-20 md:pt-24` (or whatever matches your navbar height)
      */}
      <main className="max-w-6xl mx-auto p-6 pt-6 md:pt-8">
        <header className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold">
              Welcome back,{" "}
              <span className="text-blue-600">{displayName.split(" ")[0]}</span> 👋
            </h1>
            <p className="text-sm text-gray-500 mt-1">
              Here are the courses you're enrolled in.
            </p>
          </div>

          <div className="hidden sm:flex items-center space-x-3">
            <div className="w-12 h-12 rounded-full bg-gray-200 flex items-center justify-center text-gray-700 font-medium">
              {displayName.charAt(0).toUpperCase()}
            </div>
          </div>
        </header>

        {isLoading ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {[1, 2, 3].map((s) => (
              <div
                key={s}
                className="animate-pulse bg-white rounded-2xl p-5 border border-gray-100 shadow-sm"
              >
                <div className="h-5 bg-gray-200 rounded w-3/4 mb-3" />
                <div className="h-3 bg-gray-200 rounded w-full mb-4" />
                <div className="h-3 bg-gray-200 rounded w-2/3" />
              </div>
            ))}
          </div>
        ) : coursesbystudent.length > 0 ? (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
            {coursesbystudent.map((course) => (
              <article
                key={course._id}
                role="button"
                tabIndex={0}
                onClick={() => {handleCourseClick(course)}}
                onKeyDown={(e) => {
                  if (e.key === "Enter" || e.key === " ") {
                    e.preventDefault();
                    navigate(`/course/${course._id}`);
                  }
                }}
                className="cursor-pointer bg-white rounded-2xl shadow-md hover:shadow-lg transition transform hover:-translate-y-1 p-5 border border-gray-100 focus:outline-none focus:ring-2 focus:ring-blue-200"
                aria-label={`Open course ${course.title}`}
              >
                <div className="flex items-start justify-between">
                  <div className="text-left">
                    <h2 className="text-lg font-semibold text-gray-800">
                      {course.title}
                    </h2>
                    <p className="text-sm text-gray-600 mt-2 line-clamp-3">
                      {course.description || "No description available."}
                    </p>
                  </div>
                </div>

                <div className="mt-4 flex items-center justify-between">
                  <span className="text-sm font-medium text-gray-700">
                    {course.price != null ? `$${course.price}` : "Free"}
                  </span>
                  <span className="text-blue-600 text-sm font-medium">
                    View Course →
                  </span>
                </div>
              </article>
            ))}
          </div>
        ) : (
          <div className="text-center py-20">
            <p className="text-gray-600">You are not enrolled in any courses yet.</p>
            <button
              onClick={() => navigate("/courses")}
              className="mt-4 inline-block bg-blue-600 text-white px-4 py-2 rounded-lg shadow"
            >
              Browse Courses
            </button>
          </div>
        )}
      </main>
    </div>
  );
};

export default Student;
