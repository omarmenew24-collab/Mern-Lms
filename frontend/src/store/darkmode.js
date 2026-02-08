import { create } from "zustand";
import { persist } from "zustand/middleware";

export const useDarkMode = create(persist((set) => ({
  darkMode: false,

  onToggleDarkMode : () =>
    set((state) => ({ darkMode: !state.darkMode }))
})));
