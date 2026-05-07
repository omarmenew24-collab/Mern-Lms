import { axiosInstance } from "./axios";
import { useAuthStore } from "../store/useauthstore";
import useUserStore from "../store/userstore";

let authBootstrap = null;

/**
 * Cold start: exchange httpOnly refresh cookie for access token + user.
 * Does not wait on persisted Zustand user (rehydration can lag; gating on `user` skipped refresh).
 * `authBootstrap` dedupes concurrent runs (e.g. React Strict Mode double mount).
 */
export async function initializeAuth() {
  if (authBootstrap) return authBootstrap;

  authBootstrap = (async () => {
    try {
      const res = await axiosInstance.post("/refresh");
      const newAccessToken = res.data.accessToken;
      useAuthStore.getState().setAccessToken(newAccessToken);

      if (res.data?.user) {
        useUserStore.getState().setUser(res.data.user);
      }
    } catch (e) {
      // Always clear in-memory access token.
      useAuthStore.getState().clearAuth();
      // If the server rejects the session (expired/invalid refresh cookie), clear persisted user too.
      // Otherwise the UI still shows a logged-in user with no way to call authenticated APIs (401s).
      // Transient network errors and 5xx keep persisted user so a retry can recover without a hard logout.
      if (e?.response?.status === 401) {
        useUserStore.getState().clearUser();
      }
    } finally {
      authBootstrap = null;
    }
  })();

  return authBootstrap;
}
