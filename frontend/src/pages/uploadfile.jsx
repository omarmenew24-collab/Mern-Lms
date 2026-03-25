import { useState } from "react";
import { axiosInstance } from "../lib/axios";
import { useParams } from "react-router-dom";
import { useMarkTask } from "../api/task"; // ✅ Import the hook

export default function FileUploadForm() {
  const [upload, setUpload] = useState({
    file: null,
    status: "",
    url: "",
    loading: false,
  });

  // ✅ Added courseId here (Make sure your App.jsx route matches this)
  const { courseId, taskId, studentId } = useParams();

  // ✅ Initialize the progress mutation
  const { markTask } = useMarkTask(courseId);

  const handleChange = (e) => {
    const file = e.target.files[0];
    if (file) {
      setUpload((prev) => ({
        ...prev,
        file,
        status: "",
      }));
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!upload.file) {
      setUpload((prev) => ({ ...prev, status: "⚠️ Please select a file." }));
      return;
    }

    const formData = new FormData();
    formData.append("file", upload.file);
    formData.append("taskId", taskId);
    formData.append("courseId", courseId);

    setUpload((prev) => ({
      ...prev,
      loading: true,
      status: "⏳ Uploading...",
    }));

    try {
      // 1. Upload the file
      const { data } =  await axiosInstance.post("/upload", formData, { withCredentials: true });

      // 2. ✅ UPDATE PROGRESS: Only if the upload was successful
      await markTask(taskId);

      setUpload({
        file: null,
        status: "✅ Uploaded successfully!",
        url: data.url,
        loading: false,
      });
    } catch (err) {
      setUpload((prev) => ({
        ...prev,
        loading: false,
        status:
          "❌ Upload failed: " + (err.response?.data?.error || err.message),
      }));
    }
  };

  return (
    <div className="flex items-center justify-center min-h-screen bg-gray-100">
      <form
        onSubmit={handleSubmit}
        className="bg-white p-8 rounded-2xl shadow-md w-96 space-y-4"
      >
        <h2 className="text-2xl font-bold text-gray-800 text-center">
          Upload Any File
        </h2>

        {/* File Input / Preview */}
        <label
          htmlFor="file"
          className="flex flex-col items-center justify-center w-full p-4 border-2 border-dashed border-gray-300 rounded-xl cursor-pointer bg-gray-50 hover:bg-gray-100 relative"
        >
          {!upload.file ? (
            <>
              <svg
                className="w-10 h-10 text-gray-400"
                fill="none"
                stroke="currentColor"
                viewBox="0 0 24 24"
                xmlns="http://www.w3.org/2000/svg"
              >
                <path
                  strokeLinecap="round"
                  strokeLinejoin="round"
                  strokeWidth="2"
                  d="M7 16V4m0 0L3 8m4-4l4 4M17 8h2a2 2 0 012 2v10a2 2 0 01-2 2H5a2 2 0 01-2-2V10a2 2 0 012-2h2m10 0l-4-4m0 0l-4 4m4-4v12"
                />
              </svg>
              <p className="text-gray-500 mt-2">Click to choose a file</p>
            </>
          ) : upload.file.type.startsWith("image/") ? (
            <img
              src={URL.createObjectURL(upload.file)}
              alt="preview"
              className="w-full h-40 object-cover rounded-lg shadow"
            />
          ) : (
            <p className="text-gray-700 text-sm truncate">
              📄 {upload.file.name}
            </p>
          )}

          <input
            id="file"
            name="file"
            type="file"
            className="hidden"
            onChange={handleChange}
          />
        </label>

        {/* Submit Button */}
        <button
          type="submit"
          disabled={upload.loading}
          className={`w-full py-2 px-4 rounded-lg transition ${
            upload.loading
              ? "bg-gray-400 cursor-not-allowed"
              : "bg-blue-600 hover:bg-blue-700 text-white"
          }`}
        >
          {upload.loading ? "Uploading..." : "Upload"}
        </button>

        {/* Status */}
        {upload.status && (
          <div className="text-sm text-center text-gray-600">
            {upload.status}
            {upload.url && (
              <div>
                <a
                  href={upload.url}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-blue-500 underline block mt-2"
                >
                  View File
                </a>
              </div>
            )}
          </div>
        )}
      </form>
    </div>
  );
}
