import { Suspense } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";

interface SceneProps {
  positions: { x: number; y: number; z: number }[]; // meters
  cubeSize: number; // cm
}

export function GeneratedScene({ positions, cubeSize }: SceneProps) {
  // 1 three.js unit = 1 meter
  const s = cubeSize / 100;
  return (
    <Canvas shadows camera={{ position: [4, 3, 5], fov: 40 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow />
      <Suspense fallback={null}>
        {positions.map((p, i) => (
          <mesh key={i} position={[p.x, p.y, p.z]} castShadow receiveShadow>
            <boxGeometry args={[s * 0.98, s * 0.98, s * 0.98]} />
            <meshStandardMaterial color="#6db8ac" metalness={0.2} roughness={0.4} />
          </mesh>
        ))}
        <ContactShadows position={[0, -2, 0]} opacity={0.5} scale={20} blur={3} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan />
    </Canvas>
  );
}

// Build a downloadable .obj file from positions
export function buildObj(positions: { x: number; y: number; z: number }[], cubeSizeCm: number): string {
  const s = cubeSizeCm / 100 / 2; // half-edge
  const lines: string[] = ["# ABBAD AI Studio generated assembly", "# units: meters"];
  let vCount = 0;
  positions.forEach((p, idx) => {
    const verts = [
      [p.x - s, p.y - s, p.z - s],
      [p.x + s, p.y - s, p.z - s],
      [p.x + s, p.y + s, p.z - s],
      [p.x - s, p.y + s, p.z - s],
      [p.x - s, p.y - s, p.z + s],
      [p.x + s, p.y - s, p.z + s],
      [p.x + s, p.y + s, p.z + s],
      [p.x - s, p.y + s, p.z + s],
    ];
    lines.push(`o Cube_${idx + 1}`);
    verts.forEach((v) => lines.push(`v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`));
    const o = vCount;
    // 6 faces (quads → 2 tris each)
    const faces = [
      [1, 2, 3, 4], [5, 8, 7, 6], [1, 5, 6, 2],
      [2, 6, 7, 3], [3, 7, 8, 4], [4, 8, 5, 1],
    ];
    faces.forEach((f) => lines.push(`f ${f.map((n) => n + o).join(" ")}`));
    vCount += 8;
  });
  return lines.join("\n");
}
