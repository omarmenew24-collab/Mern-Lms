// src/api/teaching.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useauthstore";

/* =========================
   1. GET TEACHING REQUESTS (Admin Only)
========================= */
export const useGetTeachingRequests = (enabled) => {
  const accessToken = useAuthStore((s) => s.accessToken);
  const getRequests = async () => {
    const res = await axiosInstance.get("/getteachingrequests");
    return res.data?.requests || [];
  };

  const canFetch = Boolean(enabled) && Boolean(accessToken);

  const {
    data: teachingRequests,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["teachingRequests"],
    queryFn: getRequests,
    enabled: canFetch,
  });

  return {
    teachingRequests,
    isLoading,
    isError,
    /** Admin selected but no JWT (e.g. refresh failed); show re-login instead of a fake empty list */
    needsReauth: Boolean(enabled) && !accessToken,
  };
};

/* =========================
   2. CREATE TEACHING REQUEST
========================= */
export const useCreateTeachingRequest = () => {
  const submitRequest = async (formData) => {
    const res = await axiosInstance.post("/createteachingrequest", formData);
    return res.data;
  };

  const {
    mutateAsync: createteachingrequest,
    isPending,
    isError,
  } = useMutation({
    mutationFn: submitRequest,
    onSuccess: () => {
      toast.success("Your teaching request has been submitted!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to submit request");
    },
  });

  return { createteachingrequest, isPending, isError };
};

/* =========================
   3. REVIEW REQUEST (Admin Action)
========================= */
export const useReviewRequest = () => {
  const queryClient = useQueryClient();

  const reviewAction = async ({ requestId, action }) => {
    const res = await axiosInstance.put(
      `/reviewrequest/${requestId}`,
      { action },
      { withCredentials: true }
    );
    return res.data;
  };

  const {
    mutateAsync: reviewrequest,
    isPending,
    isError,
  } = useMutation({
    mutationFn: reviewAction,
    onSuccess: (_, variables) => {
      toast.success(`Request ${variables.action}d successfully!`);
      // ✅ Refresh the list automatically so the approved request disappears
      queryClient.invalidateQueries({ queryKey: ["teachingRequests"] });
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Failed to review request");
    },
  });

  return { reviewrequest, isPending, isError };
};

export const useDeleteRequest = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: async (requestId) => {
      // FIX: requestId must be in the 'data' object for DELETE requests
      const res = await axiosInstance.delete(`/deleterequest`, {
        data: { requestId }, 
        withCredentials: true,
      });
      return res.data;
    },
    onSuccess: () => {  
      toast.success("Request deleted successfully!");
      queryClient.invalidateQueries({ queryKey: ["teachingRequests"] });
    },
    onError: (error) => {
      // FIX: Ensure we only send the STRING message to toast, not the whole error object
      const errorMessage = error.response?.data?.message || "Failed to delete request";
      toast.error(errorMessage);
    },
  });
};