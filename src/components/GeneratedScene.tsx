import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import * as THREE from "three";

interface Slide {
  ax: 0 | 1 | 2;
  mid: { x: number; y: number; z: number };
}

interface SceneProps {
  positions: { x: number; y: number; z: number }[]; // meters
  slides?: Slide[];
  cubeSize: number; // cm
}

// Dovetail cross-section as a 2D shape (in cm), then scaled to meters at render.
function useDovetailGeometry(lengthM: number) {
  return useMemo(() => {
    const sh = new THREE.Shape();
    // 2.3cm × 2.3cm dovetail T-profile (in cm)
    sh.moveTo(-1.15, 1.15);
    sh.lineTo(1.15, 1.15);
    sh.lineTo(1.15, 0.2);
    sh.lineTo(0.45, -0.2);
    sh.lineTo(0.45, -1.15);
    sh.lineTo(-0.45, -1.15);
    sh.lineTo(-0.45, -0.2);
    sh.lineTo(-1.15, 0.2);
    sh.lineTo(-1.15, 1.15);
    const g = new THREE.ExtrudeGeometry(sh, {
      depth: lengthM * 100, // back to cm during build
      bevelEnabled: false,
      curveSegments: 1,
    });
    g.translate(0, 0, -(lengthM * 100) / 2);
    g.scale(0.01, 0.01, 0.01); // cm → m
    return g;
  }, [lengthM]);
}

export function GeneratedScene({ positions, slides = [], cubeSize }: SceneProps) {
  const s = cubeSize / 100; // meter
  const slideLen = 0.20; // 20 cm in meters
  const slideGeo = useDovetailGeometry(slideLen);

  return (
    <Canvas shadows camera={{ position: [s * 6, s * 5, s * 8], fov: 38 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow />
      <Suspense fallback={null}>
        {/* Cubes */}
        {positions.map((p, i) => (
          <mesh key={`c${i}`} position={[p.x, p.y, p.z]} castShadow receiveShadow>
            <boxGeometry args={[s * 0.985, s * 0.985, s * 0.985]} />
            <meshStandardMaterial color="#6db8ac" metalness={0.18} roughness={0.45} />
          </mesh>
        ))}

        {/* Dovetail slides — orient by axis */}
        {slides.map((sl, i) => {
          // Default extrude is along Z; rotate so length aligns to chosen axis.
          const rot: [number, number, number] =
            sl.ax === 0 ? [0, Math.PI / 2, 0] : sl.ax === 1 ? [Math.PI / 2, 0, 0] : [0, 0, 0];
          return (
            <mesh
              key={`s${i}`}
              position={[sl.mid.x, sl.mid.y, sl.mid.z]}
              rotation={rot}
              geometry={slideGeo}
              castShadow
            >
              <meshStandardMaterial color="#a8d5cc" metalness={0.3} roughness={0.35} />
            </mesh>
          );
        })}

        <ContactShadows position={[0, -s * 1.5, 0]} opacity={0.45} scale={20} blur={3} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan />
    </Canvas>
  );
}

// Build a downloadable .obj file from positions + slides
export function buildObj(
  positions: { x: number; y: number; z: number }[],
  cubeSizeCm: number,
  slides: Slide[] = []
): string {
  const s = cubeSizeCm / 100 / 2;
  const lines: string[] = ["# ABBAD AI Studio — generated assembly", "# units: meters"];
  let vCount = 0;

  const cubeFaces = [
    [1, 2, 3, 4],
    [5, 8, 7, 6],
    [1, 5, 6, 2],
    [2, 6, 7, 3],
    [3, 7, 8, 4],
    [4, 8, 5, 1],
  ];

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
    cubeFaces.forEach((f) => lines.push(`f ${f.map((n) => n + o).join(" ")}`));
    vCount += 8;
  });

  // Slides: simplified bounding box 2.3×2.3×20 cm → 0.023×0.023×0.20 m
  const sw = 0.023 / 2;
  const sl = 0.20 / 2;
  slides.forEach((sd, idx) => {
    const { x, y, z } = sd.mid;
    let dx = sw, dy = sw, dz = sw;
    if (sd.ax === 0) dx = sl;
    if (sd.ax === 1) dy = sl;
    if (sd.ax === 2) dz = sl;
    const verts = [
      [x - dx, y - dy, z - dz],
      [x + dx, y - dy, z - dz],
      [x + dx, y + dy, z - dz],
      [x - dx, y + dy, z - dz],
      [x - dx, y - dy, z + dz],
      [x + dx, y - dy, z + dz],
      [x + dx, y + dy, z + dz],
      [x - dx, y + dy, z + dz],
    ];
    lines.push(`o Slide_${idx + 1}`);
    verts.forEach((v) => lines.push(`v ${v[0].toFixed(4)} ${v[1].toFixed(4)} ${v[2].toFixed(4)}`));
    const o = vCount;
    cubeFaces.forEach((f) => lines.push(`f ${f.map((n) => n + o).join(" ")}`));
    vCount += 8;
  });

  return lines.join("\n");
}
