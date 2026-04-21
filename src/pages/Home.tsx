import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { Layout } from "@/components/Layout";
import { Product3D } from "@/components/Product3D";
import { PRODUCTS } from "@/data/products";
import { ArrowRight, Box, Sparkles, ShoppingBag, MapPin } from "lucide-react";
import { useState } from "react";

export default function Home() {
  const { t, lang } = useLang();
  return (
    <Layout>
      {/* Welcome / hero with rotating 3D background */}
      <section className="relative overflow-hidden min-h-[100vh] flex items-center">
        {/* Rotating 3D background — centered, fills the section */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 2.0, duration: 1.2 }}
          className="absolute inset-0 pointer-events-none"
          aria-hidden
        >
          <div className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 w-[min(90vw,820px)] h-[min(90vw,820px)] opacity-80">
            <Product3D product={PRODUCTS[0]} autoRotate shinyWood />
          </div>
          {/* Soft vignette so text reads */}
          <div
            className="absolute inset-0"
            style={{
              background:
                "radial-gradient(ellipse at center, transparent 0%, hsl(var(--bg-root) / 0.55) 60%, hsl(var(--bg-root) / 0.92) 100%)",
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
            <span className="inline-block text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))] mb-5 px-3 py-1 rounded-full border border-[color:var(--card-border)] bg-background/40 backdrop-blur-md">
              {lang === "ar" ? "أبعاد · صُنع في السعودية" : "ABBAD · Made in Saudi"}
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
              <span className="text-gradient">{t.hero.title}</span>
            </h1>
            <p className="text-base md:text-lg text-foreground/75 mb-8 max-w-xl mx-auto leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3 justify-center">
              <Link to="/store" className="btn-primary">
                <ShoppingBag className="w-4 h-4" />
                {t.hero.cta}
                <ArrowRight className="w-4 h-4" />
              </Link>
              <Link to="/studio" className="btn-ghost">
                <Sparkles className="w-4 h-4" />
                {t.hero.cta2}
              </Link>
            </div>
          </motion.div>
        </div>
      </section>

      {/* Feature strip */}
      <section className="container mx-auto px-6 grid md:grid-cols-3 gap-5 mb-20">
        {[
          { Icon: Box, title: lang === "ar" ? "هندسة دقيقة" : "Precision geometry", body: lang === "ar" ? "كل قطعة مُختبرة ميكانيكياً" : "Every piece mechanically tested" },
          { Icon: Sparkles, title: lang === "ar" ? "ذكاء توليدي" : "Generative AI", body: lang === "ar" ? "صِف الفكرة، نولّد التصميم" : "Describe the idea, get a design" },
          { Icon: MapPin, title: lang === "ar" ? "شحن داخل السعودية" : "Ships within Saudi Arabia", body: lang === "ar" ? "نشحن حصرياً داخل المملكة" : "We currently ship inside KSA only" },
        ].map(({ Icon, title, body }, i) => (
          <motion.div
            key={i}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ delay: i * 0.1 }}
            className="glass-card rounded-2xl p-6"
          >
            <div className="w-11 h-11 rounded-xl bg-green-500/30 flex items-center justify-center mb-4">
              <Icon className="w-5 h-5 text-green-100" />
            </div>
            <h3 className="font-display text-lg font-semibold mb-1">{title}</h3>
            <p className="text-sm text-foreground/65">{body}</p>
          </motion.div>
        ))}
      </section>

      {/* Featured products */}
      <section className="container mx-auto px-6 pb-12">
        <div className="flex items-center justify-between mb-8">
          <h2 className="font-display text-2xl md:text-3xl font-semibold">{t.store.title}</h2>
          <Link to="/store" className="text-sm flex items-center gap-2 hover:text-green-100 transition">
            {t.store.viewAll} <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
        <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
          {PRODUCTS.slice(0, 8).map((p, i) => (
            <HomeProductCard key={p.id} product={p} index={i} lang={lang} t={t} />
          ))}
        </div>
      </section>
    </Layout>
  );
}

function HomeProductCard({ product: p, index: i, lang, t }: { product: typeof PRODUCTS[number]; index: number; lang: string; t: any }) {
  const [hover, setHover] = useState(false);
  return (
    <Link
      to="/store"
      className="glass-card rounded-2xl overflow-hidden group block"
      style={{ animationDelay: `${i * 0.08}s` }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
    >
      <div className="aspect-square relative overflow-hidden flex items-center justify-center" style={{ background: "rgba(106,125,122,0.14)" }}>
        {hover ? (
          <Product3D product={p} autoRotate />
        ) : (
          <div
            className="w-full h-full flex items-center justify-center"
            style={{ background: `radial-gradient(circle at 35% 30%, ${p.color}, ${p.color}cc 55%, ${p.color}88 100%)` }}
          >
            <div
              className="w-16 h-16 rounded-full"
              style={{
                background: p.color,
                boxShadow: `0 12px 32px ${p.color}66, inset 0 -8px 24px rgba(0,0,0,0.18), inset 0 8px 20px rgba(255,255,255,0.18)`,
              }}
            />
          </div>
        )}
      </div>
      <div className="p-3">
        <h3 className="font-display text-sm font-semibold">
          {p.kind === "cube" ? (lang === "ar" ? "مكعب" : "Cube") : t.store.sheetTitle}
        </h3>
        <p className="text-[11px] text-foreground/55">
          {p.kind === "cube" ? `${p.size}³ ${t.common.cm}` : t.store.sheetSize}
        </p>
        <p className="text-[10px] text-foreground/45 mt-0.5">
          {lang === "ar" ? p.colorName.ar : p.colorName.en}
        </p>
      </div>
    </Link>
  );
}
