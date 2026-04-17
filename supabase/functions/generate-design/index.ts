// ABBAD generate-design — deterministic geometry + GPT-OSS narrative.
// Geometry source of truth: holedCube.blend (10cm cube) + Dovetail_slide.blend (2.3×2.3×20cm).
// Connection rule (per user spec): "each 2 adjacent cubes share 1 dovetail slide".

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

// --- Code context handed to GPT-OSS so it can "translate code → 3D" ---
const SIMPLEST_EXAMPLE_PSEUDOCODE = `
# Reference assembly inspected from simplest_example.blend
# Two 10cm cubes stacked along -Y, joined by 2 vertical dovetail slides
# (one slide engages 2 cubes — slide length 20cm = 2 × cube edge).
Cube      at (0,  0.000, 0)   size = 10x10x10
Cube.001  at (-2, -4.407, 0)  size = 2.3 x 2.3 x 10  # slide column A
Cube.002  at ( 2, -4.407, 0)  size = 2.3 x 2.3 x 10  # slide column B
Cube.003  at (0, -10.003, 0)  size = 10x10x10
# Logic: each pair of adjacent cubes shares ONE dovetail slide.
`.trim();

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { shapeName, width, height, depth, purpose, lang } = body;

    // ── Deterministic geometry math (truth source) ─────────────────
    const cubeSize = 10;          // cm — only one cube size exists
    const sizeM = cubeSize / 100; // 0.1 m
    const nx = Math.max(1, Math.ceil(width / sizeM));
    const ny = Math.max(1, Math.ceil(height / sizeM));
    const nz = Math.max(1, Math.ceil(depth / sizeM));
    const cubes = nx * ny * nz;
    // Each pair of adjacent cubes (sharing a face) → 1 dovetail slide
    const sheets =
      (nx - 1) * ny * nz + nx * (ny - 1) * nz + nx * ny * (nz - 1);

    // Pricing
    const cubeUnit = 35;
    const sheetUnit = 12;
    const total = cubes * cubeUnit + sheets * sheetUnit;

    // ── Ask GPT-OSS for narrative notes (with reference example) ──
    let aiNotes = "";
    const key = Deno.env.get("OPENROUTER_API_KEY");
    if (key) {
      const sys =
        lang === "ar"
          ? `أنت مهندس تصميم في "أبعاد". لديك قطعتان فقط:
- مكعب 10×10×10 سم (مع شقوق رأس سهم على الأوجه الأربعة العمودية)
- شريحة ربط رأس سهم 2.3×2.3×20 سم (تربط مكعبين متجاورين)
استخدم المثال المرجعي كـ"شيفرة → ثلاثي الأبعاد" لفهم آلية الربط، ثم أعطِ ٣-٥ نقاط عملية لتجميع الشكل.

المرجع:
${SIMPLEST_EXAMPLE_PSEUDOCODE}`
          : `You are a design engineer at ABBAD. You have ONLY two parts:
- Cube  10×10×10 cm (with dovetail slots on the 4 vertical faces)
- Dovetail slide  2.3×2.3×20 cm (joins TWO adjacent cubes)
Use the reference example as a "code → 3D" template to understand the joinery, then give 3-5 practical bullets on how to assemble the requested shape.

REFERENCE:
${SIMPLEST_EXAMPLE_PSEUDOCODE}`;

      const user = `Shape: ${shapeName}
Purpose: ${purpose}
Target dimensions: ${width}m × ${height}m × ${depth}m
Computed grid: ${nx} × ${ny} × ${nz} cubes (${cubes} total), ${sheets} dovetail slides.
Cube edge: ${cubeSize}cm.`;

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
            max_tokens: 500,
            temperature: 0.4,
          }),
        });
        if (r.ok) {
          const j = await r.json();
          aiNotes = j.choices?.[0]?.message?.content ?? "";
        } else {
          const errText = await r.text();
          console.error("OpenRouter error", r.status, errText);
          aiNotes =
            lang === "ar"
              ? "تعذّر الاتصال بنموذج الذكاء حالياً، لكن الحساب الهندسي مكتمل أعلاه."
              : "AI model unavailable right now, but the geometric calculation above is complete.";
        }
      } catch (e) {
        console.error("AI fetch failed", e);
      }
    }

    // ── Build cube positions (centered grid, units = meters) ───────
    const positions: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++)
        for (let k = 0; k < nz; k++)
          positions.push({
            x: (i - (nx - 1) / 2) * sizeM,
            y: (j - (ny - 1) / 2) * sizeM,
            z: (k - (nz - 1) / 2) * sizeM,
          });

    // ── Build dovetail-slide segments (one per shared face) ────────
    // axis 0=x,1=y,2=z; each slide sits between two neighboring cubes.
    const slides: { ax: 0 | 1 | 2; mid: { x: number; y: number; z: number } }[] = [];
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++)
        for (let k = 0; k < nz; k++) {
          const cx = (i - (nx - 1) / 2) * sizeM;
          const cy = (j - (ny - 1) / 2) * sizeM;
          const cz = (k - (nz - 1) / 2) * sizeM;
          if (i + 1 < nx) slides.push({ ax: 0, mid: { x: cx + sizeM / 2, y: cy, z: cz } });
          if (j + 1 < ny) slides.push({ ax: 1, mid: { x: cx, y: cy + sizeM / 2, z: cz } });
          if (k + 1 < nz) slides.push({ ax: 2, mid: { x: cx, y: cy, z: cz + sizeM / 2 } });
        }

    return new Response(
      JSON.stringify({
        grid: { nx, ny, nz },
        cubes,
        sheets,
        cubeSize,
        cubeUnit,
        sheetUnit,
        total,
        positions,
        slides,
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
