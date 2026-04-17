import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows } from "@react-three/drei";
import * as THREE from "three";
import { Product } from "@/data/products";

function CubeMesh({ size }: { size: number }) {
  const s = size / 10; // scale: 10cm cube = 1 unit
  return (
    <group>
      <mesh castShadow receiveShadow>
        <boxGeometry args={[s, s, s]} />
        <meshStandardMaterial color="#6db8ac" metalness={0.2} roughness={0.35} />
      </mesh>
      {/* Edge highlight */}
      <lineSegments>
        <edgesGeometry args={[new THREE.BoxGeometry(s, s, s)]} />
        <lineBasicMaterial color="#a8d5cc" />
      </lineSegments>
      {/* Channel slots — visual hint of where sheets fit (4 per face, simplified to 1) */}
      {[
        [s / 2 + 0.001, 0, 0],
        [-s / 2 - 0.001, 0, 0],
        [0, s / 2 + 0.001, 0],
        [0, -s / 2 - 0.001, 0],
        [0, 0, s / 2 + 0.001],
        [0, 0, -s / 2 - 0.001],
      ].map((p, i) => (
        <mesh key={i} position={p as [number, number, number]}>
          <boxGeometry args={[s * 0.6, s * 0.05, s * 0.05]} />
          <meshStandardMaterial color="#1e5e52" />
        </mesh>
      ))}
    </group>
  );
}

function SheetMesh() {
  // 20cm × 2cm × 1.25cm in our 1unit=10cm scale: 2 × 0.2 × 0.125
  return (
    <group>
      <mesh castShadow>
        <boxGeometry args={[2, 0.2, 0.125]} />
        <meshStandardMaterial color="#a8d5cc" metalness={0.3} roughness={0.4} />
      </mesh>
      {/* Triangular interlock hint */}
      <mesh position={[0, 0, 0.07]}>
        <boxGeometry args={[2, 0.14, 0.02]} />
        <meshStandardMaterial color="#3d9e8f" />
      </mesh>
    </group>
  );
}

export function Product3D({ product, autoRotate = true }: { product: Product; autoRotate?: boolean }) {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 2.5, 4], fov: 35 }}
      style={{ width: "100%", height: "100%" }}
      gl={{ antialias: true, alpha: true }}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        {product.kind === "cube" ? <CubeMesh size={product.size} /> : <SheetMesh />}
        <ContactShadows position={[0, -1.2, 0]} opacity={0.5} scale={6} blur={2} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls
        enablePan={false}
        enableZoom={false}
        autoRotate={autoRotate}
        autoRotateSpeed={1.5}
        minPolarAngle={Math.PI / 3}
        maxPolarAngle={Math.PI / 1.8}
      />
    </Canvas>
  );
}
