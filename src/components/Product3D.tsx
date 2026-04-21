import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Center, Bounds } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Product } from "@/data/products";

// Shared OBJ — split into cube + sheet pieces.
function useObjPieces() {
  const obj = useLoader(OBJLoader, "/models/Cube_and_sheet.obj");
  return useMemo(() => {
    const meshes: { kind: "cube" | "sheet"; geom: THREE.BufferGeometry }[] = [];
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const g = (m.geometry as THREE.BufferGeometry).clone();
        g.computeBoundingBox();
        const bb = g.boundingBox!;
        const sz = new THREE.Vector3();
        bb.getSize(sz);
        const isSheet = Math.max(sz.x, sz.y, sz.z) / Math.max(Math.min(sz.x, sz.y, sz.z), 0.001) > 3;
        const c = new THREE.Vector3();
        bb.getCenter(c);
        g.translate(-c.x, -c.y, -c.z);
        meshes.push({ kind: isSheet ? "sheet" : "cube", geom: g });
      }
    });
    return meshes;
  }, [obj]);
}

function Piece({ product, shinyWood = false }: { product: Product; shinyWood?: boolean }) {
  const pieces = useObjPieces();
  const kind = product.kind === "custom-cube" ? "cube" : product.kind === "custom-sheet" ? "sheet" : product.kind;
  const target = pieces.find((p) => p.kind === kind);
  if (!target) return null;
  const scale = kind === "cube" ? product.size / 10 : 1;
  // Shiny wood = warm walnut with a polished finish (used for the home hero).
  const color = shinyWood ? "#a47148" : product.color;
  const metalness = shinyWood ? 0.35 : 0.18;
  const roughness = shinyWood ? 0.22 : 0.42;
  return (
    <Center>
      <mesh geometry={target.geom} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} />
      </mesh>
    </Center>
  );
}

export function Product3D({
  product,
  autoRotate = true,
  interactive = true,
  shinyWood = false,
}: {
  product: Product;
  autoRotate?: boolean;
  interactive?: boolean;
  shinyWood?: boolean;
}) {
  // frameloop="demand" pauses the render loop when not hovering — fixes Store lag.
  return (
    <Canvas
      shadows
      camera={{ position: [4, 3.4, 4.4], fov: 28 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true, powerPreference: "low-power" }}
      frameloop={interactive ? "always" : "demand"}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[10, 16, 8]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.7}>
          <Piece product={product} shinyWood={shinyWood} />
        </Bounds>
        <ContactShadows position={[0, -1.6, 0]} opacity={0.4} scale={14} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        enableRotate={interactive}
        autoRotate={autoRotate && interactive}
        autoRotateSpeed={1.2}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}
