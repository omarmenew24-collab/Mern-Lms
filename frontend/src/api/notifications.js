import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import toast from "react-hot-toast";
import { axiosInstance } from "../lib/axios";
import useUserStore from "../store/userstore";
import { useAuthStore } from "../store/useauthstore";

export const NOTIFICATION_QK = {
  base: ["notifications"],
  list: (page, limit) => ["notifications", "list", page, limit],
  unread: ["notifications", "unread-count"],
};

export function useNotificationsList(page = 1, limit = 20) {
  const user = useUserStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: NOTIFICATION_QK.list(page, limit),
    queryFn: async () => {
      const { data } = await axiosInstance.get("/notifications", {
        params: { page, limit },
      });
      return data;
    },
    // Require access token: persisted `user` can exist while JWT is still null (e.g. refresh pending/failed)
    enabled: Boolean(user && accessToken),
    refetchInterval: 30_000,
  });
}

/** Latest N for sidebar */
export function useRecentNotifications(limit = 5) {
  return useNotificationsList(1, limit);
}

export function useUnreadNotificationCount() {
  const user = useUserStore((s) => s.user);
  const accessToken = useAuthStore((s) => s.accessToken);
  return useQuery({
    queryKey: NOTIFICATION_QK.unread,
    queryFn: async () => {
      const { data } = await axiosInstance.get("/notifications/unread-count");
      return typeof data?.count === "number" ? data.count : 0;
    },
    enabled: Boolean(user && accessToken),
    refetchInterval: 30_000,
  });
}

export function useMarkNotificationRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.patch(`/notifications/${id}/read`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_QK.base });
    },
  });
}

export function useMarkAllNotificationsRead() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: () => axiosInstance.patch("/notifications/read-all"),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_QK.base });
    },
  });
}

export function useDeleteNotification() {
  const qc = useQueryClient();
  return useMutation({
    mutationFn: (id) => axiosInstance.delete(`/notifications/${id}`),
    onSuccess: () => {
      qc.invalidateQueries({ queryKey: NOTIFICATION_QK.base });
    },
  });
}

/**
 * Admin or instructor — POST /notifications/send (bulk in-app announcement).
 * @param {{ title: string, message: string, targetType: string, courseId?: string, isImportant?: boolean }} payload
 */
export function useSendAnnouncement() {
  return useMutation({
    mutationFn: async (payload) => {
      const { data } = await axiosInstance.post("/notifications/send", payload);
      return data;
    },
    onSuccess: (data) => {
      if (data?.created === 0) {
        toast(
          data?.message || "No recipients matched this audience (e.g. no enrolled students).",
          { icon: "ℹ️" },
        );
        return;
      }
      toast.success(
        `Announcement sent to ${data?.created ?? "?"} recipient(s)`,
      );
    },
    onError: (err) => {
      toast.error(err.response?.data?.message || "Failed to send announcement");
    },
  });
}
