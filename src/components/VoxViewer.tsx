import { Suspense, useEffect, useState } from "react";
import { Canvas } from "@react-three/fiber";
import { OrbitControls, Stage, Bounds } from "@react-three/drei";
import * as THREE from "three";
// @ts-ignore - three examples have no types here
import { VOXLoader, VOXMesh } from "three/examples/jsm/loaders/VOXLoader.js";

/**
 * Renders a MagicaVoxel .vox file (binary) given a blob/object URL.
 * Uses three.js' built-in VOXLoader + VOXMesh (instanced cubes).
 */
export function VoxViewer({ url }: { url: string }) {
  const [group, setGroup] = useState<THREE.Group | null>(null);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let cancelled = false;
    setGroup(null);
    setError(null);

    const loader = new VOXLoader();
    loader.load(
      url,
      (chunks: any[]) => {
        if (cancelled) return;
        const g = new THREE.Group();
        for (const chunk of chunks) {
          const mesh = new VOXMesh(chunk);
          mesh.scale.setScalar(0.01);
          g.add(mesh);
        }
        setGroup(g);
      },
      undefined,
      (err: any) => {
        console.error("VOX load error", err);
        if (!cancelled) setError(err?.message || "Failed to load .vox");
      }
    );

    return () => {
      cancelled = true;
    };
  }, [url]);

  if (error) {
    return (
      <div className="w-full h-full flex items-center justify-center text-sm text-red-400 p-6 text-center">
        {error}
      </div>
    );
  }

  return (
    <Canvas
      camera={{ position: [3, 3, 3], fov: 45 }}
      dpr={[1, 2]}
      gl={{ antialias: true, preserveDrawingBuffer: false }}
    >
      <color attach="background" args={["#0a0a0f"]} />
      <Suspense fallback={null}>
        {group && (
          <Bounds fit clip observe margin={1.2}>
            <Stage environment="city" intensity={0.5} adjustCamera={false} shadows={false}>
              <primitive object={group} />
            </Stage>
          </Bounds>
        )}
      </Suspense>
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

export default VoxViewer;
