import React from 'react';
import { useDarkMode } from "../store/darkmode";


const WhyLearn = () => {

      const { darkMode, toggleDarkMode } = useDarkMode();
    
  return (
    <div>
         {/* Why Learn Section */}
        <div className={`py-20 px-6 ${darkMode ? "bg-gray-800" : "bg-white"}`}>
          <div className="max-w-6xl mx-auto text-center">
            <h2
              className={`text-4xl font-bold mb-6 ${
                darkMode ? "text-white" : "text-gray-800"
              }`}
            >
              Why Learn on <span className="text-blue-600">Course Academy</span>
              ?
            </h2>
            <p
              className={`mb-12 ${
                darkMode ? "text-gray-300" : "text-gray-600"
              }`}
            >
              Experience the best learning platform designed for both learners
              and teachers.
            </p>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
              <div className="bg-gradient-to-r from-blue-500 to-purple-500 text-white p-8 rounded-2xl shadow-lg hover:scale-105 transform transition cursor-pointer">
                <h3 className="text-2xl font-bold mb-4">1. Secure Payment</h3>
                <p className="text-gray-100">
                  All transactions are protected with Stripe, ensuring your
                  payments are safe and reliable.
                </p>
              </div>
              <div className="bg-gradient-to-r from-purple-500 to-pink-500 text-white p-8 rounded-2xl shadow-lg hover:scale-105 transform transition cursor-pointer">
                <h3 className="text-2xl font-bold mb-4">
                  2. High Quality Learning
                </h3>
                <p className="text-gray-100">
                  Access top-notch courses created by experts to enhance your
                  skills and knowledge.
                </p>
              </div>
              <div className="bg-gradient-to-r from-pink-500 to-red-500 text-white p-8 rounded-2xl shadow-lg hover:scale-105 transform transition cursor-pointer">
                <h3 className="text-2xl font-bold mb-4">
                  3. Share Your Expertise
                </h3>
                <p className="text-gray-100">
                  Become a teacher and share your knowledge with thousands of
                  eager learners worldwide.
                </p>
              </div>
            </div>
          </div>
        </div>

    </div>
  )
}

export default WhyLearn