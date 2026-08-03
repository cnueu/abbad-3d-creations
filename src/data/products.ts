// ─────────────────────────────────────────────────────────────────────────────
// PRODUCT CATALOG  (B2B — no public pricing)
//
// WHERE TO CHANGE THINGS:
//  • Add / remove a colour ................ COLORS (below)
//  • Add a new part or generation ......... GEN1_PARTS / GEN2_PARTS
//  • Change the 3D file used for a part ... `model.url` on that part
//  • Change quote estimate rates .......... QUOTE_RATES (used by /quote only)
//
// Generation 1 = the original cube + connecter (10 / 20 / 30 cm cubes).
// Generation 2 = the new unified 20 cm system: cube, smooth-top cube,
//                connecter and half connecter. All colours are customizable.
// ─────────────────────────────────────────────────────────────────────────────

export type ProductKind = "cube" | "cube-smooth" | "connecter" | "half-connecter";
export type ModelFormat = "stl" | "obj";

export interface Product {
  id: string;
  generation: 1 | 2;
  kind: ProductKind;
  name: { en: string; ar: string };
  size: number; // cm — cube edge / connecter length
  dims: { x: number; y: number; z: number };
  materials: string[];
  color: string; // default hex (fully customizable on request)
  colorName: { en: string; ar: string };
  model: { url: string; format: ModelFormat; authoredCm: number };
}

// Customizable colour palette — the same swatches everywhere in the app.
export const COLORS: { hex: string; en: string; ar: string }[] = [
  { hex: "#E4EEF0", en: "Abaad Mist", ar: "ضباب أبعاد" },
  { hex: "#075056", en: "Abaad Teal", ar: "أخضر أبعاد" },
  { hex: "#16232A", en: "Deep Navy", ar: "كحلي عميق" },
  { hex: "#d9c6a3", en: "Sand", ar: "رملي" },
  { hex: "#a47148", en: "Walnut Wood", ar: "خشب جوز" },
  { hex: "#8a8a8a", en: "Stone Gray", ar: "رمادي حجري" },
  { hex: "#9aa3ad", en: "Brushed Metal", ar: "معدن مصقول" },
  { hex: "#6e4a2b", en: "Dark Wood", ar: "خشب داكن" },
];

const DEFAULT_COLOR = COLORS[1];

// ── Generation 1 ────────────────────────────────────────────────────────────
const GEN1_CUBE_SIZES: number[] = [10, 20, 30];

const GEN1_PARTS: Product[] = [
  ...GEN1_CUBE_SIZES.map<Product>((size) => ({
    id: `g1-cube-${size}`,
    generation: 1,
    kind: "cube",
    name: { en: `Gen 1 Cube · ${size}cm`, ar: `مكعب الجيل الأول · ${size} سم` },
    size,
    dims: { x: size, y: size, z: size },
    materials: ["PLA", "WOOD"],
    color: DEFAULT_COLOR.hex,
    colorName: { en: DEFAULT_COLOR.en, ar: DEFAULT_COLOR.ar },
    model: { url: "/models/FinalCube.stl", format: "stl", authoredCm: 10 },
  })),
  {
    id: "g1-connecter",
    generation: 1,
    kind: "connecter",
    name: { en: "Gen 1 Connecter · 10cm", ar: "موصِّل الجيل الأول · 10 سم" },
    size: 10,
    dims: { x: 2.3, y: 2.3, z: 10 },
    materials: ["PLA"],
    color: DEFAULT_COLOR.hex,
    colorName: { en: DEFAULT_COLOR.en, ar: DEFAULT_COLOR.ar },
    model: { url: "/models/FinalConnecter.obj", format: "obj", authoredCm: 10 },
  },
];

// ── Generation 2 — unified 20 cm system ─────────────────────────────────────
const GEN2_PARTS: Product[] = [
  {
    id: "g2-cube",
    generation: 2,
    kind: "cube",
    name: { en: "Gen 2 Cube · 20cm", ar: "مكعب الجيل الثاني · 20 سم" },
    size: 20,
    dims: { x: 20, y: 20, z: 20 },
    materials: ["PLA", "WOOD"],
    color: DEFAULT_COLOR.hex,
    colorName: { en: DEFAULT_COLOR.en, ar: DEFAULT_COLOR.ar },
    model: { url: "/models/gen2/Gen2Cube.stl", format: "stl", authoredCm: 20 },
  },
  {
    id: "g2-cube-smooth",
    generation: 2,
    kind: "cube-smooth",
    name: { en: "Gen 2 Cube · Smooth Top · 20cm", ar: "مكعب الجيل الثاني · سطح أملس · 20 سم" },
    size: 20,
    dims: { x: 20, y: 20, z: 20 },
    materials: ["PLA", "WOOD"],
    color: DEFAULT_COLOR.hex,
    colorName: { en: DEFAULT_COLOR.en, ar: DEFAULT_COLOR.ar },
    model: { url: "/models/gen2/Gen2CubeSmooth.stl", format: "stl", authoredCm: 20 },
  },
  {
    id: "g2-connecter",
    generation: 2,
    kind: "connecter",
    name: { en: "Gen 2 Connecter", ar: "موصِّل الجيل الثاني" },
    size: 20,
    dims: { x: 2.3, y: 2.3, z: 20 },
    materials: ["PLA"],
    color: DEFAULT_COLOR.hex,
    colorName: { en: DEFAULT_COLOR.en, ar: DEFAULT_COLOR.ar },
    model: { url: "/models/gen2/Gen2Connecter.stl", format: "stl", authoredCm: 20 },
  },
  {
    id: "g2-half-connecter",
    generation: 2,
    kind: "half-connecter",
    name: { en: "Gen 2 Half Connecter", ar: "نصف موصِّل الجيل الثاني" },
    size: 10,
    dims: { x: 2.3, y: 2.3, z: 10 },
    materials: ["PLA"],
    color: DEFAULT_COLOR.hex,
    colorName: { en: DEFAULT_COLOR.en, ar: DEFAULT_COLOR.ar },
    model: { url: "/models/gen2/Gen2HalfConnecter.stl", format: "stl", authoredCm: 10 },
  },
];

export const PRODUCTS: Product[] = [...GEN2_PARTS, ...GEN1_PARTS];

export const GENERATIONS: { gen: 1 | 2; items: Product[] }[] = [
  { gen: 2, items: GEN2_PARTS },
  { gen: 1, items: GEN1_PARTS },
];

export function findProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

// ── Internal quote estimation (NOT shown in the store) ──────────────────────
// Rough indicative rates used by the /quote page only. Tune freely.
export const QUOTE_RATES = {
  /** SAR per cubic metre of finished volume, per generation. */
  perCubicMeter: { 1: 2200, 2: 2600 } as Record<1 | 2, number>,
  /** Multiplier applied when a custom colour is requested. */
  customColor: 1.12,
  /** Bulk discount tiers keyed by minimum volume in m³. */
  bulkTiers: [
    { minM3: 50, factor: 0.82 },
    { minM3: 20, factor: 0.89 },
    { minM3: 5, factor: 0.95 },
  ],
};
