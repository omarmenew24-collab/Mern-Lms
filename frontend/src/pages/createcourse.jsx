import { useState, useRef, useEffect } from "react";
import usecourseStore from "../store/coursestore";
import { useNavigate } from "react-router-dom";
import { useMutation } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { useQueryClient } from "@tanstack/react-query";
import {useCreateCourse} from "../api/course"
import { useGetTeachersList } from "../api/course";

export default function CreateCourseForm() {
    const [searchQuery, setSearchQuery] = useState("");

  const{teacherslist} = useGetTeachersList(searchQuery);
  //const { getteacherslist } = usecourseStore();
  const navigate = useNavigate();
  const {createmycourse} = useCreateCourse();
  const [form, setForm] = useState({
    title: "",
    teacher: "",
    category: "",
    description: "",
  });
  const [teacherResults, setTeacherResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null); // store timer ID

  function handleChange(e) {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));

    if (name === "teacher") {
      clearTimeout(debounceRef.current); // cancel previous timer

      if (value.trim().length > 0) {
        debounceRef.current = setTimeout(async () => {
         // const results = await teacherslist({ searchquery: value });
         setSearchQuery(value);
         const results = teacherslist.filter((t) =>
            t.name.toLowerCase().includes(value.toLowerCase())
          );
          setTeacherResults(results);
          setShowDropdown(true);
        }, 300); // wait 300ms after typing stops
      } else {
        setTeacherResults([]);
        setShowDropdown(false);
      }
    }
  }

  function handleTeacherSelect(teacherName) {
    setForm((prev) => ({ ...prev, teacher: teacherName }));
    setTeacherResults([]);
    setShowDropdown(false);
  }

  function handleSubmit(e) {
    e.preventDefault();
    createmycourse(form)
      .then(() => {
        console.log("Course Data:", form);
        toast.success("Course created successfully!");
        navigate("/teacher"); // ✅ redirect to teacher page
      })
      .catch((err) => {
        console.error("Failed to create course", err);
        toast.error("Failed to create course");
      });
  }

  // cleanup timers when unmounting
  useEffect(() => {
    return () => clearTimeout(debounceRef.current);
  }, []);

  return (
    <div className="max-w-lg mx-auto p-6 bg-white shadow-md rounded-md">
      <h2 className="text-2xl font-bold mb-4">Create Course</h2>

      <form onSubmit={handleSubmit} className="space-y-4">
        {/* Title */}
        <div>
          <label
            htmlFor="title"
            className="block text-sm font-medium text-gray-700"
          >
            Course Title
          </label>
          <input
            type="text"
            id="title"
            name="title"
            value={form.title}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="Enter course title"
            required
          />
        </div>

        {/* Teacher */}
        <div className="relative">
          <label
            htmlFor="teacher"
            className="block text-sm font-medium text-gray-700"
          >
            Teacher
          </label>
          <input
            type="text"
            id="teacher"
            name="teacher"
            value={form.teacher}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="Enter teacher's name"
            required
            autoComplete="off"
          />

          {showDropdown && teacherResults.length > 0 && (
            <ul className="absolute z-10 w-full bg-white border border-gray-300 rounded-md shadow-lg mt-1 max-h-48 overflow-y-auto">
              {teacherResults.map((t) => (
                <li
                  key={t._id}
                  onClick={() => handleTeacherSelect(t.name)}
                  className="px-4 py-2 hover:bg-blue-100 cursor-pointer"
                >
                  {t.name}
                </li>
              ))}
            </ul>
          )}
        </div>

        {/* Category */}
        <div>
          <label
            htmlFor="category"
            className="block text-sm font-medium text-gray-700"
          >
            Category
          </label>
          <select
            id="category"
            name="category"
            value={form.category}
            onChange={handleChange}
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            required
          >
            <option value="">Select category</option>
            <option value="programming">Programming</option>
            <option value="culture">Culture</option>
            <option value="science">Science</option>
          </select>
        </div>

        {/* Description */}
        <div>
          <label
            htmlFor="description"
            className="block text-sm font-medium text-gray-700"
          >
            Description
          </label>
          <textarea
            id="description"
            name="description"
            value={form.description}
            onChange={handleChange}
            rows="4"
            className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring focus:ring-blue-200"
            placeholder="Write a brief description of the course"
            required
          ></textarea>
        </div>

        {/* Submit Button */}
        <div>
          <button
            type="submit"
            className="w-full bg-blue-600 text-white py-2 px-4 rounded-md hover:bg-blue-700 transition"
          >
            Save Course
          </button>
        </div>
      </form>
    </div>
  );
}
