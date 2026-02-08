import { create } from "zustand";
import { persist } from "zustand/middleware";
import { axiosInstance } from "../lib/axios";
import toast from "react-hot-toast";

// const useStore = create(
//   persist(
//     (set) => ({
//       zuser: null, // unified user object

//       setUser: (user) => set({ zuser: user }),

//       signup: async ({ name, password, email }) => {
//         try {
//           const res = await axiosInstance.post("/signup", {
//             name,
//             password,
//             email,
//           });
//           if (res.status === 201) {
//             toast.success("Signup successful!");
//             set({ zuser: res.data }); // unified user response
//             return res.data;
//           } else {
//             toast.error("Something went wrong");
//           }
//         } catch (error) {
//           toast.error(error.response?.data?.message || "Signup failed");
//         }
//       },

//       login: async ({ name, password }) => {
//         try {
//           const res = await axiosInstance.post("/login", { name, password });
//           if (res.status === 200) {
//             set({ zuser: res.data }); // unified user response
//             return res.data;
//           } else {
//             toast.error("Something went wrong");
//           }
//         } catch (error) {
//           toast.error(error.response?.data?.message || "Login failed");
//         }
//       },

//       logout: async () => {
//         try {
//           await axiosInstance.post("/logout", {}, { withCredentials: true });
//         } catch (err) {
//           console.error("Logout failed:", err);
//         } finally {
//           set({ zuser: null });
//         }
//       },

//       googlelogin: async (token) => {
//         try {
//           const res = await axiosInstance.post(
//             "/auth/google",
//             { token },
//             { withCredentials: true },
//           );
//           set({ zuser: res.data }); // unified user response
//           console.log("user logged in is", res.data);
//           return res.data;
//         } catch (err) {
//           console.error("Google login failed:", err);
//         }
//       },

//       googlelogout: async () => {
//         try {
//           await axiosInstance.post(
//             "/auth/logout",
//             {},
//             { withCredentials: true },
//           );
//         } catch (err) {
//           console.error("Google logout failed:", err);
//         } finally {
//           set({ zuser: null });
//         }
//       },

//       updateuser: async (userId, updatedFields) => {
//         if (!userId) return console.error("No userId provided!");
//         try {
//           const res = await axiosInstance.put(
//             `/updateuserprofile/${userId}`,
//             updatedFields,
//             { withCredentials: true },
//           );
//           set({ zuser: res.data }); // unified user response
//           return res.data;
//         } catch (error) {
//           console.error("Failed to update user:", error);
//         }
//       },
//       getteachingrequests: async () => {
//         try {
//           const res = await axiosInstance.get("/getteachingrequests", {
//             withCredentials: true,
//           });
//           if (res.status === 200 && res.data?.requests) {
//             return res.data.requests;
//           } else {
//             throw new Error(
//               res.data?.message || "Failed to fetch teaching requests",
//             );
//           }
//         } catch (error) {
//           console.error("Error fetching teaching requests:", error);
//           throw new Error(
//             error.response?.data?.message || error.message || "Server error",
//           );
//         }
//       },

//       fetchUser: async () => {
//         try {
//           const res = await axiosInstance.get("/auth/me", {
//             withCredentials: true,
//           });
//           console.log("response from fetchuser", res.data);
//           return res.data;
//         } catch (error) {
//           console.error("fetchUser error:", error);
//           set({ zuser: null });
//           return null;
//         }
//       },
//       createteachingrequest: async (formData) => {
//         try {
//           // Send the form data to the backend
//           const res = await axiosInstance.post(
//             "/createteachingrequest",
//             formData,
//           );

//           if (res.status === 201) {
//             console.log(
//               "✅ Teaching request submitted successfully:",
//               res.data,
//             );
//             toast.success("Your teaching request has been submitted!");
//             return res.data; // return the newly created request
//           } else {
//             console.warn("Unexpected response:", res.status);
//             toast.error("Something went wrong submitting your request.");
//             return null;
//           }
//         } catch (error) {
//           const message =
//             error.response?.data?.message ||
//             "Failed to submit teaching request";
//           console.error("❌ Teaching request error:", message);
//           toast.error(message);
//           throw error; // throw to let frontend catch it
//         }
//       },

//       // ✅ New reviewrequest function to match backend
//       reviewrequest: async (requestId, action) => {
//         try {
//           if (!requestId || !action)
//             throw new Error("Request ID and action required");

//           const res = await axiosInstance.put(
//             `/reviewrequest/${requestId}`,
//             { action },
//             { withCredentials: true },
//           );

//           if (res.status === 200) {
//             toast.success(`Request ${action}d successfully!`);
//             return res.data.request; // returns the updated request object
//           } else {
//             toast.error("Something went wrong while reviewing the request");
//             return null;
//           }
//         } catch (err) {
//           console.error("Review request error:", err);
//           toast.error(
//             err.response?.data?.message || "Failed to review request",
//           );
//           throw err;
//         }
//       },
//     }),

//     { name: "user-storage" }, // persisted in localStorage
//   ),
// );

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setUser: (user) => set({ user }),

      clearUser: () => {
        set({ user: null });                // clear memory
        useUserStore.persist.clearStorage(); // 🔥 clear persisted storage
      },

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "user-storage",
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
    }
  )
);

export default useUserStore;


