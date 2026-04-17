import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Center } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Product } from "@/data/products";

// The .obj file ships both pieces. We split it on first load and re-color them.
function useObjPieces(color: string) {
  const obj = useLoader(OBJLoader, "/models/Cube_and_sheet.obj");
  return useMemo(() => {
    const meshes: { kind: "cube" | "sheet"; geom: THREE.BufferGeometry }[] = [];
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const g = (m.geometry as THREE.BufferGeometry).clone();
        // Heuristic: the slide is much longer in one axis than the cube.
        g.computeBoundingBox();
        const bb = g.boundingBox!;
        const sz = new THREE.Vector3();
        bb.getSize(sz);
        const maxDim = Math.max(sz.x, sz.y, sz.z);
        const minDim = Math.min(sz.x, sz.y, sz.z);
        const isSheet = maxDim / Math.max(minDim, 0.001) > 3;
        // center on origin
        const center = new THREE.Vector3();
        bb.getCenter(center);
        g.translate(-center.x, -center.y, -center.z);
        meshes.push({ kind: isSheet ? "sheet" : "cube", geom: g });
      }
    });
    return meshes;
  }, [obj, color]);
}

function CubeMesh({ color, scale }: { color: string; scale: number }) {
  const pieces = useObjPieces(color);
  const cube = pieces.find((p) => p.kind === "cube");
  if (!cube) return null;
  return (
    <Center>
      <mesh geometry={cube.geom} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.18} roughness={0.42} />
      </mesh>
    </Center>
  );
}

function SheetMesh({ color }: { color: string }) {
  const pieces = useObjPieces(color);
  const sheet = pieces.find((p) => p.kind === "sheet");
  if (!sheet) return null;
  return (
    <Center>
      <mesh geometry={sheet.geom} castShadow receiveShadow>
        <meshStandardMaterial color={color} metalness={0.3} roughness={0.32} />
      </mesh>
    </Center>
  );
}

export function Product3D({ product, autoRotate = true }: { product: Product; autoRotate?: boolean }) {
  // Larger cubes get a slightly farther camera
  const camDist = product.kind === "cube" ? 3 + product.size * 0.18 : 6;
  const scale = product.kind === "cube" ? product.size / 10 : 1; // .obj cube is 10cm
  return (
    <Canvas
      shadows
      camera={{ position: [camDist, camDist * 0.85, camDist * 1.1], fov: 32 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 16, 8]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        {product.kind === "cube" ? (
          <CubeMesh color={product.color} scale={scale} />
        ) : (
          <SheetMesh color={product.color} />
        )}
        <ContactShadows position={[0, -2.2, 0]} opacity={0.45} scale={20} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.4}
        minPolarAngle={Math.PI / 3.5}
        maxPolarAngle={Math.PI / 1.7}
      />
    </Canvas>
  );
}
