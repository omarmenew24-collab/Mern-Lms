import React, { useState } from "react";
import useUserStore from "../store/userstore";
import toast from "react-hot-toast";
import { useNavigate } from "react-router-dom";
import { useSignup } from "../api/auth";

const SignUp = () => {
  const [formData, setFormData] = useState({
    name: "",
    password: "",
    email: "",
  });

  // ✅ Keep using your hook pattern
  const { signup, isPending , isError } = useSignup();
  const navigate = useNavigate();

  const validateForm = () => {
    if (!formData.name.trim()) return toast.error("Full name is required");
    if (!formData.password) return toast.error("Password is required");
    if (formData.password.length < 6)
      return toast.error("Password must be at least 6 characters");
    return true;
  };

  function handleChange(e) {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  }

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (validateForm() !== true) return;

    try {
      // ✅ 1. Wait for the signup to finish and get the returned user data
      const newUser = await signup(formData);

      // ✅ 2. Handle navigation immediately after success
      if (newUser) {
        if (newUser.role === "student") navigate("/student");
        else if (newUser.role === "teacher") navigate("/teacher");
        else navigate("/");
      }
    } catch (error) {
      // Errors are already handled by your useSignup toast, 
      // so we just catch it here to prevent the app from crashing.
      console.error("Signup navigation error:", error);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-white-100 to-white-200 p-6">
      <form
        onSubmit={handleSubmit}
        className="w-full max-w-md bg-white rounded-3xl shadow-2xl p-10 space-y-8"
      >
        <h2 className="text-3xl font-extrabold text-center text-gray-800 tracking-tight">
          Create Account
        </h2>

        {/* Name Input */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Full Name</label>
          <input
            type="text"
            name="name"
            value={formData.name}
            onChange={handleChange}
            className="w-full px-5 py-3 text-lg border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Email Input */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Email</label>
          <input
            type="email"
            name="email"
            value={formData.email}
            onChange={handleChange}
            className="w-full px-5 py-3 text-lg border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Password Input */}
        <div>
          <label className="block text-base font-medium text-gray-700 mb-2">Password</label>
          <input
            type="password"
            name="password"
            value={formData.password}
            onChange={handleChange}
            className="w-full px-5 py-3 text-lg border border-gray-300 rounded-2xl focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        <button
          type="submit"
          disabled={isPending}
          className="w-full py-3 px-6 bg-blue-600 text-white text-lg font-semibold rounded-2xl hover:bg-blue-700 transition disabled:bg-gray-400"
        >
          {isPending ? "Creating Account..." : "Sign Up"}
        </button>
      </form>
    </div>
  );
};

export default SignUp;