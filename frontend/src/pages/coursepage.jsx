import { useLocation } from "react-router-dom";
import { useNavigate } from "react-router-dom";

const CoursePublic = () => {
  const location = useLocation();
  const course = location.state; // course object passed from navigate
  const navigate = useNavigate();

  if (!course) return <p>Course not found!</p>;

  const handleclick = () => {
    navigate(`/payment/${course._id}`)
  }

  return (
    <div className="min-h-screen bg-gray-100 p-6">
      <div className="max-w-5xl mx-auto grid grid-cols-1 lg:grid-cols-3 gap-8">
        
        {/* Left Content */}
        <div className="lg:col-span-2">
          {/* Title + Rating */}
          <h1 className="text-4xl font-bold text-gray-900 mb-3">{course.title}</h1>
          <div className="flex items-center space-x-2 mb-6">
            <div className="flex text-yellow-400 text-xl">
              ★★★★☆
            </div>
            <span className="text-gray-600 text-sm">(123 ratings)</span>
          </div>

          {/* Teacher */}
          <p className="text-gray-700 mb-6">
            <span className="font-semibold">Instructor:</span>{" "}
            {course.teacher?.name || course.teacher || "Unknown"}
          </p>

          {/* Description */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-3">Course Description</h2>
            <p className="text-gray-700 leading-relaxed">{course.description}</p>
          </div>

          {/* Requirements */}
          <div className="bg-white p-6 rounded-xl shadow-md mb-8">
            <h2 className="text-2xl font-semibold mb-3">Requirements</h2>
            <ul className="list-disc list-inside space-y-2 text-gray-700">
              <li>Basic knowledge of {course.category || "the subject"}.</li>
              <li>A computer with internet access.</li>
              <li>Willingness to learn and practice.</li>
            </ul>
          </div>

          {/* Category */}
          <p className="text-sm text-gray-500 mt-6">
            <span className="font-semibold">Category:</span> {course.category}
          </p>
        </div>

        {/* Right Sidebar - Payment / Enrollment */}
        <div className="bg-white p-6 rounded-xl shadow-md h-fit">
          <img
            src="https://source.unsplash.com/600x400/?education,course"
            alt="Course banner"
            className="rounded-lg mb-4"
          />
          <h3 className="text-2xl font-bold text-gray-900 mb-2">{course.price}</h3>
          <button 
          onClick={handleclick}
          className="w-full bg-blue-600 text-white py-3 rounded-lg font-semibold hover:bg-blue-700 transition">
            Enroll Now
          </button>
          <p className="text-sm text-gray-500 mt-3">
            30-day money-back guarantee
          </p>
        </div>
      </div>
    </div>
  );
};

export default CoursePublic;
