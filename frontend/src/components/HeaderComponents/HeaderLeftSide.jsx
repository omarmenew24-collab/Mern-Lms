import React from "react";
import { useNavigate } from "react-router-dom";
import { useDarkMode } from "../../store/darkmode";
import useUserStore from "../../store/userstore";

const HeaderLeftSide = () => {
  const navigate = useNavigate();
  const { darkMode } = useDarkMode();
  const user = useUserStore((state) => state.user);
  console.log("user:", user?.role);
  const handleDashboard = () => {
    if (!user) return;
    if (user.role === "student") navigate("/student");
    else if (user.role === "admin") navigate("/admindashboard");
    else if (user.role === "teacher") navigate("/teacher");
  };

  const handleTeach = () => {
    navigate("/teacherform");
  };

  // we need here to handle the admin case to outline the dashboard
  const isOnMyPage =
    (user?.role === "student" && location.pathname.startsWith("/student")) ||
    (user?.role === "teacher" && location.pathname.startsWith("/teacher")) ||
    (user?.role === "admin" && location.pathname.startsWith("/admin"));

  return (
    <div>
      {/* Left side */}
      <div className="flex items-center space-x-4 cursor-pointer">
        <div
          className="flex items-center space-x-2"
          onClick={() => navigate("/")}
        >
          <span
            className={`text-2xl font-bold hover:text-blue-700 transition-colors ${
              darkMode ? "text-blue-400" : "text-blue-600"
            }`}
          >
            Course Academy
          </span>
        </div>

        {user?.role !== "teacher" && user && user?.role !== "admin" && (
          <button
            onClick={handleTeach}
            className={`px-4 py-2 rounded-lg font-semibold hover:bg-blue-700 shadow-md transition ${
              darkMode
                ? "bg-blue-600 text-white hover:bg-blue-500"
                : "bg-blue-600 text-white hover:bg-blue-700"
            }`}
          >
            Teach
          </button>
        )}

        {(user?.role === "teacher" || user?.role === "admin") && (
          <button
            className={`px-4 py-2 rounded-lg font-semibold shadow-md transition ${
              darkMode
                ? "bg-green-600 text-white hover:bg-green-500"
                : "bg-green-600 text-white hover:bg-green-700"
            }`}
            onClick={() => {
              navigate("/createcourse");
            }}
          >
            Create Course
          </button>
        )}

        {user && (
          <button
            onClick={handleDashboard}
            className={`px-4 py-2 rounded-lg font-semibold shadow-md transition ${
              isOnMyPage
                ? `ring-2 ${
                    darkMode
                      ? "bg-purple-700 text-white ring-purple-400"
                      : "bg-purple-800 text-white ring-purple-400"
                  }`
                : darkMode
                  ? "bg-purple-600 text-white hover:bg-purple-500"
                  : "bg-purple-600 text-white hover:bg-purple-700"
            }`}
          >
            Dashboard
          </button>
        )}
      </div>
    </div>
  );
};

export default HeaderLeftSide;
