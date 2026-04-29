import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Grid, TransformControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Trash2, Move, RotateCw, Box, Link2, Plus, Magnet } from "lucide-react";

// Unit system: 1 scene unit = 10cm.
// Cube sizes are strict: 10, 20, 30 cm => 1, 2, 3 units.
// Connecter is fixed at 10cm long, ~2.3cm cross-section.
type Kind = "cube" | "connecter";
type CubeSize = 10 | 20 | 30;
type ConAxis = "x" | "y" | "z";

interface SimItem {
  id: string;
  kind: Kind;
  position: [number, number, number];
  rotationY: number; // degrees, snapped 0/90/180/270
  size: CubeSize; // for cubes
  axis: ConAxis; // for connecters: orientation along axis
  color: string;
}

const GRID = 1; // 1 unit = 10cm cubes snap on integer grid
const CON_LEN = 1; // connecter length in units (10cm)
const CON_THICK = 0.23; // connecter cross-section in units (2.3cm)

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
    const size = new THREE.Vector3();
    bb.getSize(size);
    const c = new THREE.Vector3();
    bb.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);
    // Normalize to a 1-unit bounding box on its largest axis,
    // so we can scale precisely afterwards regardless of authored units.
    const maxDim = Math.max(size.x, size.y, size.z) || 1;
    geom.scale(1 / maxDim, 1 / maxDim, 1 / maxDim);
    return geom;
  }, [obj]);
}

function snapCube(p: [number, number, number], size: CubeSize): [number, number, number] {
  // Cube center sits at multiples of GRID, vertical so bottom rests on y=0.
  const half = size / 10 / 2;
  const sx = Math.round(p[0] / GRID) * GRID;
  const sz = Math.round(p[2] / GRID) * GRID;
  // Snap y to integer stacks of 1u above ground (cube height = size/10).
  const stepY = size / 10;
  const sy = Math.max(half, Math.round((p[1] - half) / stepY) * stepY + half);
  return [sx, sy, sz];
}

function snapConnecter(
  p: [number, number, number],
  axis: ConAxis,
): [number, number, number] {
  // Connecter sits between two grid cells on its axis: center at half-step on that axis,
  // and on integer grid on the other axes. Default elevation: y = 0.5 (mid of 1u cube).
  const round = (v: number) => Math.round(v / GRID) * GRID;
  const half = (v: number) => Math.round(v / GRID - 0.5) * GRID + GRID / 2;
  let x = round(p[0]);
  let y = p[1];
  let z = round(p[2]);
  if (axis === "x") x = half(p[0]);
  if (axis === "z") z = half(p[2]);
  if (axis === "y") y = half(Math.max(p[1], 0.5));
  else y = Math.max(0.5, Math.round((p[1] - 0.5) / GRID) * GRID + 0.5);
  return [x, y, z];
}

function CubeMesh({
  item,
  selected,
  onSelect,
  onChange,
  mode,
  snap,
  cubeGeom,
}: {
  item: SimItem;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: Partial<SimItem>) => void;
  mode: "translate" | "rotate";
  snap: boolean;
  cubeGeom: THREE.BufferGeometry;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const sizeU = item.size / 10;

  const node = (
    <mesh
      ref={meshRef}
      geometry={cubeGeom}
      position={item.position}
      rotation={[0, (item.rotationY * Math.PI) / 180, 0]}
      scale={sizeU}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshStandardMaterial color={item.color} metalness={0.15} roughness={0.45} />
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
          let p: [number, number, number] = [m.position.x, m.position.y, m.position.z];
          if (snap) p = snapCube(p, item.size);
          m.position.set(p[0], p[1], p[2]);
          onChange({ position: p });
        } else {
          const deg = (m.rotation.y * 180) / Math.PI;
          const snapDeg = ((Math.round(deg / 90) * 90) % 360 + 360) % 360;
          m.rotation.y = (snapDeg * Math.PI) / 180;
          onChange({ rotationY: snapDeg });
        }
      }}
      translationSnap={snap ? GRID : null}
      rotationSnap={Math.PI / 2}
      showY={mode === "translate"}
    >
      {node}
    </TransformControls>
  );
}

