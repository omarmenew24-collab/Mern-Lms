import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

export function usePublicManualPaymentMethods() {
  return useQuery({
    queryKey: ["manual-payment-methods-public"],
    queryFn: async () => {
      const res = await axiosInstance.get("/manual-payments/methods");
      return res.data.methods ?? [];
    },
    staleTime: 60_000,
  });
}

export function useMyManualPaymentOrders(enabled = true) {
  return useQuery({
    queryKey: ["manual-payment-orders-mine"],
    queryFn: async () => {
      const res = await axiosInstance.get("/manual-payments/my-orders");
      return res.data.orders ?? [];
    },
    enabled,
  });
}

export function useCreateManualPaymentOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ courseId, paymentMethodId, couponCode }) => {
      const res = await axiosInstance.post("/manual-payments/orders", {
        courseId,
        paymentMethodId,
        ...(couponCode ? { couponCode: String(couponCode).trim().toUpperCase() } : {}),
      });
      return res.data;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-payment-orders-mine"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not start manual checkout");
    },
  });
}

export function useSubmitManualPaymentProof() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, transactionRef, senderName, paymentDate, receiptFile }) => {
      const fd = new FormData();
      fd.append("transactionRef", transactionRef);
      fd.append("senderName", senderName || "");
      fd.append("paymentDate", paymentDate || "");
      fd.append("receipt", receiptFile);
      const res = await axiosInstance.post(`/manual-payments/my-orders/${orderId}/proof`, fd, {
        headers: { "Content-Type": "multipart/form-data" },
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Proof submitted. We’ll verify your payment shortly.");
      qc.invalidateQueries({ queryKey: ["manual-payment-orders-mine"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not upload proof");
    },
  });
}

export function useAdminManualPaymentMethods() {
  return useQuery({
    queryKey: ["manual-payment-methods-admin"],
    queryFn: async () => {
      const res = await axiosInstance.get("/manual-payments/admin/methods");
      return res.data.methods ?? [];
    },
  });
}

export function useSaveManualPaymentMethod() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      if (id) {
        const res = await axiosInstance.patch(`/manual-payments/admin/methods/${id}`, payload);
        return res.data.method;
      }
      const res = await axiosInstance.post("/manual-payments/admin/methods", payload);
      return res.data.method;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["manual-payment-methods-admin"] });
      qc.invalidateQueries({ queryKey: ["manual-payment-methods-public"] });
      toast.success("Saved");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Save failed"),
  });
}

export function useAdminManualPaymentOrders(status = "pending") {
  return useQuery({
    queryKey: ["manual-payment-orders-admin", status],
    queryFn: async () => {
      const res = await axiosInstance.get("/manual-payments/admin/orders", {
        params: { status },
      });
      return res.data.orders ?? [];
    },
  });
}

export function useApproveManualPaymentOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (orderId) => {
      const res = await axiosInstance.post(`/manual-payments/admin/orders/${orderId}/approve`);
      return res.data;
    },
    onSuccess: () => {
      toast.success("Approved — student enrolled");
      qc.invalidateQueries({ queryKey: ["manual-payment-orders-admin"] });
      qc.invalidateQueries({ queryKey: ["manual-payment-orders-mine"] });
      qc.invalidateQueries({ queryKey: ["admin-finance-payments"] });
      qc.invalidateQueries({ queryKey: ["dashboardstats"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Approval failed"),
  });
}

export function useRejectManualPaymentOrder() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ orderId, reason }) => {
      const res = await axiosInstance.post(`/manual-payments/admin/orders/${orderId}/reject`, {
        reason,
      });
      return res.data;
    },
    onSuccess: () => {
      toast.success("Marked as rejected — student can resubmit");
      qc.invalidateQueries({ queryKey: ["manual-payment-orders-admin"] });
      qc.invalidateQueries({ queryKey: ["manual-payment-orders-mine"] });
    },
    onError: (err) => toast.error(err.response?.data?.message || "Could not reject"),
  });
}
