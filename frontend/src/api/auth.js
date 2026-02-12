// src/api/auth.js
import { useQuery, useMutation, useQueryClient } from "@tanstack/react-query";
import { axiosInstance } from "../lib/axios";
import useUserStore from "../store/userstore"; // ✅ Using consistent store name
import toast from "react-hot-toast";

/* =========================
   1. SIGNUP
========================= */
export const useSignup = () => {
  const setUser = useUserStore((state) => state.setUser);

  const signupUser = async ({ name, password, email }) => {
    const res = await axiosInstance.post("/signup", { name, password, email });
        localStorage.setItem("token", res.data.token);

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
      setUser(data.userResponse);
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

  const loginUser = async ({ name, password }) => {
    const res = await axiosInstance.post("/login", { name, password });

    // Save token
    localStorage.setItem("token", res.data.token);

    return res.data;
  };

  const {
    mutateAsync: login,
    isPending,
    isError,
  } = useMutation({
    mutationFn: loginUser,
    onSuccess: (data) => {
      setUser(data.userResponse); // ✅ only the user
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

  const googleAuth = async (token) => {
    const res = await axiosInstance.post(
      "/auth/google",
      { token },
    );
        localStorage.setItem("token", res.data.token);

    return res.data;
  };

  const {
    mutateAsync: googlelogin,
    isPending,
    isError,
  } = useMutation({
    mutationFn: googleAuth,
    onSuccess: (data) => {
      setUser(data.userResponse);
      toast.success("Google Login successful!");
    },
    onError: (error) => {
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
      { withCredentials: true },
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
