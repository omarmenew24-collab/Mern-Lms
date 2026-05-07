// src/api/auth.js
import { useMutation, useQueryClient } from "@tanstack/react-query";
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

  const signupUser = async ({ name, password, email, image }) => {
    const formData = new FormData();
    formData.append("name", name);
    formData.append("password", password);
    formData.append("email", email);
    if (image) {
      formData.append("image", image);
    }

    const res = await axiosInstance.post("/signup", formData);

    return res.data;
  };

  const {
    mutateAsync: signup,
    isPending,
    isError,
  } = useMutation({
    mutationFn: signupUser,
    onSuccess: (data) => {
      if (data.needsVerification) {
        // Toast + navigation are handled in SignUpPage so the message stays visible longer.
        return;
      }
      toast.success(data.message || "You're signed in!");
      if (data.userResponse) setUser(data.userResponse);
      if (data.accessToken) setAccessToken(data.accessToken);
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
      const msg = error.response?.data?.message || "Login failed";
      if (error.response?.data?.code === "EMAIL_NOT_VERIFIED") {
        toast.error(`${msg} You can resend the link from the sign-up page.`);
      } else {
        toast.error(msg);
      }
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
   4. UPDATE PROFILE
========================= */
export const useUpdateUser = () => {
  const setUser = useUserStore((state) => state.setUser);
  const queryClient = useQueryClient();

  const updateProfile = async ({ userId, updatedFields }) => {
    const formData = new FormData();
    if (updatedFields.name !== undefined) {
      formData.append("name", updatedFields.name);
    }
    if (updatedFields.picture !== undefined) {
      formData.append("picture", updatedFields.picture);
    }
    if (updatedFields.image) {
      formData.append("image", updatedFields.image);
    }
    if (updatedFields.publicAbout !== undefined) {
      formData.append("publicAbout", updatedFields.publicAbout);
    }
    if (updatedFields.publicProjectLinks !== undefined) {
      formData.append("publicProjectLinks", JSON.stringify(updatedFields.publicProjectLinks));
    }

    const res = await axiosInstance.put(`/updateuserprofile/${userId}`, formData);
    return res.data;
  };

  const {
    mutateAsync: updateuser,
    isPending,
    isError,
  } = useMutation({
    mutationFn: updateProfile,
    onSuccess: (data) => {
      if (data?.user?._id) {
        queryClient.invalidateQueries({ queryKey: ["public-user", data.user._id] });
      }
      const me = useUserStore.getState().user;
      if (data?.user && me && String(data.user._id) === String(me._id)) {
        setUser(data.user);
      }
      toast.success("Profile updated!");
    },
    onError: () => {
      toast.error("Failed to update profile");
    },
  });

  return { updateuser, isPending, isError };
};

/* =========================
   5. LOGOUT
========================= */
export const useLogout = () => {
  const clearUser = useUserStore((state) => state.clearUser);
  const clearAuth = useAuthStore((state) => state.clearAuth);
  const queryClient = useQueryClient();

  const logoutUser = async () => {
    await axiosInstance.post("/logout", {});
  };

  const { mutateAsync: logout, isPending } = useMutation({
    mutationFn: logoutUser,
    onSuccess: () => {
      toast.success("Logged out");
    },
    onError: () => {
      toast.error("Could not reach the server. You were signed out on this device.");
    },
    onSettled: () => {
      clearUser();
      clearAuth();
      queryClient.clear();
    },
  });

  return { logout, isPending };
};
