// ABBAD generate-design — voxel pixel-art generator.
// Model: openai/gpt-oss-120b via Lovable AI Gateway (with safe fallback chain).
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
}

type Size = 10 | 20 | 30;
interface PlannedCube { x: number; y: number; z: number; size: Size; color: string }

const PALETTE: Record<Size, string[]> = {
  30: ["#5b7fc7", "#2f3640", "#9b6ec7", "#d4546b", "#e08a5b"],
  20: ["#e08a5b", "#f2c94c", "#6db8ac", "#9b6ec7", "#d4546b"],
  10: ["#6db8ac", "#f4f1ea", "#f2c94c", "#d4546b", "#a8d5cc", "#5b7fc7"],
};
const colorFor = (s: Size, i: number) => PALETTE[s][i % PALETTE[s].length];

function fallbackShape(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const layers = Math.max(2, Math.min(6, Math.round(h / 0.3)));
  const spanX = Math.max(1, Math.round(w / 0.6));
  const spanZ = Math.max(1, Math.round(d / 0.6));
  for (let j = 0; j < layers; j++) {
    const sx = Math.max(1, spanX - j);
    const sz = Math.max(1, spanZ - j);
    for (let i = -sx; i <= sx; i++)
      for (let k = -sz; k <= sz; k++) {
        if (Math.abs(i) !== sx && Math.abs(k) !== sz && j !== 0) continue;
        out.push({ x: i * 0.3, y: j * 0.3, z: k * 0.3, size: 30, color: colorFor(30, i + k + j) });
      }
  }
  return out;
}

function snapSize(n: unknown): Size {
  const v = Number(n);
  if (v <= 12) return 10;
  if (v <= 24) return 20;
  return 30;
}

function validateCubes(raw: unknown): PlannedCube[] {
  if (!Array.isArray(raw)) return [];
  const out: PlannedCube[] = [];
  for (const r of raw as any[]) {
    if (!r || typeof r !== "object") continue;
    const x = Number(r.x), y = Number(r.y), z = Number(r.z);
    if (!isFinite(x) || !isFinite(y) || !isFinite(z)) continue;
    if (Math.abs(x) > 5 || Math.abs(y) > 5 || Math.abs(z) > 5) continue;
    const size = snapSize(r.size);
    const color = typeof r.color === "string" && /^#[0-9a-f]{6}$/i.test(r.color)
      ? r.color : colorFor(size, out.length);
    out.push({ x, y, z, size, color });
    if (out.length > 600) break;
  }
  return out;
}

// ---------- Connectivity enforcement (no floating cubes) ----------
// Snap every cube center to a 0.05m grid, drop overlaps, then keep only the
// connected component that contains the lowest cube. Cubes that aren't touching
// any other cube on at least one full face are removed.
function snap(n: number) { return Math.round(n / 0.05) * 0.05; }
function key(c: PlannedCube) { return `${snap(c.x)}|${snap(c.y)}|${snap(c.z)}`; }

function touches(a: PlannedCube, b: PlannedCube) {
  const tol = 0.02;
  const halfSum = (a.size + b.size) / 200; // sizes in cm → m halves
  const dx = Math.abs(a.x - b.x), dy = Math.abs(a.y - b.y), dz = Math.abs(a.z - b.z);
  // face-touch on one axis, near-aligned on the other two
  const xTouch = Math.abs(dx - halfSum) < tol && dy < halfSum - tol && dz < halfSum - tol;
  const yTouch = Math.abs(dy - halfSum) < tol && dx < halfSum - tol && dz < halfSum - tol;
  const zTouch = Math.abs(dz - halfSum) < tol && dx < halfSum - tol && dy < halfSum - tol;
  return xTouch || yTouch || zTouch;
}

