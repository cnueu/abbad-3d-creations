// ABBAD generate-design — code→3D translator using GPT-OSS-120B.
//
// Strategy:
//   1. Let GPT-OSS plan the shape as a low-res VOXEL GRID using cube SIZES (10/20/30 cm).
//      Large cubes form the body; medium for shoulders; small (10 cm) for details
//      (battlements, windows, decorative trim). The model returns JSON only.
//   2. Server validates the JSON, computes deterministic geometry + sheets count
//      (real-life rule: each cube engages dovetails on its faces → sheets ≈ 2 × cubes,
//      but at minimum we count one slide per shared face between adjacent cubes).
//   3. Returns positions for direct rendering, plus per-size summary.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  shapeName: string;
  width: number;   // meters
  height: number;
  depth: number;
  purpose: string;
  lang: "en" | "ar";
}

interface PlannedCube { x: number; y: number; z: number; size: 10 | 20 | 30 }

const COLORS: Record<number, string> = { 10: "#6db8ac", 20: "#e08a5b", 30: "#5b7fc7" };

// Reference assembly inspected from the user's .blend files
const CODE_TO_3D_REFERENCE = `
# Reference assembly (simplest_example.blend) — units: cm
# Two cubes stacked along -Y, joined by 2 vertical dovetail slides.
# A slide is 2.3 x 2.3 x 20 cm and engages BOTH cubes (length = 2 * cube edge).
Cube      pos=(0,  0.000, 0)   size=10x10x10
Cube.001  pos=(-2,-4.407, 0)   size=2.3x2.3x10   # slide column A
Cube.002  pos=( 2,-4.407, 0)   size=2.3x2.3x10   # slide column B
Cube.003  pos=(0,-10.003, 0)   size=10x10x10
# Logic: each pair of adjacent (face-touching) cubes shares ONE dovetail slide.
# In a real build, every cube engages slides on multiple faces → for ordering,
# use sheets_real = 2 * cubes (rule of thumb), and report shared_face_slides too.
`.trim();

function fallbackVoxelize(w: number, h: number, d: number): PlannedCube[] {
  // crude blocky body when the AI fails: castle-ish — body of 30cm cubes,
  // crown of 10cm battlements.
  const cubes: PlannedCube[] = [];
  const wallH = Math.max(0.3, h - 0.1);
  const nx = Math.max(1, Math.round(w / 0.3));
  const nz = Math.max(1, Math.round(d / 0.3));
  const ny = Math.max(1, Math.round(wallH / 0.3));
  for (let i = 0; i < nx; i++)
    for (let k = 0; k < nz; k++)
      for (let j = 0; j < ny; j++) {
        const onShell = i === 0 || i === nx - 1 || k === 0 || k === nz - 1;
        if (!onShell && j !== 0) continue;
        cubes.push({
          x: (i - (nx - 1) / 2) * 0.3,
          y: (j - (ny - 1) / 2) * 0.3,
          z: (k - (nz - 1) / 2) * 0.3,
          size: 30,
        });
      }
  // battlements (10cm) on the top edge
  const topY = ((ny - 1) / 2) * 0.3 + 0.2;
  for (let i = 0; i < nx * 3; i++) {
    if (i % 2 !== 0) continue;
    const x = (i / 3 - (nx - 1) / 2) * 0.3;
    cubes.push({ x, y: topY, z: -((nz - 1) / 2) * 0.3, size: 10 });
    cubes.push({ x, y: topY, z: ((nz - 1) / 2) * 0.3, size: 10 });
  }
  return cubes;
}

