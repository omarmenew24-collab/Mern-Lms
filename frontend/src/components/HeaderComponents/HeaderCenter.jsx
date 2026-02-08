import React from "react";
import { useDarkMode } from "../../store/darkmode";
const HeaderCenter = () => {
    
  const { darkMode } = useDarkMode();

  return (
    <div>
      <div className="flex-1 max-w-xl px-6">
        <div
          className={`flex items-center rounded-full px-4 py-2 shadow-inner ${
            darkMode ? "bg-gray-700" : "bg-gray-100"
          }`}
        >
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className={`h-5 w-5 mr-2 ${
              darkMode ? "text-gray-400" : "text-gray-500"
            }`}
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.9 14.32a8 8 0 111.414-1.414l4.387 4.387a1 1 0 01-1.414 1.414l-4.387-4.387zM14 8a6 6 0 11-12 0 6 6 0 0112 0z"
              clipRule="evenodd"
            />
          </svg>
          <input
            type="text"
            placeholder="Search for courses..."
            className={`bg-transparent focus:outline-none flex-1 ${
              darkMode ? "text-white placeholder-gray-400" : "text-gray-700"
            }`}
          />
        </div>
      </div>
    </div>
  );
};

export default HeaderCenter;