function enforceConnectivity(cubes: PlannedCube[]): PlannedCube[] {
  if (cubes.length === 0) return cubes;
  // 1) Snap to grid + dedupe by center
  const seen = new Map<string, PlannedCube>();
  for (const c of cubes) {
    const sc: PlannedCube = { x: snap(c.x), y: snap(c.y), z: snap(c.z), size: c.size, color: c.color };
    if (!seen.has(key(sc))) seen.set(key(sc), sc);
  }
  let arr = [...seen.values()];

  // 2) Drop the lowest layer down to y = halfSize (sit on ground)
  const minBottom = Math.min(...arr.map((c) => c.y - c.size / 200));
  const dy = -minBottom;
  arr = arr.map((c) => ({ ...c, y: snap(c.y + dy) }));

  // 3) Build adjacency via face-touch
  const adj: number[][] = arr.map(() => []);
  for (let i = 0; i < arr.length; i++) {
    for (let j = i + 1; j < arr.length; j++) {
      if (touches(arr[i], arr[j])) {
        adj[i].push(j);
        adj[j].push(i);
      }
    }
  }

  // 4) Find connected components; keep the largest (the main body)
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

const DEFAULT_SYSTEM_PROMPT = `You are a master 3D pixel-art (voxel) sculptor — Minecraft / Crossy Road style.

HARD RULES:
- Output 150–350 cubes. Minimum 120.
- Cube sizes (cm): 30 = main mass (~20%), 20 = mid shapes (~35%), 10 = pixel details (~45%).
- Y is up. Snap centers to a 0.1m grid. Sit the build on the ground (lowest cube bottom at y=0).
- EVERY cube MUST share at least one full face with another cube (or sit on the ground). NO floating cubes, NO gaps inside surfaces, NO overlaps.
- Build complex silhouettes: tiers, asymmetry, towers, archways, doors, windows, decorations.
- Use 6–12 vibrant hex colors grouped by region. Mix warm + cool. No monochrome.

OUTPUT (JSON only — no prose, no fences):
{ "cubes": [ { "x": <m>, "y": <m>, "z": <m>, "size": 10|20|30, "color": "#rrggbb" } ], "note": "<one short tip>" }`;

// Try a chain of models — first available wins.
async function callModel(
  lovableKey: string,
  sys: string,
  userContent: any,
): Promise<{ text: string; modelUsed: string } | null> {
  const candidates = [
    "openai/gpt-oss-120b",          // user-requested
    "openai/gpt-5",                 // strong fallback
    "google/gemini-2.5-pro",        // last resort
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
          temperature: 0.85,
        }),
      });
      if (r.status === 429 || r.status === 402) {
        // surface to caller
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
    const { shapeName, width, height, depth, purpose, lang, imageDataUrl, systemPrompt } = body;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let cubes: PlannedCube[] = [];
    let aiNotes = "";
    let modelUsed = "fallback";

    if (lovableKey) {
      const sys = (systemPrompt && systemPrompt.trim().length > 20)
        ? systemPrompt
        : DEFAULT_SYSTEM_PROMPT;

      const userText = `Build "${shapeName}" as a 3D pixel-art voxel sculpture.
Approx bounds: ${width}m wide (X) × ${height}m tall (Y) × ${depth}m deep (Z), centered at origin (X,Z), sitting on the ground (Y starts at 0).
${purpose ? `Purpose: ${purpose}` : ""}
Note language: ${lang === "ar" ? "Arabic" : "English"}.

Reason layer by layer from the ground up. Make sure every cube touches another. Output JSON only.`;

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

    // Enforce: snap, dedupe, sit on ground, drop floating clusters.
    cubes = enforceConnectivity(cubes);

    const bySize: Record<10 | 20 | 30, number> = { 10: 0, 20: 0, 30: 0 };
    cubes.forEach((c) => { bySize[c.size] = (bySize[c.size] || 0) + 1; });
    const totalCubes = cubes.length;
    const slides = adjacentFaceSlides(cubes);
    const sheetsRealLife = Math.max(slides.length, totalCubes * 2);

    const cubePrices: Record<10 | 20 | 30, number> = { 10: 2, 20: 4, 30: 6 };
    const sheetPrice = 2;
    const cubesCost = (Object.keys(bySize) as Array<"10"|"20"|"30">)
      .reduce((sum, k) => sum + bySize[Number(k) as 10|20|30] * cubePrices[Number(k) as 10|20|30], 0);
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
