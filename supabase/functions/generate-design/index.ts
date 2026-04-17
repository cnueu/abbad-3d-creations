// ABBAD generate-design — pixel-art voxel translator.
//
// Pipeline:
//   1. Procedural voxel templates (castle, house, tree, car, tower, pyramid,
//      arch, throne) provide a STRONG baseline so we never return a single
//      giant cube. Templates use a mix of 30/20/10 cm cubes:
//         - 30cm = mass / walls
//         - 20cm = transitions (towers, shoulders)
//         - 10cm = pixel-art details (battlements, windows, trim)
//   2. The AI (GPT-OSS-120B via OpenRouter) is asked for a JSON edit list:
//      add / remove cubes on top of the template. We validate and apply.
//   3. Server computes counts, sheets (real-life rule: 2 × cubes), and price.

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
  imageDataUrl?: string; // optional reference photo (data URL)
}

type Size = 10 | 20 | 30;
interface PlannedCube { x: number; y: number; z: number; size: Size; color?: string }

// More colors for the pixel-art look. Pick by size + index.
const PALETTE: Record<Size, string[]> = {
  30: ["#5b7fc7", "#2f3640", "#9b6ec7", "#d4546b"],
  20: ["#e08a5b", "#f2c94c", "#6db8ac", "#9b6ec7"],
  10: ["#6db8ac", "#f4f1ea", "#f2c94c", "#d4546b", "#a8d5cc"],
};
const colorFor = (s: Size, i: number) => PALETTE[s][i % PALETTE[s].length];

// ───────────────────────── procedural pixel-art templates ─────────────────────────
// Origin: bounding box centered at (0,0,0). Y is up.
function tplCastle(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const nx = Math.max(3, Math.round(w / 0.3));
  const nz = Math.max(3, Math.round(d / 0.3));
  const ny = Math.max(2, Math.round(h / 0.3));
  // perimeter walls of 30cm
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      for (let k = 0; k < nz; k++) {
        const onShell = i === 0 || i === nx - 1 || k === 0 || k === nz - 1;
        if (!onShell) continue;
        out.push({
          x: (i - (nx - 1) / 2) * 0.3,
          y: (j - (ny - 1) / 2) * 0.3,
          z: (k - (nz - 1) / 2) * 0.3,
          size: 30, color: "#5b7fc7",
        });
      }
  // 20cm corner towers (taller than walls)
  const corners = [[0, 0], [nx - 1, 0], [0, nz - 1], [nx - 1, nz - 1]];
  for (const [ci, ck] of corners) {
    for (let j = 0; j < ny + 2; j++) {
      out.push({
        x: (ci - (nx - 1) / 2) * 0.3,
        y: (j - (ny - 1) / 2) * 0.3 + 0.05,
        z: (ck - (nz - 1) / 2) * 0.3,
        size: 20, color: "#2f3640",
      });
    }
  }
  // 10cm battlements along top edge
  const topY = ((ny - 1) / 2) * 0.3 + 0.18;
  const step = 0.2;
  for (let i = 0; i < nx; i++) {
    if (i % 2 !== 0) continue;
    const x = (i - (nx - 1) / 2) * 0.3;
    out.push({ x, y: topY, z: -((nz - 1) / 2) * 0.3, size: 10, color: "#f4f1ea" });
    out.push({ x, y: topY, z:  ((nz - 1) / 2) * 0.3, size: 10, color: "#f4f1ea" });
  }
  for (let k = 0; k < nz; k++) {
    if (k % 2 !== 0) continue;
    const z = (k - (nz - 1) / 2) * 0.3;
    out.push({ x: -((nx - 1) / 2) * 0.3, y: topY, z, size: 10, color: "#f4f1ea" });
    out.push({ x:  ((nx - 1) / 2) * 0.3, y: topY, z, size: 10, color: "#f4f1ea" });
  }
  // gate detail (10cm) front centre
  out.push({ x: 0, y: -((ny - 1) / 2) * 0.3, z: ((nz - 1) / 2) * 0.3 + 0.16, size: 10, color: "#2f3640" });
  void step;
  return out;
}

