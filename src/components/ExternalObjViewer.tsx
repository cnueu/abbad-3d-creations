import { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Bounds, Center } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";

// Renders a .obj (voxel mesh) returned from the external backend.
// The URL is typically an object URL created from a fetched Blob.
function Model({ url }: { url: string }) {
  const obj = useLoader(OBJLoader, url);
  // Ensure all meshes have a visible, lit material (OBJ from server may have none).
  obj.traverse((child: any) => {
    if (child.isMesh) {
      if (!child.material || (Array.isArray(child.material) && child.material.length === 0)) {
        child.material = new THREE.MeshStandardMaterial({
          color: "#c9a17a",
          metalness: 0.05,
          roughness: 0.7,
          flatShading: true,
        });
      }
      child.castShadow = true;
      child.receiveShadow = true;
    }
  });
  return (
    <Center>
      <primitive object={obj} />
    </Center>
  );
}

export function ExternalObjViewer({ url }: { url: string }) {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 2.4, 3.2], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.8} />
      <hemisphereLight args={["#ffffff", "#444466", 0.6]} />
      <directionalLight position={[8, 12, 6]} intensity={1.2} castShadow shadow-mapSize={[1024, 1024]} />
      <directionalLight position={[-6, 4, -4]} intensity={0.5} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.4}>
          <Model url={url} />
        </Bounds>
        <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={10} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enablePan autoRotate autoRotateSpeed={0.6} />
    </Canvas>
  );
}
