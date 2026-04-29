import { Suspense, useMemo, useRef, useState } from "react";
import { Canvas, useLoader, useThree } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Grid, TransformControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Trash2, Move, RotateCw, Maximize2, Box, Link2, Plus } from "lucide-react";

type Kind = "cube" | "connecter";
interface SimItem {
  id: string;
  kind: Kind;
  position: [number, number, number];
  rotationY: number; // degrees, snapped 0/90/180/270
  scale: number;
  color: string;
}

function useCenteredGeom(url: string) {
  const obj = useLoader(OBJLoader, url);
  return useMemo(() => {
    let geom: THREE.BufferGeometry | null = null;
    obj.traverse((c) => {
      if ((c as THREE.Mesh).isMesh) {
        const g = ((c as THREE.Mesh).geometry as THREE.BufferGeometry).clone();
        geom = geom ?? g;
      }
    });
    if (!geom) return null;
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const c = new THREE.Vector3();
    bb.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);
    return geom;
  }, [obj]);
}

function SimMesh({
  item,
  selected,
  onSelect,
  onChange,
  mode,
}: {
  item: SimItem;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: Partial<SimItem>) => void;
  mode: "translate" | "rotate" | "scale";
}) {
  const cubeGeom = useCenteredGeom("/models/FinalCube.obj");
  const connecterGeom = useCenteredGeom("/models/FinalConnecter.obj");
  const target = item.kind === "cube" ? cubeGeom : connecterGeom;
  const meshRef = useRef<THREE.Mesh>(null!);
  if (!target) return null;
  // Cube authored at 10cm — show at scene scale ~1 unit per cube.
  const baseScale = item.kind === "cube" ? item.scale * 0.1 : item.scale * 1;

  const node = (
    <mesh
      ref={meshRef}
      geometry={target}
      position={item.position}
      rotation={[0, (item.rotationY * Math.PI) / 180, 0]}
      scale={baseScale}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshStandardMaterial color={item.color} metalness={0.2} roughness={0.4} />
    </mesh>
  );

  if (!selected) return node;

  return (
    <TransformControls
      mode={mode}
      object={meshRef.current ?? undefined}
      onObjectChange={() => {
        const m = meshRef.current;
        if (!m) return;
        if (mode === "translate") {
          onChange({ position: [m.position.x, m.position.y, m.position.z] });
        } else if (mode === "rotate") {
          // snap to nearest 90 deg
          const deg = (m.rotation.y * 180) / Math.PI;
          const snap = Math.round(deg / 90) * 90;
          m.rotation.y = (snap * Math.PI) / 180;
          onChange({ rotationY: ((snap % 360) + 360) % 360 });
        } else {
          const s = m.scale.x;
          const norm = item.kind === "cube" ? s / 0.1 : s;
          onChange({ scale: Math.max(0.2, Math.min(5, norm)) });
        }
      }}
      translationSnap={0.5}
      rotationSnap={Math.PI / 2}
    >
      {node}
    </TransformControls>
  );
}

