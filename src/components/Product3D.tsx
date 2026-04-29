import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Center, Bounds } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import { STLLoader } from "three/examples/jsm/loaders/STLLoader.js";
import * as THREE from "three";
import { Product } from "@/data/products";

// Two separate OBJ files: FinalCube for cubes, FinalConnecter for the connecter.
// Each file is loaded once, centered on origin, and re-used for every card.
function useCenteredGeom(url: string) {
  const obj = useLoader(OBJLoader, url);
  return useMemo(() => {
    // Collect ALL meshes from the OBJ (Blender often exports multiple sub-meshes
    // per object). Previously only the first was kept, which made the cube look
    // broken / hollow on the web while it appeared correct in Blender.
    const meshes: THREE.Mesh[] = [];
    obj.updateMatrixWorld(true);
    obj.traverse((child) => {
      const m = child as THREE.Mesh;
      if (m.isMesh && m.geometry) meshes.push(m);
    });
    if (meshes.length === 0) return null;

    // Bake each mesh's world transform into its geometry, then concatenate
    // into a single non-indexed position buffer. We deliberately drop the
    // OBJ's normals (the file ships with far fewer normals than vertices,
    // which produces the warped shading the user is seeing) and recompute
    // clean per-vertex normals below.
    const positions: number[] = [];
    for (const m of meshes) {
      const g = (m.geometry as THREE.BufferGeometry).clone();
      g.applyMatrix4(m.matrixWorld);
      const nonIndexed = g.index ? g.toNonIndexed() : g;
      const pos = nonIndexed.getAttribute("position") as THREE.BufferAttribute;
      for (let i = 0; i < pos.count; i++) {
        positions.push(pos.getX(i), pos.getY(i), pos.getZ(i));
      }
    }

    const geom = new THREE.BufferGeometry();
    geom.setAttribute("position", new THREE.Float32BufferAttribute(positions, 3));
    // Recompute normals so faces shade like they do in Blender's viewport.
    geom.computeVertexNormals();

    // Center on origin.
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const c = new THREE.Vector3();
    bb.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);
    return geom;
  }, [obj]);
}

// STL gives us a clean, single-mesh BufferGeometry with proper face normals —
// no missing sub-meshes, no broken normal indices. Used for the cube which
// the user authored in Blender and exported as STL.
function useCenteredStl(url: string) {
  const geomRaw = useLoader(STLLoader, url);
  return useMemo(() => {
    const geom = geomRaw.clone();
    geom.computeVertexNormals();
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const c = new THREE.Vector3();
    bb.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);
    return geom;
  }, [geomRaw]);
}

function Piece({ product, shinyWood = false, colorOverride }: { product: Product; shinyWood?: boolean; colorOverride?: string }) {
  const kind = product.kind === "custom-cube" ? "cube" : product.kind === "custom-sheet" ? "connecter" : product.kind === "sheet" ? "connecter" : product.kind;
  const cubeGeom = useCenteredGeom("/models/FinalCube.obj");
  const connecterGeom = useCenteredGeom("/models/FinalConnecter.obj");
  const target = kind === "cube" ? cubeGeom : connecterGeom;
  if (!target) return null;
  // Cube file is authored at 10cm — scale up for 20/30. Connecter stays at authored size.
  const scale = kind === "cube" ? product.size / 10 : 1;
  // Shiny mode: glassy polished finish (clearcoat + reflections) on the
  // product's own color. The Home hero passes colorOverride to force walnut.
  const color = colorOverride ?? product.color;
  const metalness = shinyWood ? 0.55 : 0.18;
  const roughness = shinyWood ? 0.14 : 0.42;
  const clearcoat = shinyWood ? 1 : 0;
  return (
    <Center>
      <mesh geometry={target} scale={scale} castShadow receiveShadow>
        {shinyWood ? (
          // @ts-ignore - drei/three types
          <meshPhysicalMaterial
            color={color}
            metalness={metalness}
            roughness={roughness}
            clearcoat={clearcoat}
            clearcoatRoughness={0.08}
            reflectivity={0.6}
            side={THREE.DoubleSide}
          />
        ) : (
          <meshStandardMaterial color={color} metalness={metalness} roughness={roughness} side={THREE.DoubleSide} />
        )}
      </mesh>
    </Center>
  );
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
          <Piece product={product} shinyWood={shinyWood} colorOverride={colorOverride} />
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
