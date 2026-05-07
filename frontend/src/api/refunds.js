import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

export function usePublicRefundPolicy() {
  return useQuery({
    queryKey: ["public-refund-policy"],
    queryFn: async () => {
      const res = await axiosInstance.get("/public/refund-policy");
      return res.data;
    },
    staleTime: 60_000,
  });
}

export function useRefundEligibility(courseId) {
  return useQuery({
    queryKey: ["refund-eligibility", courseId],
    queryFn: async () => {
      const res = await axiosInstance.get(`/refunds/eligibility/${courseId}`);
      return res.data;
    },
    enabled: !!courseId,
  });
}

export function useMyRefundRequests() {
  return useQuery({
    queryKey: ["refunds-mine"],
    queryFn: async () => {
      const res = await axiosInstance.get("/refunds/mine");
      return res.data;
    },
  });
}

export function useCreateRefundRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, reason, refundPercent }) => {
      const res = await axiosInstance.post("/refunds", { courseId, reason, refundPercent });
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["refunds-mine"] });
      queryClient.invalidateQueries({ queryKey: ["refund-eligibility"] });
      if (data?.request?.status === "failed" || data?.processError) {
        toast.error(
          data?.processError || "Refund was created but payment refund failed. Contact support.",
        );
      } else {
        toast.success("Refund request submitted");
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not submit refund");
    },
  });
}

export function useAdminRefundRequests(status = "all") {
  return useQuery({
    queryKey: ["admin-refunds", status],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/refunds", {
        params:
          status && status !== "all" ? { status: String(status) } : undefined,
      });
      return res.data;
    },
  });
}

export function useAdminRefundRequest(id) {
  return useQuery({
    queryKey: ["admin-refund", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/refunds/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useUpdateAdminRefundRequest() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, body }) => {
      const res = await axiosInstance.patch(`/admin/refunds/${id}`, body);
      return res.data;
    },
    onSuccess: (data) => {
      queryClient.invalidateQueries({ queryKey: ["admin-refunds"] });
      if (data?.request?._id) {
        queryClient.invalidateQueries({ queryKey: ["admin-refund", data.request._id] });
      }
      if (data?.processOk === false && data?.processWarning) {
        toast.error(data.processWarning);
      } else {
        toast.success("Updated");
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Update failed");
    },
  });
}
