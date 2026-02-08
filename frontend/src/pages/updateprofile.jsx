import { useEffect, useState } from "react";
import { useNavigate } from "react-router-dom";
import useUserStore from "../store/userstore"; // ✅ Updated to correct store name
import { useUpdateUser } from "../api/auth"; // ✅ Import your new hook

const UpdateProfile = () => {
  // ✅ 1. Get user from Zustand
  const user = useUserStore((state) => state.user);
  
  // ✅ 2. Get mutation from your new TanStack hook
  const { updateuser, isPending } = useUpdateUser();
  
  const navigate = useNavigate();
  
  const [form, setForm] = useState({
    name: "",
    email: "",
    picture: "",
  });

  // ✅ 3. Sync form with user data when component mounts or user changes
  useEffect(() => {
    if (user) {
      setForm({
        name: user.name || "",
        email: user.email || "",
        picture: user.picture || "",
      });
    }
  }, [user]);

  const handleChange = (e) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!user) return;

    try {
      // ✅ 4. Use the hook. Note: passed as an object to match your hook's signature
      await updateuser({
        userId: user._id,
        updatedFields: {
          name: form.name,
          picture: form.picture,
        },
      });

      // ✅ 5. Navigation on success (Toast is handled in the hook)
      navigate(-1);
    } catch (err) {
      // Error is already handled by toast in your hook, but we catch it here for safety
      console.error("Update failed:", err);
    }
  };

  return (
    <div className="flex justify-center items-center min-h-screen bg-gradient-to-br from-indigo-50 via-white to-blue-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white/95 backdrop-blur-md shadow-2xl rounded-3xl p-10 w-full max-w-lg border border-gray-100 transform transition-all duration-300 hover:scale-[1.02]"
      >
        <h2 className="text-3xl font-extrabold text-center mb-3 text-gray-800">
          Update Profile
        </h2>
        <p className="text-sm text-gray-500 text-center mb-8">
          Keep your details fresh ✨
        </p>

        {/* Picture Preview */}
        {form.picture && (
          <div className="flex justify-center mb-8">
            <img
              src={form.picture}
              alt="Profile Preview"
              className="w-28 h-28 rounded-full object-cover border-4 border-white shadow-lg transition-transform duration-300 hover:scale-110"
            />
          </div>
        )}

        {/* Name */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-1">Name</label>
          <input
            type="text"
            name="name"
            value={form.name}
            onChange={handleChange}
            className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 transition"
            placeholder="Enter your name"
            required
          />
        </div>

        {/* Email (locked) */}
        <div className="mb-5">
          <label className="block text-gray-700 font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            className="w-full p-3 border rounded-2xl bg-gray-100 text-gray-500 cursor-not-allowed"
            disabled
          />
        </div>

        {/* Picture */}
        <div className="mb-8">
          <label className="block text-gray-700 font-medium mb-1">
            Profile Picture (URL)
          </label>
          <input
            type="text"
            name="picture"
            value={form.picture}
            onChange={handleChange}
            className="w-full p-3 border rounded-2xl focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:border-indigo-300 transition"
            placeholder="Paste image URL"
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 rounded-2xl font-semibold text-white bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-500 hover:to-indigo-500 shadow-md hover:shadow-lg transition-all duration-200 disabled:opacity-50"
        >
          {isPending ? "Saving..." : "Save Changes"}
        </button>
      </form>
    </div>
  );
};

export default UpdateProfile;