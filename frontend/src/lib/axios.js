/**
 * Authenticated API client.
 *
 * Model: short-lived access JWT in memory (Zustand) + httpOnly refresh cookie.
 * Every request sends Bearer when a token exists; refresh/logout also send a
 * custom header (see cookieAuthHeader) so simple cross-site POSTs cannot hit those routes.
 *
 * Response interceptor: on 401, optionally refresh once and retry. We only do that when
 * the failed request had actually sent Bearer auth—otherwise public endpoints that return
 * 401 would trigger pointless refresh. We skip refresh for /refresh and /logout to avoid loops.
 */

import axios from "axios";
import { useAuthStore } from "../store/useauthstore";
import useUserStore from "../store/userstore";
import {
  COOKIE_AUTH_HEADER,
  COOKIE_AUTH_HEADER_VALUE,
  isRefreshOrLogoutUrl,
} from "../config/cookieAuthHeader";

export const axiosInstance = axios.create({
  baseURL: import.meta.env.VITE_API_URL,
  withCredentials: true,
});

/** Reads Authorization from AxiosHeaders or plain object (Axios normalizes casing). */
function requestHadBearerAuth(config) {
  if (!config?.headers) return false;
  const h = config.headers;
  const raw =
    typeof h.get === "function"
      ? h.get("Authorization") ?? h.get("authorization")
      : h.Authorization ?? h.authorization;
  return typeof raw === "string" && raw.startsWith("Bearer ");
}
// custom header a security against csrf attacks
axiosInstance.interceptors.request.use((config) => {
  if (isRefreshOrLogoutUrl(config.url)) {
    config.headers[COOKIE_AUTH_HEADER] = COOKIE_AUTH_HEADER_VALUE;
  }

  const token = useAuthStore.getState().accessToken;
  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

axiosInstance.interceptors.response.use(
  (response) => response,
  async (error) => {
    const originalRequest = error.config;
    if (!originalRequest) {
      return Promise.reject(error);
    }

    if (error.response?.status !== 401 || originalRequest._retry) {
      return Promise.reject(error);
    }

    // Nested refresh failure must not try to refresh again.
    if (isRefreshOrLogoutUrl(originalRequest.url)) {
      return Promise.reject(error);
    }

    // Anonymous calls that get 401: do not refresh (nothing to extend).
    if (!requestHadBearerAuth(originalRequest)) {
      return Promise.reject(error);
    }

    originalRequest._retry = true;

    try {
      const res = await axiosInstance.post("/refresh");

      const newAccessToken = res.data.accessToken;
      useAuthStore.getState().setAccessToken(newAccessToken);

      // Same payload as boot: keeps role/status in sync after admin changes while tab is open.
      if (res.data?.user) {
        useUserStore.getState().setUser(res.data.user);
      }

      if (typeof originalRequest.headers?.set === "function") {
        originalRequest.headers.set("Authorization", `Bearer ${newAccessToken}`);
      } else {
        originalRequest.headers.Authorization = `Bearer ${newAccessToken}`;
      }

      return axiosInstance(originalRequest);
    } catch (refreshError) {
      useAuthStore.getState().clearAuth();
      return Promise.reject(refreshError);
    }
  },
);