function tplHouse(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const nx = Math.max(2, Math.round(w / 0.3));
  const nz = Math.max(2, Math.round(d / 0.3));
  const ny = Math.max(2, Math.round((h * 0.6) / 0.3));
  for (let j = 0; j < ny; j++)
    for (let i = 0; i < nx; i++)
      for (let k = 0; k < nz; k++) {
        const onShell = i === 0 || i === nx - 1 || k === 0 || k === nz - 1;
        if (!onShell) continue;
        out.push({ x: (i - (nx-1)/2)*0.3, y: (j - (ny-1)/2)*0.3, z: (k - (nz-1)/2)*0.3, size: 30, color: "#e08a5b" });
      }
  // pitched roof from 20cm
  const roofRows = Math.max(1, Math.floor(nx / 2));
  for (let r = 0; r < roofRows; r++) {
    for (let k = 0; k < nz; k++) {
      out.push({ x: (r - (nx-1)/2)*0.3 + 0.15, y: ((ny-1)/2)*0.3 + 0.2 + r*0.2, z:(k-(nz-1)/2)*0.3, size: 20, color: "#d4546b" });
      out.push({ x: ((nx-1-r) - (nx-1)/2)*0.3 - 0.15, y: ((ny-1)/2)*0.3 + 0.2 + r*0.2, z:(k-(nz-1)/2)*0.3, size: 20, color: "#d4546b" });
    }
  }
  // door + window 10cm
  out.push({ x: 0, y: -((ny-1)/2)*0.3, z: ((nz-1)/2)*0.3 + 0.16, size: 10, color: "#2f3640" });
  out.push({ x: 0.2, y: -((ny-1)/2)*0.3 + 0.2, z: ((nz-1)/2)*0.3 + 0.16, size: 10, color: "#f2c94c" });
  return out;
}

function tplTree(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const trunkH = Math.max(1, Math.round((h * 0.4) / 0.2));
  for (let j = 0; j < trunkH; j++)
    out.push({ x: 0, y: (j - trunkH/2) * 0.2, z: 0, size: 20, color: "#8b5a2b" });
  // foliage: cluster of 10cm cubes in a rough sphere
  const r = Math.max(0.25, Math.min(w, d) / 2);
  const cy = trunkH * 0.2 / 2 + r * 0.6;
  for (let x = -r; x <= r; x += 0.1)
    for (let y = -r; y <= r; y += 0.1)
      for (let z = -r; z <= r; z += 0.1) {
        const dist = Math.hypot(x, y, z);
        if (dist > r) continue;
        if (Math.random() > 0.6) continue;
        out.push({ x, y: y + cy, z, size: 10, color: Math.random() > 0.3 ? "#6db8ac" : "#5b7fc7" });
      }
  return out;
}

function tplTower(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const ny = Math.max(3, Math.round(h / 0.3));
  const r = Math.max(1, Math.round(Math.min(w, d) / 0.6));
  for (let j = 0; j < ny; j++) {
    for (let i = -r; i <= r; i++)
      for (let k = -r; k <= r; k++) {
        if (Math.abs(i) !== r && Math.abs(k) !== r) continue;
        out.push({ x: i * 0.3, y: (j - (ny-1)/2)*0.3, z: k * 0.3, size: 30, color: "#9b6ec7" });
      }
  }
  // top crown 10cm
  for (let i = -r; i <= r; i++)
    for (let k = -r; k <= r; k++)
      if (Math.abs(i) === r || Math.abs(k) === r)
        if ((i + k) % 2 === 0)
          out.push({ x: i * 0.3, y: ((ny-1)/2)*0.3 + 0.2, z: k * 0.3, size: 10, color: "#f2c94c" });
  return out;
}

