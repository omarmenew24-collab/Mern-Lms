import { axiosInstance } from "./axios";
import { useAuthStore } from "../store/useauthstore";
import useUserStore from "../store/userstore";
import { useQueryClient } from "@tanstack/react-query";

export const initializeAuth = async () => {
  const user = useUserStore.getState().user;
  if (!user) return;

  try {
    const res = await axiosInstance.post("/refresh");
    const newAccessToken = res.data.accessToken;

    useAuthStore.getState().setAccessToken(newAccessToken);

    // ✅ Refetch queries that depend on auth
    // Get the default query client from React Query
  
  } catch (error) {
    useUserStore.getState().clearUser();
    useAuthStore.getState().clearAuth();
  }
};