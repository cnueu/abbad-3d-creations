import { Suspense, useMemo, useRef, useState, useCallback, useEffect } from "react";
import { Canvas, useLoader, useThree, ThreeEvent } from "@react-three/fiber";
import { OrbitControls, Environment, ContactShadows, Grid } from "@react-three/drei";
import { OBJLoader } from "three/examples/jsm/loaders/OBJLoader.js";
import * as THREE from "three";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Trash2, RotateCw, Box, Link2, Palette, Ruler, Move3d, ShoppingCart } from "lucide-react";
import { Button } from "@/components/ui/button";
import { PRODUCTS, CUSTOM_CUBES, CUBE_PRICE, CONNECTER_PRICE, type Product } from "@/data/products";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

// ============================================================
// 1 scene unit = 1 cm.
// Cubes: 10/20/30 cm. Connecter: fixed 10 cm long.
// Free pointer-drag in XZ plane + Y nudging via gizmo / keyboard.
// Connecter free rotation in 45° steps on X / Y / Z.
// AABB collision prevents cube overlap.
// ============================================================

type Kind = "cube" | "connecter";
type CubeSize = 10 | 20 | 30;

interface SimItem {
  id: string;
  kind: Kind;
  position: [number, number, number];
  rotationY: number;        // cube rotation
  rot: [number, number, number]; // connecter rotation in degrees (X, Y, Z) — multiples of 45
  size: CubeSize;
  color: string;
}

const NUDGE = 5; // cm
const PRESET_COLORS = ["#d9c6a3", "#b8a37e", "#8a8a8a", "#5a5a5a", "#a47148", "#c89b6c", "#6e4a2b", "#9aa3ad"];

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

