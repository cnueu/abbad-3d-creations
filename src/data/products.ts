// Product catalog. Each cube size comes in multiple natural colors.
// Pricing rule: 10cm = 2 SAR, 20cm = 4 SAR, 30cm = 6 SAR. Connecter = 0.25 SAR.
// Custom-color cubes: +1 SAR (10cm = 3, 20cm = 5, 30cm = 7) with size minimums.
// NOTE: kind "sheet" / "custom-sheet" are the legacy enum values for the connecter
// (renamed in UI but kept as enum strings to avoid breaking saved cart/order data).
export type ProductKind = "cube" | "sheet" | "custom-cube" | "custom-sheet";

export interface Product {
  id: string;
  kind: ProductKind;
  size: number; // cm — cube edge or connecter length
  materials: string[];
  price: number; // SAR
  dims: { x: number; y: number; z: number };
  color: string; // hex
  colorName: { en: string; ar: string };
  isCustom?: boolean;
  minQty?: number;
}

// Chrome / silver / black / white palette only.
const CUBE_COLORS: { hex: string; en: string; ar: string }[] = [
  { hex: "#131312", en: "Obsidian Black", ar: "أسود عميق" },
  { hex: "#2b2c2e", en: "Graphite",       ar: "غرافيت" },
  { hex: "#6b7079", en: "Steel",          ar: "فولاذ" },
  { hex: "#9aa0a8", en: "Brushed Silver", ar: "فضي مصقول" },
  { hex: "#c8ccd2", en: "Liquid Chrome",  ar: "كروم سائل" },
  { hex: "#e8ecf1", en: "Polished Silver", ar: "فضي لامع" },
  { hex: "#f5f7fa", en: "Pearl White",    ar: "أبيض لؤلؤي" },
  { hex: "#ffffff", en: "Pure White",     ar: "أبيض نقي" },
];

// Connecter color combinations — match the cube palette.
const CONNECTER_COLORS: { hex: string; en: string; ar: string }[] = [
  { hex: "#131312", en: "Obsidian Black", ar: "أسود عميق" },
  { hex: "#6b7079", en: "Steel",          ar: "فولاذ" },
  { hex: "#9aa0a8", en: "Brushed Silver", ar: "فضي مصقول" },
  { hex: "#c8ccd2", en: "Liquid Chrome",  ar: "كروم سائل" },
  { hex: "#e8ecf1", en: "Polished Silver", ar: "فضي لامع" },
  { hex: "#ffffff", en: "Pure White",     ar: "أبيض نقي" },
];

function makeCubes(size: 10 | 20 | 30, price: number): Product[] {
  return CUBE_COLORS.map((c) => ({
    id: `cube-${size}-${c.en.toLowerCase().replace(/\s+/g, "-")}`,
    kind: "cube" as const,
    size, price,
    materials: ["PLA", "WOOD"],
    dims: { x: size, y: size, z: size },
    color: c.hex,
    colorName: { en: c.en, ar: c.ar },
  }));
}

function makeConnecters(): Product[] {
  return CONNECTER_COLORS.map((c) => ({
    id: `connecter-10-${c.en.toLowerCase().replace(/\s+/g, "-")}`,
    kind: "sheet" as const, // legacy enum value — represents the connecter
    size: 10,
    materials: ["PLA"],
    price: 0.25,
    dims: { x: 2.3, y: 2.3, z: 10 },
    color: c.hex,
    colorName: { en: c.en, ar: c.ar },
  }));
}

export const PRODUCTS: Product[] = [
  ...makeCubes(10, 2),
  ...makeCubes(20, 4),
  ...makeCubes(30, 6),
  ...makeConnecters(),
];

// Custom-color cubes — one card per size. +1 SAR over standard, with min order qty.
export const CUSTOM_CUBES: Product[] = [
  {
    id: "custom-cube-10",
    kind: "custom-cube",
    size: 10,
    materials: ["PLA", "WOOD"],
    price: 3,
    dims: { x: 10, y: 10, z: 10 },
    color: "#c0c0c0",
    colorName: { en: "Custom color", ar: "لون مخصص" },
    isCustom: true,
    minQty: 100,
  },
  {
    id: "custom-cube-20",
    kind: "custom-cube",
    size: 20,
    materials: ["PLA", "WOOD"],
    price: 5,
    dims: { x: 20, y: 20, z: 20 },
    color: "#c0c0c0",
    colorName: { en: "Custom color", ar: "لون مخصص" },
    isCustom: true,
    minQty: 70,
  },
  {
    id: "custom-cube-30",
    kind: "custom-cube",
    size: 30,
    materials: ["PLA", "WOOD"],
    price: 7,
    dims: { x: 30, y: 30, z: 30 },
    color: "#c0c0c0",
    colorName: { en: "Custom color", ar: "لون مخصص" },
    isCustom: true,
    minQty: 60,
  },
];

export function findProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id) || CUSTOM_CUBES.find((p) => p.id === id);
}

// Suggest one representative card per used cube size + a connecter.
export function suggestProducts(usedSizes: number[] = [10]) {
  const sizes = new Set(usedSizes);
  const seen = new Set<number>();
  const out: Product[] = [];
  for (const p of PRODUCTS) {
    if (p.kind === "sheet") {
      if (!out.some((x) => x.kind === "sheet")) out.push(p);
      continue;
    }
    if (p.kind !== "cube") continue;
    if (!sizes.has(p.size)) continue;
    if (seen.has(p.size)) continue;
    seen.add(p.size);
    out.push(p);
  }
  return out;
}

export const CUBE_PRICE: Record<10 | 20 | 30, number> = { 10: 2, 20: 4, 30: 6 };
export const CONNECTER_PRICE = 0.25;
// Backwards-compat alias (legacy name).
export const SHEET_PRICE = CONNECTER_PRICE;
