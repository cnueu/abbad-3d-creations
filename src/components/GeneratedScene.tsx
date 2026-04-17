import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Bounds, Edges } from "@react-three/drei";

// Pixel-art / voxel style preview: simple colored boxes with crisp edges.
// We intentionally do NOT use the dovetail OBJ here — that geometry is reserved
// for the math/report layer. The preview is a clean voxel rendering.
export interface PlacedCube {
  x: number; y: number; z: number; // meters (center)
  size: number; // cm — 10/20/30
  color: string;
}
export interface Slide {
  ax: 0 | 1 | 2;
  mid: { x: number; y: number; z: number };
}
interface SceneProps {
  cubes: PlacedCube[];
  slides?: Slide[];
}

function VoxelCube({ c }: { c: PlacedCube }) {
  const s = c.size / 100; // cm → m
  return (
    <mesh position={[c.x, c.y, c.z]} castShadow receiveShadow>
      <boxGeometry args={[s, s, s]} />
      <meshStandardMaterial color={c.color} metalness={0.05} roughness={0.65} flatShading />
      <Edges threshold={15} color="#0b0d10" />
    </mesh>
  );
}

export function GeneratedScene({ cubes }: SceneProps) {
  const items = useMemo(() => cubes, [cubes]);
  return (
    <Canvas shadows camera={{ position: [3, 2.4, 3.2], fov: 36 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.5}>
          <group>
            {items.map((c, i) => <VoxelCube key={i} c={c} />)}
          </group>
        </Bounds>
        <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={6} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan />
    </Canvas>
  );
}

// Simple .obj exporter (axis-aligned boxes).
export function buildObj(cubes: PlacedCube[], slides: Slide[] = []): string {
  const lines: string[] = ["# ABBAD AI Studio — generated assembly", "# units: meters"];
  let v = 0;
  const faces = [[1,2,3,4],[5,8,7,6],[1,5,6,2],[2,6,7,3],[3,7,8,4],[4,8,5,1]];

  function box(name: string, cx: number, cy: number, cz: number, dx: number, dy: number, dz: number) {
    const verts = [
      [cx-dx,cy-dy,cz-dz],[cx+dx,cy-dy,cz-dz],[cx+dx,cy+dy,cz-dz],[cx-dx,cy+dy,cz-dz],
      [cx-dx,cy-dy,cz+dz],[cx+dx,cy-dy,cz+dz],[cx+dx,cy+dy,cz+dz],[cx-dx,cy+dy,cz+dz],
    ];
    lines.push(`o ${name}`);
    verts.forEach((p) => lines.push(`v ${p[0].toFixed(4)} ${p[1].toFixed(4)} ${p[2].toFixed(4)}`));
    faces.forEach((f) => lines.push(`f ${f.map((n) => n + v).join(" ")}`));
    v += 8;
  }

  cubes.forEach((c, i) => {
    const h = c.size / 100 / 2;
    box(`Cube_${c.size}cm_${i + 1}`, c.x, c.y, c.z, h, h, h);
  });
  slides.forEach((s, i) => {
    const sw = 0.023 / 2, sl = 0.20 / 2;
    const dx = s.ax === 0 ? sl : sw;
    const dy = s.ax === 1 ? sl : sw;
    const dz = s.ax === 2 ? sl : sw;
    box(`Slide_${i + 1}`, s.mid.x, s.mid.y, s.mid.z, dx, dy, dz);
  });
  return lines.join("\n");
}
