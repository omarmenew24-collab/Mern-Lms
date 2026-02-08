import React from "react";
import { useDarkMode } from "../../store/darkmode";
import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import GoogleSignIn from "../GoogleSignIn";
import useUserStore from "../../store/userstore"; // Fixed import consistency
import { useLogout } from "../../api/auth";

const HeaderRightSide = () => {
  const { darkMode, onToggleDarkMode } = useDarkMode();
  const dropdownRef = useRef(null);
  const [open, setOpen] = useState(false);
  
  // ✅ Using consistent store hook
  const user = useUserStore((state) => state.user);
  const hasHydrated = useUserStore((state) => state.hasHydrated);

  console.log("user:", user);

  
  // ✅ Getting the logout mutation from your tanstack hook
  const { logout, isPending } = useLogout();

  const navigate = useNavigate();

  const handleClickProfile = () => {
    navigate("/updateprofile");
    setOpen(false);
  };

  // ✅ Updated Logout handler
  const handleLogout = async () => {
    try {
      // 1. Execute the mutation (this calls the API and clears Zustand internally)
      await logout(); 
      
      // 2. Navigation and UI cleanup
      navigate("/");
      setOpen(false);
    } catch (error) {
      console.error("Logout failed", error);
    }
  };

  // Handles clicks outside the dropdown to close it
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <div>
      <div className="relative flex items-center space-x-3" ref={dropdownRef}>
        {/* Dark Mode Toggle */}
        <button
          onClick={onToggleDarkMode}
          className={`p-2 rounded-full transition duration-200 ${
            darkMode
              ? "bg-yellow-400 text-gray-900 hover:bg-yellow-300"
              : "bg-gray-800 text-white hover:bg-gray-700"
          }`}
          title={darkMode ? "Switch to light mode" : "Switch to dark mode"}
        >
          {darkMode ? "☀️" : "🌙"}
        </button>

        {user && hasHydrated? (
          <>
            <img
              src={`http://localhost:3000/api/user/${user._id}/picture`}
              alt={user.name}
              className="w-10 h-10 rounded-full cursor-pointer border-2 border-blue-500 hover:scale-105 transition-transform"
              onClick={() => setOpen(!open)}
            />
            {open && (
              <div
                className={`absolute right-0 mt-3 w-48 border rounded-xl shadow-xl py-2 overflow-hidden animate-fade-in z-50 ${
                  darkMode
                    ? "bg-gray-800 border-gray-700"
                    : "bg-white border-gray-200"
                }`}
              >
                <div
                  className={`px-4 py-2 border-b ${
                    darkMode ? "border-gray-700" : "border-gray-100"
                  }`}
                >
                  <p className={`font-semibold truncate ${darkMode ? "text-white" : "text-gray-800"}`}>
                    {user.name}
                  </p>
                  <p className={`text-sm truncate ${darkMode ? "text-gray-400" : "text-gray-500"}`}>
                    {user.email}
                  </p>
                  <p className={`text-xs mt-1 uppercase tracking-wider font-bold ${darkMode ? "text-blue-400" : "text-blue-600"}`}>
                    {user.role}
                  </p>
                </div>

                <button
                  onClick={handleClickProfile}
                  className={`w-full text-left px-4 py-2 transition ${
                    darkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-blue-400"
                      : "text-gray-700 hover:bg-blue-50 hover:text-blue-600"
                  }`}
                >
                  Update Profile
                </button>

                <button
                  onClick={handleLogout}
                  disabled={isPending}
                  className={`w-full text-left px-4 py-2 transition ${
                    isPending ? "opacity-50 cursor-not-allowed" : ""
                  } ${
                    darkMode
                      ? "text-gray-300 hover:bg-gray-700 hover:text-red-400"
                      : "text-gray-700 hover:bg-red-50 hover:text-red-600"
                  }`}
                >
                  {isPending ? "Logging out..." : "Logout"}
                </button>
              </div>
            )}
          </>
        ) : (
          <div className="flex items-center space-x-3 h-10">
            <GoogleSignIn />
            <button
              onClick={() => navigate("/signup")}
              className="px-4 py-2 rounded-lg font-semibold bg-green-600 text-white hover:bg-green-700 shadow-md transition"
            >
              Sign Up
            </button>
            <button
              onClick={() => navigate("/login")}
              className="px-4 py-2 rounded-lg font-semibold bg-blue-600 text-white hover:bg-blue-700 shadow-md transition"
            >
              Login
            </button>
          </div>
        )}
      </div>
    </div>
  );
};

export default HeaderRightSide;