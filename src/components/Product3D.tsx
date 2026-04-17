import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Product } from "@/data/products";

/**
 * HoledCube — visual approximation of holedCube.blend.
 * 10cm cube with 4 vertical dovetail-slot grooves on each of the 4 vertical faces.
 * Scale: 1 three.js unit = 1 cm.
 */
function HoledCube() {
  const s = 10;
  // Slot dimensions tuned to match the dovetail slide cross-section (2.3 × 2.3 cm)
  const slotW = 2.3, slotD = 1.15, slotH = s; // half-depth slot
  const slots: { pos: [number, number, number]; rot: [number, number, number] }[] = [];
  // Each face gets two slots near the edges; placed on +X, -X, +Y, -Y faces
  const offsets = [-2.5, 2.5];
  for (const o of offsets) {
    slots.push({ pos: [s / 2 - slotD / 2, o, 0], rot: [0, 0, 0] });
    slots.push({ pos: [-(s / 2 - slotD / 2), o, 0], rot: [0, 0, 0] });
    slots.push({ pos: [o, s / 2 - slotD / 2, 0], rot: [0, 0, Math.PI / 2] });
    slots.push({ pos: [o, -(s / 2 - slotD / 2), 0], rot: [0, 0, Math.PI / 2] });
  }

  const cubeGeo = useMemo(() => new THREE.BoxGeometry(s, s, s), []);

  return (
    <group>
      <mesh castShadow receiveShadow geometry={cubeGeo}>
        <meshStandardMaterial color="#6db8ac" metalness={0.15} roughness={0.45} />
      </mesh>
      <lineSegments>
        <edgesGeometry args={[cubeGeo]} />
        <lineBasicMaterial color="#a8d5cc" transparent opacity={0.55} />
      </lineSegments>
      {slots.map((sl, i) => (
        <mesh key={i} position={sl.pos} rotation={sl.rot}>
          <boxGeometry args={[slotD, slotW, slotH]} />
          <meshStandardMaterial color="#1c3833" roughness={0.9} />
        </mesh>
      ))}
    </group>
  );
}

/**
 * DovetailSlide — Dovetail_slide.blend ("Cube.001"): 2.3 × 2.3 × 20 cm.
 * 18 verts / 16 faces — a tapered prism. Approximated as a stacked profile.
 */
function DovetailSlide() {
  // Build the dovetail cross-section as an extruded shape.
  const shape = useMemo(() => {
    const sh = new THREE.Shape();
    // Cross-section: trapezoid with narrow neck (dovetail T)
    //  ┌───┐
    //  │   │   wide head
    //  └─┐ ┌─┘
    //    │ │   neck
    //    └─┘
    sh.moveTo(-1.15, 1.15);
    sh.lineTo(1.15, 1.15);
    sh.lineTo(1.15, 0.2);
    sh.lineTo(0.45, -0.2);
    sh.lineTo(0.45, -1.15);
    sh.lineTo(-0.45, -1.15);
    sh.lineTo(-0.45, -0.2);
    sh.lineTo(-1.15, 0.2);
    sh.lineTo(-1.15, 1.15);
    return sh;
  }, []);

  const geo = useMemo(() => {
    const g = new THREE.ExtrudeGeometry(shape, { depth: 20, bevelEnabled: false, curveSegments: 1 });
    g.translate(0, 0, -10);
    g.rotateX(Math.PI / 2);
    return g;
  }, [shape]);

  return (
    <mesh geometry={geo} castShadow receiveShadow>
      <meshStandardMaterial color="#a8d5cc" metalness={0.3} roughness={0.35} />
    </mesh>
  );
}

export function Product3D({ product, autoRotate = true }: { product: Product; autoRotate?: boolean }) {
  const camPos: [number, number, number] = product.kind === "cube" ? [16, 13, 18] : [22, 16, 22];
  return (
    <Canvas
      shadows
      camera={{ position: camPos, fov: 32 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[10, 16, 8]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        {product.kind === "cube" ? <HoledCube /> : <DovetailSlide />}
        <ContactShadows position={[0, -7, 0]} opacity={0.45} scale={40} blur={2.5} />
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
