import { Suspense, useMemo } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, ContactShadows, Environment } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

export interface PlacedCube {
  x: number; y: number; z: number; // meters (center)
  size: number; // cm — 10/20/30
  color: string; // hex
}
export interface Slide {
  ax: 0 | 1 | 2;
  mid: { x: number; y: number; z: number };
}
interface SceneProps {
  cubes: PlacedCube[];
  slides?: Slide[];
}

function useObjPieces() {
  const obj = useLoader(OBJLoader, "/models/Cube_and_sheet.obj");
  return useMemo(() => {
    const out: { kind: "cube" | "sheet"; geom: THREE.BufferGeometry; sizeCm: number } = {
      kind: "cube", geom: new THREE.BoxGeometry(0.1, 0.1, 0.1), sizeCm: 10,
    };
    const pieces: { kind: "cube" | "sheet"; geom: THREE.BufferGeometry }[] = [];
    obj.traverse((child) => {
      if ((child as THREE.Mesh).isMesh) {
        const m = child as THREE.Mesh;
        const g = (m.geometry as THREE.BufferGeometry).clone();
        g.computeBoundingBox();
        const bb = g.boundingBox!;
        const sz = new THREE.Vector3();
        bb.getSize(sz);
        const maxDim = Math.max(sz.x, sz.y, sz.z);
        const minDim = Math.min(sz.x, sz.y, sz.z);
        const isSheet = maxDim / Math.max(minDim, 0.001) > 3;
        const c = new THREE.Vector3();
        bb.getCenter(c);
        g.translate(-c.x, -c.y, -c.z);
        // .obj is in cm — convert to meters: scale by 0.01
        g.scale(0.01, 0.01, 0.01);
        pieces.push({ kind: isSheet ? "sheet" : "cube", geom: g });
      }
    });
    void out;
    return pieces;
  }, [obj]);
}

export function GeneratedScene({ cubes, slides = [] }: SceneProps) {
  const span = Math.max(
    ...cubes.map((c) => Math.max(Math.abs(c.x), Math.abs(c.y), Math.abs(c.z)) + c.size / 200),
    0.3
  );
  const cam = span * 3.2;

  return (
    <Canvas shadows camera={{ position: [cam, cam * 0.85, cam * 1.1], fov: 38 }} gl={{ antialias: true, alpha: true }}>
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow />
      <Suspense fallback={null}>
        <Pieces cubes={cubes} slides={slides} />
        <ContactShadows position={[0, -span, 0]} opacity={0.45} scale={span * 8} blur={3} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls autoRotate autoRotateSpeed={0.6} enablePan />
    </Canvas>
  );
}

function Pieces({ cubes, slides }: { cubes: PlacedCube[]; slides: Slide[] }) {
  const pieces = useObjPieces();
  const cubeGeo = pieces.find((p) => p.kind === "cube")?.geom;
  const sheetGeo = pieces.find((p) => p.kind === "sheet")?.geom;

  return (
    <>
      {cubeGeo && cubes.map((c, i) => (
        <mesh
          key={`c${i}`}
          geometry={cubeGeo}
          position={[c.x, c.y, c.z]}
          scale={c.size / 10} // base cube is 10 cm
          castShadow
          receiveShadow
        >
          <meshStandardMaterial color={c.color} metalness={0.18} roughness={0.42} />
        </mesh>
      ))}
      {sheetGeo && slides.map((sl, i) => {
        const rot: [number, number, number] =
          sl.ax === 0 ? [0, Math.PI / 2, 0] : sl.ax === 1 ? [Math.PI / 2, 0, 0] : [0, 0, 0];
        return (
          <mesh key={`s${i}`} geometry={sheetGeo} position={[sl.mid.x, sl.mid.y, sl.mid.z]} rotation={rot} castShadow>
            <meshStandardMaterial color="#a8d5cc" metalness={0.3} roughness={0.32} />
          </mesh>
        );
      })}
    </>
  );
}

// Simple .obj exporter from cube list + slides (axis-aligned boxes)
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
