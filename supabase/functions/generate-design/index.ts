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
  cubeSize: number; // cm: 10/20/30
  purpose: string;
  lang: "en" | "ar";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const body = (await req.json()) as Body;
    const { shapeName, width, height, depth, cubeSize, purpose, lang } = body;

    // ── Deterministic geometry math (truth source) ─────────────────
    const sizeM = cubeSize / 100;
    const nx = Math.max(1, Math.ceil(width / sizeM));
    const ny = Math.max(1, Math.ceil(height / sizeM));
    const nz = Math.max(1, Math.ceil(depth / sizeM));
    const cubes = nx * ny * nz;
    // adjacent-cube faces (each pair sharing a face = 1 sheet)
    const sheets = (nx - 1) * ny * nz + nx * (ny - 1) * nz + nx * ny * (nz - 1);

    // Pricing
    const cubePriceMap: Record<number, number> = { 10: 35, 20: 95, 30: 180 };
    const cubeUnit = cubePriceMap[cubeSize] ?? 35;
    const sheetUnit = 12;
    const total = cubes * cubeUnit + sheets * sheetUnit;

    // ── Ask GPT-OSS for narrative notes (optional, falls back gracefully) ──
    let aiNotes = "";
    const key = Deno.env.get("OPENROUTER_API_KEY");
    if (key) {
      const sys =
        lang === "ar"
          ? "أنت مهندس تصميم في شركة أبعاد. أعطِ ملاحظات قصيرة (٣-٥ نقاط) حول كيفية تجميع الشكل المطلوب باستخدام مكعبات وصفائح ربط فقط. كن دقيقاً وعملياً."
          : "You are a design engineer at ABBAD. Give 3-5 short bullet notes on how to assemble the requested shape using ONLY cubes and connector sheets. Be precise and practical.";
      const user = `Shape: ${shapeName}
Purpose: ${purpose}
Target dimensions: ${width}m × ${height}m × ${depth}m
Cube size: ${cubeSize}cm
Computed grid: ${nx} × ${ny} × ${nz} cubes (${cubes} total), ${sheets} connector sheets.`;

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
            max_tokens: 400,
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

    // ── Build positions for the 3D scene ───────────────────────────
    const positions: { x: number; y: number; z: number }[] = [];
    for (let i = 0; i < nx; i++)
      for (let j = 0; j < ny; j++)
        for (let k = 0; k < nz; k++)
          positions.push({
            x: (i - (nx - 1) / 2) * sizeM,
            y: (j - (ny - 1) / 2) * sizeM,
            z: (k - (nz - 1) / 2) * sizeM,
          });

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
        aiNotes,
      }),
      { headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  } catch (e) {
    console.error("generate-design error", e);
    return new Response(JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
