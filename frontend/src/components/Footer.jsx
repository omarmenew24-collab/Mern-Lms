import React from 'react'
import { useDarkMode } from '../store/darkmode'
const Footer = () => {
      const { darkMode, toggleDarkMode } = useDarkMode();

  return (
    <div>
            {/* Footer */}
      <footer
        className={`py-8 mt-12 ${
          darkMode ? "bg-gray-800 text-white" : "bg-gray-800 text-white"
        }`}
      >
        <div className="max-w-6xl mx-auto px-6">
          <div className="flex flex-col md:flex-row justify-between items-center">
            <div className="mb-4 md:mb-0">
              <h3 className="text-xl font-bold">Course Academy</h3>
              <p className="text-gray-400">Learn Anything, Anytime, Anywhere</p>
            </div>
            <div className="flex space-x-6">
              <a
                href="https://wa.me/yournumber"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-green-400 transition duration-200"
              >
                <div className="flex items-center space-x-2">
                  <span>📱</span>
                  <span>WhatsApp</span>
                </div>
              </a>
              <a
                href="https://t.me/yourusername"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-400 transition duration-200"
              >
                <div className="flex items-center space-x-2">
                  <span>✈️</span>
                  <span>Telegram</span>
                </div>
              </a>
              <a
                href="https://facebook.com/yourpage"
                target="_blank"
                rel="noopener noreferrer"
                className="hover:text-blue-500 transition duration-200"
              >
                <div className="flex items-center space-x-2">
                  <span>👍</span>
                  <span>Facebook</span>
                </div>
              </a>
            </div>
          </div>
          <div className="border-t border-gray-700 mt-6 pt-6 text-center text-gray-400">
            <p>
              &copy; {new Date().getFullYear()} Course Academy. All rights
              reserved.
            </p>
          </div>
        </div>
      </footer>
    </div>
  )
}

export default Footer