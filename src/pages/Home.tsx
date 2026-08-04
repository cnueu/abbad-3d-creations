import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { Layout } from "@/components/Layout";
import { Product3D } from "@/components/Product3D";
import { PRODUCTS } from "@/data/products";
import { ArrowRight, Box, Recycle, MapPin, FileText, LayoutGrid } from "lucide-react";

// HOME (B2B). No prices anywhere, every CTA leads to /store or /quote.
export default function Home() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const hero = PRODUCTS[0]; // Gen 2 cube

  return (
    <Layout>
      {/* Hero with the rotating Gen 2 cube */}
      <section className="relative overflow-hidden min-h-[100vh] flex items-center">
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(92vw,860px)] h-[min(92vw,860px)]">
            {/* Hero cube tone, deeper walnut so it does not glare */}
            <Product3D product={hero} autoRotate shinyWood colorOverride="#6f4a2c" />

          </div>
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 55%, hsl(var(--bg-root) / 0.35) 90%, hsl(var(--bg-root) / 0.7) 100%)",
            }}
          />
        </motion.div>

        <div className="container relative z-10 mx-auto px-6 pt-32 md:pt-40 pb-24 text-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
            className="max-w-3xl mx-auto"
          >
            <span className="inline-block text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))] mb-3 px-3 py-1 rounded-full border border-[color:var(--card-border)] bg-background/40 backdrop-blur-md">
              {ar ? "أبعاد · صُنع في السعودية" : "ABAAD · Made in Saudi Arabia"}
            </span>
            {/* Intellectual-property notice, deliberately in red under the "Made in Saudi Arabia" badge. */}
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

            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
              <span className="text-gradient">
                {ar ? "نظام بناء معياري للمشاريع الكبرى" : "A modular building system for large projects"}
              </span>
            </h1>
            <p className="text-base md:text-lg text-foreground/75 mb-8 max-w-xl mx-auto leading-relaxed">
              {ar
                ? "مكعبات وموصِّلات دقيقة تُبنى وتُفكّك وتُعاد استخدامها، للمسارح والمدارس والعلامات التجارية والجهات الحكومية."
                : "Precision cubes and connecters that build, disassemble and rebuild, for theatres, schools, brands and public institutions."}
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

      {/* Value strip */}
      <section className="container mx-auto px-6 grid md:grid-cols-3 gap-5 mb-20">
        {[
          {
            Icon: Box,
            title: ar ? "هندسة دقيقة" : "Precision geometry",
            body: ar ? "كل قطعة مُختبرة ميكانيكياً قبل التسليم" : "Every piece mechanically tested before delivery",
          },
          {
            Icon: Recycle,
            title: ar ? "قابل لإعادة الاستخدام" : "Endlessly reusable",
            body: ar ? "فكّك المشروع وابنِ التالي بنفس القطع" : "Strike one build and reuse the parts for the next",
          },
          {
            Icon: MapPin,
            title: ar ? "تصنيع داخل المملكة" : "Manufactured in KSA",
            body: ar ? "توريد وتسليم لكل مناطق المملكة" : "Supply and delivery across Saudi Arabia",
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

      {/* The system, Gen 2 first */}
      <section className="container mx-auto px-6 pb-20">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-semibold">
            {ar ? "النظام" : "The system"}
          </h2>
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
    </Layout>
  );
}

// Static card, the heavy 3D viewer only runs on the store detail sheet.
function HomeProductCard({
  product: p,
  index: i,
  ar,
}: {
  product: (typeof PRODUCTS)[number];
  index: number;
  ar: boolean;
}) {
  return (
    <Link
      to="/store"
      className="glass-card neon-edge rounded-2xl overflow-hidden group block"
      style={{ animationDelay: `${i * 0.08}s` }}
    >
      <div className="aspect-square relative overflow-hidden flex items-center justify-center">
        {(
          <div
            className="w-full h-full flex items-center justify-center"
            style={{
              background: `radial-gradient(ellipse at 30% 20%, ${p.color}dd 0%, ${p.color}88 45%, hsl(var(--bg-main)) 100%)`,
            }}
          >
            <div
              className="w-16 h-16 rounded-2xl"
              style={{
                background: `linear-gradient(135deg, ${p.color} 0%, ${p.color}bb 60%, ${p.color}66 100%)`,
                boxShadow: `0 14px 34px ${p.color}55, inset 0 -8px 22px rgba(0,0,0,0.30), inset 0 8px 20px rgba(255,255,255,0.20)`,
              }}
            />
          </div>
        )}
      </div>
      <div className="p-3">
        <span className="text-[10px] tracking-wider uppercase text-[hsl(var(--accent))]">
          {ar ? `الجيل ${p.generation === 2 ? "الثاني" : "الأول"}` : `Gen ${p.generation}`}
        </span>
        <h3 className="font-display text-sm font-semibold">{ar ? p.name.ar : p.name.en}</h3>
        <p className="text-[11px] text-foreground/55">
          {p.dims.x} × {p.dims.y} × {p.dims.z} {ar ? "سم" : "cm"}
        </p>
      </div>
    </Link>
  );
}