function tplPyramid(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const layers = Math.max(2, Math.round(h / 0.3));
  for (let j = 0; j < layers; j++) {
    const span = layers - j;
    for (let i = -span; i <= span; i++)
      for (let k = -span; k <= span; k++) {
        if (Math.abs(i) !== span && Math.abs(k) !== span && j !== 0) continue;
        out.push({ x: i * 0.3, y: j * 0.3, z: k * 0.3, size: 30, color: "#f2c94c" });
      }
  }
  void w; void d;
  return out;
}

function tplArch(w: number, h: number, d: number): PlannedCube[] {
  const out: PlannedCube[] = [];
  const wN = Math.max(3, Math.round(w / 0.3));
  const hN = Math.max(3, Math.round(h / 0.3));
  const cx = (wN - 1) / 2;
  const r = Math.min(cx, hN - 1);
  for (let i = 0; i < wN; i++)
    for (let j = 0; j < hN; j++)
      for (let k = 0; k < Math.max(1, Math.round(d / 0.3)); k++) {
        const dx = i - cx;
        const dy = j;
        const dist = Math.hypot(dx, dy);
        const inside = dist < r - 0.5 && j < hN - 1;
        if (inside) continue;
        if (j > hN - 1 && dist > r) continue;
        out.push({
          x: (i - cx) * 0.3,
          y: (j - (hN - 1) / 2) * 0.3,
          z: (k - 0.5) * 0.3,
          size: dist > r - 0.6 && dist < r + 0.6 ? 20 : 30,
          color: dist > r - 0.6 && dist < r + 0.6 ? "#e08a5b" : "#5b7fc7",
        });
      }
  return out;
}

