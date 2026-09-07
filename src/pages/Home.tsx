import { useState } from "react";
import { Link } from "react-router-dom";

import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { Layout } from "@/components/Layout";
import { Product3D } from "@/components/Product3D";
import { PRODUCTS } from "@/data/products";
import {
  ArrowRight,
  Box,
  Recycle,
  MapPin,
  FileText,
  LayoutGrid,
  Ruler,
  Truck,
  Wrench,
  Theater,
  GraduationCap,
  Store as StoreIcon,
  Building2,
} from "lucide-react";
import bgBlueprint from "@/assets/bg-blueprint.jpg";
import bgProcessTech from "@/assets/bg-process-tech.jpg";
import bgCraftAsset from "@/assets/bg-craft.jpg.asset.json";

// ─────────────────────────────────────────────────────────────────────────────
// HOME (B2B). No prices anywhere, every call to action leads to /store or /quote.
// WHERE TO CHANGE THINGS:
//  • Section background images ...... src/assets/bg-*.jpg (imported above)
//  • Steps / sectors / numbers ...... the arrays inside each section below
// ─────────────────────────────────────────────────────────────────────────────
export default function Home() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const hero = PRODUCTS[0]; // Gen 2 cube

  return (
    <Layout>
      {/* ── HERO ─────────────────────────────────────────────────────────── */}
      <section className="relative overflow-hidden min-h-[92vh] flex items-center">
        <img
          src={bgBlueprint}
          alt=""
          aria-hidden
          className="absolute inset-0 w-full h-full object-cover opacity-[0.35]"
        />
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.6, duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,820px)] h-[min(92vw,820px)]">
            <Product3D product={hero} autoRotate shinyWood colorOverride="#6f4a2c" />
          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 58%, hsl(var(--bg-root) / 0.35) 92%, hsl(var(--bg-root) / 0.75) 100%)",
            }}
          />
        </motion.div>

        <div className="container relative z-10 mx-auto px-6 pt-24 md:pt-28 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 1.6, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-block text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))] mb-3 px-3 py-1 rounded-full border border-[color:var(--card-border)] bg-background/40 backdrop-blur-md">
              {ar ? "أبعاد · صُنع في السعودية" : "ABAAD · Made in Saudi Arabia"}
            </span>
            <div className="mb-5">
              <span
                className="inline-block text-[10px] sm:text-[11px] leading-relaxed px-3 py-1 rounded-full border"
                style={{ color: "#e0453c", borderColor: "rgba(224, 69, 60, 0.45)", background: "rgba(224, 69, 60, 0.10)" }}
              >
                {ar
                  ? "جميع المنتجات محمية ويُمنع تقليدها أو نسخها"
                  : "All products are protected. Imitation or copying is prohibited"}
              </span>
            </div>

            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.1] mb-6">
              <span className="text-gradient">
                {ar ? "وحدات بناء أبعاد" : "Abaad building units"}
              </span>
            </h1>
            <p className="text-base md:text-lg text-foreground/78 mb-8 max-w-xl mx-auto leading-relaxed">
              {ar
                ? "وحدات وموصّلات مصنّعة بدقة لتنفيذ المسارح والفعاليات."
                : "Precision units and connecters for theatres and events."}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/quote" className="btn-primary">
                <FileText className="w-4 h-4" />
                {ar ? "اطلب عرض سعر" : "Request a quote"}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/store" className="btn-ghost">
                <LayoutGrid className="w-4 h-4" />
                {ar ? "تصفّح المنتجات" : "Browse products"}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* ── VALUE STRIP ──────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 grid md:grid-cols-3 gap-5 mb-20">
        {[
          {
            Icon: Box,
            title: ar ? "هندسة دقيقة" : "Precision engineering",
            body: ar ? "كل وحدة تُختبر ميكانيكياً قبل التسليم" : "Every unit is mechanically tested before delivery",
          },
          {
            Icon: Recycle,
            title: ar ? "قابلة لإعادة الاستخدام" : "Built for reuse",
            body: ar ? "فكّ التنفيذ وأعد استخدام الوحدات نفسها" : "Strike one build and reuse the same units",
          },
          {
            Icon: MapPin,
            title: ar ? "تصنيع داخل المملكة" : "Manufactured in KSA",
            body: ar ? "توريد وتسليم لجميع مناطق المملكة" : "Supply and delivery across Saudi Arabia",
          },
        ].map(({ Icon, title, body }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div
              className="w-11 h-11 rounded-xl flex items-center justify-center mb-4"
              style={{ background: "hsl(var(--accent) / 0.16)" }}
            >
              <Icon className="w-5 h-5 text-[hsl(var(--accent))]" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-foreground/65">{body}</p>
          </motion.div>
        ))}
      </section>

      {/* ── HOW IT WORKS, over the stage photograph ──────────────────────── */}
      <section className="relative overflow-hidden mb-20 border-y" style={{ borderColor: "var(--card-border)" }}>
        <img
          src={bgProcessTech}
          alt=""
          aria-hidden
          loading="lazy"
          width={1920}
          height={1080}
          className="absolute inset-0 w-full h-full object-cover opacity-30"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, hsl(var(--bg-root) / 0.82), hsl(var(--bg-root) / 0.94))" }}
        />
        <div className="relative container mx-auto px-6 py-20">
          <h2 className="font-display text-2xl md:text-4xl font-semibold text-center mb-3">
            {ar ? "كيف نعمل" : "How we work"}
          </h2>
          <p className="text-center text-foreground/65 max-w-xl mx-auto mb-12">
            {ar
              ? "من أول رسالة حتى تسليم المشروع جاهزاً، أربع خطوات واضحة."
              : "From the first message to a finished handover, four clear steps."}
          </p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-5">
            {[
              {
                Icon: FileText,
                title: ar ? "١. طلب العرض" : "1. Request",
                body: ar ? "تشاركنا المساحة والغرض والموعد." : "You share the space, the purpose and the date.",
              },
              {
                Icon: Ruler,
                title: ar ? "٢. التصميم" : "2. Design",
                body: ar ? "نحدد عدد الوحدات وتوزيعها والألوان." : "We define the unit count, layout and colours.",
              },
              {
                Icon: Truck,
                title: ar ? "٣. التوريد" : "3. Delivery",
                body: ar ? "تصنيع وتجهيز وتوصيل داخل المملكة." : "Manufacturing, preparation and delivery in the Kingdom.",
              },
              {
                Icon: Wrench,
                title: ar ? "٤. التركيب" : "4. Installation",
                body: ar ? "تركيب خلال ٣ إلى ٨ ساعات، وفكّ سريع بعد الفعالية." : "Installed in 3 to 8 hours, and struck quickly after.",
              },
            ].map(({ Icon, title, body }, i) => (
              <motion.div
                key={i}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.08 }}
                className="glass-card rounded-2xl p-6"
              >
                <Icon className="w-5 h-5 text-[hsl(var(--accent))] mb-4" />
                <h3 className="font-display text-base font-semibold mb-1.5">{title}</h3>
                <p className="text-sm text-foreground/65 leading-relaxed">{body}</p>
              </motion.div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTORS ──────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 mb-20">
        <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
          {ar ? "أين تُستخدم أبعاد" : "Where Abaad is used"}
        </h2>
        <p className="text-foreground/65 mb-8">
          {ar ? "قطاعات نخدمها بوحدات واحدة وتركيبات مختلفة." : "Sectors we serve with one kit and many configurations."}
        </p>
        <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
          {[
            { Icon: Theater, t: ar ? "المسارح والفعاليات" : "Theatres and events", b: ar ? "خلفيات ومنصّات ومستويات." : "Backdrops, platforms and levels." },
            { Icon: StoreIcon, t: ar ? "المعارض والعلامات" : "Exhibitions and brands", b: ar ? "أجنحة وواجهات عرض." : "Booths and display fronts." },
            { Icon: GraduationCap, t: ar ? "التعليم" : "Education", b: ar ? "فصول مرنة وأنشطة عملية." : "Flexible classrooms and hands on activities." },
            { Icon: Building2, t: ar ? "الجهات الحكومية" : "Public institutions", b: ar ? "مبادرات ومناسبات متكررة." : "Recurring initiatives and occasions." },
          ].map(({ Icon, t, b }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-2xl p-6"
            >
              <Icon className="w-5 h-5 text-[hsl(var(--accent))] mb-3" />
              <h3 className="font-display text-base font-semibold mb-1">{t}</h3>
              <p className="text-sm text-foreground/62">{b}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* ── CRAFT SPLIT ──────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 mb-20">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="rounded-3xl overflow-hidden border min-h-[280px]" style={{ borderColor: "var(--card-border)" }}>
            <img
              src={bgCraft}
              alt={ar ? "وحدة خشبية مصنّعة بدقة" : "A precision manufactured wooden unit"}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
          <div className="glass-panel rounded-3xl p-8 md:p-10 flex flex-col justify-center">
            <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))] mb-3">
              {ar ? "التصنيع" : "Manufacturing"}
            </span>
            <h2 className="font-display text-2xl md:text-3xl font-semibold mb-4">
              {ar ? "دقة في كل وحدة، ثبات في كل تركيب" : "Precision in every unit, stability in every build"}
            </h2>
            <p className="text-foreground/72 leading-loose mb-6">
              {ar
                ? "تُصنَّع الوحدات بمقاسات موحّدة وتُختبر قبل التسليم، ويربطها موصّل واحد يمنح التركيب ثباتاً دون أدوات أو مسامير، ويسمح بالفكّ دون إتلاف أي قطعة."
                : "Units are produced to a single standard size and tested before delivery. One connecter holds the build steady without tools or screws, and lets it come apart without damaging a single piece."}
            </p>
            <div className="flex flex-wrap gap-3">
              <Link to="/store" className="btn-ghost">
                <LayoutGrid className="w-4 h-4" />
                {ar ? "تصفّح المنتجات" : "Browse products"}
              </Link>
              <Link to="/models" className="btn-ghost">
                {ar ? "شاهد نماذجنا" : "See our models"}
                <ArrowRight className="w-4 h-4" />
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* ── PRODUCTS ─────────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-semibold">{ar ? "المنتجات" : "Products"}</h2>
          <Link to="/store" className="text-sm flex items-center gap-2 hover:text-[hsl(var(--accent))] transition">
            {ar ? "عرض الكل" : "View all"} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS.slice(0, 8).map((p, i) => (
            <HomeProductCard key={p.id} product={p} index={i} ar={ar} />
          ))}
        </div>
      </section>

      {/* ── CLOSING CTA ──────────────────────────────────────────────────── */}
      <section className="container mx-auto px-6 pb-20">
        <div className="glass-panel rounded-3xl p-10 md:p-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
            {ar ? "جاهزون لمشروعك القادم" : "Ready for your next project"}
          </h2>
          <p className="text-foreground/70 mb-7 max-w-xl mx-auto">
            {ar
              ? "اختر التأجير أو التأجير مع التركيب أو الشراء، وسنعود إليك بعرض واضح."
              : "Choose rental, rental with installation, or purchase, and we come back with a clear offer."}
          </p>
          <Link to="/quote" className="btn-primary">
            <FileText className="w-4 h-4" />
            {ar ? "اطلب عرض سعر" : "Request a quote"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}

