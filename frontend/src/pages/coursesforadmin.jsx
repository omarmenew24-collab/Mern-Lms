import { useState, useEffect } from "react";
import { useGetCourses } from "../api/course"; // adjust path if needed
import { useNavigate } from "react-router-dom";

const Courses = () => {
  const navigate = useNavigate();

  // 🔹 Fetch courses using React Query
  const { allcourses, isLoading, isError } = useGetCourses();

  // 🔹 Search state
  const [search, setSearch] = useState("");
  const [debouncedSearch, setDebouncedSearch] = useState("");

  // 🔹 Filtered courses
  const [filteredCourses, setFilteredCourses] = useState([]);

  // 🧠 Debounce logic (wait before applying search)
  useEffect(() => {
    const timeout = setTimeout(() => {
      setDebouncedSearch(search);
    }, 400); // 400ms delay

    return () => clearTimeout(timeout);
  }, [search]);

  // 🧠 Filter courses when data or search changes
  useEffect(() => {
    if (!allcourses) return;

    const filtered = allcourses.filter((course) =>
      course.title.toLowerCase().includes(debouncedSearch.toLowerCase())
    );

    setFilteredCourses(filtered);
  }, [allcourses, debouncedSearch]);

  // 🔹 Loading state
  if (isLoading) {
    return <div className="p-4">Loading courses...</div>;
  }

  // 🔹 Error state
  if (isError) {
    return <div className="p-4 text-red-500">Failed to load courses</div>;
  }

  return (
    <div className="p-6">
      {/* 🔹 Page Title */}
      <h1 className="text-2xl font-bold mb-4">Courses</h1>

      {/* 🔍 Search Bar */}
      <div className="mb-4">
        <input
          type="text"
          placeholder="Search courses..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          className="border p-2 rounded w-full max-w-md"
        />
      </div>

      {/* ➕ Add Course Button (optional for later) */}
      <div className="mb-4">
        <button
          onClick={() => navigate("/admin/courses/create")}
          className="bg-blue-500 text-white px-4 py-2 rounded"
        >
          + Add Course
        </button>
      </div>

      {/* 📊 Courses Table */}
      <div className="overflow-x-auto">
        <table className="w-full border border-gray-200">
          <thead className="bg-gray-100">
            <tr>
              <th className="p-2 text-left border">Title</th>
              <th className="p-2 text-left border">Price</th>
              <th className="p-2 text-left border">Instructor</th>
              <th className="p-2 text-left border">Actions</th>
            </tr>
          </thead>

          <tbody>
            {filteredCourses.length > 0 ? (
              filteredCourses.map((course) => (
                <tr key={course._id} className="hover:bg-gray-50">
                  {/* Title */}
                  <td className="p-2 border">{course.title}</td>

                  {/* Price */}
                  <td className="p-2 border">${course.price}</td>

                  {/* Instructor (from populate) */}
                  <td className="p-2 border">
                    {course.teacher?.name || "N/A"}
                  </td>

                  {/* Actions */}
                  <td className="p-2 border space-x-2">
                    <button
                      onClick={() =>
                        navigate(`/admin/courses/${course._id}`)
                      }
                      className="bg-green-500 text-white px-2 py-1 rounded"
                    >
                      View
                    </button>

                    <button
                      onClick={() =>
                        navigate(`/admin/courses/edit/${course._id}`)
                      }
                      className="bg-yellow-500 text-white px-2 py-1 rounded"
                    >
                      Edit
                    </button>
                  </td>
                </tr>
              ))
            ) : (
              // ❌ No results
              <tr>
                <td colSpan="4" className="text-center p-4">
                  No courses found
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
};

export default Courses;