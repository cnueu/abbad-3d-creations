// ABBAD generate-design — voxel pixel-art generator.
// Model: google/gemini-2.5-pro via Lovable AI Gateway (with safe fallback chain).
// Post-process enforces: snap-to-grid, no overlaps, no floating cubes (every
// non-ground cube must touch another cube on a face — gravity-style flood fill).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  shapeName: string;
  width: number;
  height: number;
  depth: number;
  purpose: string;
  lang: "en" | "ar";
  imageDataUrl?: string;
  systemPrompt?: string;
  // ── DETAIL LEVEL ──────────────────────────────────────────────
  // Sent from src/pages/Studio.tsx — controls target cube count.
  detailLevel?: "simple" | "balanced" | "intricate";
}

type Size = 10 | 20 | 30 | 40 | 50;
interface PlannedCube { x: number; y: number; z: number; size: Size; color: string }

const PALETTE: Record<Size, string[]> = {
  50: ["#3a4a6b", "#2f3640", "#5b3a5e", "#6b3a3a"],
  40: ["#5b7fc7", "#4a6b8a", "#7a5ea8", "#a8505f"],
  30: ["#5b7fc7", "#9b6ec7", "#d4546b", "#e08a5b", "#3a8f7a"],
  20: ["#e08a5b", "#f2c94c", "#6db8ac", "#9b6ec7", "#d4546b", "#5b7fc7"],
  10: ["#6db8ac", "#f4f1ea", "#f2c94c", "#d4546b", "#a8d5cc", "#5b7fc7", "#ff7a59", "#7ed957"],
};
const colorFor = (s: Size, i: number) => PALETTE[s][i % PALETTE[s].length];

function fallbackShape(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const layers = Math.max(3, Math.min(8, Math.round(h / 0.2)));
  const spanX = Math.max(2, Math.round(w / 0.4));
  const spanZ = Math.max(2, Math.round(d / 0.4));
  for (let j = 0; j < layers; j++) {
    const sx = Math.max(1, spanX - Math.floor(j / 2));
    const sz = Math.max(1, spanZ - Math.floor(j / 2));
    for (let i = -sx; i <= sx; i++)
      for (let k = -sz; k <= sz; k++) {
        const isShell = Math.abs(i) === sx || Math.abs(k) === sz || j === 0;
        if (!isShell && j !== 0) continue;
        const size: Size = (j === 0 && Math.abs(i) === sx && Math.abs(k) === sz) ? 30 : (j > layers - 2 ? 10 : 20);
        const step = size / 100;
        out.push({ x: i * step, y: j * 0.2, z: k * step, size, color: colorFor(size, i + k + j) });
      }
  }
  return out;
}

function snapSize(n: unknown): Size {
  const v = Number(n);
  if (v <= 12) return 10;
  if (v <= 24) return 20;
  if (v <= 34) return 30;
  if (v <= 44) return 40;
  return 50;
}

function validateCubes(raw: unknown): PlannedCube[] {
  if (!Array.isArray(raw)) return [];
  const out: PlannedCube[] = [];
  for (const r of raw as any[]) {
    if (!r || typeof r !== "object") continue;
    const x = Number(r.x), y = Number(r.y), z = Number(r.z);
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue;
    if (Math.abs(x) > 6 || Math.abs(y) > 6 || Math.abs(z) > 6) continue;
    const size = snapSize(r.size);
    const color = typeof r.color === "string" && /^#[0-9a-f]{6}$/i.test(r.color)
      ? r.color : colorFor(size, out.length);
    out.push({ x, y, z, size, color });
    if (out.length > 800) break;
  }
  return out;
}

// ---------- Connectivity enforcement (no floating cubes) ----------
function snap(n: number) { return Math.round(n / 0.05) * 0.05; }
function key(c: PlannedCube) { return `${snap(c.x)}|${snap(c.y)}|${snap(c.z)}`; }

function touches(a: PlannedCube, b: PlannedCube) {
  const tol = 0.025;
  const halfSum = (a.size + b.size) / 200;
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y), dz = Math.abs(a.z - b.z);
  const xTouch = Math.abs(dx - halfSum) < tol && dy < halfSum - tol && dz < halfSum - tol;
  const yTouch = Math.abs(dy - halfSum) < tol && dx < halfSum - tol && dz < halfSum - tol;
  const zTouch = Math.abs(dz - halfSum) < tol && dx < halfSum - tol && dy < halfSum - tol;
  return xTouch || yTouch || zTouch;
}