function adjacentFaceSlides(cubes: PlannedCube[]) {
  // counts pairs of cubes whose centres differ by exactly half-sum on one axis,
  // and are aligned on the other two (within tolerance) → 1 slide per pair.
  const tol = 0.005;
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { shapeName, width, height, depth, purpose, lang } = body;

    // ── Ask GPT-OSS to plan the shape as JSON voxels ──────────────
    let cubes: PlannedCube[] = [];
    let aiNotes = "";
    const key = Deno.env.get("OPENROUTER_API_KEY");

    if (key) {
      const sys = `You are a CAD shape planner for ABBAD modular blocks.
You must return ONLY valid JSON, no prose.

INVENTORY (the only parts that exist):
- Cube 30cm  → use for the BODY/MAIN MASS of the structure
- Cube 20cm  → use for SHOULDERS, secondary masses, transitions
- Cube 10cm  → use ONLY for DETAILS (battlements, windows, trim, decorations)
- Dovetail slide 2.3x2.3x20 cm → connector (auto-counted, do not include in JSON)

REFERENCE (code → 3D logic):
${CODE_TO_3D_REFERENCE}

RULES:
1. Cubes must NOT overlap. Cubes touch face-to-face (centers differ by half-sum of sizes).
2. Use a MIX of sizes — never one giant cube. A castle = walls (30cm), towers (20cm), battlements (10cm).
3. All positions in METERS, axis-aligned, origin at the centre of the bounding box.
4. Aim for 15-80 cubes total — enough variety, but buildable.
5. Output JSON: { "cubes": [{"x":0,"y":0,"z":0,"size":30}, ...], "notes": "short ${lang === "ar" ? "Arabic" : "English"} assembly summary" }
   - size MUST be 10, 20, or 30
   - notes: 2-4 sentences on assembly order.`;

      const user = `Design this shape:
Name: ${shapeName}
Purpose: ${purpose || "general"}
Bounding box: ${width}m wide × ${height}m tall × ${depth}m deep.
Return the JSON plan now.`;

      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${key}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://abbad.app",
            "X-Title": "ABBAD AI Studio",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: sys },
              { role: "user", content: user },
            ],
            response_format: { type: "json_object" },
            max_tokens: 3000,
            temperature: 0.7,
          }),
        });
        if (r.ok) {
          const j = await r.json();
          const raw = j.choices?.[0]?.message?.content ?? "{}";
          try {
            const parsed = JSON.parse(raw);
            if (Array.isArray(parsed.cubes)) {
              cubes = parsed.cubes
                .filter((c: any) => [10, 20, 30].includes(c.size) && [c.x, c.y, c.z].every((v) => typeof v === "number"))
                .map((c: any) => ({ x: c.x, y: c.y, z: c.z, size: c.size as 10 | 20 | 30 }));
            }
            aiNotes = typeof parsed.notes === "string" ? parsed.notes : "";
          } catch (e) {
            console.error("JSON parse failed", e, raw.slice(0, 200));
          }
        } else {
          const errText = await r.text();
          console.error("OpenRouter error", r.status, errText);
          aiNotes = lang === "ar"
            ? "تعذّر استخدام النموذج، استُخدم تخطيط افتراضي."
            : "AI unavailable — using fallback voxel plan.";
        }
      } catch (e) {
        console.error("AI fetch failed", e);
      }
    }

    if (cubes.length === 0) cubes = fallbackVoxelize(width, height, depth);

    // ── Geometry & counts ─────────────────────────────────────────
    const bySize: Record<10 | 20 | 30, number> = { 10: 0, 20: 0, 30: 0 };
    cubes.forEach((c) => { bySize[c.size] = (bySize[c.size] || 0) + 1; });
    const totalCubes = cubes.length;

    const slides = adjacentFaceSlides(cubes);
    // Real-life ordering rule: each cube engages dovetails on multiple faces,
    // average 2 sheets per cube. Take MAX of geometric pairs and 2×cubes.
    const sheetsRealLife = Math.max(slides.length, totalCubes * 2);

    // Pricing (SAR)
    const cubePrices: Record<10 | 20 | 30, number> = { 10: 35, 20: 95, 30: 180 };
    const sheetPrice = 12;
    const cubesCost = (Object.keys(bySize) as Array<"10"|"20"|"30">)
      .reduce((sum, k) => sum + bySize[Number(k) as 10|20|30] * cubePrices[Number(k) as 10|20|30], 0);
    const total = cubesCost + sheetsRealLife * sheetPrice;

    const placed = cubes.map((c) => ({ ...c, color: COLORS[c.size] }));

    return new Response(
      JSON.stringify({
        cubes: placed,
        slides,
        breakdown: bySize,
        totalCubes,
        sheetsVisible: slides.length,
        sheetsRealLife,
        total,
        aiNotes,
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
