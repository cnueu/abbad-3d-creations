import { Suspense, useMemo, useRef, useState, useEffect } from "react";
import { Canvas, useLoader } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Grid, TransformControls } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Trash2, Move, RotateCw, Box, Link2, Plus, Palette, Maximize2, Compass } from "lucide-react";

// Unit system: 1 scene unit = 1 cm.
// FinalCube.obj is ~10x10x10cm authored. Cubes scale to 10/20/30 cm.
// FinalConnecter.obj is ~10cm long along its Y axis.
type Kind = "cube" | "connecter";
type CubeSize = 10 | 20 | 30;
type ConAxis = "x" | "y" | "z";
type Mode = "translate" | "rotate";

interface SimItem {
  id: string;
  kind: Kind;
  position: [number, number, number];
  rotationY: number; // degrees: 0/90/180/270
  size: CubeSize; // for cubes (cm)
  axis: ConAxis; // for connecters: long axis orientation
  color: string;
}

// Load OBJ and return a single merged-style geometry, centered at origin.
// We DO NOT normalize/scale here — we keep the model's authored cm units.
function useObjGeom(url: string) {
  const obj = useLoader(OBJLoader, url);
  return useMemo(() => {
    let geom: THREE.BufferGeometry | null = null;
    obj.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        const g = (m.geometry as THREE.BufferGeometry).clone();
        geom = geom ?? g;
      }
    });
    if (!geom) return null;
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const c = new THREE.Vector3();
    bb.getCenter(c);
    geom.translate(-c.x, -c.y, -c.z);
    geom.computeVertexNormals();
    return geom;
  }, [obj]);
}

