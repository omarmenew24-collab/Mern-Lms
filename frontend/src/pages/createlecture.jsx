import { useState } from "react";
import axios from "axios";
import { useParams } from "react-router-dom";
import { useCreateLecture } from "../api/lecture";
import { useNavigate } from "react-router-dom";

const LectureForm = () => {
  const [lecture, setLecture] = useState({
    title: "",
    description: "",
    videoUrl: "",
    level: { number: 1, title: "Beginner" },
    duration: "",
    order: 0,
  });
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");
  const{ courseId } = useParams();
  const {createMyLecture, isPending, isError} = useCreateLecture(courseId);
  const navigate = useNavigate();


  const handleChange = (e) => {
    const { name, value } = e.target;

    // handle nested level fields
    if (name === "levelNumber" || name === "levelTitle") {
      setLecture((prev) => ({
        ...prev,
        level: {
          ...prev.level,
          number: name === "levelNumber" ? Number(value) : prev.level.number,
          title: name === "levelTitle" ? value : prev.level.title,
        },
      }));
    } else {
      setLecture((prev) => ({ ...prev, [name]: value }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setMessage("");

    try {
      await createMyLecture(lecture);
      setMessage("Lecture added successfully!");
      setLecture({
        title: "",
        description: "",
        videoUrl: "",
        level: { number: 1, title: "Beginner" },
        duration: "",
        order: 0,
      });
      navigate(-1);
    } catch (err) {
      setMessage(err.response?.data?.message || "Error adding lecture");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="max-w-xl mx-auto bg-white p-6 rounded-xl shadow-md">
      <h2 className="text-2xl font-semibold mb-4">Add New Lecture</h2>
      {message && (
        <p className="mb-4 text-center text-sm text-green-600">{message}</p>
      )}
      <form onSubmit={handleSubmit} className="space-y-4">
        <div>
          <label className="block mb-1 font-medium">Title</label>
          <input
            type="text"
            name="title"
            value={lecture.title}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Description</label>
          <textarea
            name="description"
            value={lecture.description}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
          />
        </div>

        <div>
          <label className="block mb-1 font-medium">Video URL</label>
          <input
            type="url"
            name="videoUrl"
            value={lecture.videoUrl}
            onChange={handleChange}
            className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            required
          />
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Level Number</label>
            <input
              type="number"
              name="levelNumber"
              value={lecture.level.number}
              onChange={handleChange}
              min={1}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
          <div className="flex-1">
            <label className="block mb-1 font-medium">Level Title</label>
            <input
              type="text"
              name="levelTitle"
              value={lecture.level.title}
              onChange={handleChange}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
              required
            />
          </div>
        </div>

        <div className="flex gap-4">
          <div className="flex-1">
            <label className="block mb-1 font-medium">Duration (seconds)</label>
            <input
              type="number"
              name="duration"
              value={lecture.duration}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>

          <div className="flex-1">
            <label className="block mb-1 font-medium">Order</label>
            <input
              type="number"
              name="order"
              value={lecture.order}
              onChange={handleChange}
              min={0}
              className="w-full border border-gray-300 rounded px-3 py-2 focus:outline-none focus:ring-2 focus:ring-blue-400"
            />
          </div>
        </div>

        <button
          type="submit"
          disabled={loading}
          className="w-full bg-blue-500 hover:bg-blue-600 text-white font-semibold py-2 px-4 rounded transition-colors disabled:opacity-50"
        >
          {loading ? "Adding..." : "Add Lecture"}
        </button>
      </form>
    </div>
  );
};

export default LectureForm;
