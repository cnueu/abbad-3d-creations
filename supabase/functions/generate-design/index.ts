// ABBAD generate-design — single AI call, pixel-art voxel output.
//
// One model (Lovable AI / google/gemini-2.5-flash) returns a JSON list of
// voxel cubes (size 10/20/30 cm) on a grid. Server validates, computes
// piece counts, sheets (real-life rule: 2 × cubes), and price.

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  shapeName: string;
  width: number;   // meters
  height: number;
  purpose: string;
  lang: "en" | "ar";
  imageDataUrl?: string;
}

type Size = 10 | 20 | 30;
interface PlannedCube { x: number; y: number; z: number; size: Size; color: string }

const PALETTE: Record<Size, string[]> = {
  30: ["#5b7fc7", "#2f3640", "#9b6ec7", "#d4546b", "#e08a5b"],
  20: ["#e08a5b", "#f2c94c", "#6db8ac", "#9b6ec7", "#d4546b"],
  10: ["#6db8ac", "#f4f1ea", "#f2c94c", "#d4546b", "#a8d5cc", "#5b7fc7"],
};
const colorFor = (s: Size, i: number) => PALETTE[s][i % PALETTE[s].length];

// Fallback procedural shape if AI fails — simple stepped pyramid so it's never empty.
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

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { shapeName, width, height, purpose, lang, imageDataUrl } = body;
    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    let cubes: PlannedCube[] = [];
    let aiNotes = "";

    if (lovableKey) {
      const userContent: any[] = [
        {
          type: "text",
          text: `Build "${shapeName}" as a 3D PIXEL-ART sculpture made of axis-aligned cubes.
Approx footprint: ${width}m wide × ${height}m tall (Y is up, centered at origin).
${purpose ? `Purpose: ${purpose}` : ""}

Hard rules:
- Output 60–250 cubes. Never fewer than 40. Never one giant block.
- Cube sizes (cm): 30 = main mass, 20 = mid shapes, 10 = pixel details (windows, trim, antenna, eyes).
- Snap centers to a 0.1m grid. Cubes must touch on faces (no floating, no overlap).
- Build a recognizable silhouette like classic Minecraft / voxel art: distinct front, sides, top.
- Use 4–8 colors total, grouped by region (roof vs walls vs accents). Vibrant, saturated hex colors.
- Include negative space: openings, steps, layered tiers — not a solid box.

Think layer by layer from the ground up. Then call build_voxel.`,
        },
      ];
      if (imageDataUrl) {
        userContent.push({ type: "image_url", image_url: { url: imageDataUrl } });
      }

      try {
        const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-pro",
            messages: [
              {
                role: "system",
                content: "You are an expert 3D pixel-art (voxel) sculptor in the style of Minecraft and Crossy Road. You translate descriptions and reference photos into rich, recognizable voxel builds with 60–250 cubes. You always call build_voxel — never reply with prose. You never return a single big cube; you always sculpt detail.",
              },
              { role: "user", content: userContent },
            ],
            tools: [
              {
                type: "function",
                function: {
                  name: "build_voxel",
                  description: "Return the voxel build as cubes plus a short assembly note.",
                  parameters: {
                    type: "object",
                    properties: {
                      cubes: {
                        type: "array",
                        description: "Pixel-art cubes that compose the shape.",
                        items: {
                          type: "object",
                          properties: {
                            x: { type: "number", description: "x center in meters" },
                            y: { type: "number", description: "y center in meters" },
                            z: { type: "number", description: "z center in meters" },
                            size: { type: "number", enum: [10, 20, 30], description: "cube edge in cm" },
                            color: { type: "string", description: "hex color like #5b7fc7" },
                          },
                          required: ["x", "y", "z", "size"],
                          additionalProperties: false,
                        },
                      },
                      note: {
                        type: "string",
                        description: `One short assembly tip in ${lang === "ar" ? "Arabic" : "English"}.`,
                      },
                    },
                    required: ["cubes", "note"],
                    additionalProperties: false,
                  },
                },
              },
            ],
            tool_choice: { type: "function", function: { name: "build_voxel" } },
            temperature: 0.7,
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
            JSON.stringify({ error: lang === "ar" ? "الرصيد غير كافٍ، أضف رصيدًا للذكاء." : "AI credits exhausted." }),
            { status: 402, headers: { ...corsHeaders, "Content-Type": "application/json" } }
          );
        }
        if (r.ok) {
          const j = await r.json();
          const call = j.choices?.[0]?.message?.tool_calls?.[0];
          if (call?.function?.arguments) {
            try {
              const parsed = JSON.parse(call.function.arguments);
              cubes = validateCubes(parsed.cubes);
              aiNotes = typeof parsed.note === "string" ? parsed.note.trim() : "";
            } catch (e) {
              console.error("Failed to parse tool args", e);
            }
          }
        } else {
          console.error("AI call failed", r.status, await r.text());
        }
      } catch (e) {
        console.error("AI exception", e);
      }
    }

    if (cubes.length === 0) {
      cubes = fallbackShape(width, height);
      if (!aiNotes) {
        aiNotes = lang === "ar"
          ? "ابدأ بالأساس من 30 سم، ثم ارفع الجدران، ثم أضف تفاصيل 10 سم. كل مكعب يحتاج تقريبًا قطعتي صفيحة."
          : "Start with the 30cm base, raise the walls, then add 10cm pixel details. Each cube needs ~2 sheets in real life.";
      }
    }

    // Counts, slides, pricing
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
