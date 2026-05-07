import { create } from "zustand";
import { persist } from "zustand/middleware";

const useUserStore = create(
  persist(
    (set) => ({
      user: null,
      hasHydrated: false,

      setUser: (user) => set({ user }),

      clearUser: () => {
        set({ user: null });
        useUserStore.persist.clearStorage();
      },

      setHasHydrated: (state) => set({ hasHydrated: state }),
    }),
    {
      name: "user-storage",
      onRehydrateStorage: () => (state) => {
        state.setHasHydrated(true);
      },
    },
  ),
);

export default useUserStore;