function enforceConnectivity(cubes: PlannedCube[]): PlannedCube[] {
  if (cubes.length === 0) return cubes;
  const seen = new Map<string, PlannedCube>();
  for (const c of cubes) {
    const sc: PlannedCube = { x: snap(c.x), y: snap(c.y), z: snap(c.z), size: c.size, color: c.color };
    if (!seen.has(key(sc))) seen.set(key(sc), sc);
  }
  let arr = [...seen.values()];

  const minBottom = Math.min(...arr.map((c) => c.y - c.size / 200));
  const dy = -minBottom;
  arr = arr.map((c) => ({ ...c, y: snap(c.y + dy) }));

  const adj: number[][] = arr.map(() => []);
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (touches(arr[i], arr[j])) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  const comp = new Array(arr.length).fill(-1);
  let cid = 0;
  const sizes: number[] = [];
  for (let i = 0; i < arr.length; i++) {
    if (comp[i] !== -1) continue;
    const queue = [i]; comp[i] = cid; let count = 0;
    while (queue.length) {
      const n = queue.shift()!; count++;
      for (const nb of adj[n]) if (comp[nb] === -1) { comp[nb] = cid; queue.push(nb); }
    }
    sizes.push(count);
    cid++;
  }
  let keep = 0;
  for (let i = 1; i < sizes.length; i++) if (sizes[i] > sizes[keep]) keep = i;
  return arr.filter((_, i) => comp[i] === keep);
}

function adjacentFaceSlides(cubes: PlannedCube[]) {
  const tol = 0.02;
  const slides: { ax: 0 | 1 | 2; mid: { x: number; y: number; z: number } }[] = [];
  for (let i = 0; i < cubes.length; i++) {
    for (let j = i + 1; j < cubes.length; j++) {
      const a = cubes[i], b = cubes[j];
      const half = (a.size + b.size) / 200;
      const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y), dz = Math.abs(a.z - b.z);
      if (Math.abs(dx - half) < tol && dy < tol && dz < tol)
        slides.push({ ax: 0, mid: { x: (a.x + b.x) / 2, y: a.y, z: a.z } });
      else if (Math.abs(dy - half) < tol && dx < tol && dz < tol)
        slides.push({ ax: 1, mid: { x: a.x, y: (a.y + b.y) / 2, z: a.z } });
      else if (Math.abs(dz - half) < tol && dx < tol && dy < tol)
        slides.push({ ax: 2, mid: { x: a.x, y: a.y, z: (a.z + b.z) / 2 } });
    }
  }
  return slides;
}

function extractJson(text: string): any | null {
  if (!text) return null;
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  try { return JSON.parse(candidate); } catch { /* fall through */ }
  const s = candidate.indexOf("{");
  const e = candidate.lastIndexOf("}");
  if (s >= 0 && e > s) {
    try { return JSON.parse(candidate.slice(s, e + 1)); } catch { /* ignore */ }
  }
  return null;
}

const DEFAULT_SYSTEM_PROMPT = `You are a master 3D pixel-art (voxel) sculptor — Minecraft / Crossy Road style, but ULTRA detailed.

HARD RULES:
- Output 250–500 cubes. Minimum 200. More detail = better.
- Cube sizes available (cm): 50, 40, 30, 20, 10.
  • 50cm = massive base / core mass (~5%)
  • 40cm = large structural blocks (~10%)
  • 30cm = mid-mass walls / towers (~20%)
  • 20cm = mid details, trims, edges (~25%)
  • 10cm = pixel details, decorations, accents (~40%)
- Y is up. Snap centers to a 0.05m grid. Sit the build on the ground (lowest cube bottom at y=0).
- EVERY cube MUST share at least one full face with another cube (or sit on the ground). NO floating cubes, NO gaps inside surfaces, NO overlaps (centers must differ).
- Build COMPLEX silhouettes: tiers, asymmetry, towers, archways, doors, windows, flags, antennas, ornamental crowns, balconies, stairs, overhangs.
- Use 8–14 vibrant hex colors grouped by region (roof, walls, windows, accents). Mix warm + cool. No monochrome. Smaller cubes carry the boldest accent colors.

OUTPUT (JSON only — no prose, no fences):
{ "cubes": [ { "x": <m>, "y": <m>, "z": <m>, "size": 10|20|30|40|50, "color": "#rrggbb" } ], "note": "<one short tip>" }`;

