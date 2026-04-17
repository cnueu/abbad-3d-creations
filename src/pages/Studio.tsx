import { useState } from "react";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Sparkles, Download, Loader2 } from "lucide-react";
import { GeneratedScene, buildObj } from "@/components/GeneratedScene";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { suggestProducts, Product } from "@/data/products";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";

interface Slide { ax: 0 | 1 | 2; mid: { x: number; y: number; z: number } }
interface Result {
  grid: { nx: number; ny: number; nz: number };
  cubes: number;
  sheets: number;
  cubeSize: number;
  cubeUnit: number;
  sheetUnit: number;
  total: number;
  positions: { x: number; y: number; z: number }[];
  slides: Slide[];
  aiNotes: string;
}

export default function Studio() {
  const { t, lang } = useLang();
  const [shapeName, setShapeName] = useState("");
  const [width, setWidth] = useState(2);
  const [height, setHeight] = useState(2);
  const [depth, setDepth] = useState(0.5);
  const [purpose, setPurpose] = useState("");
  const [loading, setLoading] = useState(false);
  const [result, setResult] = useState<Result | null>(null);
  const [selected, setSelected] = useState<Product | null>(null);

  async function generate() {
    if (!shapeName.trim()) {
      toast.error(lang === "ar" ? "أدخل اسم الشكل" : "Enter a shape name");
      return;
    }
    setLoading(true);
    try {
      const { data, error } = await supabase.functions.invoke("generate-design", {
        body: { shapeName, width, height, depth, purpose, lang },
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
    const obj = buildObj(result.positions, result.cubeSize, result.slides);
    const blob = new Blob([obj], { type: "text/plain" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `abbad_${shapeName.replace(/\s+/g, "_") || "design"}.obj`;
    a.click();
    URL.revokeObjectURL(url);
  }

  const suggested = result ? suggestProducts(10) : [];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14 max-w-6xl">
        <header className="mb-10">
          <span className="inline-flex items-center gap-2 text-xs tracking-[0.2em] uppercase text-green-100 mb-3 px-3 py-1 rounded-full border border-[color:var(--card-border)]">
            <Sparkles className="w-3 h-3" /> GPT-OSS-120B
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
              <Field label={t.studio.depth}>
                <input type="number" min={0.1} step={0.1} className="input-field" value={depth} onChange={(e) => setDepth(+e.target.value)} />
              </Field>
            </div>
            <Field label={t.studio.cubeSize}>
              <div className="rounded-xl border border-[color:var(--card-border)] px-4 py-3 text-sm bg-white/[0.02]">
                <span className="text-green-100 font-semibold">10 {t.common.cm}</span>
                <span className="text-foreground/50 ms-2 text-xs">
                  {lang === "ar" ? "(القطعة الأساسية)" : "(standard module)"}
                </span>
              </div>
            </Field>

            <button onClick={generate} disabled={loading} className="btn-primary w-full disabled:opacity-60">
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles className="w-4 h-4" />}
              {loading ? t.studio.generating : t.studio.generate}
            </button>
          </motion.div>

          {/* Result */}
          <div className="lg:col-span-3 space-y-4">
            <div className="aspect-video rounded-3xl glass-panel overflow-hidden bg-gradient-to-br from-green-500/20 to-transparent">
              {result ? (
                <GeneratedScene positions={result.positions} slides={result.slides} cubeSize={result.cubeSize} />
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
                  <div className="grid grid-cols-3 gap-3">
                    <Stat label={t.studio.cubes} value={result.cubes} sub={`${result.cubeSize}${t.common.cm}`} />
                    <Stat label={t.studio.sheets} value={result.sheets} sub="20cm" />
                    <Stat label={t.studio.total} value={`${result.total}`} sub={t.common.sar} highlight />
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
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
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

function Stat({ label, value, sub, highlight }: { label: string; value: string | number; sub?: string; highlight?: boolean }) {
  return (
    <div className={`rounded-2xl p-4 border ${highlight ? "border-green-200 bg-green-500/15" : "border-[color:var(--card-border)] bg-white/[0.03]"}`}>
      <div className="text-[10px] tracking-wider uppercase text-foreground/55 mb-1">{label}</div>
      <div className={`font-display text-2xl font-bold ${highlight ? "text-green-100" : ""}`}>{value}</div>
      {sub && <div className="text-[11px] text-foreground/50 mt-0.5">{sub}</div>}
    </div>
  );
}