function pickTemplate(name: string, w: number, h: number, d: number): { cubes: PlannedCube[]; tag: string } {
  const n = name.toLowerCase();
  if (/(قلعة|قلاع|castle|fort|citadel)/i.test(n))   return { cubes: tplCastle(w, h, d),  tag: "castle" };
  if (/(منزل|بيت|house|home|cabin|cottage)/i.test(n)) return { cubes: tplHouse(w, h, d),   tag: "house" };
  if (/(شجرة|tree|bush|plant)/i.test(n))             return { cubes: tplTree(w, h, d),    tag: "tree" };
  if (/(برج|tower|minaret|spire)/i.test(n))          return { cubes: tplTower(w, h, d),   tag: "tower" };
  if (/(هرم|pyramid|ziggurat)/i.test(n))             return { cubes: tplPyramid(w, h, d), tag: "pyramid" };
  if (/(قوس|بوابة|arch|gate|gateway|portal)/i.test(n)) return { cubes: tplArch(w, h, d),  tag: "arch" };
  // default → castle is the most expressive template
  return { cubes: tplCastle(w, h, d), tag: "castle" };
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
    const { shapeName, width, height, depth, purpose, lang, imageDataUrl } = body;

    const lovableKey = Deno.env.get("LOVABLE_API_KEY");

    // ─── Stage 1: VISION (optional) — analyze user photo with Gemini 2.5 Flash
    let visionDescription = "";
    let templateHintFromImage = "";
    if (imageDataUrl && lovableKey) {
      try {
        const v = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
          method: "POST",
          headers: { Authorization: `Bearer ${lovableKey}`, "Content-Type": "application/json" },
          body: JSON.stringify({
            model: "google/gemini-2.5-flash",
            messages: [
              {
                role: "system",
                content: "You analyze reference images for a pixel-art voxel builder. Reply with EXACTLY two short lines:\nLINE 1: one of [castle, house, tree, tower, pyramid, arch, throne]\nLINE 2: a 1-sentence description of the structure (style, distinctive features, colors).",
              },
              {
                role: "user",
                content: [
                  { type: "text", text: "Classify this reference image and describe it." },
                  { type: "image_url", image_url: { url: imageDataUrl } },
                ],
              },
            ],
            max_tokens: 120,
            temperature: 0.3,
          }),
        });
        if (v.ok) {
          const j = await v.json();
          const txt: string = j.choices?.[0]?.message?.content?.trim() ?? "";
          const [l1, ...rest] = txt.split("\n").map((s) => s.trim()).filter(Boolean);
          templateHintFromImage = (l1 || "").toLowerCase();
          visionDescription = rest.join(" ").trim();
        } else {
          console.error("Vision stage failed", v.status, await v.text());
        }
      } catch (e) {
        console.error("Vision exception", e);
      }
    }

    // ─── Stage 2: PLANNER — pick template (image hint > shape name)
    const tpl = pickTemplate(templateHintFromImage || shapeName, width, height, depth);
    const cubes: PlannedCube[] = tpl.cubes;

    // ─── Stage 3: NOTES — assembly instructions
    let aiNotes = "";
    const orKey = Deno.env.get("OPENROUTER_API_KEY");
    const counts30 = cubes.filter(c => c.size === 30).length;
    const counts20 = cubes.filter(c => c.size === 20).length;
    const counts10 = cubes.filter(c => c.size === 10).length;

    const notesSystem = `You are an assembly guide for ABBAD modular blocks. Shape is already planned as voxels using cubes of 30cm (walls), 20cm (transitions), and 10cm (details). Each cube engages dovetail slides on its faces; ~2 sheets per cube in real life. Write 3-5 concrete sentences in ${lang === "ar" ? "Arabic" : "English"}, ordered: foundation → walls → towers → details. Mention the part counts.`;
    const notesUser = `Shape: "${shapeName}" (template: ${tpl.tag})
${visionDescription ? `Reference photo says: ${visionDescription}\n` : ""}Purpose: ${purpose || "general"}
Bounding box: ${width}m × ${height}m × ${depth}m
Total cubes: ${cubes.length} — 30cm=${counts30}, 20cm=${counts20}, 10cm=${counts10}
Write the assembly note now.`;

    async function tryNotes(url: string, key: string, model: string) {
      const r = await fetch(url, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${key}`,
          "Content-Type": "application/json",
          ...(url.includes("openrouter") ? { "HTTP-Referer": "https://abbad.app", "X-Title": "ABBAD AI Studio" } : {}),
        },
        body: JSON.stringify({
          model,
          messages: [
            { role: "system", content: notesSystem },
            { role: "user", content: notesUser },
          ],
          max_tokens: 400,
          temperature: 0.8,
        }),
      });
      if (!r.ok) {
        console.error("Notes stage", model, r.status, await r.text());
        return "";
      }
      const j = await r.json();
      return j.choices?.[0]?.message?.content?.trim() ?? "";
    }

    if (orKey) {
      aiNotes = await tryNotes("https://openrouter.ai/api/v1/chat/completions", orKey, "openai/gpt-oss-120b");
    }
    if (!aiNotes && lovableKey) {
      aiNotes = await tryNotes("https://ai.gateway.lovable.dev/v1/chat/completions", lovableKey, "google/gemini-3-flash-preview");
    }
    if (!aiNotes) {
      aiNotes = lang === "ar"
        ? `ابدأ بتثبيت الأساس من مكعبات 30 سم، ثم ارفع الجدران المحيطة. ركّب أبراج 20 سم في الزوايا، ثم أضف تفاصيل 10 سم (شرفات، نوافذ، زخارف). كل مكعب يحتاج تقريبًا قطعتي صفيحة في التركيب الفعلي.`
        : `Start by laying the 30cm foundation, then raise the perimeter walls. Add 20cm corner towers, then finish with 10cm pixel details (battlements, windows, trim). Each cube engages roughly 2 dovetail slides in the real-life build.`;
    }
    if (visionDescription) {
      aiNotes = (lang === "ar" ? `📷 من الصورة: ${visionDescription}\n\n` : `📷 From your photo: ${visionDescription}\n\n`) + aiNotes;
    }

    // 3. Counts, slides, pricing
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

    // assign colors if not set, varying within each size
    const placed = cubes.map((c, i) => ({
      ...c,
      color: c.color ?? colorFor(c.size, i),
    }));

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
        template: tpl.tag,
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