// 3D preview that stays still until the user clicks it, then becomes rotatable.
function HomeProductCard({
  product: p,
  index: i,
  ar,
}: {
  product: (typeof PRODUCTS)[number];
  index: number;
  ar: boolean;
}) {
  const [live, setLive] = useState(false);
  return (
    <div
      className="glass-card neon-edge rounded-2xl overflow-hidden group block"
      style={{ animationDelay: `${i * 0.08}s` }}
    >
      <div
        className="aspect-square relative overflow-hidden cursor-pointer"
        onClick={() => setLive(true)}
        style={{
          background:
            "linear-gradient(160deg, hsl(var(--accent) / 0.30) 0%, hsl(var(--bg-sidebar)) 45%, hsl(var(--accent) / 0.14) 100%)",
        }}
      >
        <Product3D product={p} autoRotate={live} interactive={live} shinyWood colorOverride={p.color} />
        {!live && (
          <span className="absolute bottom-2 end-2 z-10 text-[10px] px-2 py-1 rounded-full bg-background/70 border border-[color:var(--card-border)] text-foreground/70">
            {ar ? "اضغط للتدوير" : "Click to rotate"}
          </span>
        )}
      </div>
      <Link to="/store" className="block p-3">
        <span className="text-[10px] tracking-wider uppercase text-[hsl(var(--accent))]">
          {ar ? `الجيل ${p.generation === 2 ? "الثاني" : "الأول"}` : `Gen ${p.generation}`}
        </span>
        <h3 className="font-display text-sm font-semibold">{ar ? p.name.ar : p.name.en}</h3>
        <p className="text-[11px] text-foreground/55">
          {p.dims.x} × {p.dims.y} × {p.dims.z} {ar ? "سم" : "cm"}
        </p>
      </Link>
    </div>
  );
}