function CubeMesh({
  item,
  selected,
  onSelect,
  onChange,
  mode,
  geom,
  baseSizeCm,
}: {
  item: SimItem;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: Partial<SimItem>) => void;
  mode: Mode;
  geom: THREE.BufferGeometry;
  baseSizeCm: number; // authored size of the OBJ in cm (~10)
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  const scale = item.size / baseSizeCm;

  const node = (
    <mesh
      ref={meshRef}
      geometry={geom}
      position={item.position}
      rotation={[0, (item.rotationY * Math.PI) / 180, 0]}
      scale={scale}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshStandardMaterial color={item.color} metalness={0.15} roughness={0.5} />
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
        } else {
          // Rotation only handled via preset buttons — keep snapped quarter-turns.
          const deg = (m.rotation.y * 180) / Math.PI;
          const snapDeg = (((Math.round(deg / 90) * 90) % 360) + 360) % 360;
          m.rotation.y = (snapDeg * Math.PI) / 180;
          onChange({ rotationY: snapDeg });
        }
      }}
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
  geom,
}: {
  item: SimItem;
  selected: boolean;
  onSelect: () => void;
  onChange: (next: Partial<SimItem>) => void;
  mode: Mode;
  geom: THREE.BufferGeometry;
}) {
  const meshRef = useRef<THREE.Mesh>(null!);
  // Authored long axis is Y. Rotate so it points along chosen axis.
  const rot: [number, number, number] =
    item.axis === "y"
      ? [0, 0, 0]
      : item.axis === "x"
      ? [0, 0, Math.PI / 2]
      : [Math.PI / 2, 0, 0];

  const node = (
    <mesh
      ref={meshRef}
      geometry={geom}
      position={item.position}
      rotation={rot}
      castShadow
      receiveShadow
      onPointerDown={(e) => {
        e.stopPropagation();
        onSelect();
      }}
    >
      <meshStandardMaterial color={item.color} metalness={0.3} roughness={0.4} />
    </mesh>
  );

  if (!selected) return node;

  return (
    <TransformControls
      mode={mode === "rotate" ? "translate" : mode}
      object={meshRef.current ?? undefined}
      onObjectChange={() => {
        const m = meshRef.current;
        if (!m) return;
        onChange({ position: [m.position.x, m.position.y, m.position.z] });
      }}
      showY
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
  mode: Mode;
}) {
  const cubeGeom = useObjGeom("/models/FinalCube.obj");
  const conGeom = useObjGeom("/models/FinalConnecter.obj");

  // Compute authored cube size from its bounding box (≈10cm).
  const cubeBaseCm = useMemo(() => {
    if (!cubeGeom) return 10;
    cubeGeom.computeBoundingBox();
    const bb = cubeGeom.boundingBox!;
    const s = new THREE.Vector3();
    bb.getSize(s);
    return Math.max(s.x, s.y, s.z);
  }, [cubeGeom]);

  return (
    <Canvas
      shadows
      camera={{ position: [40, 35, 50], fov: 38 }}
      onPointerMissed={() => setSelectedId(null)}
      gl={{ antialias: true }}
    >
      <ambientLight intensity={0.55} />
      <directionalLight position={[40, 70, 30]} intensity={1.1} castShadow shadow-mapSize={[1024, 1024]} />
      <Suspense fallback={null}>
        {cubeGeom &&
          conGeom &&
          items.map((it) =>
            it.kind === "cube" ? (
              <CubeMesh
                key={it.id}
                item={it}
                selected={selectedId === it.id}
                onSelect={() => setSelectedId(it.id)}
                onChange={(patch) => updateItem(it.id, patch)}
                mode={mode}
                geom={cubeGeom}
                baseSizeCm={cubeBaseCm}
              />
            ) : (
              <ConnecterMesh
                key={it.id}
                item={it}
                selected={selectedId === it.id}
                onSelect={() => setSelectedId(it.id)}
                onChange={(patch) => updateItem(it.id, patch)}
                mode={mode}
                geom={conGeom}
              />
            ),
          )}
        <ContactShadows position={[0, -0.01, 0]} opacity={0.35} scale={150} blur={2.4} />
        <Environment preset="city" />
      </Suspense>
      <Grid
        position={[0, 0, 0]}
        args={[200, 200]}
        cellSize={10}
        cellThickness={0.6}
        cellColor="#777"
        sectionSize={50}
        sectionThickness={1.2}
        sectionColor="#bba24a"
        fadeDistance={200}
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
  const [mode, setMode] = useState<Mode>("translate");
  const [openPanel, setOpenPanel] = useState<null | "size" | "rotate" | "color" | "axis">(null);
  const dragKindRef = useRef<{ kind: Kind; size?: CubeSize } | null>(null);

  const selected = items.find((i) => i.id === selectedId) ?? null;

  function addCube(size: CubeSize) {
    const id = `cube-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        kind: "cube",
        position: [0, size / 2, 0],
        rotationY: 0,
        size,
        axis: "x",
        color: "#c9a24a",
      },
    ]);
    setSelectedId(id);
    setOpenPanel(null);
  }

  function addConnecter() {
    const id = `con-${Date.now()}-${Math.random().toString(36).slice(2, 6)}`;
    setItems((prev) => [
      ...prev,
      {
        id,
        kind: "connecter",
        position: [0, 5, 0],
        rotationY: 0,
        size: 10,
        axis: "x",
        color: "#9aa6b2",
      },
    ]);
    setSelectedId(id);
    setOpenPanel(null);
  }

  function updateItem(id: string, patch: Partial<SimItem>) {
    setItems((prev) => prev.map((i) => (i.id === id ? { ...i, ...patch } : i)));
  }

  function removeSelected() {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
    setOpenPanel(null);
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

  // Keyboard: Delete remove
  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.key === "Delete" || e.key === "Backspace") && selectedId) {
        const tag = (e.target as HTMLElement)?.tagName;
        if (tag === "INPUT" || tag === "TEXTAREA") return;
        removeSelected();
      }
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedId]);

  // Reset open panel when selection changes
  useEffect(() => {
    setOpenPanel(null);
  }, [selectedId]);

  return (
    <Layout>
      <div className="px-4 sm:px-6 lg:px-10 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold" style={{ color: "hsl(var(--text-primary))" }}>
            {ar ? "منصة المحاكاة" : "Simulation Platform"}
          </h1>
          <p className="text-sm opacity-70 mt-1">
            {ar
              ? "اسحب المكعبات (10/20/30 سم) والموصِّلات (10 سم) إلى المشهد. حركها بحرية، وغيّر خصائصها من اللوحة الجانبية."
              : "Drag cubes (10/20/30 cm) and connecters (10 cm) into the scene. Move them freely and tweak each piece from the inspector."}
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
            <div className="mt-4 pt-3 border-t text-[10px] opacity-50 leading-snug" style={{ borderColor: "var(--card-border)" }}>
              {ar ? "حرّكها بحرّية كاللعبة. حذف بزر Delete." : "Move freely like a game. Delete with the Del key."}
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
              <div className="space-y-2">
                <div className="text-sm font-medium mb-1">
                  {selected.kind === "cube"
                    ? ar
                      ? `مكعب ${selected.size} سم`
                      : `Cube ${selected.size} cm`
                    : ar
                    ? "موصِّل 10 سم"
                    : "Connecter 10 cm"}
                </div>

                {/* Action buttons — settings reveal on click */}
                {selected.kind === "cube" && (
                  <ActionRow
                    icon={<Maximize2 className="w-3.5 h-3.5" />}
                    label={ar ? "المقاس" : "Size"}
                    open={openPanel === "size"}
                    onClick={() => setOpenPanel(openPanel === "size" ? null : "size")}
                  >
                    <div className="grid grid-cols-3 gap-1 mt-2">
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
                  </ActionRow>
                )}

                {selected.kind === "cube" && (
                  <ActionRow
                    icon={<RotateCw className="w-3.5 h-3.5" />}
                    label={ar ? "تدوير" : "Rotate"}
                    open={openPanel === "rotate"}
                    onClick={() => setOpenPanel(openPanel === "rotate" ? null : "rotate")}
                  >
                    <div className="grid grid-cols-4 gap-1 mt-2">
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
                  </ActionRow>
                )}

                {selected.kind === "connecter" && (
                  <ActionRow
                    icon={<Compass className="w-3.5 h-3.5" />}
                    label={ar ? "المحور" : "Axis"}
                    open={openPanel === "axis"}
                    onClick={() => setOpenPanel(openPanel === "axis" ? null : "axis")}
                  >
                    <div className="grid grid-cols-3 gap-1 mt-2">
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
                  </ActionRow>
                )}

                <ActionRow
                  icon={<Palette className="w-3.5 h-3.5" />}
                  label={ar ? "اللون" : "Color"}
                  open={openPanel === "color"}
                  onClick={() => setOpenPanel(openPanel === "color" ? null : "color")}
                >
                  <div className="flex items-center gap-2 mt-2">
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
                </ActionRow>

                <div className="text-[11px] opacity-60 pt-1">
                  pos: {selected.position.map((n) => n.toFixed(1)).join(", ")} cm
                </div>

                <button
                  onClick={removeSelected}
                  className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs border border-red-500/40 text-red-400 hover:bg-red-500/10 transition mt-2"
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
            </div>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function ActionRow({
  icon,
  label,
  open,
  onClick,
  children,
}: {
  icon: React.ReactNode;
  label: string;
  open: boolean;
  onClick: () => void;
  children: React.ReactNode;
}) {
  return (
    <div
      className="rounded-lg border"
      style={{ borderColor: "var(--card-border)" }}
    >
      <button
        onClick={onClick}
        className="w-full flex items-center justify-between px-3 py-2 text-xs"
      >
        <span className="flex items-center gap-2">
          {icon}
          {label}
        </span>
        <span className="opacity-50">{open ? "−" : "+"}</span>
      </button>
      {open && <div className="px-3 pb-3">{children}</div>}
    </div>
  );
}
