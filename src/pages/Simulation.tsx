import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Grid, Html } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Trash2, RotateCw, Box, Link2, Plus, Palette, Ruler, Compass } from "lucide-react";
import { Button } from "@/components/ui/button";

// ============================================================
// Unit system: 1 scene unit = 1 cm.
// Cubes: 10/20/30 cm. Connecter: fixed 10 cm long.
// Free pointer-drag in XZ plane (game-style).
// On-canvas arrow gizmos nudge the selected item by exactly 10 cm.
// AABB collision prevents cube overlap.
// ============================================================

type Kind = "cube" | "connecter";
type CubeSize = 10 | 20 | 30;
type ConAxis = "x" | "y" | "z";

interface SimItem {
  id: string;
  kind: Kind;
  position: [number, number, number];
  rotationY: number; // 0/90/180/270
  size: CubeSize;
  axis: ConAxis;
  color: string;
}

const NUDGE = 10; // cm
const CUBE_COLORS = ["#e8c547", "#5b8def", "#ef6f6c", "#7ed957", "#b07cff", "#f6f6f6", "#2c2c2c"];

// Authored model dims (from FinalConnecter.obj bbox we know it's ~10cm long)
// We'll measure at runtime and rescale to the requested cm.

function useObjGeom(url: string) {
  const obj = useLoader(OBJLoader, url);
  return useMemo(() => {
    let merged: THREE.BufferGeometry | null = null;
    obj.traverse((c) => {
      const m = c as THREE.Mesh;
      if (m.isMesh) {
        const g = (m.geometry as THREE.BufferGeometry).clone();
        merged = merged ?? g;
      }
    });
    if (!merged) return null;
    merged.computeBoundingBox();
    const bb = merged.boundingBox!;
    const center = new THREE.Vector3();
    bb.getCenter(center);
    merged.translate(-center.x, -center.y, -center.z);
    merged.computeVertexNormals();
    return merged;
  }, [obj]);
}

// AABB of an item in world space
function itemAABB(it: SimItem): { min: THREE.Vector3; max: THREE.Vector3 } {
  if (it.kind === "cube") {
    const h = it.size / 2;
    const [x, y, z] = it.position;
    return {
      min: new THREE.Vector3(x - h, y - h, z - h),
      max: new THREE.Vector3(x + h, y + h, z + h),
    };
  }
  // connecter: 2x10x2 cm box along chosen axis
  const [x, y, z] = it.position;
  const long = 5; // half of 10
  const thin = 1; // half of 2
  let hx = thin, hy = thin, hz = thin;
  if (it.axis === "x") hx = long;
  if (it.axis === "y") hy = long;
  if (it.axis === "z") hz = long;
  return {
    min: new THREE.Vector3(x - hx, y - hy, z - hz),
    max: new THREE.Vector3(x + hx, y + hy, z + hz),
  };
}

function aabbOverlap(a: { min: THREE.Vector3; max: THREE.Vector3 }, b: { min: THREE.Vector3; max: THREE.Vector3 }) {
  const eps = 0.001;
  return (
    a.min.x < b.max.x - eps && a.max.x > b.min.x + eps &&
    a.min.y < b.max.y - eps && a.max.y > b.min.y + eps &&
    a.min.z < b.max.z - eps && a.max.z > b.min.z + eps
  );
}

// Try moving an item to newPos; reject if overlaps with another CUBE.
// (Connecters are allowed to pass through anything — they're meant to bridge cubes.)
function canPlace(items: SimItem[], item: SimItem, newPos: [number, number, number]): boolean {
  const candidate = { ...item, position: newPos };
  if (candidate.kind !== "cube") return true; // free placement for connecters
  const ca = itemAABB(candidate);
  for (const other of items) {
    if (other.id === item.id) continue;
    if (other.kind !== "cube") continue;
    const ob = itemAABB(other);
    if (aabbOverlap(ca, ob)) return false;
  }
  return true;
}

// Floor at y=0 means item rests with its bottom on the floor.
// We keep y so item sits above floor: cube center y = size/2; connecter y depends on axis.
function floorY(it: SimItem) {
  if (it.kind === "cube") return it.size / 2;
  if (it.axis === "y") return 5; // half of 10
  return 1; // half of 2
}

// ===================== 3D pieces =====================