async function callModel(
  lovableKey: string,
  sys: string,
  userContent: any,
): Promise<{ text: string; modelUsed: string } | null> {
  const candidates = [
    "google/gemini-2.5-flash",      // primary — fast + multimodal, fits edge timeout
    "google/gemini-3-flash-preview",// fallback
    "google/gemini-2.5-pro",        // last resort, slow but strongest
  ];
  for (const model of candidates) {
    try {
      const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
        method: "POST",
        headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: sys },
            { role: "user", content: userContent },
          ],
          temperature: 0.9,
        }),
      });
      if (r.status === 429 || r.status === 402) {
        return { text: `__STATUS__${r.status}`, modelUsed: model };
      }
      if (!r.ok) {
        const errTxt = await r.text();
        console.error(`Model ${model} failed`, r.status, errTxt.slice(0, 300));
        continue;
      }
      const j = await r.json();
      const text = j.choices?.[0]?.message?.content ?? "";
      if (text) return { text: typeof text === "string" ? text : JSON.stringify(text), modelUsed: model };
    } catch (e) {
      console.error(`Model ${model} threw`, e);
    }
  }
  return null;
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { shapeName, width, height, depth, purpose, lang, imageDataUrl, systemPrompt, detailLevel } = body;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    // ── DETAIL LEVEL → target cube count ─────────────────────────
    const detailTargets: Record<string, { min: number; max: number }> = {
      simple:    { min: 100, max: 200 },
      balanced:  { min: 220, max: 380 },
      intricate: { min: 380, max: 550 },
    };
    const target = detailTargets[detailLevel || "balanced"];

    let cubes: PlannedCube[] = [];
    let aiNotes = "";
    let modelUsed = "fallback";

    if (lovableKey) {
      const sys = (systemPrompt && systemPrompt.trim().length > 20)
        ? systemPrompt
        : DEFAULT_SYSTEM_PROMPT;

      const userText = `Build "${shapeName}" as a 3D pixel-art voxel sculpture — make it INTRICATE.
Approx bounds: ${width}m wide (X) × ${height}m tall (Y) × ${depth}m deep (Z), centered at origin (X,Z), sitting on the ground (Y starts at 0).
${purpose ? `Purpose: ${purpose}` : ""}
Detail level: ${detailLevel || "balanced"} — produce between ${target.min} and ${target.max} cubes.
Note language: ${lang === "ar" ? "Arabic" : "English"}.

Reason layer by layer from the ground up. Use ALL five sizes (10, 20, 30, 40, 50 cm). Pack ${target.min}+ cubes. Make sure every cube touches another. Output JSON only.`;

      const userContent: any = imageDataUrl
        ? [{ type: "text", text: userText }, { type: "image_url", image_url: { url: imageDataUrl } }]
        : userText;

      const result = await callModel(lovableKey, sys, userContent);
      if (result?.text?.startsWith("__STATUS__")) {
        const st = Number(result.text.replace("__STATUS__", ""));
        return new Response(
          JSON.stringify({
            error: st === 429
              ? (lang === "ar" ? "تجاوزت الحد المسموح، حاول لاحقًا." : "Rate limit exceeded, try again later.")
              : (lang === "ar" ? "الرصيد غير كافٍ." : "AI credits exhausted."),
          }),
          { status: st, headers: { ...corsHeaders, "Content-Type": "application/json" } }
        );
      }
      if (result) {
        modelUsed = result.modelUsed;
        const parsed = extractJson(result.text);
        if (parsed) {
          cubes = validateCubes(parsed.cubes);
          aiNotes = typeof parsed.note === "string" ? parsed.note.trim() : "";
        } else {
          console.error("Could not parse model output:", result.text?.slice?.(0, 400));
        }
      }
    }

    let usedFallback = false;
    if (cubes.length === 0) {
      usedFallback = true;
      cubes = fallbackShape(width, height, depth);
      if (!aiNotes) {
        aiNotes = lang === "ar"
          ? "تعذّر توليد نموذج من الذكاء — تم استخدام شكل احتياطي. جرّب وصفًا أوضح."
          : "AI generation failed — used a fallback shape. Try a clearer description.";
      }
    }

    cubes = enforceConnectivity(cubes);

    const bySize: Record<Size, number> = { 10: 0, 20: 0, 30: 0, 40: 0, 50: 0 };
    cubes.forEach((c) => { bySize[c.size] = (bySize[c.size] || 0) + 1; });
    const totalCubes = cubes.length;
    const slides = adjacentFaceSlides(cubes);
    const sheetsRealLife = Math.max(slides.length, totalCubes * 2);

    const cubePrices: Record<Size, number> = { 10: 2, 20: 4, 30: 6, 40: 9, 50: 12 };
    const sheetPrice = 2;
    const cubesCost = ([10, 20, 30, 40, 50] as Size[])
      .reduce((sum, k) => sum + bySize[k] * cubePrices[k], 0);
    const total = cubesCost + sheetsRealLife * sheetPrice;

    return new Response(
      JSON.stringify({
        cubes,
        slides,
        breakdown: bySize,
        totalCubes,
        sheetsVisible: slides.length,
        sheetsRealLife,
        total,
        aiNotes,
        usedFallback,
        modelUsed,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-design error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
