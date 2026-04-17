// Product catalog. Geometry verified against the user's .blend files:
//  - Cube  : 10 × 10 × 10 cm  (with dovetail slots — file: holedCube.blend)
//  - Sheet : 2.3 × 2.3 × 20 cm (Dovetail_slide.blend, named "Cube.001")
// Each pair of adjacent cubes is joined by ONE dovetail slide.
export type ProductKind = "cube" | "sheet";

export interface Product {
  id: string;
  kind: ProductKind;
  size: number; // cm — cube edge or sheet length
  materials: string[];
  price: number; // SAR
  dims: { x: number; y: number; z: number }; // cm
}

export const PRODUCTS: Product[] = [
  { id: "cube-10", kind: "cube", size: 10, materials: ["PLA", "WOOD"], price: 35, dims: { x: 10, y: 10, z: 10 } },
  { id: "sheet-20", kind: "sheet", size: 20, materials: ["PLA"], price: 12, dims: { x: 2.3, y: 2.3, z: 20 } },
];

export function findProduct(id: string) {
  return PRODUCTS.find((p) => p.id === id);
}

export function suggestProducts(_cubeSize: number) {
  return PRODUCTS;
}
