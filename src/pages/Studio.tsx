import { useEffect, useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Sparkles, Download, Loader2, ImagePlus, X, LogIn, Palette, ListChecks, Upload, Wand2, ShoppingCart } from "lucide-react";
import { Link } from "react-router-dom";
import { GeneratedScene, buildObj, PlacedCube, Slide, ColorTheme } from "@/components/GeneratedScene";
import { ExternalObjViewer } from "@/components/ExternalObjViewer";
import { ExternalGltfViewer } from "@/components/ExternalGltfViewer";
import { Progress } from "@/components/ui/progress";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { suggestProducts, Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import najdiImage from "@/assets/theme-najdi.png";
import medievalImage from "@/assets/theme-medieval.png";

// External Hunyuan3D-2.1 + voxelizer backend (Kaggle/ngrok).
// Async job API: POST /generate-3d/ -> { job_id }
//                GET  /status/{id}  -> { status: "pending"|"processing"|"done"|"error", ... }
//                GET  /result/{id}  -> GLB (or OBJ) binary
const EXTERNAL_BASE = "https://squatted-probation-underdone.ngrok-free.app";
const NGROK_HEADERS = { "ngrok-skip-browser-warning": "true" } as const;
const EXPECTED_DURATION_MS = 6 * 60 * 1000; // ~6 minutes

interface Result {
  cubes: PlacedCube[];
  slides: Slide[];
  breakdown: Record<10 | 20 | 30 | 40 | 50, number>;
  totalCubes: number;
  sheetsVisible: number;
  sheetsRealLife: number;
  total: number;
  aiNotes: string;
}

// Daily generation quota (resets at local midnight).
const GUEST_LIMIT = 2;
const USER_LIMIT = 5;

function todayKey() {
  const d = new Date();
  return `abaad_studio_uses_${d.getFullYear()}-${d.getMonth() + 1}-${d.getDate()}`;
}
function readUses() {
  return parseInt(localStorage.getItem(todayKey()) || "0", 10) || 0;
}
function bumpUses() {
  const n = readUses() + 1;
  localStorage.setItem(todayKey(), String(n));
  return n;
}

export default function Studio() {
  const { t, lang } = useLang();
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const [pickedFile, setPickedFile] = useState<File | null>(null);
  const [modelUrl, setModelUrl] = useState<string | null>(null);
  const [modelKind, setModelKind] = useState<"glb" | "obj">("glb");
  const [progress, setProgress] = useState(0);
  const [statusText, setStatusText] = useState<string>("");
  const [authed, setAuthed] = useState(false);
  const [uses, setUses] = useState(0);
  const [theme, setTheme] = useState<ColorTheme>("original");
  const [glassy, setGlassy] = useState(false);
  const fileRef = useRef<HTMLInputElement>(null);

  useEffect(() => {
    setUses(readUses());
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => setAuthed(!!session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const limit = authed ? USER_LIMIT : GUEST_LIMIT;
  const remaining = Math.max(0, limit - uses);
  const ar = lang === "ar";

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      toast.error(ar ? "الصورة أكبر من 4 ميغا" : "Image must be < 4MB");
      return;
    }
    setPickedFile(f);
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  }

  // Polling-based generation:
  // 1) POST /generate-3d/ (multipart `file`) -> { job_id }
  // 2) Poll GET /status/{id} every 5s while showing a 0->100% progress estimated over EXPECTED_DURATION_MS
  // 3) When status === "done", fetch GET /result/{id} as a binary blob (GLB by default, OBJ fallback)
  async function generate() {
    if (!pickedFile) {
      toast.error(ar ? "ارفع صورة لما تريد بناءه" : "Upload a photo to build from");
      return;
    }
    if (remaining <= 0) {
      toast.error(
        authed
          ? ar
            ? `وصلت إلى الحد اليومي (${USER_LIMIT}). جرّب غداً.`
            : `You hit the daily limit (${USER_LIMIT}). Try again tomorrow.`
          : ar
            ? `وصلت إلى حد الزائر (${GUEST_LIMIT}). سجّل دخولك للحصول على ${USER_LIMIT}.`
            : `Guest limit reached (${GUEST_LIMIT}). Sign in to get ${USER_LIMIT}/day.`
      );
      return;
    }
    setLoading(true);
    setProgress(0);
    setStatusText(ar ? "إرسال الصورة..." : "Uploading image...");

    const startedAt = Date.now();
    const progressTimer = window.setInterval(() => {
      const elapsed = Date.now() - startedAt;
      // Cap auto-progress at 95% — final 5% is set when result arrives.
      const pct = Math.min(95, (elapsed / EXPECTED_DURATION_MS) * 100);
      setProgress(pct);
    }, 1000);

    try {
      // 1) Submit job
      const fd = new FormData();
      fd.append("file", pickedFile);
      const submit = await fetch(`${EXTERNAL_BASE}/generate-3d/`, {
        method: "POST",
        body: fd,
        headers: { ...NGROK_HEADERS },
      });
      if (!submit.ok) {
        const txt = await submit.text().catch(() => "");
        throw new Error(`Server ${submit.status}: ${txt.slice(0, 200) || submit.statusText}`);
      }
      const submitJson = await submit.json().catch(() => ({} as any));
      const jobId: string | undefined =
        submitJson.job_id ?? submitJson.id ?? submitJson.jobId ?? submitJson.task_id;
      if (!jobId) throw new Error("No job_id returned from server");

      setStatusText(ar ? "جاري التوليد..." : "Generating...");

      // 2) Poll status every 5s
      const sleep = (ms: number) => new Promise((r) => setTimeout(r, ms));
      let done = false;
      let attempts = 0;
      const maxAttempts = 12 * 15; // ~15 minutes safety
      while (!done) {
        attempts++;
        if (attempts > maxAttempts) throw new Error("Generation timed out");
        await sleep(5000);
        const sres = await fetch(`${EXTERNAL_BASE}/status/${jobId}`, { headers: { ...NGROK_HEADERS } });
        if (!sres.ok) continue; // transient — keep polling
        const sjson = await sres.json().catch(() => ({} as any));
        const status: string = String(sjson.status ?? sjson.state ?? "").toLowerCase();
        if (status === "done" || status === "completed" || status === "success" || status === "finished") {
          done = true;
          break;
        }
        if (status === "error" || status === "failed") {
          throw new Error(sjson.error || sjson.message || "Generation failed");
        }
        if (sjson.progress != null) {
          const p = Number(sjson.progress);
          if (!Number.isNaN(p)) setProgress(Math.min(95, p <= 1 ? p * 100 : p));
        }
      }

      // 3) Fetch result
      setStatusText(ar ? "تحميل النموذج..." : "Fetching model...");
      const rres = await fetch(`${EXTERNAL_BASE}/result/${jobId}`, { headers: { ...NGROK_HEADERS } });
      if (!rres.ok) throw new Error(`Result ${rres.status}`);
      const ct = (rres.headers.get("content-type") || "").toLowerCase();
      const buf = await rres.arrayBuffer();
      if (!buf.byteLength) throw new Error(ar ? "الملف المُستلم فارغ" : "Empty model file");

      // Detect format: GLB starts with magic "glTF"
      const head = new Uint8Array(buf.slice(0, 4));
      const isGlb =
        ct.includes("model/gltf-binary") ||
        ct.includes("glb") ||
        (head[0] === 0x67 && head[1] === 0x6c && head[2] === 0x54 && head[3] === 0x46);
      const kind: "glb" | "obj" = isGlb ? "glb" : "obj";
      const blob = new Blob([buf], { type: isGlb ? "model/gltf-binary" : "text/plain" });

      if (modelUrl) URL.revokeObjectURL(modelUrl);
      const url = URL.createObjectURL(blob);
      setModelUrl(url);
      setModelKind(kind);
      setResult(null);
      setProgress(100);
      setStatusText("");
      setUses(bumpUses());
      toast.success(ar ? "تم استلام المجسم" : "3D model received");
    } catch (e: any) {
      console.error("generate error", e);
      toast.error(e.message || "Failed");
    } finally {
      window.clearInterval(progressTimer);
      setLoading(false);
    }
  }

  function downloadObj() {
    if (modelUrl) {
      const a = document.createElement("a");
      a.href = modelUrl;
      a.download = modelKind === "glb" ? "model.glb" : "model_voxel.obj";
      a.click();
      return;
    }
    if (!result) return;
    const obj = buildObj(result.cubes, result.slides);
    const blob = new Blob([obj], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abaad_design.obj`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sizesUsed = result
    ? ([10, 20, 30, 40, 50] as const).filter((k) => (result.breakdown[k] || 0) > 0).map((k) => k as number)
    : [];
  const suggested = result ? suggestProducts(sizesUsed) : [];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14 max-w-6xl">
        <header className="mb-6">
          {/* ── HEADER (model name removed per request) ────────────────── */}
          <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[hsl(var(--accent))] mb-3 px-3 py-1 rounded-full border border-[color:var(--card-border)]">
            <Sparkles className="w-3 h-3" /> {ar ? "استوديو الذكاء" : "AI Studio"}
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
            <span className="text-gradient">{t.studio.title}</span>
          </h1>
          <p className="text-foreground/65 max-w-2xl">{t.studio.subtitle}</p>
        </header>

        {/* ─────────────────────────────────────────────────────────────
            HOW-TO-USE GUIDE
            Edit the `steps` / `features` arrays below to change copy.
            Icons come from lucide-react (top of file).
           ───────────────────────────────────────────────────────────── */}
        <section className="mb-6 glass-panel rounded-3xl p-5 md:p-6">
          <div className="flex items-center gap-2 mb-4">
            <ListChecks className="w-4 h-4 text-[hsl(var(--accent))]" />
            <h2 className="text-[11px] tracking-[0.2em] uppercase text-foreground/65">
              {ar ? "كيف تستخدم الاستوديو" : "How to use the Studio"}
            </h2>
          </div>
          <ol className="grid sm:grid-cols-3 gap-3 mb-5">
            {(ar
              ? [
                  { icon: Upload, t: "ارفع صورة", d: "صورة واضحة لما تريد بناءه (أقل من 4 ميغا)." },
                  { icon: Wand2, t: "اضغط توليد", d: "ينتج مجسّم ٣D تفاعلي يمكنك تدويره." },
                  { icon: ShoppingCart, t: "نزّل أو اطلب", d: "حمّل ملف المجسم أو اطلب القطع من المتجر." },
                ]
              : [
                  { icon: Upload, t: "Upload an image", d: "A clear photo of what you want to build (< 4MB)." },
                  { icon: Wand2, t: "Hit Generate", d: "Get an interactive 3D model you can rotate." },
                  { icon: ShoppingCart, t: "Download or order", d: "Save the model file or order the pieces from the store." },
                ]
            ).map((s, i) => (
              <li key={i} className="rounded-2xl p-4 border border-[color:var(--card-border)] bg-[hsl(var(--accent))]/5 flex gap-3">
                <div className="flex-shrink-0 w-8 h-8 rounded-full bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))] flex items-center justify-center font-display font-bold text-sm">
                  {i + 1}
                </div>
                <div>
                  <div className="flex items-center gap-1.5 text-sm font-semibold mb-0.5">
                    <s.icon className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                    {s.t}
                  </div>
                  <div className="text-xs text-foreground/65 leading-relaxed">{s.d}</div>
                </div>
              </li>
            ))}
          </ol>

          {/* Page features summary */}
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-2 text-[11px] text-foreground/65">
            {(ar
              ? ["معاينة ٣D دوّارة", "ثيمات ألوان قابلة للتبديل", "تعليمات تجميع تلقائية", "تصدير ملف .obj"]
              : ["Rotating 3D preview", "Switchable color themes", "Auto assembly instructions", "Export to .obj file"]
            ).map((f) => (
              <div key={f} className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--card-border)]">
                <Sparkles className="w-3 h-3 text-[hsl(var(--accent))]" />
                {f}
              </div>
            ))}
          </div>
        </section>

        {/* Quota banner */}
        <div className="mb-6 flex items-center justify-between gap-3 flex-wrap rounded-2xl px-5 py-3 border border-[color:var(--card-border)] glass-card">
          <div className="text-sm">
            <span className="text-foreground/65">
              {ar ? "المتبقي اليوم:" : "Remaining today:"}
            </span>{" "}
            <span className="font-semibold text-[hsl(var(--accent))]">{remaining}</span>
            <span className="text-foreground/45"> / {limit}</span>
          </div>
          {!authed && (
            <Link to="/auth" className="text-xs inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--card-border)] hover:bg-[hsl(var(--accent))]/10 transition">
              <LogIn className="w-3.5 h-3.5" />
              {ar ? `سجّل لتصل إلى ${USER_LIMIT}/يوم` : `Sign in for ${USER_LIMIT}/day`}
            </Link>
          )}
        </div>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Image-only input */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-6 lg:col-span-2 space-y-4 h-fit"
          >
            <div>
              <span className="block text-[11px] tracking-[0.18em] uppercase text-foreground/55 mb-2">
                {ar ? "صورة المرجع" : "Reference image"}
              </span>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
              {imageDataUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[color:var(--card-border)]">
                  <img src={imageDataUrl} alt="reference" className="w-full h-64 object-cover" />
                  <button
                    type="button"
                    onClick={() => { setImageDataUrl(null); setPickedFile(null); }}
                    className="absolute top-2 end-2 w-8 h-8 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    aria-label="remove"
                  >
                    <X className="w-4 h-4" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex flex-col items-center justify-center gap-3 py-16 rounded-2xl border-2 border-dashed border-[color:var(--card-border)] text-foreground/65 hover:bg-white/[0.04] hover:border-[hsl(var(--accent))]/40 transition-colors"
                >
                  <ImagePlus className="w-8 h-8" />
                  <span className="text-sm font-medium">
                    {ar ? "ارفع صورة لما تريد بناءه" : "Upload a photo to build"}
                  </span>
                  <span className="text-[11px] text-foreground/45">PNG · JPG · WEBP · &lt; 4MB</span>
                </button>
              )}
            </div>


            <button onClick={generate} disabled={loading || !pickedFile || remaining <= 0} className="btn-primary w-full disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? t.studio.generating : t.studio.generate}
            </button>
          </motion.div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-4">
            {result && (
              <div className="flex items-center gap-2 flex-wrap rounded-2xl px-4 py-2.5 border border-[color:var(--card-border)] glass-card">
                <Palette className="w-3.5 h-3.5 text-foreground/55" />
                <span className="text-[10px] tracking-[0.18em] uppercase text-foreground/55 me-1">
                  {ar ? "ثيم اللون" : "Color theme"}
                </span>
                {([
                  { id: "original", label: ar ? "الأصلي" : "Original", swatches: ["#e08a5b", "#5b7fc7", "#9b6ec7"] },
                  { id: "walnut", label: ar ? "خشب الجوز" : "Walnut", swatches: ["#5a3a1f", "#7a5230", "#3d2514"] },
                  { id: "sand", label: ar ? "رملي" : "Sand", swatches: ["#d9c8a8", "#a89272", "#6e5a40"] },
                  { id: "mono", label: ar ? "أحادي" : "Mono", swatches: ["#a47148", "#5a3a1f", "#c9a17a"] },
                ] as { id: ColorTheme; label: string; swatches: string[] }[]).map((opt) => (
                  <button
                    key={opt.id}
                    type="button"
                    onClick={() => setTheme(opt.id)}
                    className={`flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] border transition ${
                      theme === opt.id
                        ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/15 text-foreground"
                        : "border-[color:var(--card-border)] text-foreground/65 hover:bg-white/[0.04]"
                    }`}
                  >
                    <span className="flex -space-x-1">
                      {opt.swatches.map((s) => (
                        <span key={s} className="w-2.5 h-2.5 rounded-full ring-1 ring-black/30" style={{ background: s }} />
                      ))}
                    </span>
                    {opt.label}
                  </button>
                ))}
                <button
                  type="button"
                  onClick={() => setGlassy((g) => !g)}
                  className={`ms-auto px-2.5 py-1 rounded-full text-[11px] border transition ${
                    glassy
                      ? "border-[hsl(var(--accent))] bg-[hsl(var(--accent))]/15 text-foreground"
                      : "border-[color:var(--card-border)] text-foreground/65 hover:bg-white/[0.04]"
                  }`}
                >
                  {ar ? "لمعان زجاجي" : "Glassy finish"}
                </button>
              </div>
            )}

            <div className="aspect-video rounded-3xl glass-panel overflow-hidden bg-gradient-to-br from-[hsl(var(--accent))]/10 to-transparent">
              {modelUrl ? (
                modelKind === "glb" ? (
                  <ExternalGltfViewer url={modelUrl} />
                ) : (
                  <ExternalObjViewer url={modelUrl} />
                )
              ) : result ? (
                <GeneratedScene cubes={result.cubes} slides={result.slides} theme={theme} glassy={glassy} />
              ) : loading ? (
                <div className="w-full h-full flex flex-col items-center justify-center gap-4 px-8">
                  <Loader2 className="w-6 h-6 animate-spin text-[hsl(var(--accent))]" />
                  <div className="text-sm text-foreground/70">
                    {statusText || (ar ? "جاري التوليد... (٥-٧ دقائق)" : "Generating... (5-7 min)")}
                  </div>
                  <div className="w-full max-w-sm">
                    <Progress value={progress} />
                    <div className="text-[11px] text-foreground/50 mt-1 text-center">{Math.round(progress)}%</div>
                  </div>
                </div>
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/40 text-sm">
                  {t.studio.result}
                </div>
              )}
            </div>

            {modelUrl && (
              <button onClick={downloadObj} className="btn-ghost w-full">
                <Download className="w-4 h-4" />
                {ar
                  ? modelKind === "glb" ? "تحميل model.glb" : "تحميل model_voxel.obj"
                  : modelKind === "glb" ? "Download model.glb" : "Download model_voxel.obj"}
              </button>
            )}

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl p-6 space-y-5"
              >
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/45 mb-2">{t.studio.pieces}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-3">
                    <Stat label={`${t.studio.cubes} 50${t.common.cm}`} value={result.breakdown[50] || 0} swatch="#3a4a6b" />
                    <Stat label={`${t.studio.cubes} 40${t.common.cm}`} value={result.breakdown[40] || 0} swatch="#5b7fc7" />
                    <Stat label={`${t.studio.cubes} 30${t.common.cm}`} value={result.breakdown[30] || 0} swatch="#9b6ec7" />
                    <Stat label={`${t.studio.cubes} 20${t.common.cm}`} value={result.breakdown[20] || 0} swatch="#e08a5b" />
                    <Stat label={`${t.studio.cubes} 10${t.common.cm}`} value={result.breakdown[10] || 0} swatch="#6db8ac" />
                    <Stat label={t.studio.sheets} value={result.sheetsRealLife} sub={ar ? "حقيقية" : "real-life"} swatch="#a8d5cc" />
                  </div>
                  <div className="mt-3 text-sm text-foreground/70 flex items-center justify-between">
                    <span>{t.studio.total}</span>
                    <span className="font-display text-2xl font-bold text-[hsl(var(--accent))]">{result.total} {t.common.sar}</span>
                  </div>
                </div>

                {/* Assembly instructions — generated from the breakdown */}
                <div className="rounded-2xl p-4 border border-[color:var(--card-border)] bg-[hsl(var(--accent))]/5">
                  <div className="flex items-center gap-2 mb-2">
                    <ListChecks className="w-4 h-4 text-[hsl(var(--accent))]" />
                    <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/55">
                      {ar ? "تعليمات التجميع" : "Assembly instructions"}
                    </div>
                  </div>
                  <ol className="text-sm text-foreground/80 leading-relaxed space-y-1.5 list-decimal ps-5 marker:text-[hsl(var(--accent))]">
                    {(ar
                      ? [
                          `ابدأ بالقاعدة: ضع المكعبات الكبيرة أولاً (${(result.breakdown[50] || 0) + (result.breakdown[40] || 0)} مكعب 40-50 سم).`,
                          `ابنِ الجدران الوسطى بمكعبات 30-20 سم (${(result.breakdown[30] || 0) + (result.breakdown[20] || 0)} مكعب).`,
                          `أضف التفاصيل والزخارف بمكعبات 10 سم (${result.breakdown[10] || 0} مكعب).`,
                          `استخدم ${result.sheetsRealLife} موصِّل لتثبيت المكعبات معاً عبر الفتحات الجانبية.`,
                          ar ? "حمّل ملف .obj لمعاينته في أي برنامج 3D، ثم اطلب القطع من المتجر." : "",
                        ].filter(Boolean)
                      : [
                          `Start with the base: place the largest cubes first (${(result.breakdown[50] || 0) + (result.breakdown[40] || 0)} cubes at 40–50cm).`,
                          `Build the mid walls with 30 & 20cm cubes (${(result.breakdown[30] || 0) + (result.breakdown[20] || 0)} cubes).`,
                          `Add details and accents with 10cm cubes (${result.breakdown[10] || 0} cubes).`,
                          `Use ${result.sheetsRealLife} connecters to lock the cubes together through the side channels.`,
                          "Download the .obj to preview in any 3D tool, then order the pieces from the store.",
                        ]
                    ).map((step, i) => (
                      <li key={i}>{step}</li>
                    ))}
                  </ol>
                </div>

                {result.aiNotes && (
                  <div>
                    <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/45 mb-2">{t.studio.notes}</div>
                    <div className="text-sm whitespace-pre-wrap leading-relaxed text-foreground/80">{result.aiNotes}</div>
                  </div>
                )}

                <button onClick={downloadObj} className="btn-ghost w-full">
                  <Download className="w-4 h-4" />
                  {t.studio.download}
                </button>
              </motion.div>
            )}
          </div>
        </div>

        {result && suggested.length > 0 && (
          <section className="mt-14">
            <h2 className="font-display text-2xl mb-5">{t.studio.suggested}</h2>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
              {suggested.map((p, i) => (
                <ProductCard key={p.id} product={p} index={i} onClick={() => setSelected(p)} />
              ))}
            </div>
          </section>
        )}

        <ThemesSection ar={ar} />
      </div>

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </Layout>
  );
}

function Stat({ label, value, sub, swatch }: { label: string; value: string | number; sub?: string; swatch?: string }) {
  return (
    <div className="rounded-2xl p-4 border border-[color:var(--card-border)]" style={{ background: "var(--card-bg)" }}>
      <div className="flex items-center gap-2 mb-1">
        {swatch && <span className="w-2.5 h-2.5 rounded-full" style={{ background: swatch }} />}
        <div className="text-[10px] tracking-wider uppercase text-foreground/65">{label}</div>
      </div>
      <div className="font-display text-2xl font-bold text-foreground">{value}</div>
      {sub && <div className="text-[11px] text-foreground/60 mt-0.5">{sub}</div>}
    </div>
  );
}

// ── THEMES SECTION ────────────────────────────────────────────
// User types a theme (e.g. "Najdi", "Medieval") → Lovable AI image
// generates a theatre stage scene built entirely in Abaad blocks.
function ThemesSection({ ar }: { ar: boolean }) {
  const [theme, setTheme] = useState("");
  const [loading, setLoading] = useState(false);
  const [imageUrl, setImageUrl] = useState<string | null>(null);
  const [lastTheme, setLastTheme] = useState("");

  const PRESETS = ar
    ? ["نجدي", "حجازي", "عسيري", "قروسطي", "فضاء", "غابة سحرية"]
    : ["Najdi", "Hijazi", "Asiri", "Medieval", "Sci-Fi", "Enchanted Forest"];

  async function generate(t?: string) {
    const value = (t ?? theme).trim();
    if (!value) {
      toast.error(ar ? "اكتب اسم الثيم" : "Type a theme name");
      return;
    }
    setLoading(true);
    setImageUrl(null);
    setLastTheme(value);

    // Curated reference images for specific themes (skip AI generation).
    if (/^(najdi|نجدي)$/i.test(value)) {
      setImageUrl(najdiImage);
      setLoading(false);
      return;
    }
    if (/^(medieval|قروسطي|العصور الوسطى)$/i.test(value.trim())) {
      setImageUrl(medievalImage);
      setLoading(false);
      return;
    }

    try {
      const { data, error } = await supabase.functions.invoke("generate-theme", {
        body: { theme: value, lang: ar ? "ar" : "en" },
      });
      if (error) throw error;
      if ((data as any)?.error) throw new Error((data as any).error);
      setImageUrl((data as any).imageUrl);
    } catch (e: any) {
      toast.error(e?.message || (ar ? "تعذّر التوليد" : "Generation failed"));
    } finally {
      setLoading(false);
    }
  }

  function download() {
    if (!imageUrl) return;
    const a = document.createElement("a");
    a.href = imageUrl;
    a.download = `abaad-theme-${lastTheme.replace(/\s+/g, "-").toLowerCase()}.png`;
    a.click();
  }

  return (
    <section className="mt-20">
      <div className="flex items-center gap-3 mb-2">
        <Palette className="w-5 h-5 text-foreground/70" />
        <h2 className="font-display text-3xl">{ar ? "الثيمات" : "Themes"}</h2>
      </div>
      <p className="text-sm text-foreground/65 mb-6 max-w-2xl">
        {ar
          ? "اكتب أي ثيم تريده لمسرحك وسيُولّد الذكاء الاصطناعي صورة لخشبة المسرح مبنية بالكامل من مكعبات أبعاد."
          : "Type any theme for your theatre and AI will generate a stage scene built entirely from Abaad blocks."}
      </p>

      <div className="rounded-2xl p-5 border border-[color:var(--card-border)]" style={{ background: "var(--card-bg)" }}>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            value={theme}
            onChange={(e) => setTheme(e.target.value)}
            onKeyDown={(e) => e.key === "Enter" && !loading && generate()}
            placeholder={ar ? "مثال: نجدي" : "e.g. Najdi"}
            className="flex-1 rounded-xl px-4 py-3 bg-background border border-[color:var(--card-border)] outline-none focus:ring-2 focus:ring-foreground/20 text-foreground"
          />
          <button onClick={() => generate()} disabled={loading} className="btn-primary px-6">
            {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Wand2 className="w-4 h-4" />}
            {loading ? (ar ? "جارٍ التوليد..." : "Generating...") : (ar ? "توليد" : "Generate")}
          </button>
        </div>

        <div className="flex flex-wrap gap-2 mt-4">
          {PRESETS.map((p) => (
            <button
              key={p}
              onClick={() => { setTheme(p); generate(p); }}
              disabled={loading}
              className="text-xs px-3 py-1.5 rounded-full border border-[color:var(--card-border)] hover:bg-foreground/5 transition disabled:opacity-50"
            >
              {p}
            </button>
          ))}
        </div>

        <div className="mt-5 rounded-xl overflow-hidden border border-[color:var(--card-border)] bg-background/50 aspect-video flex items-center justify-center">
          {loading && (
            <div className="flex flex-col items-center gap-3 text-foreground/60">
              <Loader2 className="w-8 h-8 animate-spin" />
              <div className="text-sm">{ar ? "يبني المشهد بالمكعبات..." : "Building scene from blocks..."}</div>
            </div>
          )}
          {!loading && imageUrl && (
            <img src={imageUrl} alt={`${lastTheme} theme in Abaad blocks`} className="w-full h-full object-cover" />
          )}
          {!loading && !imageUrl && (
            <div className="text-sm text-foreground/40 px-6 text-center">
              {ar ? "ستظهر الصورة هنا بعد التوليد" : "Your generated theme scene will appear here"}
            </div>
          )}
        </div>

        {imageUrl && !loading && (
          <button onClick={download} className="btn-ghost mt-4">
            <Download className="w-4 h-4" />
            {ar ? "تحميل الصورة" : "Download image"}
          </button>
        )}
      </div>
    </section>
  );
}
