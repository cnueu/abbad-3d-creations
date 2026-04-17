// Product catalog. Each cube size comes in multiple colors.
// Pricing rule (per user): 10cm = 2 SAR, 20cm = 4 SAR, 30cm = 6 SAR. Sheet = 2 SAR.
// Real-life rule: each cube needs ~2 sheets → multiplier handled in Studio.
export type ProductKind = "cube" | "sheet";

export interface Product {
  id: string;
  kind: ProductKind;
  size: number; // cm — cube edge or sheet length
  materials: string[];
  price: number; // SAR
  dims: { x: number; y: number; z: number };
  color: string; // hex
  colorName: { en: string; ar: string };
}

const CUBE_COLORS: { hex: string; en: string; ar: string }[] = [
  { hex: "#6db8ac", en: "Sage Mint",   ar: "نعناع" },
  { hex: "#e08a5b", en: "Terracotta",  ar: "طيني" },
  { hex: "#5b7fc7", en: "Indigo",      ar: "نيلي" },
  { hex: "#d4546b", en: "Rose Clay",   ar: "وردي طيني" },
  { hex: "#f2c94c", en: "Amber",       ar: "عنبري" },
  { hex: "#9b6ec7", en: "Lavender",    ar: "خزامى" },
  { hex: "#2f3640", en: "Onyx",        ar: "أونكس" },
  { hex: "#f4f1ea", en: "Bone White",  ar: "عاجي" },
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

export const PRODUCTS: Product[] = [
  ...makeCubes(10, 2),
  ...makeCubes(20, 4),
  ...makeCubes(30, 6),
  // Connector sheet — single SKU
  { id: "sheet-20", kind: "sheet", size: 20, materials: ["PLA"], price: 2,
    dims: { x: 2.3, y: 2.3, z: 20 },
    color: "#a8d5cc", colorName: { en: "Pale Mint", ar: "نعناع فاتح" } },
];

export function findProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

// Suggest one representative card per used cube size + the sheet.
export function suggestProducts(usedSizes: number[] = [10]) {
  const sizes = new Set(usedSizes);
  const seen = new Set<number>();
  const out: Product[] = [];
  for (const p of PRODUCTS) {
    if (p.kind === "sheet") { out.push(p); continue; }
    if (!sizes.has(p.size)) continue;
    if (seen.has(p.size)) continue;
    seen.add(p.size);
    out.push(p);
  }
  return out;
}

export const CUBE_PRICE: Record<10 | 20 | 30, number> = { 10: 2, 20: 4, 30: 6 };
export const SHEET_PRICE = 2;
