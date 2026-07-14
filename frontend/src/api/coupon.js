import { axiosInstance } from "../lib/axios";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";

export function useValidateCheckoutCoupon() {
  return useMutation({
    mutationFn: async ({ courseId, couponCode }) => {
      const res = await axiosInstance.post("/coupons/validate", {
        courseId,
        couponCode,
      });
      return res.data;
    },
  });
}

export function useAdminCoupons() {
  return useQuery({
    queryKey: ["admin-coupons"],
    queryFn: async () => {
      const res = await axiosInstance.get("/coupons/admin");
      return res.data.coupons ?? [];
    },
  });
}

export function useCreateCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async (payload) => {
      const res = await axiosInstance.post("/coupons/admin", payload);
      return res.data.coupon;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon created");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Could not create coupon"),
  });
}

export function usePatchCoupon() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: async ({ id, payload }) => {
      const res = await axiosInstance.patch(`/coupons/admin/${id}`, payload);
      return res.data.coupon;
    },
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: ["admin-coupons"] });
      toast.success("Coupon updated");
    },
    onError: (err) => toast.error(err.response?.data?.message || "Update failed"),
  });
}
