import { useRef, useState } from "react";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Sparkles, Download, Loader2, ImagePlus, X, RotateCcw } from "lucide-react";
import { GeneratedScene, buildObj, PlacedCube, Slide } from "@/components/GeneratedScene";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { suggestProducts, Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

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

const DEFAULT_PROMPT = `You are a master 3D pixel-art (voxel) sculptor — think Minecraft, Crossy Road, Monument Valley.
You translate user descriptions (and optional reference photos) into ULTRA detailed, colorful, recognizable voxel builds.

HARD RULES (do not break):
- Output 250–500 cubes. Minimum 200. Never a giant uniform block.
- Cube sizes available (cm): 50, 40, 30, 20, 10. USE ALL FIVE.
  • 50cm = massive base/core (~5%)
  • 40cm = large structural blocks (~10%)
  • 30cm = mid-mass walls/towers (~20%)
  • 20cm = mid details, trims (~25%)
  • 10cm = pixel details, decorations (~40%, USE A LOT)
- Y is up. Snap centers to a 0.05m grid. Cubes touch on faces (no floating, no overlap).
- Complex silhouette: multiple tiers, asymmetry, overhangs, towers, archways, windows, doors, antennas, decorations.
- Detail clusters from 10cm cubes: lanterns, chimneys, flags, rivets, vents, plants, eyes, stripes.
- Use 8–14 vibrant hex colors grouped by region. Mix warm + cool. Avoid monochrome.

OUTPUT FORMAT (JSON only, no prose, no fences):
{
  "cubes": [ { "x": <m>, "y": <m>, "z": <m>, "size": 10|20|30|40|50, "color": "#rrggbb" }, ... ],
  "note": "<one short assembly tip>"
}`;

export default function Studio() {
  const { t, lang } = useLang();
  const [shapeName, setShapeName] = useState("");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [depth, setDepth] = useState(2);
  const [purpose, setPurpose] = useState("");
  const [systemPrompt, setSystemPrompt] = useState(DEFAULT_PROMPT);
  const [showPrompt, setShowPrompt] = useState(false);
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);
  const [imageDataUrl, setImageDataUrl] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  function onPickImage(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4 * 1024 * 1024) {
      toast.error(lang === "ar" ? "الصورة أكبر من 4 ميغا" : "Image must be < 4MB");
      return;
    }
    const reader = new FileReader();
    reader.onload = () => setImageDataUrl(reader.result as string);
    reader.readAsDataURL(f);
  }

  async function generate() {
    if (!shapeName.trim() && !imageDataUrl) {
      toast.error(lang === "ar" ? "أدخل اسم الشكل أو ارفع صورة" : "Enter a shape name or upload a photo");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-design", {
        body: { shapeName: shapeName || "reference", width, height, depth, purpose, lang, imageDataUrl, systemPrompt },
      });
      if (error) throw error;
      setResult(data as Result);
    } catch (e: any) {
      toast.error(e.message || "Failed");
    } finally {
      setLoading(false);
    }
  }

  function downloadObj() {
    if (!result) return;
    const obj = buildObj(result.cubes, result.slides);
    const blob = new Blob([obj], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abbad_${shapeName.replace(/\s+/g, "_") || "design"}.obj`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const sizesUsed = result ? ([10, 20, 30, 40, 50] as const)
    .filter((k) => (result.breakdown[k] || 0) > 0)
    .map((k) => k as number) : [];
  const suggested = result ? suggestProducts(sizesUsed) : [];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14 max-w-6xl">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-[hsl(var(--accent))] mb-3 px-3 py-1 rounded-full border border-[color:var(--card-border)]">
            <Sparkles className="w-3 h-3" /> GPT-OSS 120B · Pixel-Art 3D
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
            <span className="text-gradient">{t.studio.title}</span>
          </h1>
          <p className="text-foreground/65 max-w-2xl">{t.studio.subtitle}</p>
        </header>

        <div className="grid lg:grid-cols-5 gap-6">
          {/* Form */}
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            className="glass-panel rounded-3xl p-6 lg:col-span-2 space-y-4 h-fit"
          >
            <Field label={t.studio.shapeName}>
              <input className="input-field" value={shapeName} onChange={(e) => setShapeName(e.target.value)} placeholder={t.studio.shapeNamePh} />
            </Field>
            <Field label={t.studio.purpose}>
              <input className="input-field" value={purpose} onChange={(e) => setPurpose(e.target.value)} placeholder={t.studio.purposePh} />
            </Field>
            <div className="grid grid-cols-3 gap-3">
              <Field label={t.studio.width}>
                <input type="number" min={0.1} step={0.1} className="input-field" value={width} onChange={(e) => setWidth(+e.target.value)} />
              </Field>
              <Field label={t.studio.height}>
                <input type="number" min={0.1} step={0.1} className="input-field" value={height} onChange={(e) => setHeight(+e.target.value)} />
              </Field>
              <Field label={lang === "ar" ? "العمق (م)" : "Depth (m)"}>
                <input type="number" min={0.1} step={0.1} className="input-field" value={depth} onChange={(e) => setDepth(+e.target.value)} />
              </Field>
            </div>
            {/* Reference photo (optional) → vision pass guides the template */}
            <div>
              <span className="block text-[11px] tracking-[0.18em] uppercase text-foreground/55 mb-1.5">
                {lang === "ar" ? "صورة مرجعية (اختياري)" : "Reference photo (optional)"}
              </span>
              <input ref={fileRef} type="file" accept="image/*" hidden onChange={onPickImage} />
              {imageDataUrl ? (
                <div className="relative rounded-xl overflow-hidden border border-[color:var(--card-border)]">
                  <img src={imageDataUrl} alt="reference" className="w-full h-32 object-cover" />
                  <button
                    type="button"
                    onClick={() => setImageDataUrl(null)}
                    className="absolute top-2 right-2 w-7 h-7 rounded-full bg-black/60 text-white flex items-center justify-center hover:bg-black/80"
                    aria-label="remove"
                  >
                    <X className="w-3.5 h-3.5" />
                  </button>
                </div>
              ) : (
                <button
                  type="button"
                  onClick={() => fileRef.current?.click()}
                  className="w-full flex items-center justify-center gap-2 py-3 rounded-xl border border-dashed border-[color:var(--card-border)] text-foreground/65 hover:bg-white/[0.04] transition-colors text-sm"
                >
                  <ImagePlus className="w-4 h-4" />
                  {lang === "ar" ? "ارفع صورة لما تريد بناءه" : "Upload a photo of what to build"}
                </button>
              )}
            </div>

            {/* Editable system prompt */}
            <div>
              <div className="flex items-center justify-between mb-1.5">
                <span className="text-[11px] tracking-[0.18em] uppercase text-foreground/55">
                  {lang === "ar" ? "تعليمات النموذج (نظام)" : "AI System Prompt"}
                </span>
                <div className="flex items-center gap-2">
                  <button
                    type="button"
                    onClick={() => setSystemPrompt(DEFAULT_PROMPT)}
                    className="text-[10px] uppercase tracking-wider text-foreground/55 hover:text-foreground/90 inline-flex items-center gap-1"
                    title="Reset"
                  >
                    <RotateCcw className="w-3 h-3" /> {lang === "ar" ? "إعادة" : "Reset"}
                  </button>
                  <button
                    type="button"
                    onClick={() => setShowPrompt((v) => !v)}
                    className="text-[10px] uppercase tracking-wider text-foreground/55 hover:text-foreground/90"
                  >
                    {showPrompt ? (lang === "ar" ? "إخفاء" : "Hide") : (lang === "ar" ? "عرض" : "Show")}
                  </button>
                </div>
              </div>
              {showPrompt && (
                <textarea
                  value={systemPrompt}
                  onChange={(e) => setSystemPrompt(e.target.value)}
                  rows={10}
                  spellCheck={false}
                  className="input-field w-full font-mono text-[11px] leading-relaxed resize-y min-h-[160px]"
                />
              )}
            </div>

            <button onClick={generate} disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? t.studio.generating : t.studio.generate}
            </button>
          </motion.div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-video rounded-3xl glass-panel overflow-hidden bg-gradient-to-br from-green-500/20 to-transparent">
              {result ? (
                <GeneratedScene cubes={result.cubes} slides={result.slides} />
              ) : (
                <div className="w-full h-full flex items-center justify-center text-foreground/40 text-sm">
                  {t.studio.result}
                </div>
              )}
            </div>

            {result && (
              <motion.div
                initial={{ opacity: 0, y: 16 }}
                animate={{ opacity: 1, y: 0 }}
                className="glass-panel rounded-3xl p-6 space-y-5"
              >
                <div>
                  <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/45 mb-2">{t.studio.pieces}</div>
                  <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                    <Stat label={`${t.studio.cubes} 30${t.common.cm}`} value={result.breakdown[30] || 0} swatch="#5b7fc7" />
                    <Stat label={`${t.studio.cubes} 20${t.common.cm}`} value={result.breakdown[20] || 0} swatch="#e08a5b" />
                    <Stat label={`${t.studio.cubes} 10${t.common.cm}`} value={result.breakdown[10] || 0} swatch="#6db8ac" />
                    <Stat label={t.studio.sheets} value={result.sheetsRealLife} sub={lang === "ar" ? "حقيقية" : "real-life"} swatch="#a8d5cc" />
                  </div>
                  <div className="mt-3 text-sm text-foreground/70 flex items-center justify-between">
                    <span>{t.studio.total}</span>
                    <span className="font-display text-2xl font-bold text-[hsl(var(--accent))]">{result.total} {t.common.sar}</span>
                  </div>
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
      </div>

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] tracking-[0.18em] uppercase text-foreground/55 mb-1.5">{label}</span>
      {children}
    </label>
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
