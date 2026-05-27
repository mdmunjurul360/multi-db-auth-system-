import { create } from "zustand";
import { persist, createJSONStorage } from "zustand/middleware";

export type CartItem = {
  id: string;
  title: string;
  author: string;
  img: string;
  price: number;
  qty: number;
};

type CartState = {
  items: CartItem[];
  add: (item: Omit<CartItem, "qty">, qty?: number) => void;
  buyNow: (item: Omit<CartItem, "qty">) => void;
  updateQty: (id: string, delta: number) => void;
  remove: (id: string) => void;
  clear: () => void;
};

export const useCartStore = create<CartState>()(
  persist(
    (set) => ({
      items: [],
      add: (item, qty = 1) =>
        set((s) => {
          const existing = s.items.find((i) => i.id === item.id);
          if (existing) {
            return {
              items: s.items.map((i) =>
                i.id === item.id ? { ...i, qty: i.qty + qty } : i,
              ),
            };
          }
          return { items: [...s.items, { ...item, qty }] };
        }),
      buyNow: (item) => set({ items: [{ ...item, qty: 1 }] }),
      updateQty: (id, delta) =>
        set((s) => ({
          items: s.items.map((i) =>
            i.id === id ? { ...i, qty: Math.max(1, i.qty + delta) } : i,
          ),
        })),
      remove: (id) => set((s) => ({ items: s.items.filter((i) => i.id !== id) })),
      clear: () => set({ items: [] }),
    }),
    {
      name: "edubari.cart.v1",
      storage: createJSONStorage(() =>
        typeof window === "undefined"
          ? (undefined as unknown as Storage)
          : localStorage,
      ),
    },
  ),
);

/* ---------- Back-compat API (drop-in replacement) ---------- */

export function addToCart(item: Omit<CartItem, "qty">, qty = 1) {
  useCartStore.getState().add(item, qty);
}
export function buyNow(item: Omit<CartItem, "qty">) {
  useCartStore.getState().buyNow(item);
}
export function updateQty(id: string, delta: number) {
  useCartStore.getState().updateQty(id, delta);
}
export function removeFromCart(id: string) {
  useCartStore.getState().remove(id);
}
export function clearCart() {
  useCartStore.getState().clear();
}

/** Hook returning the current cart items (subscribes to changes). */
export function useCart() {
  return useCartStore((s) => s.items);
}
