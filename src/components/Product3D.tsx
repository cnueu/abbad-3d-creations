import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Center, Bounds } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";
import { Product } from "@/data/products";

// ─────────────────────────────────────────────────────────────────────────────
// 3D PART VIEWER
// The model file used for each part is declared in src/data/products.ts
// (`model.url` + `model.format`). To swap a part's mesh, change it there
// nothing in this file needs editing.
// ─────────────────────────────────────────────────────────────────────────────

/** Merge every sub-mesh of an OBJ into one clean, centered geometry. */
function useObjGeom(url: string) {
  const obj = useLoader(OBJLoader, url);
  return useMemo(() => {
    const meshes: THREE.Mesh[] = [];
    obj.updateMatrixWorld(true);
    obj.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh && m.geometry) meshes.push(m);
    });
    if (meshes.length === 0) return null;

    const positions: number[] = [];
    for (const m of meshes) {
      const g = (m.geometry as THREE.BufferGeometry).clone();
      g.applyMatrix4(m.matrixWorld);
      const nonIndexed = g.index ? g.toNonIndexed() : g;
      const pos = nonIndexed.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    const c = new THREE.Vector3();
    geom.boundingBox!.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);
    return geom;
  }, [obj]);
}

/** STL: single clean mesh. Blender exports Z-up, three.js is Y-up. */
function useStlGeom(url: string) {
  const raw = useLoader(STLLoader, url);
  return useMemo(() => {
    const geom = raw.clone();
    geom.rotateX(-Math.PI / 2);
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    const c = new THREE.Vector3();
    geom.boundingBox!.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);
    return geom;
  }, [raw]);
}

function Mesh({ geom, color, shiny }: { geom: THREE.BufferGeometry | null; color: string; shiny: boolean }) {
  if (!geom) return null;
  return (
    <Center>
      <mesh geometry={geom} castShadow receiveShadow>
        {shiny ? (
          // @ts-ignore drei/three jsx types
          <meshPhysicalMaterial
            color={color}
            metalness={0.5}
            roughness={0.16}
            clearcoat={1}
            clearcoatRoughness={0.08}
            reflectivity={0.6}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial color={color} metalness={0.18} roughness={0.42} side={THREE.DoubleSide} />
        )}
      </mesh>
    </Center>
  );
}

function StlPiece({ url, color, shiny }: { url: string; color: string; shiny: boolean }) {
  return <Mesh geom={useStlGeom(url)} color={color} shiny={shiny} />;
}
function ObjPiece({ url, color, shiny }: { url: string; color: string; shiny: boolean }) {
  return <Mesh geom={useObjGeom(url)} color={color} shiny={shiny} />;
}

export function Product3D({
  product,
  autoRotate = true,
  interactive = true,
  shinyWood = false,
  colorOverride,
}: {
  product: Product;
  autoRotate?: boolean;
  interactive?: boolean;
  shinyWood?: boolean;
  colorOverride?: string;
}) {
  const color = colorOverride ?? product.color;
  const { url, format } = product.model;

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
          {format === "stl" ? (
            <StlPiece key={url} url={url} color={color} shiny={shinyWood} />
          ) : (
            <ObjPiece key={url} url={url} color={color} shiny={shinyWood} />
          )}
        </Bounds>
        <ContactShadows position={[0, -1.6, 0]} opacity={0.35} scale={14} blur={2.4} />
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
