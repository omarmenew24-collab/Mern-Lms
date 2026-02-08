import React from "react";
import { useNavigate, Link } from "react-router-dom";
import { useDarkMode } from "../store/darkmode";

const Hero = () => {
  const navigate = useNavigate();
  const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div>
      {/* Hero Section */}
      <div
        className={`relative bg-gradient-to-r from-blue-600 via-purple-600 to-pink-500 text-white py-20 px-6 ${
          darkMode
            ? "dark:bg-gradient-to-r dark:from-blue-900 dark:via-purple-900 dark:to-pink-900"
            : ""
        }`}
      >
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 items-center gap-8">
          <div className="space-y-6">
            <h1 className="text-5xl font-extrabold leading-tight drop-shadow-md">
              Learn Anything, Anytime, Anywhere
            </h1>
            <p className="text-lg text-gray-100">
              Join thousands of learners and teachers on{" "}
              <span className="font-semibold">Course Academy</span>. Build your
              skills, share knowledge, and achieve your goals.
            </p>
            <button
              onClick={() => navigate("/signup")}
              className="px-6 py-3 bg-white text-blue-600 font-semibold rounded-xl shadow-lg hover:bg-gray-100 hover:scale-105 transition duration-200"
            >
              Get Started
            </button>
          </div>
          <div className="flex justify-center"></div>
        </div>
      </div>
    </div>
  );
};

export default Hero;
