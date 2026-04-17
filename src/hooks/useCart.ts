import { useEffect, useState } from "react";
import { Product } from "@/data/products";

export interface CartItem {
  product: Product;
  qty: number;
}

const KEY = "abbad_cart_v1";

function read(): CartItem[] {
  try {
    return JSON.parse(localStorage.getItem(KEY) || "[]");
  } catch {
    return [];
  }
}

function write(items: CartItem[]) {
  localStorage.setItem(KEY, JSON.stringify(items));
  window.dispatchEvent(new Event("abbad-cart-change"));
}

export function useCart() {
  const [items, setItems] = useState<CartItem[]>(() => read());

  useEffect(() => {
    const onChange = () => setItems(read());
    window.addEventListener("abbad-cart-change", onChange);
    window.addEventListener("storage", onChange);
    return () => {
      window.removeEventListener("abbad-cart-change", onChange);
      window.removeEventListener("storage", onChange);
    };
  }, []);

  const add = (product: Product, qty = 1) => {
    const next = [...read()];
    const existing = next.find((i) => i.product.id === product.id);
    if (existing) existing.qty += qty;
    else next.push({ product, qty });
    write(next);
  };

  const remove = (id: string) => write(read().filter((i) => i.product.id !== id));
  const setQty = (id: string, qty: number) =>
    write(read().map((i) => (i.product.id === id ? { ...i, qty: Math.max(1, qty) } : i)));
  const clear = () => write([]);

  const total = items.reduce((s, i) => s + i.product.price * i.qty, 0);

  return { items, add, remove, setQty, clear, total };
}
