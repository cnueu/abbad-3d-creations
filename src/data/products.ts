// Product catalog. Geometry verified against the user's .blend files:
//  - Cube  : 10/20/30 cm edge variants (with dovetail slots — file: holedCube.blend)
//  - Sheet : 2.3 × 2.3 × 20 cm (Dovetail_slide.blend, named "Cube.001")
// Real-life rule: each cube engages dovetail slots on all 6 faces → on average
// each cube needs ~2 sheets in a real assembly (multiplier = 2 × cubes).
export type ProductKind = "cube" | "sheet";

export interface Product {
  id: string;
  kind: ProductKind;
  size: number; // cm — cube edge or sheet length
  materials: string[];
  price: number; // SAR
  dims: { x: number; y: number; z: number }; // cm
  color: string; // hex — visualizer + card accent
  colorName: { en: string; ar: string };
}

export const PRODUCTS: Product[] = [
  // Cubes — three sizes, three signature colors
  { id: "cube-10", kind: "cube", size: 10, materials: ["PLA", "WOOD"], price: 35, dims: { x: 10, y: 10, z: 10 },
    color: "#6db8ac", colorName: { en: "Sage Mint", ar: "نعناع" } },
  { id: "cube-20", kind: "cube", size: 20, materials: ["PLA", "WOOD"], price: 95, dims: { x: 20, y: 20, z: 20 },
    color: "#e08a5b", colorName: { en: "Terracotta", ar: "طيني" } },
  { id: "cube-30", kind: "cube", size: 30, materials: ["PLA", "WOOD"], price: 180, dims: { x: 30, y: 30, z: 30 },
    color: "#5b7fc7", colorName: { en: "Indigo", ar: "نيلي" } },
  // Connector sheet
  { id: "sheet-20", kind: "sheet", size: 20, materials: ["PLA"], price: 12, dims: { x: 2.3, y: 2.3, z: 20 },
    color: "#a8d5cc", colorName: { en: "Pale Mint", ar: "نعناع فاتح" } },
];

export function findProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

// Suggest the cube sizes used by the AI plan (returns one card per size in the plan + the sheet).
export function suggestProducts(usedSizes: number[] = [10]) {
  const sizes = new Set(usedSizes);
  return PRODUCTS.filter((p) => p.kind === "sheet" || sizes.has(p.size));
}