function CubeMesh({ item, selected, onPointerDown, onClick }: {
  item: SimItem;
  selected: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const geom = useObjGeom("/models/FinalCube.obj");
  const meshRef = useRef<THREE.Mesh>(null);

  // Determine native size of model and rescale so it equals item.size cm.
  const scale = useMemo(() => {
    if (!geom) return 1;
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const native = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z);
    return item.size / native;
  }, [geom, item.size]);

  if (!geom) return null;
  return (
    <group
      position={item.position}
      rotation={[0, (item.rotationY * Math.PI) / 180, 0]}
      onPointerDown={onPointerDown}
      onClick={onClick}
    >
      <mesh ref={meshRef} geometry={geom} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial color={item.color} metalness={0.1} roughness={0.55} />
      </mesh>
      {selected && (
        <mesh scale={scale * 1.02}>
          <boxGeometry args={[
            (geom.boundingBox!.max.x - geom.boundingBox!.min.x),
            (geom.boundingBox!.max.y - geom.boundingBox!.min.y),
            (geom.boundingBox!.max.z - geom.boundingBox!.min.z),
          ]} />
          <meshBasicMaterial color="#ffd34d" wireframe />
        </mesh>
      )}
    </group>
  );
}

function ConnecterMesh({ item, selected, onPointerDown, onClick }: {
  item: SimItem;
  selected: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const geom = useObjGeom("/models/FinalConnecter.obj");
  const scale = useMemo(() => {
    if (!geom) return 1;
    geom.computeBoundingBox();
    const bb = geom.boundingBox!;
    const longest = Math.max(bb.max.x - bb.min.x, bb.max.y - bb.min.y, bb.max.z - bb.min.z);
    return 10 / longest; // 10 cm long
  }, [geom]);

  // Connecter is authored long along Y. Rotate to chosen axis.
  const rot = useMemo<[number, number, number]>(() => {
    if (item.axis === "y") return [0, 0, 0];
    if (item.axis === "x") return [0, 0, Math.PI / 2];
    return [Math.PI / 2, 0, 0]; // z
  }, [item.axis]);

  if (!geom) return null;
  return (
    <group position={item.position} onPointerDown={onPointerDown} onClick={onClick}>
      <group rotation={rot}>
        <mesh geometry={geom} scale={scale} castShadow receiveShadow>
          <meshStandardMaterial color={item.color} metalness={0.2} roughness={0.4} />
        </mesh>
        {selected && (
          <mesh scale={scale * 1.05}>
            <boxGeometry args={[2, 10, 2]} />
            <meshBasicMaterial color="#ffd34d" wireframe />
          </mesh>
        )}
      </group>
    </group>
  );
}

// On-canvas arrow gizmo: 4 arrows around a selected item to nudge ±10cm in X/Z.
function ArrowGizmo({ item, onNudge }: { item: SimItem; onNudge: (dx: number, dz: number) => void }) {
  const [x, y, z] = item.position;
  const offset = (item.kind === "cube" ? item.size / 2 : item.axis === "x" ? 5 : item.axis === "z" ? 5 : 1) + 4;

  const Arrow = ({ pos, rotY, onClick: cb }: { pos: [number, number, number]; rotY: number; onClick: () => void }) => (
    <group position={pos} rotation={[0, rotY, 0]} onClick={(e) => { e.stopPropagation(); cb(); }}>
      <mesh position={[0, 0, 1.2]}>
        <coneGeometry args={[1.1, 2.4, 16]} />
        <meshStandardMaterial color="#ffd34d" emissive="#ffaa00" emissiveIntensity={0.4} />
      </mesh>
      <mesh position={[0, 0, -0.4]}>
        <cylinderGeometry args={[0.25, 0.25, 1.6, 12]} />
        <meshStandardMaterial color="#ffd34d" />
      </mesh>
    </group>
  );

  return (
    <group position={[x, Math.max(y, 0.6), z]}>
      {/* +X (right) */}
      <Arrow pos={[offset, 0, 0]} rotY={-Math.PI / 2} onClick={() => onNudge(NUDGE, 0)} />
      {/* -X (left) */}
      <Arrow pos={[-offset, 0, 0]} rotY={Math.PI / 2} onClick={() => onNudge(-NUDGE, 0)} />
      {/* +Z (forward) */}
      <Arrow pos={[0, 0, offset]} rotY={0} onClick={() => onNudge(0, NUDGE)} />
      {/* -Z (back) */}
      <Arrow pos={[0, 0, -offset]} rotY={Math.PI} onClick={() => onNudge(0, -NUDGE)} />
    </group>
  );
}

// Floor that catches drag events. We project pointer onto y=floorY plane while dragging.
function DragFloor({ enabled, onMove, onUp }: {
  enabled: boolean;
  onMove: (point: THREE.Vector3) => void;
  onUp: () => void;
}) {
  const { camera, gl } = useThree();
  const planeY = useRef(0);

  useEffect(() => {
    if (!enabled) return;
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeY.current);
    const target = new THREE.Vector3();

    const handleMove = (ev: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      if (raycaster.ray.intersectPlane(plane, target)) {
        onMove(target.clone());
      }
    };
    const handleUp = () => onUp();

    dom.addEventListener("pointermove", handleMove);
    window.addEventListener("pointerup", handleUp);
    return () => {
      dom.removeEventListener("pointermove", handleMove);
      window.removeEventListener("pointerup", handleUp);
    };
  }, [enabled, camera, gl, onMove, onUp]);

  return null;
}

