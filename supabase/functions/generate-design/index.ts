// ABBAD generate-design — GPT-OSS-120B via OpenRouter, pixel-art voxel output.
// User controls the system prompt from the UI.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  shapeName: string;
  width: number;
  height: number;
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

function fallbackShape(w: number, h: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const layers = Math.max(2, Math.min(6, Math.round(h / 0.3)));
  for (let j = 0; j < layers; j++) {
    const span = layers - j;
    for (let i = -span; i <= span; i++)
      for (let k = -span; k <= span; k++) {
        if (Math.abs(i) !== span && Math.abs(k) !== span && j !== 0) continue;
        out.push({ x: i * 0.3, y: j * 0.3, z: k * 0.3, size: 30, color: colorFor(30, i + k + j) });
      }
  }
  void w;
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

function adjacentFaceSlides(cubes: PlannedCube[]) {
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

function extractJson(text: string): any | null {
  if (!text) return null;
  // Strip ```json fences
  const fence = text.match(/```(?:json)?\s*([\s\S]*?)```/i);
  const candidate = fence ? fence[1] : text;
  // Try direct parse
  try { return JSON.parse(candidate); } catch { /* fall through */ }
  // Find first { ... last }
  const s = candidate.indexOf("{");
  const e = candidate.lastIndexOf("}");
  if (s >= 0 && e > s) {
    try { return JSON.parse(candidate.slice(s, e + 1)); } catch { /* ignore */ }
  }
  return null;
}

const DEFAULT_SYSTEM_PROMPT = `You are an expert 3D pixel-art (voxel) sculptor in the style of Minecraft and Crossy Road.
You translate user descriptions (and optional reference photos) into rich, recognizable voxel builds.

HARD RULES:
- Output 60–250 cubes. Never fewer than 40. Never one giant block.
- Cube sizes (cm): 30 = main mass, 20 = mid shapes, 10 = pixel details (windows, trim, eyes).
- Y is up. Snap centers to a 0.1m grid. Cubes touch on faces (no floating, no overlap).
- Build a recognizable silhouette: distinct front, sides, top. Include negative space (openings, tiers, steps).
- Use 4–8 vibrant hex colors grouped by region (roof vs walls vs accents).

OUTPUT FORMAT:
Return ONLY a JSON object (no prose, no markdown fences) with this exact shape:
{
  "cubes": [ { "x": <m>, "y": <m>, "z": <m>, "size": 10|20|30, "color": "#rrggbb" }, ... ],
  "note": "<one short assembly tip>"
}`;

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { shapeName, width, height, purpose, lang, imageDataUrl, systemPrompt } = body;
    const orKey = Deno.env.get("OPENROUTER_API_KEY");

    let cubes: PlannedCube[] = [];
    let aiNotes = "";

    if (orKey) {
      const sys = (systemPrompt && systemPrompt.trim().length > 20)
        ? systemPrompt
        : DEFAULT_SYSTEM_PROMPT;

      const userText = `Build "${shapeName}" as a 3D pixel-art voxel sculpture.
Approx footprint: ${width}m wide × ${height}m tall (Y up, centered at origin).
${purpose ? `Purpose: ${purpose}` : ""}
Note language: ${lang === "ar" ? "Arabic" : "English"}.

Think layer by layer from the ground up, then output the JSON.`;

      // GPT-OSS-120B is text-only on most OpenRouter providers; only attach image if present and ignore otherwise.
      const userContent: any = imageDataUrl
        ? [
            { type: "text", text: userText },
            { type: "image_url", image_url: { url: imageDataUrl } },
          ]
        : userText;

      try {
        const r = await fetch("https://openrouter.ai/api/v1/chat/completions", {
          method: "POST",
          headers: {
            Authorization: `Bearer ${orKey}`,
            "Content-Type": "application/json",
            "HTTP-Referer": "https://abbad.lovable.app",
            "X-Title": "ABBAD Studio",
          },
          body: JSON.stringify({
            model: "openai/gpt-oss-120b",
            messages: [
              { role: "system", content: sys },
              { role: "user", content: userContent },
            ],
            temperature: 0.9,
            top_p: 0.95,
            max_tokens: 8000,
            response_format: { type: "json_object" },
          }),
        });

        if (r.status === 429) {
          return new Response(
            JSON.stringify({ error: lang === "ar" ? "تجاوزت الحد المسموح، حاول لاحقًا." : "Rate limit exceeded, try again later." }),
            { status: 429, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (r.status === 402) {
          return new Response(
            JSON.stringify({ error: lang === "ar" ? "الرصيد غير كافٍ." : "AI credits exhausted." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (r.ok) {
          const j = await r.json();
          const text = j.choices?.[0]?.message?.content ?? "";
          const parsed = extractJson(typeof text === "string" ? text : JSON.stringify(text));
          if (parsed) {
            cubes = validateCubes(parsed.cubes);
            aiNotes = typeof parsed.note === "string" ? parsed.note.trim() : "";
          } else {
            console.error("Could not parse model output:", text?.slice?.(0, 400));
          }
        } else {
          console.error("AI call failed", r.status, await r.text());
        }
      } catch (e) {
        console.error("AI exception", e);
      }
    }

    let usedFallback = false;
    if (cubes.length === 0) {
      usedFallback = true;
      cubes = fallbackShape(width, height);
      if (!aiNotes) {
        aiNotes = lang === "ar"
          ? "تعذّر توليد نموذج من الذكاء — تم استخدام شكل احتياطي. جرّب وصفًا أوضح."
          : "AI generation failed — used a fallback shape. Try a clearer description.";
      }
    }

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
