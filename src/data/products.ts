// Product catalog. Cube sizes are real (10/20/30 cm). Sheet is your Cube.001 (20cm × 2cm × 1.25cm).
export type ProductKind = "cube" | "sheet";

export interface Product {
  id: string;
  kind: ProductKind;
  size: number; // cm (cube edge or sheet length)
  materials: string[];
  price: number; // SAR
  // dimensions in cm
  dims: { x: number; y: number; z: number };
}

export const PRODUCTS: Product[] = [
  { id: "cube-10", kind: "cube", size: 10, materials: ["PLA", "WOOD"], price: 35, dims: { x: 10, y: 10, z: 10 } },
  { id: "cube-20", kind: "cube", size: 20, materials: ["PLA", "WOOD"], price: 95, dims: { x: 20, y: 20, z: 20 } },
  { id: "cube-30", kind: "cube", size: 30, materials: ["PLA", "WOOD"], price: 180, dims: { x: 30, y: 30, z: 30 } },
  { id: "sheet-20", kind: "sheet", size: 20, materials: ["PLA"], price: 12, dims: { x: 2, y: 20, z: 1.25 } },
];

export function findProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

export function suggestProducts(cubeSize: number) {
  const cube = PRODUCTS.find((p) => p.kind === "cube" && p.size === cubeSize) || PRODUCTS[0];
  const sheet = PRODUCTS.find((p) => p.kind === "sheet")!;
  return [cube, sheet];
}
