import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";

/* =========================
   GET PAYMENT INTENT (AUTO-FETCH)
========================= */
// This replaces useCreatePaymentIntent to remove useEffect
// api/payment.js
export const useGetPaymentIntent = (courseId, userId, enabled = true) => {
  const fetchIntent = async () => {
    const res = await axiosInstance.post("/create-payment-intent", { courseId });
    return res.data; // { clientSecret: '...' }
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["paymentIntent", courseId, userId],
    queryFn: fetchIntent,
    enabled: Boolean(courseId && userId && enabled),
    staleTime: Infinity,
    gcTime: 1000 * 60 * 30,
    retry: false,
  });

  return { data, isLoading, isError, error };
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

/** One-shot enrollment check (no polling). Use for catalog pages, e.g. who may rate a course. */
export const useEnrollmentSnapshot = (courseId, studentId) => {
  const fetchStatus = async () => {
    const res = await axiosInstance.get(`/check/${courseId}/${studentId}`);
    return res.data;
  };

  const { data, isLoading, isError } = useQuery({
    queryKey: ["enrollment-snapshot", courseId, studentId],
    queryFn: fetchStatus,
    enabled: Boolean(courseId && studentId),
    staleTime: 60_000,
  });

  return {
    isEnrolled: Boolean(data?.enrolled),
    isLoading,
    isError,
  };
};

/**
 * After checkout, persist Payment + enrollment if Stripe webhook did not reach the server (common on localhost).
 */
export const useSyncPaymentIntent = () => {
  const queryClient = useQueryClient();

  const { mutateAsync, isPending, isError, error } = useMutation({
    mutationFn: async (paymentIntentId) => {
      const res = await axiosInstance.post("/sync-payment-intent", {
        paymentIntentId,
      });
      return res.data;
    },
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ["finance-overview"] });
      queryClient.invalidateQueries({ queryKey: ["dashboard-analytics"] });
      queryClient.invalidateQueries({ queryKey: ["dashboardstats"] });
      queryClient.invalidateQueries({ queryKey: ["course-payments"] });
      queryClient.invalidateQueries({ queryKey: ["admin-finance-payments"] });
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Could not sync payment");
    },
  });

  return { syncPaymentIntent: mutateAsync, isPending, isError, error };
};

/* =========================
   ADMIN: COURSE PAYMENTS (MongoDB Payment collection)
========================= */
export const useGetCoursePaymentReport = (courseId) => {
  const fetchReport = async () => {
    const res = await axiosInstance.get(
      `/admin/courses/${courseId}/payments`,
    );
    return res.data;
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["course-payments", courseId],
    queryFn: fetchReport,
    enabled: !!courseId,
  });

  return {
    totalRevenue: data?.totalRevenue ?? 0,
    currency: data?.currency ?? "usd",
    payments: data?.payments ?? [],
    source: data?.source ?? "database",
    isLoading,
    isError,
    error,
  };
};

/* =========================
   ADMIN: ALL PAYMENTS (finance overview)
========================= */
export const useGetAdminFinancePayments = (limit = 100) => {
  const fetchPayments = async () => {
    const res = await axiosInstance.get(`/admin/payments`, {
      params: { limit },
    });
    return res.data.payments ?? [];
  };

  const { data, isLoading, isError, error } = useQuery({
    queryKey: ["admin-finance-payments", limit],
    queryFn: fetchPayments,
  });

  return { payments: data ?? [], isLoading, isError, error };
};

/* =========================
   ADMIN: bulk enroll many users in one course (backend: POST /enroll/:courseId/bulk)
========================= */
export const useBulkEnrollStudents = (courseId) => {
  const queryClient = useQueryClient();

  const { mutateAsync: bulkEnrollStudents, isPending } = useMutation({
    mutationFn: (studentIds) =>
      axiosInstance
        .post(`/enroll/${courseId}/bulk`, { studentIds })
        .then((r) => r.data),
    // Refresh roster + progress; toast from { enrolled, skipped }
    onSuccess: ({ enrolled, skipped }) => {
      queryClient.invalidateQueries({ queryKey: ["students", courseId] });
      queryClient.invalidateQueries({ queryKey: ["courseProgress", "bulk", courseId] });
      if (enrolled > 0) {
        toast.success(`Enrolled ${enrolled} student(s)${skipped ? `, ${skipped} skipped` : ""}`);
      } else {
        toast.error("All selected students were already enrolled");
      }
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Bulk enrollment failed");
    },
  });

  return { bulkEnrollStudents, isBulkEnrolling: isPending };
};