function ConnecterMesh({
  item,
  selected,
  onSelect,
  onChange,
  mode,
  snap,
}: {
  item: SimItem;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: Partial<SimItem>) => void;
  mode: "translate" | "rotate";
  snap: boolean;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  // Build dimensions from axis: long along chosen axis.
  const dims: [number, number, number] =
    item.axis === "x"
      ? [CON_LEN, CON_THICK, CON_THICK]
      : item.axis === "y"
      ? [CON_THICK, CON_LEN, CON_THICK]
      : [CON_THICK, CON_THICK, CON_LEN];

  const node = (
    <mesh
      ref={meshRef}
      position={item.position}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <boxGeometry args={dims} />
      <meshStandardMaterial color={item.color} metalness={0.35} roughness={0.35} />
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
          let p: [number, number, number] = [m.position.x, m.position.y, m.position.z];
          if (snap) p = snapConnecter(p, item.axis);
          m.position.set(p[0], p[1], p[2]);
          onChange({ position: p });
        }
      }}
      translationSnap={snap ? GRID / 2 : null}
      showY={mode === "translate"}
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
  snap,
}: {
  items: SimItem[];
  selectedId: string | null;
  setSelectedId: (id: string | null) => void;
  updateItem: (id: string, patch: Partial<SimItem>) => void;
  mode: "translate" | "rotate";
  snap: boolean;
}) {
  const cubeGeom = useCenteredGeom("/models/FinalCube.obj");
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
        {cubeGeom &&
          items.map((it) =>
            it.kind === "cube" ? (
              <CubeMesh
                key={it.id}
                item={it}
                selected={selectedId === it.id}
                onSelect={() => setSelectedId(it.id)}
                onChange={(patch) => updateItem(it.id, patch)}
                mode={mode}
                snap={snap}
                cubeGeom={cubeGeom}
              />
            ) : (
              <ConnecterMesh
                key={it.id}
                item={it}
                selected={selectedId === it.id}
                onSelect={() => setSelectedId(it.id)}
                onChange={(patch) => updateItem(it.id, patch)}
                mode={mode}
                snap={snap}
              />
            ),
          )}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.4} scale={30} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <Grid
        position={[0, 0, 0]}
        args={[40, 40]}
        cellSize={GRID}
        cellThickness={0.6}
        cellColor="#888"
        sectionSize={GRID * 5}
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
  const [mode, setMode] = useState<"translate" | "rotate">("translate");
  const [snap, setSnap] = useState(true);
  const [nextSize, setNextSize] = useState<CubeSize>(10);
  const dragKindRef = useRef<{ kind: Kind; size?: CubeSize } | null>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  function addCube(size: CubeSize, position?: [number, number, number]) {
    const id = `cube-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const half = size / 10 / 2;
    const pos = position ?? [0, half, 0];
    const snapped = snap ? snapCube(pos, size) : pos;
    setItems((prev) => [
      ...prev,
      { id, kind: "cube", position: snapped, rotationY: 0, size, axis: "x", color: "#c9a24a" },
    ]);
    setSelectedId(id);
  }

  function addConnecter(position?: [number, number, number]) {
    const id = `con-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    const axis: ConAxis = "x";
    const pos = position ?? [GRID / 2, 0.5, 0];
    const snapped = snap ? snapConnecter(pos, axis) : pos;
    setItems((prev) => [
      ...prev,
      { id, kind: "connecter", position: snapped, rotationY: 0, size: 10, axis, color: "#9aa6b2" },
    ]);
    setSelectedId(id);
  }

  function updateItem(id: string, patch: Partial<SimItem>) {
    setItems((prev) =>
      prev.map((i) => {
        if (i.id !== id) return i;
        const next = { ...i, ...patch };
        // Re-snap if axis or size changed.
        if (snap) {
          if (next.kind === "cube" && (patch.size !== undefined || patch.position)) {
            next.position = snapCube(next.position, next.size);
          }
          if (next.kind === "connecter" && (patch.axis !== undefined || patch.position)) {
            next.position = snapConnecter(next.position, next.axis);
          }
        }
        return next;
      }),
    );
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

  function onDragStartCube(size: CubeSize) {
    return (e: React.DragEvent) => {
      dragKindRef.current = { kind: "cube", size };
      e.dataTransfer.effectAllowed = "copy";
    };
  }
  function onDragStartConnecter(e: React.DragEvent) {
    dragKindRef.current = { kind: "connecter" };
    e.dataTransfer.effectAllowed = "copy";
  }
  function onDrop(e: React.DragEvent) {
    e.preventDefault();
    const d = dragKindRef.current;
    dragKindRef.current = null;
    if (!d) return;
    if (d.kind === "cube" && d.size) addCube(d.size);
    else addConnecter();
  }

  // Keyboard: G toggle snap, R rotate 90, Delete remove
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if (e.key === "g" || e.key === "G") setSnap((s) => !s);
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) removeSelected();
      if ((e.key === "r" || e.key === "R") && selected) {
        rotateSelectedTo(((selected.rotationY + 90) % 360) as number);
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId, selected?.rotationY]);

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-10 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
            {ar ? "منصة المحاكاة" : "Simulation Platform"}
          </h1>
          <p className="text-sm opacity-70 mt-1">
            {ar
              ? "اسحب المكعبات (10/20/30 سم) والموصِّلات (10 سم) إلى المشهد. التثبيت على الشبكة يضع القطع بجانب أو فوق بعضها، والموصِّلات بين قطعتين."
              : "Drag cubes (10/20/30 cm) and connecters (10 cm) into the scene. Snap-to-grid places pieces next to or above each other, with connecters fitting between two pieces."}
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
              {([10, 20, 30] as CubeSize[]).map((s) => (
                <button
                  key={s}
                  draggable
                  onDragStart={onDragStartCube(s)}
                  onClick={() => addCube(s)}
                  className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/30 transition cursor-grab active:cursor-grabbing"
                  style={{ borderColor: "var(--card-border)" }}
                >
                  <Box className="w-5 h-5" />
                  <span className="text-sm">
                    {ar ? `مكعب ${s} سم` : `Cube ${s} cm`}
                  </span>
                </button>
              ))}
              <button
                draggable
                onDragStart={onDragStartConnecter}
                onClick={() => addConnecter()}
                className="w-full flex items-center gap-2 p-3 rounded-lg border hover:bg-accent/30 transition cursor-grab active:cursor-grabbing"
                style={{ borderColor: "var(--card-border)" }}
              >
                <Link2 className="w-5 h-5" />
                <span className="text-sm">{ar ? "موصِّل 10 سم" : "Connecter 10 cm"}</span>
              </button>
            </div>
            <div className="text-[11px] opacity-50 mt-3 leading-snug">
              {ar ? "اسحب أو اضغط للإضافة" : "Drag or click to add"}
            </div>

            <div className="mt-4 pt-3 border-t" style={{ borderColor: "var(--card-border)" }}>
              <button
                onClick={() => setSnap((s) => !s)}
                className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs border transition"
                style={{
                  borderColor: "var(--card-border)",
                  background: snap ? "hsl(var(--accent) / 0.3)" : "transparent",
                  color: snap ? "hsl(var(--text-accent))" : undefined,
                }}
                title="G"
              >
                <Magnet className="w-3.5 h-3.5" />
                {snap
                  ? ar ? "التثبيت مفعّل" : "Snap: On"
                  : ar ? "التثبيت معطّل" : "Snap: Off"}
              </button>
              <div className="text-[10px] opacity-50 mt-2 leading-snug">
                {ar ? "اختصارات: G للتثبيت، R للتدوير، Delete للحذف" : "Keys: G snap, R rotate, Del delete"}
              </div>
            </div>
          </aside>

          {/* Canvas */}
          <div
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
              snap={snap}
            />

            {/* Mode toolbar */}
            <div
              className="absolute top-3 left-1/2 -translate-x-1/2 flex gap-1 p-1 rounded-lg border backdrop-blur"
              style={{ borderColor: "var(--card-border)", background: "hsl(var(--bg-sidebar) / 0.7)" }}
            >
              {[
                { id: "translate" as const, icon: Move, label: ar ? "تحريك" : "Move" },
                { id: "rotate" as const, icon: RotateCw, label: ar ? "تدوير" : "Rotate" },
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
                  {selected.kind === "cube"
                    ? ar
                      ? `مكعب ${selected.size} سم`
                      : `Cube ${selected.size} cm`
                    : ar
                    ? "موصِّل 10 سم"
                    : "Connecter 10 cm"}
                </div>

                {/* Cube size selector */}
                {selected.kind === "cube" && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wide opacity-60">
                      {ar ? "المقاس" : "Size"}
                    </label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {([10, 20, 30] as CubeSize[]).map((s) => (
                        <button
                          key={s}
                          onClick={() => updateItem(selected.id, { size: s })}
                          className="px-2 py-1.5 rounded text-xs border transition"
                          style={{
                            borderColor: "var(--card-border)",
                            background:
                              selected.size === s ? "hsl(var(--accent) / 0.3)" : "transparent",
                          }}
                        >
                          {s} cm
                        </button>
                      ))}
                    </div>
                  </div>
                )}

                {/* Connecter axis */}
                {selected.kind === "connecter" && (
                  <div>
                    <label className="text-[11px] uppercase tracking-wide opacity-60">
                      {ar ? "المحور" : "Axis"}
                    </label>
                    <div className="grid grid-cols-3 gap-1 mt-1">
                      {(["x", "y", "z"] as ConAxis[]).map((a) => (
                        <button
                          key={a}
                          onClick={() => updateItem(selected.id, { axis: a })}
                          className="px-2 py-1.5 rounded text-xs border transition uppercase"
                          style={{
                            borderColor: "var(--card-border)",
                            background:
                              selected.axis === a ? "hsl(var(--accent) / 0.3)" : "transparent",
                          }}
                        >
                          {a}
                        </button>
                      ))}
                    </div>
                  </div>
                )}

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

                {/* Rotation presets (cube only) */}
                {selected.kind === "cube" && (
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
                )}

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
                onClick={() => addCube(nextSize)}
                className="w-full mt-2 flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs border hover:bg-accent/20 transition"
                style={{ borderColor: "var(--card-border)" }}
              >
                <Plus className="w-3.5 h-3.5" />
                {ar ? `أضف مكعب ${nextSize} سم` : `Add ${nextSize} cm cube`}
              </button>
              <div className="grid grid-cols-3 gap-1 mt-2">
                {([10, 20, 30] as CubeSize[]).map((s) => (
                  <button
                    key={s}
                    onClick={() => setNextSize(s)}
                    className="px-2 py-1 rounded text-[11px] border transition"
                    style={{
                      borderColor: "var(--card-border)",
                      background: nextSize === s ? "hsl(var(--accent) / 0.25)" : "transparent",
                    }}
                  >
                    {s}
                  </button>
                ))}
              </div>
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}
