import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";

export function useAdminChargebacks(status = "all") {
  return useQuery({
    queryKey: ["admin-chargebacks", status],
    queryFn: async () => {
      const res = await axiosInstance.get("/admin/chargebacks", {
        params: status && status !== "all" ? { status } : undefined,
      });
      return res.data;
    },
  });
}

export function useAdminChargeback(id) {
  return useQuery({
    queryKey: ["admin-chargeback", id],
    queryFn: async () => {
      const res = await axiosInstance.get(`/admin/chargebacks/${id}`);
      return res.data;
    },
    enabled: !!id,
  });
}

export function useCreateChargeback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (body) => {
      const res = await axiosInstance.post("/admin/chargebacks", body);
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["admin-chargebacks"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not create chargeback");
    },
  });
}

export function usePatchChargeback() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, status }) => {
      const res = await axiosInstance.patch(`/admin/chargebacks/${id}`, { status });
      return res.data;
    },
    onSuccess: (_, variables) => {
      queryClient.invalidateQueries({ queryKey: ["admin-chargebacks"] });
      queryClient.invalidateQueries({ queryKey: ["admin-chargeback", variables.id] });
      toast.success("Status updated");
    },
  });
}

export function useRefreshChargebackEvidence() {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: async (id) => {
      const res = await axiosInstance.post(`/admin/chargebacks/${id}/refresh-evidence`);
      return res.data;
    },
    onSuccess: (data) => {
      const cid = data?.chargeback?._id;
      queryClient.invalidateQueries({ queryKey: ["admin-chargebacks"] });
      if (cid) {
        queryClient.setQueryData(["admin-chargeback", cid], {
          chargeback: data.chargeback,
          timeline: data.timeline,
        });
      }
      toast.success("Evidence refreshed from LMS");
    },
  });
}

export async function downloadChargebackEvidencePdf(id) {
  const res = await axiosInstance.get(`/admin/chargebacks/${id}/export.pdf`, {
    responseType: "blob",
  });
  const blob = new Blob([res.data], { type: "application/pdf" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `chargeback-evidence-${id}.pdf`;
  a.click();
  URL.revokeObjectURL(url);
}