function Scene({
  items,
  selectedId,
  setSelectedId,
  updateItem,
  mode,
}: {
  items: SimItem[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateItem: (id: string, patch: Partial<SimItem>) => void;
  mode: "translate" | "rotate" | "scale";
}) {
  return (
    <Canvas
      shadows
      camera={{ position: [6, 6, 7], fov: 38 }}
      onPointerMissed={() => setSelectedId(null)}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[8, 14, 6]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        {items.map((it) => (
          <SimMesh
            key={it.id}
            item={it}
            selected={selectedId === it.id}
            onSelect={() => setSelectedId(it.id)}
            onChange={(patch) => updateItem(it.id, patch)}
            mode={mode}
          />
        ))}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={30} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={0.5}
        cellThickness={0.6}
        cellColor="#888"
        sectionSize={2}
        sectionThickness={1.2}
        sectionColor="#bba24a"
        fadeDistance={30}
        infiniteGrid
      />
      <OrbitControls makeDefault enableDamping />
    </Canvas>
  );
}

export default function Simulation() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [items, setItems] = useState<SimItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [mode, setMode] = useState<"translate" | "rotate" | "scale">("translate");
  const dragKindRef = useRef<Kind | null>(null);
  const canvasWrapRef = useRef<HTMLDivElement>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  function addItem(kind: Kind, position: [number, number, number] = [0, 0.5, 0]) {
    const id = `${kind}-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        kind,
        position,
        rotationY: 0,
        scale: 1,
        color: kind === "cube" ? "#c9a24a" : "#9aa6b2",
      },
    ]);
    setSelectedId(id);
  }

  function updateItem(id: string, patch: Partial<SimItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeSelected() {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
  }

  function rotateSelectedTo(deg: number) {
    if (!selected) return;
    updateItem(selected.id, { rotationY: deg });
  }

  function onDragStart(kind: Kind) {
    return (e: React.DragEvent) => {
      dragKindRef.current = kind;
      e.dataTransfer.effectAllowed = "copy";
    };
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const kind = dragKindRef.current;
    dragKindRef.current = null;
    if (!kind) return;
    // Drop near origin; user can move with gizmo.
    addItem(kind, [0, kind === "cube" ? 0.5 : 0.1, 0]);
  }

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-10 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
            {ar ? "منصة المحاكاة" : "Simulation Platform"}
          </h1>
          <p className="text-sm opacity-70 mt-1">
            {ar
              ? "اسحب الأشكال إلى المشهد، حرّكها، دوّرها 90/180/270، غيّر المقاس واللون."
              : "Drag shapes into the scene, move, rotate 90/180/270, change size and color."}
          </p>
        </div>

        <div className="grid grid-cols-12 gap-4">
          {/* Palette */}
          <aside
            className="col-span-12 md:col-span-3 lg:col-span-2 rounded-xl p-3 border"
            style={{ borderColor: "var(--card-border)", background: "hsl(var(--bg-main) / 0.6)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">
              {ar ? "الأشكال" : "Shapes"}
            </div>
            <div className="space-y-2">
              <button
                draggable
                onDragStart={onDragStart("cube")}
                onClick={() => addItem("cube")}
                className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/30 transition cursor-grab active:cursor-grabbing"
                style={{ borderColor: "var(--card-border)" }}
              >
                <Box className="w-5 h-5" />
                <span className="text-sm">{ar ? "مكعب" : "Cube"}</span>
              </button>
              <button
                draggable
                onDragStart={onDragStart("connecter")}
                onClick={() => addItem("connecter")}
                className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/30 transition cursor-grab active:cursor-grabbing"
                style={{ borderColor: "var(--card-border)" }}
              >
                <Link2 className="w-5 h-5" />
                <span className="text-sm">{ar ? "موصِّل" : "Connecter"}</span>
              </button>
            </div>
            <div className="text-[11px] opacity-50 mt-3 leading-snug">
              {ar ? "اسحب أو اضغط للإضافة" : "Drag or click to add"}
            </div>
          </aside>

          {/* Canvas */}
          <div
            ref={canvasWrapRef}
            onDragOver={(e) => e.preventDefault()}
            onDrop={onDrop}
            className="col-span-12 md:col-span-6 lg:col-span-7 rounded-xl border overflow-hidden relative"
            style={{
              borderColor: "var(--card-border)",
              background: "hsl(var(--bg-main) / 0.4)",
              height: "70vh",
              minHeight: 480,
            }}
          >
            <Scene
              items={items}
              selectedId={selectedId}
              setSelectedId={setSelectedId}
              updateItem={updateItem}
              mode={mode}
            />

            {/* Mode toolbar */}
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-lg border backdrop-blur"
              style={{ borderColor: "var(--card-border)", background: "hsl(var(--bg-sidebar) / 0.7)" }}
            >
              {[
                { id: "translate" as const, icon: Move, label: ar ? "تحريك" : "Move" },
                { id: "rotate" as const, icon: RotateCw, label: ar ? "تدوير" : "Rotate" },
                { id: "scale" as const, icon: Maximize2, label: ar ? "مقاس" : "Scale" },
              ].map((m) => {
                const Icon = m.icon;
                const active = mode === m.id;
                return (
                  <button
                    key={m.id}
                    onClick={() => setMode(m.id)}
                    className="flex items-center gap-1 px-2.5 py-1.5 rounded-md text-xs transition"
                    style={{
                      background: active ? "hsl(var(--accent) / 0.3)" : "transparent",
                      color: active ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.7)",
                    }}
                  >
                    <Icon className="w-3.5 h-3.5" />
                    {m.label}
                  </button>
                );
              })}
            </div>
          </div>

          {/* Inspector */}
          <aside
            className="col-span-12 md:col-span-3 rounded-xl p-3 border"
            style={{ borderColor: "var(--card-border)", background: "hsl(var(--bg-main) / 0.6)" }}
          >
            <div className="text-xs font-semibold uppercase tracking-wider opacity-60 mb-2">
              {ar ? "خصائص" : "Properties"}
            </div>
            {!selected ? (
              <div className="text-xs opacity-60">
                {ar ? "اختر شكلاً من المشهد." : "Select a shape in the scene."}
              </div>
            ) : (
              <div className="space-y-4">
                <div className="text-sm font-medium">
                  {selected.kind === "cube" ? (ar ? "مكعب" : "Cube") : ar ? "موصِّل" : "Connecter"}
                </div>

                {/* Color */}
                <div>
                  <label className="text-[11px] uppercase tracking-wide opacity-60">
                    {ar ? "اللون" : "Color"}
                  </label>
                  <div className="flex items-center gap-2 mt-1">
                    <input
                      type="color"
                      value={selected.color}
                      onChange={(e) => updateItem(selected.id, { color: e.target.value })}
                      className="w-10 h-10 rounded cursor-pointer bg-transparent border"
                      style={{ borderColor: "var(--card-border)" }}
                    />
                    <input
                      type="text"
                      value={selected.color}
                      onChange={(e) => updateItem(selected.id, { color: e.target.value })}
                      className="flex-1 px-2 py-1 rounded text-xs border bg-transparent"
                      style={{ borderColor: "var(--card-border)" }}
                    />
                  </div>
                </div>

                {/* Rotation presets */}
                <div>
                  <label className="text-[11px] uppercase tracking-wide opacity-60">
                    {ar ? "تدوير (Y)" : "Rotation (Y)"}
                  </label>
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {[0, 90, 180, 270].map((d) => (
                      <button
                        key={d}
                        onClick={() => rotateSelectedTo(d)}
                        className="px-2 py-1.5 rounded text-xs border transition"
                        style={{
                          borderColor: "var(--card-border)",
                          background:
                            selected.rotationY === d ? "hsl(var(--accent) / 0.3)" : "transparent",
                        }}
                      >
                        {d}°
                      </button>
                    ))}
                  </div>
                </div>

                {/* Size */}
                <div>
                  <label className="text-[11px] uppercase tracking-wide opacity-60 flex justify-between">
                    <span>{ar ? "المقاس" : "Size"}</span>
                    <span>{selected.scale.toFixed(2)}×</span>
                  </label>
                  <input
                    type="range"
                    min={0.2}
                    max={5}
                    step={0.05}
                    value={selected.scale}
                    onChange={(e) =>
                      updateItem(selected.id, { scale: parseFloat(e.target.value) })
                    }
                    className="w-full mt-1"
                  />
                  <div className="grid grid-cols-4 gap-1 mt-1">
                    {[0.5, 1, 2, 3].map((s) => (
                      <button
                        key={s}
                        onClick={() => updateItem(selected.id, { scale: s })}
                        className="px-2 py-1 rounded text-xs border"
                        style={{ borderColor: "var(--card-border)" }}
                      >
                        {s}×
                      </button>
                    ))}
                  </div>
                </div>

                {/* Position display */}
                <div className="text-[11px] opacity-60">
                  pos: {selected.position.map((n) => n.toFixed(2)).join(", ")}
                </div>

                <button
                  onClick={removeSelected}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition"
                >
                  <Trash2 className="w-3.5 h-3.5" />
                  {ar ? "حذف" : "Delete"}
                </button>
              </div>
            )}

            <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--card-border)" }}>
              <button
                onClick={() => {
                  setItems([]);
                  setSelectedId(null);
                }}
                className="w-full px-3 py-2 rounded-lg text-xs border hover:bg-accent/20 transition"
                style={{ borderColor: "var(--card-border)" }}
              >
                {ar ? "تفريغ المشهد" : "Clear scene"}
              </button>
              <button
                onClick={() => addItem("cube")}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs border hover:bg-accent/20 transition"
                style={{ borderColor: "var(--card-border)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                {ar ? "أضف مكعب" : "Add cube"}
              </button>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
