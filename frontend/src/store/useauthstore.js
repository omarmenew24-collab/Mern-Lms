import { create } from "zustand";

export const useAuthStore = create((set, get) => ({
  // ================= STATE =================
  accessToken: null,
  isAuthenticated: false,

  // ================= ACTIONS =================

  setAccessToken: (token) =>
    set({
      accessToken: token,
      isAuthenticated: true,
    }),

  clearAuth: () =>
    set({
      accessToken: null,
      isAuthenticated: false,
    }),

  // Helper getter
  getAccessToken: () => get().accessToken,
}));