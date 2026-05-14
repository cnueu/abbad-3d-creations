import { Suspense, useMemo } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment, Bounds, Edges } from "@react-three/drei";

// Color theme post-processing — recolors voxel cubes without re-running the AI.
export type ColorTheme = "original" | "walnut" | "sand" | "mono";

const MONO_PALETTE = ["#a47148", "#7a5230", "#5a3a1f", "#c9a17a", "#8b6a4a", "#3d2514"];
const WALNUT_PALETTE = ["#5a3a1f", "#7a5230", "#3d2514", "#8b6a4a", "#a47148", "#2d1a0e"];
const SAND_PALETTE = ["#d9c8a8", "#c4ad82", "#a89272", "#8a7558", "#6e5a40", "#e8dcc4"];

function themedColor(original: string, theme: ColorTheme, idx: number): string {
  if (theme === "original") return original;
  const palette = theme === "walnut" ? WALNUT_PALETTE : theme === "sand" ? SAND_PALETTE : MONO_PALETTE;
  return palette[idx % palette.length];
}

// Pixel-art / voxel preview. Theme prop recolors cubes; "original" keeps AI colors.
export interface PlacedCube {
  x: number; y: number; z: number; // meters (center)
  size: number; // cm — 10/20/30/40/50
  color: string;
}
export interface Slide {
  ax: 0 | 1 | 2;
  mid: { x: number; y: number; z: number };
}
interface SceneProps {
  cubes: PlacedCube[];
  slides?: Slide[];
  theme?: ColorTheme;
  glassy?: boolean;
}

function VoxelCube({ c, color, glassy }: { c: PlacedCube; color: string; glassy: boolean }) {
  const s = c.size / 100; // cm → m
  return (
    <mesh position={[c.x, c.y, c.z]} castShadow receiveShadow>
      <boxGeometry args={[s, s, s]} />
      {glassy ? (
        // @ts-ignore drei/three jsx
        <meshPhysicalMaterial
          color={color}
          metalness={0.35}
          roughness={0.22}
          clearcoat={0.85}
          clearcoatRoughness={0.15}
          reflectivity={0.5}
        />
      ) : (
        <meshStandardMaterial color={color} metalness={0.05} roughness={0.65} flatShading />
      )}
      <Edges threshold={15} color="#0b0d10" />
    </mesh>
  );
}

export function GeneratedScene({ cubes, theme = "original", glassy = false }: SceneProps) {
  const items = useMemo(
    () => cubes.map((c, i) => ({ ...c, color: themedColor(c.color, theme, i) })),
    [cubes, theme]
  );
  return (
    <Canvas shadows camera={{ position: [3, 2.4, 3.2], fov: 36 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.5}>
          <group>
            {items.map((c, i) => <VoxelCube key={i} c={c} color={c.color} glassy={glassy} />)}
          </group>
        </Bounds>
        <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={6} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan />
    </Canvas>
  );
}

// Simple .obj exporter (axis-aligned boxes). The AI returns JSON cubes; we
// convert to .obj here so users get a standard mesh file for any 3D tool.
export function buildObj(cubes: PlacedCube[], slides: Slide[] = []): string {
  const lines: string[] = ["# Abaad AI Studio — generated assembly", "# units: meters"];
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
