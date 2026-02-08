import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

const usepaymentStore = create((set, get) => ({
  name: null,
  password: null,
  role: null,

  createpaymentintent: async ({ courseId, studentId }) => {
    try {
      const res = await axiosInstance.post("/create-payment-intent", {
        courseId,
        studentId,
      });
      console.log("client secret from res", res.data.clientSecret);
      return res;
    } catch (err) {
      console.error("Error creating payment intent:", err);
    }
  },
  enrollmentcase: async ({ courseId, studentId }) => {
    try {
      const res = await axiosInstance.get(`/check/${courseId}/${studentId}`);
      return res; // ✅ return the response
    } catch (error) {
      console.error("Error checking enrollment:", error);
      return null; // or throw error if you want to handle it outside
    }
  },
}));

export default usepaymentStore;
