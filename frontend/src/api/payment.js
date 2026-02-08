import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery } from "@tanstack/react-query";

/* =========================
   GET PAYMENT INTENT (AUTO-FETCH)
========================= */
// This replaces useCreatePaymentIntent to remove useEffect
// api/payment.js
export const useGetPaymentIntent = (courseId) => {
  const fetchIntent = async () => {
    const res = await axiosInstance.post("/create-payment-intent", { courseId });
    return res.data; // { clientSecret: '...' }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["paymentIntent", courseId],
    queryFn: fetchIntent,
    enabled: !!courseId,
    staleTime: Infinity,
    cacheTime: 1000 * 60 * 30,
    retry: false,
  });

  return { data, isLoading, isError };
};

/* =========================
   CHECK ENROLLMENT STATUS (Polling)
========================= */
export const useCheckEnrollment = (courseId, studentId, isEnabled) => {
  const checkStatus = async () => {
    const res = await axiosInstance.get(`/check/${courseId}/${studentId}`);
    return res.data; // Returns { enrolled: true/false }
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["enrollment", courseId, studentId],
    queryFn: checkStatus,
    enabled: !!courseId && !!studentId && isEnabled,
    // 🔄 Automatic Polling Logic
    refetchInterval: (query) => {
      // Access the internal state: if enrolled is true, return false to stop polling
      return query.state.data?.enrolled ? false : 3000;
    },
    refetchIntervalInBackground: true,
  });

  // Extract the status for the component
  const isEnrolled = data?.enrolled || false;

  return { isEnrolled, isLoading, isError };
};