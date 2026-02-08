import { useState, useEffect } from "react";
import { useParams, useLocation, useNavigate } from "react-router-dom";
import { useCreateTask, useUpdateTask } from "../api/task";

const toInputValue = (d) => (d ? new Date(d).toISOString().slice(0, 16) : "");

const TaskForm = () => {
  const location = useLocation();
  const navigate = useNavigate();

  const taskFromState = location.state?.task || null;
  console.log("taskFromState:", taskFromState);
  const mode = location.state?.mode || "create";
  const passedCourseId = location.state?.courseId || null;
  console.log("mode:", mode);
  console.log("passedCourseId:", passedCourseId);

  const { courseId: paramCourseId } = useParams();
  console.log("paramCourseId:", paramCourseId);
  const effectiveCourseId = passedCourseId || paramCourseId;
  const { createMyTask, isPending, isError, isSuccess } = useCreateTask(effectiveCourseId);
  const { updateMyTask } = useUpdateTask(effectiveCourseId);

  const [form, setForm] = useState({
    title: "",
    description: "",
    type: "assignment",
    dueDate: "",
    startTime: "",
    endTime: "",
  });

  useEffect(() => {
    if (mode === "update" && taskFromState) {
      setForm({
        title: taskFromState.title || "",
        description: taskFromState.description || "",
        type: taskFromState.type || "assignment",
        dueDate: toInputValue(taskFromState.dueDate),
        startTime: toInputValue(taskFromState.examDetails?.startTime),
        endTime: toInputValue(taskFromState.examDetails?.endTime),
      });
    }
  }, [mode, taskFromState]);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      dueDate: form.type === "assignment" ? form.dueDate : null,
      examDetails:
        form.type === "exam"
          ? { startTime: form.startTime, endTime: form.endTime, questions: [] }
          : null,
    };

    try {
      // Inside TaskForm.jsx
      if (mode === "update" && taskFromState?._id) {
        await updateMyTask({
          taskId: taskFromState._id,
          updatedFields: payload,
        });
      } else {
        await createMyTask(payload);
        setForm({
          title: "",
          description: "",
          type: "assignment",
          dueDate: "",
          startTime: "",
          endTime: "",
        });
      }
      navigate(-1);
    } catch (err) {
      console.error("Error saving task:", err);
    }
  };

  return (
    <div className="max-w-2xl mx-auto bg-gradient-to-br from-white to-gray-50 shadow-lg rounded-2xl p-10 mt-8 border border-gray-100">
      <h2 className="text-3xl font-bold text-gray-800 mb-8 text-center">
        {mode === "update" ? "✏️ Update Task" : "➕ Create New Task"}
      </h2>

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Task Title */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Task Title
          </label>
          <input
            type="text"
            name="title"
            placeholder="Enter task title"
            value={form.title}
            onChange={handleChange}
            required
            className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none transition duration-200 shadow-sm"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Description
          </label>
          <textarea
            name="description"
            placeholder="Enter task description"
            value={form.description}
            onChange={handleChange}
            className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none transition duration-200 shadow-sm"
            rows={4}
          />
        </div>

        {/* Task Type */}
        <div>
          <label className="block text-gray-700 font-medium mb-2">
            Task Type
          </label>
          <select
            name="type"
            value={form.type}
            onChange={handleChange}
            className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none transition duration-200 shadow-sm"
          >
            <option value="assignment">📘 Assignment</option>
            <option value="exam">📝 Exam</option>
          </select>
        </div>

        {/* Assignment Fields */}
        {form.type === "assignment" && (
          <div>
            <label className="block text-gray-700 font-medium mb-2">
              Due Date
            </label>
            <input
              type="datetime-local"
              name="dueDate"
              value={form.dueDate}
              onChange={handleChange}
              required
              className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none transition duration-200 shadow-sm"
            />
          </div>
        )}

        {/* Exam Fields */}
        {form.type === "exam" && (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                Start Time
              </label>
              <input
                type="datetime-local"
                name="startTime"
                value={form.startTime}
                onChange={handleChange}
                required
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none transition duration-200 shadow-sm"
              />
            </div>
            <div>
              <label className="block text-gray-700 font-medium mb-2">
                End Time
              </label>
              <input
                type="datetime-local"
                name="endTime"
                value={form.endTime}
                onChange={handleChange}
                required
                className="border rounded-xl p-3 w-full focus:ring-2 focus:ring-blue-400 outline-none transition duration-200 shadow-sm"
              />
            </div>
          </div>
        )}

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-gradient-to-r from-blue-600 to-blue-500 text-white font-semibold py-3 rounded-xl shadow-md hover:from-blue-700 hover:to-blue-600 transform hover:scale-[1.02] transition duration-200"
        >
          {mode === "update" ? "💾 Save Changes" : "🚀 Create Task"}
        </button>
      </form>
    </div>
  );
};

export default TaskForm;