// ===================== Page =====================

export default function Simulation() {
  const { lang } = useLang();
  const isAr = lang === "ar";
  const t = (en: string, ar: string) => (isAr ? ar : en);

  const [items, setItems] = useState<SimItem[]>([]);
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [draggingId, setDraggingId] = useState<string | null>(null);
  const [openPanel, setOpenPanel] = useState<null | "size" | "rotate" | "axis" | "color">(null);

  const selected = items.find((i) => i.id === selectedId) || null;

  const addItem = useCallback((kind: Kind) => {
    const id = Math.random().toString(36).slice(2, 9);
    const base: SimItem = {
      id,
      kind,
      position: [0, 0, 0],
      rotationY: 0,
      size: 10,
      axis: "y",
      color: kind === "cube" ? "#e8c547" : "#cccccc",
    };
    base.position = [0, floorY(base), 0];
    // try to place near origin avoiding overlap
    const tries = [[0,0],[12,0],[-12,0],[0,12],[0,-12],[12,12],[-12,-12]] as const;
    for (const [dx, dz] of tries) {
      const pos: [number, number, number] = [dx, base.position[1], dz];
      if (canPlace(items, base, pos)) {
        base.position = pos;
        break;
      }
    }
    setItems((prev) => [...prev, base]);
    setSelectedId(id);
    setOpenPanel(null);
  }, [items]);

  const updateItem = useCallback((id: string, patch: Partial<SimItem>) => {
    setItems((prev) => prev.map((it) => {
      if (it.id !== id) return it;
      const next = { ...it, ...patch };
      next.position = [next.position[0], floorY(next), next.position[2]];
      // collision check for cubes
      if (next.kind === "cube" && !canPlace(prev.filter(p => p.id !== id), next, next.position)) {
        return it; // reject
      }
      return next;
    }));
  }, []);

  const deleteSelected = () => {
    if (!selectedId) return;
    setItems((prev) => prev.filter((i) => i.id !== selectedId));
    setSelectedId(null);
    setOpenPanel(null);
  };

  const nudgeSelected = (dx: number, dz: number) => {
    if (!selected) return;
    const newPos: [number, number, number] = [selected.position[0] + dx, selected.position[1], selected.position[2] + dz];
    if (canPlace(items, selected, newPos)) {
      setItems((prev) => prev.map((i) => i.id === selected.id ? { ...i, position: newPos } : i));
    }
  };

  // Drag handlers
  const dragOffset = useRef<{ ox: number; oz: number }>({ ox: 0, oz: 0 });
  const beginDrag = (item: SimItem, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setSelectedId(item.id);
    setOpenPanel(null);
    const hit = e.point;
    dragOffset.current = { ox: item.position[0] - hit.x, oz: item.position[2] - hit.z };
    setDraggingId(item.id);
  };

  const onDragMove = useCallback((point: THREE.Vector3) => {
    if (!draggingId) return;
    setItems((prev) => prev.map((it) => {
      if (it.id !== draggingId) return it;
      const newX = point.x + dragOffset.current.ox;
      const newZ = point.z + dragOffset.current.oz;
      const candidate: [number, number, number] = [newX, it.position[1], newZ];
      if (it.kind === "cube" && !canPlace(prev.filter(p => p.id !== it.id), it, candidate)) {
        // try sliding on each axis separately
        const tryX: [number, number, number] = [newX, it.position[1], it.position[2]];
        if (canPlace(prev.filter(p => p.id !== it.id), it, tryX)) return { ...it, position: tryX };
        const tryZ: [number, number, number] = [it.position[0], it.position[1], newZ];
        if (canPlace(prev.filter(p => p.id !== it.id), it, tryZ)) return { ...it, position: tryZ };
        return it;
      }
      return { ...it, position: candidate };
    }));
  }, [draggingId]);

  const endDrag = useCallback(() => setDraggingId(null), []);

  // Keyboard nudges
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); nudgeSelected(-NUDGE, 0); }
      else if (e.key === "ArrowRight") { e.preventDefault(); nudgeSelected(NUDGE, 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); nudgeSelected(0, -NUDGE); }
      else if (e.key === "ArrowDown") { e.preventDefault(); nudgeSelected(0, NUDGE); }
      else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
      else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (selected.kind === "cube") updateItem(selected.id, { rotationY: ((selected.rotationY + 90) % 360) as any });
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [selected, items]);

  return (
    <Layout>
      <div className="container mx-auto px-4 py-6">
        <div className="mb-4">
          <h1 className="text-2xl font-bold">{t("Simulation Platform", "منصة المحاكاة")}</h1>
          <p className="text-sm text-muted-foreground">
            {t(
              "Drag pieces freely. Use the on-screen arrows or arrow keys to nudge by 10 cm. Cubes cannot overlap.",
              "اسحب القطع بحرية. استخدم الأسهم على الشاشة أو مفاتيح الأسهم للتحريك بمقدار ١٠ سم. لا يمكن تداخل المكعبات."
            )}
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-[220px_1fr_280px] gap-4">
          {/* Palette */}
          <aside className="rounded-lg border bg-card p-3 space-y-2 h-fit">
            <h2 className="text-sm font-semibold mb-2">{t("Pieces", "القطع")}</h2>
            <Button variant="outline" className="w-full justify-start" onClick={() => addItem("cube")}>
              <Box className="w-4 h-4" /> {t("Add Cube", "أضف مكعب")}
            </Button>
            <Button variant="outline" className="w-full justify-start" onClick={() => addItem("connecter")}>
              <Link2 className="w-4 h-4" /> {t("Add Connecter", "أضف موصِّل")}
            </Button>
            <div className="pt-3 mt-3 border-t text-xs text-muted-foreground space-y-1">
              <p>↔ {t("Drag to move", "اسحب للتحريك")}</p>
              <p>⌨ {t("Arrow keys = 10 cm", "أسهم = ١٠ سم")}</p>
              <p>R {t("Rotate cube 90°", "تدوير ٩٠°")}</p>
              <p>Del {t("Delete", "حذف")}</p>
            </div>
          </aside>

          {/* Canvas */}
          <div className="relative rounded-lg border bg-gradient-to-b from-background to-muted/30 overflow-hidden" style={{ height: "70vh", minHeight: 480 }}>
            <Canvas
              shadows
              camera={{ position: [60, 50, 60], fov: 45 }}
              onPointerMissed={() => { setSelectedId(null); setOpenPanel(null); }}
            >
              <color attach="background" args={["#0c1012"]} />
              <ambientLight intensity={0.5} />
              <directionalLight position={[40, 60, 30]} intensity={1.0} castShadow shadow-mapSize={[1024, 1024]} />
              <Suspense fallback={null}>
                <Environment preset="city" />
              </Suspense>

              {/* Floor grid: 10cm cells */}
              <Grid
                position={[0, 0.01, 0]}
                args={[400, 400]}
                cellSize={10}
                cellThickness={0.6}
                cellColor="#3a3f42"
                sectionSize={50}
                sectionThickness={1}
                sectionColor="#e8c547"
                fadeDistance={300}
                fadeStrength={1}
                infiniteGrid
              />
              <ContactShadows position={[0, 0.02, 0]} opacity={0.4} scale={200} blur={2.5} far={50} />

              {/* Items */}
              {items.map((it) =>
                it.kind === "cube" ? (
                  <CubeMesh
                    key={it.id}
                    item={it}
                    selected={it.id === selectedId}
                    onPointerDown={(e) => beginDrag(it, e)}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(it.id); }}
                  />
                ) : (
                  <ConnecterMesh
                    key={it.id}
                    item={it}
                    selected={it.id === selectedId}
                    onPointerDown={(e) => beginDrag(it, e)}
                    onClick={(e) => { e.stopPropagation(); setSelectedId(it.id); }}
                  />
                )
              )}

              {/* Arrow gizmo around selected */}
              {selected && <ArrowGizmo item={selected} onNudge={nudgeSelected} />}

              <DragFloor enabled={!!draggingId} onMove={onDragMove} onUp={endDrag} />

              <OrbitControls
                enablePan
                enableRotate={!draggingId}
                enableZoom
                makeDefault
                target={[0, 5, 0]}
              />
            </Canvas>

            {/* Overlay HUD */}
            <div className="absolute top-3 left-3 text-xs bg-background/70 backdrop-blur px-2 py-1 rounded border">
              {items.length} {t("pieces", "قطعة")}
            </div>
          </div>

          {/* Inspector */}
          <aside className="rounded-lg border bg-card p-3 space-y-3 h-fit">
            <h2 className="text-sm font-semibold">{t("Inspector", "الخصائص")}</h2>
            {!selected ? (
              <p className="text-xs text-muted-foreground">{t("Select a piece to edit it.", "اختر قطعة لتعديلها.")}</p>
            ) : (
              <div className="space-y-2">
                <div className="text-xs text-muted-foreground">
                  {selected.kind === "cube" ? t("Cube", "مكعب") : t("Connecter", "موصِّل")}
                </div>

                {/* Move arrows mirror */}
                <div className="grid grid-cols-3 gap-1 w-32 mx-auto">
                  <span />
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(0, -NUDGE)}>↑</Button>
                  <span />
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(-NUDGE, 0)}>←</Button>
                  <span className="text-[10px] text-muted-foreground self-center text-center">10cm</span>
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(NUDGE, 0)}>→</Button>
                  <span />
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(0, NUDGE)}>↓</Button>
                  <span />
                </div>

                {/* Buttons that reveal sub-panels */}
                {selected.kind === "cube" && (
                  <Button variant={openPanel === "size" ? "default" : "outline"} className="w-full justify-start" size="sm"
                    onClick={() => setOpenPanel(openPanel === "size" ? null : "size")}>
                    <Ruler className="w-4 h-4" /> {t("Size", "المقاس")} ({selected.size} cm)
                  </Button>
                )}
                {openPanel === "size" && selected.kind === "cube" && (
                  <div className="flex gap-1">
                    {[10, 20, 30].map((s) => (
                      <Button key={s} size="sm" variant={selected.size === s ? "default" : "outline"} className="flex-1"
                        onClick={() => updateItem(selected.id, { size: s as CubeSize })}>{s}</Button>
                    ))}
                  </div>
                )}

                {selected.kind === "cube" && (
                  <Button variant={openPanel === "rotate" ? "default" : "outline"} className="w-full justify-start" size="sm"
                    onClick={() => setOpenPanel(openPanel === "rotate" ? null : "rotate")}>
                    <RotateCw className="w-4 h-4" /> {t("Rotate", "تدوير")} ({selected.rotationY}°)
                  </Button>
                )}
                {openPanel === "rotate" && selected.kind === "cube" && (
                  <div className="grid grid-cols-4 gap-1">
                    {[0, 90, 180, 270].map((r) => (
                      <Button key={r} size="sm" variant={selected.rotationY === r ? "default" : "outline"}
                        onClick={() => updateItem(selected.id, { rotationY: r })}>{r}°</Button>
                    ))}
                  </div>
                )}

                {selected.kind === "connecter" && (
                  <Button variant={openPanel === "axis" ? "default" : "outline"} className="w-full justify-start" size="sm"
                    onClick={() => setOpenPanel(openPanel === "axis" ? null : "axis")}>
                    <Compass className="w-4 h-4" /> {t("Orientation", "الاتجاه")} ({selected.axis.toUpperCase()})
                  </Button>
                )}
                {openPanel === "axis" && selected.kind === "connecter" && (
                  <div className="grid grid-cols-3 gap-1">
                    {(["x", "y", "z"] as ConAxis[]).map((a) => (
                      <Button key={a} size="sm" variant={selected.axis === a ? "default" : "outline"}
                        onClick={() => updateItem(selected.id, { axis: a })}>{a.toUpperCase()}</Button>
                    ))}
                  </div>
                )}

                <Button variant={openPanel === "color" ? "default" : "outline"} className="w-full justify-start" size="sm"
                  onClick={() => setOpenPanel(openPanel === "color" ? null : "color")}>
                  <Palette className="w-4 h-4" /> {t("Color", "اللون")}
                </Button>
                {openPanel === "color" && (
                  <div className="grid grid-cols-7 gap-1">
                    {CUBE_COLORS.map((c) => (
                      <button key={c} className="w-7 h-7 rounded border-2"
                        style={{ background: c, borderColor: selected.color === c ? "#ffd34d" : "transparent" }}
                        onClick={() => updateItem(selected.id, { color: c })} />
                    ))}
                  </div>
                )}

                <Button variant="destructive" className="w-full" size="sm" onClick={deleteSelected}>
                  <Trash2 className="w-4 h-4" /> {t("Delete", "حذف")}
                </Button>

                <div className="text-[10px] text-muted-foreground pt-2 border-t">
                  x: {selected.position[0].toFixed(1)} • z: {selected.position[2].toFixed(1)} cm
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
}
