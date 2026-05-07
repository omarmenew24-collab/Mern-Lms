import { useState, useRef, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import toast from "react-hot-toast";
import { ArrowLeft, ImagePlus } from "lucide-react";
import { useCreateCourse, useGetTeachersList, useGetCourseCategories } from "../../api/course";
import SavedCourseCategoryChips from "../../components/course/SavedCourseCategoryChips";
import CourseCategoryField from "../../components/course/CourseCategoryField";
import { paths } from "../../config/paths";
import useUserStore from "../../store/userstore";

export default function CreateCourseForm() {
  const user = useUserStore((s) => s.user);
  const isTeacherCreator = user?.role === "teacher";

  const [searchQuery, setSearchQuery] = useState("");
  const { teacherslist } = useGetTeachersList(isTeacherCreator ? "" : searchQuery);
  const navigate = useNavigate();
  const { createmycourse } = useCreateCourse();
  const [form, setForm] = useState({ title: "", teacher: "", category: "", description: "" });
  const [selectedTeacherId, setSelectedTeacherId] = useState(null);
  const [imageFile, setImageFile] = useState(null);
  const [imagePreview, setImagePreview] = useState("");
  const [teacherResults, setTeacherResults] = useState([]);
  const [showDropdown, setShowDropdown] = useState(false);
  const debounceRef = useRef(null);

  const categoryQueryTeacherId = isTeacherCreator ? user?._id : selectedTeacherId;
  const { data: categoryOptions = [] } = useGetCourseCategories(categoryQueryTeacherId);

  function handleChange(e) {
    const { name, value } = e.target;
    if (name === "teacher" && isTeacherCreator) return;
    setForm((prev) => ({ ...prev, [name]: value }));
    if (name === "teacher") {
      clearTimeout(debounceRef.current);
      if (value.trim().length > 0) {
        debounceRef.current = setTimeout(() => {
          setSearchQuery(value);
          const results = teacherslist.filter((t) => t.name.toLowerCase().includes(value.toLowerCase()));
          setTeacherResults(results);
          setShowDropdown(true);
        }, 300);
      } else {
        setTeacherResults([]);
        setShowDropdown(false);
      }
    }
  }

  function handleTeacherSelect(t) {
    const teacherName = typeof t === "string" ? t : t?.name;
    const tid = typeof t === "object" && t?._id ? t._id : null;
    setForm((prev) => ({ ...prev, teacher: teacherName || "" }));
    if (tid) setSelectedTeacherId(tid);
    setTeacherResults([]);
    setShowDropdown(false);
  }

  function handleImageChange(e) {
    const file = e.target.files?.[0] || null;
    setImageFile(file);
    setImagePreview(file ? URL.createObjectURL(file) : "");
  }

  function handleSubmit(e) {
    e.preventDefault();
    createmycourse({ ...form, image: imageFile })
      .then(() => {
        toast.success("Course created!");
        navigate(paths.teacher);
      })
      .catch(() => toast.error("Failed to create course"));
  }

  useEffect(() => () => clearTimeout(debounceRef.current), []);

  useEffect(() => {
    if (user?.role === "teacher" && user.name) {
      setForm((prev) => ({ ...prev, teacher: user.name }));
      setSelectedTeacherId(user._id);
    }
  }, [user?.role, user?.name, user?._id]);

  const inputClass = "w-full h-10 px-3 text-sm rounded-lg border border-gray-300 dark:border-gray-700 bg-white dark:bg-gray-900 text-gray-900 dark:text-white placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-brand-500 focus:border-transparent transition-shadow";
  const teacherInputClass = `${inputClass}${
    isTeacherCreator
      ? " cursor-not-allowed bg-gray-100 dark:bg-gray-800/80 text-gray-600 dark:text-gray-300"
      : ""
  }`;

  return (
    <div className="min-h-screen bg-gray-50 dark:bg-gray-950 py-10 px-4">
      <div className="max-w-lg mx-auto">
        <button onClick={() => navigate(-1)} className="flex items-center gap-1.5 text-sm text-gray-500 dark:text-gray-400 hover:text-gray-800 dark:hover:text-white mb-6 transition-colors">
          <ArrowLeft className="w-4 h-4 rtl-flip" /> Back
        </button>

        <div className="bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-800 rounded-xl overflow-hidden">
          <div className="px-6 py-5 border-b border-gray-100 dark:border-gray-800">
            <h2 className="text-lg font-bold text-gray-900 dark:text-white">Create course</h2>
            <p className="text-xs text-gray-500 dark:text-gray-400">Fill in the details to publish a new course.</p>
          </div>

          <form onSubmit={handleSubmit} className="p-6 space-y-5">
            {/* Image */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Course image</label>
              <label className="cursor-pointer block">
                {imagePreview ? (
                  <img src={imagePreview} alt="Preview" className="w-full h-40 rounded-lg object-cover border border-gray-200 dark:border-gray-700" />
                ) : (
                  <div className="w-full h-40 rounded-lg border-2 border-dashed border-gray-300 dark:border-gray-700 flex flex-col items-center justify-center gap-2 hover:border-brand-500 transition-colors">
                    <ImagePlus className="w-6 h-6 text-gray-400" />
                    <span className="text-xs text-gray-400">Click to upload</span>
                  </div>
                )}
                <input type="file" accept="image/*" onChange={handleImageChange} className="hidden" />
              </label>
            </div>

            {/* Title */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Title</label>
              <input type="text" name="title" value={form.title} onChange={handleChange} placeholder="Course title" className={inputClass} required />
            </div>

            {/* Teacher — fixed to self for teachers; admins search and pick */}
            <div className="relative">
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Teacher</label>
              <input
                type="text"
                name="teacher"
                value={form.teacher}
                onChange={handleChange}
                placeholder={isTeacherCreator ? "Your account" : "Search teacher"}
                className={teacherInputClass}
                required
                autoComplete="off"
                readOnly={isTeacherCreator}
                title={isTeacherCreator ? "Course will be created under your teacher account" : undefined}
              />
              {!isTeacherCreator && showDropdown && teacherResults.length > 0 && (
                <ul className="absolute z-10 w-full bg-white dark:bg-gray-900 border border-gray-200 dark:border-gray-700 rounded-lg shadow-lg mt-1 max-h-44 overflow-y-auto">
                  {teacherResults.map((t) => (
                    <li key={t._id} onClick={() => handleTeacherSelect(t)} className="px-4 py-2.5 text-sm hover:bg-brand-50 dark:hover:bg-brand-900/20 cursor-pointer text-gray-800 dark:text-gray-200">
                      {t.name}
                    </li>
                  ))}
                </ul>
              )}
            </div>

            <CourseCategoryField
              name="category"
              value={form.category}
              onChange={handleChange}
              options={categoryOptions}
              inputClass={inputClass}
              idPrefix="create-course"
              required
              disabled={!categoryQueryTeacherId && !isTeacherCreator}
              placeholder={!categoryQueryTeacherId && !isTeacherCreator ? "Pick a teacher first" : "Type the exact category for this course"}
              helpText={
                <p className="mt-1 text-[11px] text-gray-500 dark:text-gray-500">
                  Pick from the list (site defaults, past labels, and this teacher’s categories) or use{" "}
                  <span className="font-medium">Other</span> and type your own. Only an admin can change the global
                  list (Admin → settings).
                </p>
              }
            >
              <SavedCourseCategoryChips
                categories={categoryOptions}
                disabled={!categoryQueryTeacherId && !isTeacherCreator}
              />
            </CourseCategoryField>

            {/* Description */}
            <div>
              <label className="block text-xs font-medium text-gray-600 dark:text-gray-400 mb-1.5">Description</label>
              <textarea name="description" value={form.description} onChange={handleChange} rows="3" placeholder="Brief description of the course" className={`${inputClass} h-auto py-2`} required />
            </div>

            <button type="submit" className="w-full h-11 rounded-lg bg-brand-600 text-white text-sm font-semibold hover:bg-brand-700 transition-colors">
              Create course
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
