import { create } from "zustand";
import { persist } from "zustand/middleware";

/**
 * Client cart for course checkout. Each line is one course. Checkout still uses
 * the existing one-course /checkout route; the cart is for gathering intent (UI + persistence).
 */
const useCartStore = create(
  persist(
    (set, get) => ({
      items: [],

      addItem: (item) => {
        const { courseId, title, image, price, listPrice } = item;
        if (!courseId) return;
        set((s) => {
          if (s.items.some((i) => i.courseId === courseId)) return s;
          return {
            items: [
              ...s.items,
              {
                courseId,
                title: title || "Course",
                image: image || "",
                price: typeof price === "number" ? price : 0,
                listPrice: typeof listPrice === "number" ? listPrice : null,
                addedAt: Date.now(),
              },
            ],
          };
        });
      },

      removeItem: (courseId) =>
        set((s) => ({ items: s.items.filter((i) => i.courseId !== courseId) })),

      clear: () => set({ items: [] }),

      isInCart: (courseId) => get().items.some((i) => i.courseId === courseId),

      itemCount: () => get().items.length,
    }),
    { name: "lms-course-cart" },
  ),
);

export default useCartStore;
