// src/api/auth.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import useUserStore from "../store/userstore"; // ✅ Using consistent store name
import toast from "react-hot-toast";
import { useAuthStore } from "../store/useauthstore";

/* =========================
   1. SIGNUP
========================= */

export const useSignup = () => {
  const setUser = useUserStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const signupUser = async ({ name, password, email }) => {
    const res = await axiosInstance.post("/signup", {
      name,
      password,
      email,
    });

    return res.data;
  };

  const {
    mutateAsync: signup,
    isPending,
    isError,
  } = useMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {
      toast.success("Signup successful!");

      // 🟢 Store user (persisted)
      setUser(data.userResponse);

      // 🔵 Store access token (memory only)
      setAccessToken(data.accessToken);
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Signup failed");
    },
  });

  return { signup, isPending, isError };
};

/* =========================
   2. LOGIN
========================= */


export const useLogin = () => {
  const setUser = useUserStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const loginUser = async ({ name, password }) => {
    const res = await axiosInstance.post("/login", {
      name,
      password,
    });

    return res.data;
  };

  const {
    mutateAsync: login,
    isPending,
    isError,
  } = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      // 🟢 Persist user
      setUser(data.userResponse);

      // 🔵 Store access token in memory only
      setAccessToken(data.accessToken);

      toast.success("Welcome back!");
    },
    onError: (error) => {
      toast.error(error.response?.data?.message || "Login failed");
    },
  });

  return { login, isPending, isError };
};
/* =========================
   3. GOOGLE LOGIN
========================= */
export const useGoogleLogin = () => {
  const setUser = useUserStore((state) => state.setUser);
  const setAccessToken = useAuthStore((state) => state.setAccessToken);

  const googleAuth = async (token) => {
    const res = await axiosInstance.post("/auth/google", { token });
    return res.data;
  };

  const { mutateAsync: googlelogin, isPending, isError } = useMutation({
    mutationFn: googleAuth,
    onSuccess: (data) => {
      setUser(data.userResponse);
      setAccessToken(data.accessToken);   // ✅ new system
      toast.success("Google Login successful!");
    },
    onError: () => {
      toast.error("Google login failed");
    },
  });

  return { googlelogin, isPending, isError };
};

/* =========================
   4. FETCH USER (The "Gatekeeper")
========================= */
export const useFetchUser = () => {
  const setUser = useUserStore((state) => state.setUser);
  const clearUser = useUserStore((state) => state.clearUser);

  const getMe = async () => {
    const token = localStorage.getItem("token");

    if (!token) {
      clearUser();
      return null;
    }

    try {
      const res = await axiosInstance.get("/auth/me");
      setUser(res.data); // ✅ fixed
      return res.data;
    } catch (error) {
      clearUser();
      localStorage.removeItem("token");
      return null;
    }
  };

  const {
    data: authUser,
    isLoading,
    isError,
  } = useQuery({
    queryKey: ["authUser"],
    queryFn: getMe,
    retry: false,
    staleTime: 0, // ✅ Changed to 0 so it always validates the session on mount
  });

  return { authUser, isLoading, isError };
};

/* =========================
   5. UPDATE PROFILE
========================= */
export const useUpdateUser = () => {
  const setUser = useUserStore((state) => state.setUser);
  const queryClient = useQueryClient();

  const updateProfile = async ({ userId, updatedFields }) => {
    const res = await axiosInstance.put(
      `/updateuserprofile/${userId}`,
      updatedFields,
    );
    return res.data;
  };

  const {
    mutateAsync: updateuser,
    isPending,
    isError,
  } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      setUser(data);
      queryClient.invalidateQueries({ queryKey: ["authUser"] });
      toast.success("Profile updated!");
    },
    onError: (error) => {
      toast.error("Failed to update profile");
    },
  });

  return { updateuser, isPending, isError };
};

/* =========================
   6. LOGOUT
========================= */
export const useLogout = () => {
  const clearUser = useUserStore((state) => state.clearUser);
  const queryClient = useQueryClient();

  const logoutUser = async () => {
    await axiosInstance.post("/logout", {});
  };

  const { mutateAsync: logout, isPending } = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      clearUser(); // ✅ Wipes LocalStorage
      localStorage.removeItem("token");
      queryClient.clear(); // ✅ Wipes TanStack Cache
      toast.success("Logged out");
    },
  });

  return { logout, isPending };
};
