import { useMemo, useState } from "react";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { QUOTE_RATES } from "@/data/products";
import { Upload, X, Calculator, Send, Ruler, Layers, Palette } from "lucide-react";
import { toast } from "sonner";
import { z } from "zod";

// ─────────────────────────────────────────────────────────────────────────────
// REQUEST A QUOTE (B2B)
//
// WHERE TO CHANGE THINGS:
//  • Estimate formula / rates ....... QUOTE_RATES in src/data/products.ts
//  • Estimate maths ................. `estimate` memo below
//  • Form fields & validation ....... `schema` below
//  • Where the request is sent ...... `submit` below (currently a mailto handoff
//                                     to CONTACT_EMAIL, swap for a backend
//                                     function when one is wired up)
// ─────────────────────────────────────────────────────────────────────────────

const CONTACT_EMAIL = "info@abaadblocks.com";
const MAX_IMAGES = 6;

const schema = z.object({
  name: z.string().trim().min(2, "Name is too short").max(100),
  company: z.string().trim().max(120).optional(),
  email: z.string().trim().email("Invalid email").max(255),
  phone: z.string().trim().max(40).optional(),
  notes: z.string().trim().max(1500).optional(),
});

export default function Quote() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const [images, setImages] = useState<{ file: File; url: string }[]>([]);
  const [gen, setGen] = useState<1 | 2>(2);
  const [w, setW] = useState(3);
  const [h, setH] = useState(2.5);
  const [d, setD] = useState(2);
  const [customColor, setCustomColor] = useState(true);
  const [form, setForm] = useState({ name: "", company: "", email: "", phone: "", notes: "" });

  function addImages(list: FileList | null) {
    if (!list) return;
    const next = Array.from(list)
      .filter((f) => f.type.startsWith("image/"))
      .slice(0, MAX_IMAGES - images.length)
      .map((file) => ({ file, url: URL.createObjectURL(file) }));
    setImages((p) => [...p, ...next]);
  }

  // ── Estimate maths ────────────────────────────────────────────────────────
  const estimate = useMemo(() => {
    const volume = Math.max(0, w) * Math.max(0, h) * Math.max(0, d); // m³
    const module = gen === 2 ? 0.2 : 0.2; // metres per cube edge
    const cubes = Math.round(volume / (module * module * module));
    let price = volume * QUOTE_RATES.perCubicMeter[gen];
    if (customColor) price *= QUOTE_RATES.customColor;
    const tier = QUOTE_RATES.bulkTiers.find((tt) => volume >= tt.minM3);
    if (tier) price *= tier.factor;
    return {
      volume,
      cubes,
      low: Math.round((price * 0.85) / 100) * 100,
      high: Math.round((price * 1.15) / 100) * 100,
    };
  }, [w, h, d, gen, customColor]);

  function submit(e: React.FormEvent) {
    e.preventDefault();
    const parsed = schema.safeParse(form);
    if (!parsed.success) {
      toast.error(parsed.error.issues[0].message);
      return;
    }
    const body = [
      `Name: ${parsed.data.name}`,
      `Company: ${parsed.data.company || "-"}`,
      `Email: ${parsed.data.email}`,
      `Phone: ${parsed.data.phone || "-"}`,
      `Generation: ${gen}`,
      `Dimensions (W×H×D m): ${w} × ${h} × ${d}`,
      `Volume: ${estimate.volume.toFixed(2)} m³ (~${estimate.cubes} cubes)`,
      `Custom color: ${customColor ? "yes" : "no"}`,
      `Reference images attached by sender: ${images.length}`,
      "",
      `Notes: ${parsed.data.notes || "-"}`,
    ].join("\n");
    window.location.href = `mailto:${CONTACT_EMAIL}?subject=${encodeURIComponent(
      "Abaad, quote request"
    )}&body=${encodeURIComponent(body)}`;
    toast.success(ar ? "تم تجهيز طلبك، أرفق صورك في البريد." : "Request prepared، attach your images in the email.");
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14 max-w-6xl">
        <header className="mb-10 max-w-3xl">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--accent))]">
            {ar ? "خدمة الجهات" : "For businesses"}
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold mt-2 mb-3">
            <span className="text-gradient">{ar ? "اطلب عرض سعر" : "Request a quote"}</span>
          </h1>
          <p className="text-foreground/65">
            {ar
              ? "ارفع صور مرجعية للمشروع، أدخل الأبعاد المطلوبة، واحصل على تقدير مبدئي فوري قبل أن يتواصل فريقنا معك بعرض رسمي."
              : "Upload reference images, enter your target dimensions, and get an instant indicative estimate before our team sends a formal offer."}
          </p>
        </header>

        <div className="grid lg:grid-cols-[1.15fr_1fr] gap-8 items-start">
          {/* ── Left: inputs ─────────────────────────────────────────────── */}
          <div className="space-y-6">
            {/* Images */}
            <section className="glass-panel rounded-2xl p-6">
              <h2 className="font-display text-lg mb-1 flex items-center gap-2">
                <Upload className="w-4 h-4 text-[hsl(var(--accent))]" />
                {ar ? "١. صور المشروع" : "1. Project images"}
              </h2>
              <p className="text-xs text-foreground/60 mb-4">
                {ar ? `حتى ${MAX_IMAGES} صور، رسومات، مخططات، أو مراجع بصرية.` : `Up to ${MAX_IMAGES} images، sketches, plans or visual references.`}
              </p>
              <label className="block border border-dashed rounded-xl p-8 text-center cursor-pointer hover:bg-[hsl(var(--accent))]/8 transition"
                style={{ borderColor: "var(--card-border)" }}>
                <input type="file" accept="image/*" multiple className="hidden" onChange={(e) => addImages(e.target.files)} />
                <Upload className="w-6 h-6 mx-auto mb-2 text-foreground/50" />
                <span className="text-sm text-foreground/70">{ar ? "اضغط لرفع الصور" : "Click to upload images"}</span>
              </label>
              {images.length > 0 && (
                <div className="grid grid-cols-3 sm:grid-cols-4 gap-3 mt-4">
                  {images.map((im, i) => (
                    <div key={i} className="relative aspect-square rounded-xl overflow-hidden border" style={{ borderColor: "var(--card-border)" }}>
                      <img src={im.url} alt={`Reference ${i + 1}`} className="w-full h-full object-cover" />
                      <button
                        onClick={() => setImages((p) => p.filter((_, j) => j !== i))}
                        className="absolute top-1 end-1 w-6 h-6 rounded-full bg-background/80 flex items-center justify-center"
                        aria-label="Remove image"
                      >
                        <X className="w-3 h-3" />
                      </button>
                    </div>
                  ))}
                </div>
              )}
            </section>

            {/* Dimensions */}
            <section className="glass-panel rounded-2xl p-6">
              <h2 className="font-display text-lg mb-1 flex items-center gap-2">
                <Ruler className="w-4 h-4 text-[hsl(var(--accent))]" />
                {ar ? "٢. الأبعاد المطلوبة" : "2. Target dimensions"}
              </h2>
              <p className="text-xs text-foreground/60 mb-4">{ar ? "بالمتر." : "In metres."}</p>
              <div className="grid grid-cols-3 gap-3 mb-5">
                {([
                  [ar ? "العرض" : "Width", w, setW],
                  [ar ? "الارتفاع" : "Height", h, setH],
                  [ar ? "العمق" : "Depth", d, setD],
                ] as const).map(([label, val, set], i) => (
                  <div key={i}>
                    <label className="text-[10px] tracking-[0.16em] uppercase text-foreground/45 mb-1.5 block">{label}</label>
                    <input
                      type="number" min={0} step={0.1} value={val}
                      onChange={(e) => (set as (n: number) => void)(Math.max(0, Number(e.target.value) || 0))}
                      className="input-field" dir="ltr"
                    />
                  </div>
                ))}
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <div>
                  <label className="text-[10px] tracking-[0.16em] uppercase text-foreground/45 mb-1.5 flex items-center gap-1.5">
                    <Layers className="w-3 h-3" />{ar ? "الجيل" : "Generation"}
                  </label>
                  <div className="flex gap-2">
                    {([2, 1] as const).map((g) => (
                      <button key={g} onClick={() => setGen(g)} type="button"
                        className="flex-1 px-3 py-2.5 rounded-xl text-sm border transition"
                        style={{
                          borderColor: gen === g ? "hsl(var(--accent))" : "var(--card-border)",
                          background: gen === g ? "hsl(var(--accent) / 0.15)" : "transparent",
                        }}>
                        {ar ? `الجيل ${g}` : `Gen ${g}`}
                      </button>
                    ))}
                  </div>
                </div>
                <div>
                  <label className="text-[10px] tracking-[0.16em] uppercase text-foreground/45 mb-1.5 flex items-center gap-1.5">
                    <Palette className="w-3 h-3" />{ar ? "لون مخصص" : "Custom color"}
                  </label>
                  <button type="button" onClick={() => setCustomColor(!customColor)}
                    className="w-full px-3 py-2.5 rounded-xl text-sm border transition"
                    style={{
                      borderColor: customColor ? "hsl(var(--accent))" : "var(--card-border)",
                      background: customColor ? "hsl(var(--accent) / 0.15)" : "transparent",
                    }}>
                    {customColor ? (ar ? "نعم" : "Yes") : (ar ? "لا، ألوان قياسية" : "No، standard colors")}
                  </button>
                </div>
              </div>
            </section>

            {/* Contact */}
            <section className="glass-panel rounded-2xl p-6">
              <h2 className="font-display text-lg mb-4 flex items-center gap-2">
                <Send className="w-4 h-4 text-[hsl(var(--accent))]" />
                {ar ? "٣. بيانات التواصل" : "3. Your details"}
              </h2>
              <form onSubmit={submit} className="space-y-3">
                <div className="grid sm:grid-cols-2 gap-3">
                  <input className="input-field" placeholder={ar ? "الاسم" : "Full name"} maxLength={100}
                    value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} />
                  <input className="input-field" placeholder={ar ? "الجهة / الشركة" : "Company"} maxLength={120}
                    value={form.company} onChange={(e) => setForm({ ...form, company: e.target.value })} />
                  <input className="input-field" type="email" placeholder={ar ? "البريد الإلكتروني" : "Email"} maxLength={255}
                    value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} dir="ltr" />
                  <input className="input-field" placeholder={ar ? "رقم الجوال" : "Phone"} maxLength={40}
                    value={form.phone} onChange={(e) => setForm({ ...form, phone: e.target.value })} dir="ltr" />
                </div>
                <textarea className="input-field min-h-[110px]" maxLength={1500}
                  placeholder={ar ? "تفاصيل المشروع، المدة الزمنية، مكان التركيب…" : "Project details, timeline, installation site…"}
                  value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })} />
                <button type="submit" className="btn-primary w-full">
                  <Send className="w-4 h-4" />
                  {ar ? "إرسال طلب عرض السعر" : "Send quote request"}
                </button>
              </form>
            </section>
          </div>

          {/* ── Right: live estimate ─────────────────────────────────────── */}
          <aside className="glass-panel rounded-2xl p-6 lg:sticky lg:top-6">
            <h2 className="font-display text-lg mb-4 flex items-center gap-2">
              <Calculator className="w-4 h-4 text-[hsl(var(--accent))]" />
              {ar ? "التقدير المبدئي" : "Indicative estimate"}
            </h2>
            <div className="space-y-3 mb-5">
              <Row label={ar ? "الحجم الإجمالي" : "Total volume"} value={`${estimate.volume.toFixed(2)} m³`} />
              <Row label={ar ? "عدد المكعبات التقريبي" : "Approx. cubes"} value={`≈ ${estimate.cubes.toLocaleString()}`} />
              <Row label={ar ? "الجيل" : "Generation"} value={ar ? `الجيل ${gen}` : `Gen ${gen}`} />
              <Row label={ar ? "لون مخصص" : "Custom color"} value={customColor ? (ar ? "نعم" : "Yes") : (ar ? "لا" : "No")} />
            </div>
            <div className="rounded-xl p-5 text-center border" style={{ borderColor: "var(--card-border)", background: "hsl(var(--accent) / 0.10)" }}>
              <div className="text-[10px] tracking-[0.18em] uppercase text-foreground/55 mb-1">
                {ar ? "النطاق التقديري" : "Estimated range"}
              </div>
              <div className="font-display text-2xl font-bold text-[hsl(var(--accent))]" dir="ltr">
                {estimate.low.toLocaleString()} – {estimate.high.toLocaleString()} SAR
              </div>
            </div>
            <p className="text-[11px] text-foreground/50 mt-4 leading-relaxed">
              {ar
                ? "هذا تقدير مبدئي غير ملزم ويعتمد على الحجم والجيل والتخصيص. العرض النهائي يصدر بعد مراجعة فريقنا للمشروع."
                : "This is a non-binding indicative estimate based on volume, generation and customization. A formal offer follows our team's review."}
            </p>
          </aside>
        </div>
      </div>
    </Layout>
  );
}

function Row({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-center justify-between text-sm">
      <span className="text-foreground/60">{label}</span>
      <span className="font-medium">{value}</span>
    </div>
  );
}
