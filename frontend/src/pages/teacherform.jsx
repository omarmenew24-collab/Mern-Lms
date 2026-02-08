import { useState } from "react";
import useStore from "../store/userstore";
import { useCreateTeachingRequest } from "../api/teaching";

const BecomeTeacherForm = () => {
  const [form, setForm] = useState({
    fullName: "",
    email: "",
    subject: "",
    bio: "",
    profilePicture: "",
    paymentMethod: "",
    portfolioLink: "",
    termsAccepted: false,
  });

  const { createteachingrequest, isPending, isError } = useCreateTeachingRequest();


  const handleChange = (e) => {
    const { name, value, type, checked } = e.target;
    setForm((prev) => ({
      ...prev,
      [name]: type === "checkbox" ? checked : value,
    }));
  };

 const handleSubmit = async (e) => {
  e.preventDefault();
  if (!form.termsAccepted) {
    alert("Please accept the terms and conditions.");
    return;
  }

  try {
    const response = await createteachingrequest(form); // wait for API
    console.log("Submitted request:", response);
    alert("Thank you! Your application has been submitted.");
    setForm({
      fullName: "",
      email: "",
      subject: "",
      bio: "",
      profilePicture: "",
      paymentMethod: "",
      portfolioLink: "",
      termsAccepted: false,
    });
  } catch (err) {
    console.error("Failed to submit request:", err);
    alert(err?.response?.data?.message || "Failed to submit request.");
  }
};

  return (
    <div className="flex justify-center items-center min-h-screen bg-gray-50 px-4">
      <form
        onSubmit={handleSubmit}
        className="bg-white shadow-xl rounded-2xl p-8 w-full max-w-lg"
      >
        <h2 className="text-2xl font-bold text-gray-800 mb-6 text-center">
          Become a Teacher
        </h2>

        {/* Full Name */}
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Full Name</label>
          <input
            type="text"
            name="fullName"
            value={form.fullName}
            onChange={handleChange}
            placeholder="Your full name"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Email */}
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Email</label>
          <input
            type="email"
            name="email"
            value={form.email}
            onChange={handleChange}
            placeholder="you@example.com"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Subject / Expertise */}
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Subject / Expertise</label>
          <input
            type="text"
            name="subject"
            value={form.subject}
            onChange={handleChange}
            placeholder="e.g., Web Development, Photography"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          />
        </div>

        {/* Short Bio */}
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Short Bio</label>
          <textarea
            name="bio"
            value={form.bio}
            onChange={handleChange}
            placeholder="Tell us about your experience"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500 resize-none"
            rows="3"
            required
          />
        </div>

        {/* Profile Picture */}
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Profile Picture (optional)</label>
          <input
            type="text"
            name="profilePicture"
            value={form.profilePicture}
            onChange={handleChange}
            placeholder="Paste image URL"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          {form.profilePicture && (
            <div className="flex justify-center mt-2">
              <img
                src={form.profilePicture}
                alt="Preview"
                className="w-24 h-24 rounded-full object-cover border"
              />
            </div>
          )}
        </div>

        {/* Payment Method */}
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Payment Method</label>
          <select
            name="paymentMethod"
            value={form.paymentMethod}
            onChange={handleChange}
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
            required
          >
            <option value="">Select payment method</option>
            <option value="paypal">PayPal</option>
            <option value="bank">Bank Transfer</option>
            <option value="stripe">Stripe</option>
          </select>
        </div>

        {/* Portfolio / Projects */}
        <div className="mb-4">
          <label className="block text-gray-600 font-medium mb-1">Portfolio / Projects (optional)</label>
          <input
            type="text"
            name="portfolioLink"
            value={form.portfolioLink}
            onChange={handleChange}
            placeholder="Link to your work (GitHub, website, etc.)"
            className="w-full p-3 border rounded-xl focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
        </div>

        {/* Terms */}
        <div className="mb-4 flex items-center">
          <input
            type="checkbox"
            name="termsAccepted"
            checked={form.termsAccepted}
            onChange={handleChange}
            className="mr-2 w-4 h-4"
            required
          />
          <label className="text-gray-600 text-sm">
            I accept the <span className="text-blue-600 underline">terms and conditions</span>
          </label>
        </div>

        {/* Submit Button */}
        <button
          type="submit"
          className="w-full bg-blue-600 text-white py-3 rounded-xl font-semibold hover:bg-blue-700 transition"
        >
          Submit Application
        </button>
      </form>
    </div>
  );
};

export default BecomeTeacherForm;
