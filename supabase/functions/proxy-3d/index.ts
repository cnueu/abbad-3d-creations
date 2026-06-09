// Proxy to external Hunyuan3D voxel server to bypass browser CORS.
// Accepts multipart/form-data with field `file`, forwards to the upstream
// /generate-3d/ endpoint, and returns the .obj text body to the client.

const UPSTREAM = "https://squatted-probation-underdone.ngrok-free.dev/generate-3d/";

const corsHeaders = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Headers": "authorization, x-client-info, apikey, content-type",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
};

Deno.serve(async (req) => {
  if (req.method === "OPTIONS") {
    return new Response("ok", { headers: corsHeaders });
  }

  try {
    const inForm = await req.formData();
    const file = inForm.get("file");
    if (!(file instanceof File) && !(file instanceof Blob)) {
      return new Response(JSON.stringify({ error: "Missing 'file' field" }), {
        status: 400,
        headers: { ...corsHeaders, "Content-Type": "application/json" },
      });
    }

    const outForm = new FormData();
    const name = (file as File).name || "upload.png";
    outForm.append("file", file, name);

    const upstream = await fetch(UPSTREAM, {
      method: "POST",
      body: outForm,
      headers: { "ngrok-skip-browser-warning": "1" },
    });

    const body = await upstream.text();
    if (!upstream.ok) {
      return new Response(
        JSON.stringify({ error: `Upstream ${upstream.status}`, detail: body.slice(0, 500) }),
        { status: 502, headers: { ...corsHeaders, "Content-Type": "application/json" } },
      );
    }

    return new Response(body, {
      status: 200,
      headers: { ...corsHeaders, "Content-Type": "text/plain; charset=utf-8" },
    });
  } catch (e) {
    return new Response(JSON.stringify({ error: (e as Error).message }), {
      status: 500,
      headers: { ...corsHeaders, "Content-Type": "application/json" },
    });
  }
});
