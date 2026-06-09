import { Suspense } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Bounds, Center } from "@react-three/drei";
import { GLTFLoader } from "three/examples/jsm/loaders/GLTFLoader.js";

// Renders a .gltf/.glb returned from an external backend.
// The URL is typically an object URL created from a fetched Blob.
function Model({ url }: { url: string }) {
  const gltf = useLoader(GLTFLoader, url);
  return (
    <Center>
      <primitive object={gltf.scene} />
    </Center>
  );
}

export function ExternalGltfViewer({ url }: { url: string }) {
  return (
    <Canvas
      shadows
      camera={{ position: [3, 2.4, 3.2], fov: 36 }}
      gl={{ antialias: true, alpha: true }}
      dpr={[1, 1.5]}
    >
      <ambientLight intensity={0.6} />
      <directionalLight position={[8, 12, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        <Bounds fit clip observe margin={1.4}>
          <Model url={url} />
        </Bounds>
        <ContactShadows position={[0, -0.05, 0]} opacity={0.4} scale={8} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <OrbitControls enablePan autoRotate autoRotateSpeed={0.6} />
    </Canvas>
  );
}
