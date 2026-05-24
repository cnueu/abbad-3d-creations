// Generates a theatre stage scene built entirely in Abaad voxel blocks,
// styled after the user's chosen theme (e.g. "Najdi", "Medieval", "Sci-Fi").
// Uses Lovable AI Gateway (google/gemini-2.5-flash-image / Nano Banana).

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers":
    "authorization, x-client-info, apikey, content-type, x-supabase-client-platform, x-supabase-client-platform-version, x-supabase-client-runtime, x-supabase-client-runtime-version",
};

interface Body {
  theme: string;
  lang?: "en" | "ar";
}

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") return new Response("ok", { headers: corsHeaders });

  try {
    const { theme, lang = "en" } = (await req.json()) as Body;
    if (!theme || theme.trim().length < 2) {
      return new Response(JSON.stringify({ error: "Theme required" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }
    const LOVABLE_API_KEY = Deno.env.get("LOVABLE_API_KEY");
    if (!LOVABLE_API_KEY) throw new Error("LOVABLE_API_KEY missing");

    const prompt = `A grand theatre stage photographed from the audience, the entire set built ENTIRELY out of Abaad modular cubic building blocks (Minecraft / LEGO / voxel style — small visible cubes of 10, 20, 30, 40, 50 cm assembled together).
Theme: "${theme}".
Render a richly detailed, intricate stage scene inspired by this theme — architecture, props, costumes-on-performers context — all constructed pixel-by-pixel from blocky cubes. Cinematic theatre lighting, warm spotlights, ornate proscenium arch, audience silhouettes in the foreground, dramatic depth.
The blocks must be clearly readable as cubes (visible seams between blocks). Photorealistic theatre photo of a voxel-built set. High detail, 16:9, ultra sharp.`;

    const r = await fetch("https://ai.gateway.lovable.dev/v1/chat/completions", {
      method: "POST",
      headers: {
        Authorization: `Bearer ${LOVABLE_API_KEY}`,
        "Content-Type": "application/json",
      },
      body: JSON.stringify({
        model: "google/gemini-2.5-flash-image",
        messages: [{ role: "user", content: prompt }],
        modalities: ["image", "text"],
      }),
    });

    if (r.status === 429 || r.status === 402) {
      return new Response(
        JSON.stringify({
          error: r.status === 429
            ? (lang === "ar" ? "تم تجاوز الحد، حاول لاحقًا." : "Rate limit, try again later.")
            : (lang === "ar" ? "الرصيد غير كافٍ." : "AI credits exhausted."),
        }),
        { status: r.status, headers: { ...corsHeaders, "Content-Type": "application/json" } }
      );
    }
    if (!r.ok) {
      const t = await r.text();
      console.error("gateway error", r.status, t);
      return new Response(JSON.stringify({ error: "Generation failed" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const j = await r.json();
    const imageUrl = j.choices?.[0]?.message?.images?.[0]?.image_url?.url;
    if (!imageUrl) {
      return new Response(JSON.stringify({ error: "No image returned" }), {
        status: 500,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    return new Response(JSON.stringify({ imageUrl, theme }), {
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  } catch (e) {
    console.error("generate-theme error", e);
    return new Response(
      JSON.stringify({ error: e instanceof Error ? e.message : "Unknown error" }),
      { status: 500, headers: { ...corsHeaders, "Content-Type": "application/json" } }
    );
  }
});