// AABB of an item in world space (axis-aligned approximation).
function itemAABB(it: SimItem): { min: THREE.Vector3; max: THREE.Vector3 } {
  if (it.kind === "cube") {
    const h = it.size / 2;
    const [x, y, z] = it.position;
    return {
      min: new THREE.Vector3(x - h, y - h, z - h),
      max: new THREE.Vector3(x + h, y + h, z + h),
    };
  }
  // Connecter: 2x10x2 cm bounding sphere-ish. Use a 10cm cube as conservative AABB.
  const [x, y, z] = it.position;
  const h = 5;
  return {
    min: new THREE.Vector3(x - h, y - h, z - h),
    max: new THREE.Vector3(x + h, y + h, z + h),
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

function canPlace(items: SimItem[], item: SimItem, newPos: [number, number, number]): boolean {
  const candidate = { ...item, position: newPos };
  if (candidate.kind !== "cube") return true;
  const ca = itemAABB(candidate);
  for (const other of items) {
    if (other.id === item.id) continue;
    if (other.kind !== "cube") continue;
    if (aabbOverlap(ca, itemAABB(other))) return false;
  }
  return true;
}

// Minimum y so the item sits at-or-above the floor.
function minY(it: SimItem) {
  if (it.kind === "cube") return it.size / 2;
  return 5; // connecter half-height (using conservative 10cm)
}

// ===================== 3D pieces =====================

function CubeMesh({ item, selected, onPointerDown, onClick }: {
  item: SimItem;
  selected: boolean;
  onPointerDown: (e: ThreeEvent<PointerEvent>) => void;
  onClick: (e: ThreeEvent<MouseEvent>) => void;
}) {
  const geom = useObjGeom("/models/FinalCube.obj");

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
      <mesh geometry={geom} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial color={item.color} metalness={0.1} roughness={0.55} />
      </mesh>
      {selected && (
        <mesh>
          <boxGeometry args={[item.size * 1.02, item.size * 1.02, item.size * 1.02]} />
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
    return 10 / longest;
  }, [geom]);

  const rot: [number, number, number] = [
    (item.rot[0] * Math.PI) / 180,
    (item.rot[1] * Math.PI) / 180,
    (item.rot[2] * Math.PI) / 180,
  ];

  if (!geom) return null;
  return (
    <group position={item.position} rotation={rot} onPointerDown={onPointerDown} onClick={onClick}>
      <mesh geometry={geom} scale={scale} castShadow receiveShadow>
        <meshStandardMaterial color={item.color} metalness={0.2} roughness={0.4} />
      </mesh>
      {selected && (
        <mesh>
          <boxGeometry args={[3, 11, 3]} />
          <meshBasicMaterial color="#ffd34d" wireframe />
        </mesh>
      )}
    </group>
  );
}

// On-canvas arrow gizmo: 6 arrows around a selected item to nudge ±10cm in X / Y / Z.
function ArrowGizmo({ item, onNudge }: { item: SimItem; onNudge: (dx: number, dy: number, dz: number) => void }) {
  const [x, y, z] = item.position;
  const reach = (item.kind === "cube" ? item.size / 2 : 5) + 4;

  const Arrow = ({
    pos, rotation, color = "#ffd34d", onClick: cb,
  }: {
    pos: [number, number, number];
    rotation: [number, number, number];
    color?: string;
    onClick: () => void;
  }) => (
    <group position={pos} rotation={rotation} onClick={(e) => { e.stopPropagation(); cb(); }}>
      <mesh position={[0, 0.8, 0]}>
        <coneGeometry args={[1.1, 2.4, 16]} />
        <meshStandardMaterial color={color} emissive={color} emissiveIntensity={0.4} />
      </mesh>
      <mesh>
        <cylinderGeometry args={[0.25, 0.25, 1.6, 12]} />
        <meshStandardMaterial color={color} />
      </mesh>
    </group>
  );

  return (
    <group position={[x, y, z]}>
      {/* +X (right) */}
      <Arrow pos={[reach, 0, 0]} rotation={[0, 0, -Math.PI / 2]} color="#ef6f6c" onClick={() => onNudge(NUDGE, 0, 0)} />
      {/* -X (left) */}
      <Arrow pos={[-reach, 0, 0]} rotation={[0, 0, Math.PI / 2]} color="#ef6f6c" onClick={() => onNudge(-NUDGE, 0, 0)} />
      {/* +Z (forward) */}
      <Arrow pos={[0, 0, reach]} rotation={[Math.PI / 2, 0, 0]} color="#5b8def" onClick={() => onNudge(0, 0, NUDGE)} />
      {/* -Z (back) */}
      <Arrow pos={[0, 0, -reach]} rotation={[-Math.PI / 2, 0, 0]} color="#5b8def" onClick={() => onNudge(0, 0, -NUDGE)} />
      {/* +Y (up) */}
      <Arrow pos={[0, reach, 0]} rotation={[0, 0, 0]} color="#7ed957" onClick={() => onNudge(0, NUDGE, 0)} />
      {/* -Y (down) */}
      <Arrow pos={[0, -reach, 0]} rotation={[Math.PI, 0, 0]} color="#7ed957" onClick={() => onNudge(0, -NUDGE, 0)} />
    </group>
  );
}

function DragFloor({ enabled, planeYRef, onMove, onUp }: {
  enabled: boolean;
  planeYRef: React.MutableRefObject<number>;
  onMove: (point: THREE.Vector3) => void;
  onUp: () => void;
}) {
  const { camera, gl } = useThree();

  useEffect(() => {
    if (!enabled) return;
    const dom = gl.domElement;
    const raycaster = new THREE.Raycaster();
    const ndc = new THREE.Vector2();
    const target = new THREE.Vector3();

    const handleMove = (ev: PointerEvent) => {
      const rect = dom.getBoundingClientRect();
      ndc.x = ((ev.clientX - rect.left) / rect.width) * 2 - 1;
      ndc.y = -((ev.clientY - rect.top) / rect.height) * 2 + 1;
      raycaster.setFromCamera(ndc, camera);
      const plane = new THREE.Plane(new THREE.Vector3(0, 1, 0), -planeYRef.current);
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
  }, [enabled, camera, gl, onMove, onUp, planeYRef]);

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
  const [openPanel, setOpenPanel] = useState<null | "size" | "rotate" | "color">(null);

  const selected = items.find((i) => i.id === selectedId) || null;

  const addItem = useCallback((kind: Kind) => {
    const id = Math.random().toString(36).slice(2, 9);
    const base: SimItem = {
      id,
      kind,
      position: [0, 0, 0],
      rotationY: 0,
      rot: [0, 0, 0],
      size: 10,
      color: kind === "cube" ? "#e8c547" : "#cccccc",
    };
    base.position = [0, minY(base), 0];
    const tries = [[0, 0], [12, 0], [-12, 0], [0, 12], [0, -12], [12, 12], [-12, -12]] as const;
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
      // keep above floor
      const minimum = minY(next);
      if (next.position[1] < minimum) next.position = [next.position[0], minimum, next.position[2]];
      if (next.kind === "cube" && !canPlace(prev.filter(p => p.id !== id), next, next.position)) {
        return it;
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

  const nudgeSelected = (dx: number, dy: number, dz: number) => {
    if (!selected) return;
    const minimum = minY(selected);
    const newY = Math.max(minimum, selected.position[1] + dy);
    const newPos: [number, number, number] = [selected.position[0] + dx, newY, selected.position[2] + dz];
    if (canPlace(items, selected, newPos)) {
      setItems((prev) => prev.map((i) => i.id === selected.id ? { ...i, position: newPos } : i));
    }
  };

  // Drag (XZ plane at the item's current Y)
  const dragOffset = useRef<{ ox: number; oz: number }>({ ox: 0, oz: 0 });
  const dragPlaneY = useRef<number>(0);
  const beginDrag = (item: SimItem, e: ThreeEvent<PointerEvent>) => {
    e.stopPropagation();
    setSelectedId(item.id);
    setOpenPanel(null);
    dragPlaneY.current = item.position[1];
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

  // Keyboard
  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (!selected) return;
      const target = e.target as HTMLElement;
      if (target && (target.tagName === "INPUT" || target.tagName === "TEXTAREA")) return;
      if (e.key === "ArrowLeft") { e.preventDefault(); nudgeSelected(-NUDGE, 0, 0); }
      else if (e.key === "ArrowRight") { e.preventDefault(); nudgeSelected(NUDGE, 0, 0); }
      else if (e.key === "ArrowUp") { e.preventDefault(); nudgeSelected(0, 0, -NUDGE); }
      else if (e.key === "ArrowDown") { e.preventDefault(); nudgeSelected(0, 0, NUDGE); }
      else if (e.key === "PageUp" || e.key.toLowerCase() === "e") { e.preventDefault(); nudgeSelected(0, NUDGE, 0); }
      else if (e.key === "PageDown" || e.key.toLowerCase() === "q") { e.preventDefault(); nudgeSelected(0, -NUDGE, 0); }
      else if (e.key === "Delete" || e.key === "Backspace") { e.preventDefault(); deleteSelected(); }
      else if (e.key.toLowerCase() === "r") {
        e.preventDefault();
        if (selected.kind === "cube") updateItem(selected.id, { rotationY: (selected.rotationY + 90) % 360 });
        else updateItem(selected.id, { rot: [selected.rot[0], (selected.rot[1] + 45) % 360, selected.rot[2]] });
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
              "Drag to move on the floor. Use the on-screen arrows or arrow keys / Q-E for up & down. Each step is 5 cm.",
              "اسحب للتحريك على الأرضية. استخدم الأسهم على الشاشة أو لوحة المفاتيح، و Q/E للأعلى والأسفل. كل خطوة ٥ سم."
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
              <p>⌨ {t("Arrows = X/Z (5 cm)", "أسهم = X/Z (٥ سم)")}</p>
              <p>Q / E {t("= Down / Up", "= أسفل / أعلى")}</p>
              <p>R {t("Rotate", "تدوير")}</p>
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

              {selected && <ArrowGizmo item={selected} onNudge={nudgeSelected} />}

              <DragFloor enabled={!!draggingId} planeYRef={dragPlaneY} onMove={onDragMove} onUp={endDrag} />

              <OrbitControls
                enablePan
                enableRotate={!draggingId}
                enableZoom
                makeDefault
                target={[0, 5, 0]}
              />
            </Canvas>

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

                {/* Move grid: XZ + Y */}
                <div className="grid grid-cols-3 gap-1 w-40 mx-auto">
                  <span />
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(0, 0, -NUDGE)}>↑</Button>
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(0, NUDGE, 0)} title="Up">⤴</Button>
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(-NUDGE, 0, 0)}>←</Button>
                  <span className="text-[10px] text-muted-foreground self-center text-center">5cm</span>
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(NUDGE, 0, 0)}>→</Button>
                  <span />
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(0, 0, NUDGE)}>↓</Button>
                  <Button size="sm" variant="outline" onClick={() => nudgeSelected(0, -NUDGE, 0)} title="Down">⤵</Button>
                </div>

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

                <Button variant={openPanel === "rotate" ? "default" : "outline"} className="w-full justify-start" size="sm"
                  onClick={() => setOpenPanel(openPanel === "rotate" ? null : "rotate")}>
                  <RotateCw className="w-4 h-4" /> {t("Rotate", "تدوير")}
                </Button>
                {openPanel === "rotate" && selected.kind === "cube" && (
                  <div className="space-y-1">
                    <div className="text-[10px] text-muted-foreground">Y ({selected.rotationY}°)</div>
                    <div className="grid grid-cols-4 gap-1">
                      {[0, 90, 180, 270].map((r) => (
                        <Button key={r} size="sm" variant={selected.rotationY === r ? "default" : "outline"}
                          onClick={() => updateItem(selected.id, { rotationY: r })}>{r}°</Button>
                      ))}
                    </div>
                  </div>
                )}
                {openPanel === "rotate" && selected.kind === "connecter" && (
                  <div className="space-y-2">
                    {(["X", "Y", "Z"] as const).map((axisLabel, idx) => (
                      <div key={axisLabel} className="space-y-1">
                        <div className="text-[10px] text-muted-foreground">
                          {axisLabel} ({selected.rot[idx]}°)
                        </div>
                        <div className="grid grid-cols-4 gap-1">
                          {[0, 45, 90, 135, 180, 225, 270, 315].map((r) => (
                            <Button
                              key={r}
                              size="sm"
                              variant={selected.rot[idx] === r ? "default" : "outline"}
                              className="text-[10px] px-1"
                              onClick={() => {
                                const newRot = [...selected.rot] as [number, number, number];
                                newRot[idx] = r;
                                updateItem(selected.id, { rot: newRot });
                              }}
                            >{r}°</Button>
                          ))}
                        </div>
                      </div>
                    ))}
                    <Button size="sm" variant="ghost" className="w-full"
                      onClick={() => updateItem(selected.id, { rot: [0, 0, 0] })}>
                      <Move3d className="w-3 h-3" /> {t("Reset rotation", "إعادة ضبط")}
                    </Button>
                  </div>
                )}

                <Button variant={openPanel === "color" ? "default" : "outline"} className="w-full justify-start" size="sm"
                  onClick={() => setOpenPanel(openPanel === "color" ? null : "color")}>
                  <Palette className="w-4 h-4" /> {t("Color", "اللون")}
                </Button>
                {openPanel === "color" && (
                  <div className="space-y-2">
                    <div className="grid grid-cols-7 gap-1">
                      {PRESET_COLORS.map((c) => (
                        <button key={c} className="w-7 h-7 rounded border-2"
                          style={{ background: c, borderColor: selected.color === c ? "#ffd34d" : "transparent" }}
                          onClick={() => updateItem(selected.id, { color: c })} />
                      ))}
                    </div>
                    <div className="flex items-center gap-2">
                      <input
                        type="color"
                        value={selected.color}
                        onChange={(e) => updateItem(selected.id, { color: e.target.value })}
                        className="h-8 w-12 rounded border bg-transparent cursor-pointer"
                      />
                      <span className="text-[10px] text-muted-foreground">{t("Custom color", "لون مخصص")}</span>
                      <span className="text-[10px] font-mono ml-auto">{selected.color}</span>
                    </div>
                  </div>
                )}

                <Button variant="destructive" className="w-full" size="sm" onClick={deleteSelected}>
                  <Trash2 className="w-4 h-4" /> {t("Delete", "حذف")}
                </Button>

                <div className="text-[10px] text-muted-foreground pt-2 border-t">
                  x: {selected.position[0].toFixed(1)} • y: {selected.position[1].toFixed(1)} • z: {selected.position[2].toFixed(1)} cm
                </div>
              </div>
            )}
          </aside>
        </div>
      </div>
    </Layout>
  );
}
