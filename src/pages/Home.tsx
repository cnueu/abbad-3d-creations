import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { useLang } from "@/i18n/LanguageContext";
import { Layout } from "@/components/Layout";
import { Product3D } from "@/components/Product3D";
import { PRODUCTS } from "@/data/products";
import { ArrowRight, Box, Sparkles, ShoppingBag } from "lucide-react";

export default function Home() {
  const { t, lang } = useLang();
  return (
    <Layout>
      {/* Welcome / hero */}
      <section className="relative overflow-hidden">
        <div className="container mx-auto px-6 pt-16 md:pt-28 pb-20 grid md:grid-cols-2 gap-10 items-center">
          <motion.div
            initial={{ opacity: 0, y: 30 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 2.0, duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
          >
            <span className="inline-block text-[11px] tracking-[0.22em] uppercase text-green-100 mb-5 px-3 py-1 rounded-full border border-[color:var(--card-border)]">
              {lang === "ar" ? "أبعاد · صُنع في السعودية" : "ABBAD · Made in Saudi"}
            </span>
            <h1 className="font-display text-4xl md:text-6xl font-bold leading-[1.05] mb-6">
              <span className="text-gradient">{t.hero.title}</span>
            </h1>
            <p className="text-base md:text-lg text-foreground/70 mb-8 max-w-xl leading-relaxed">
              {t.hero.subtitle}
            </p>
            <div className="flex flex-wrap gap-3">
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

          <motion.div
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            transition={{ delay: 2.2, duration: 1 }}
            className="mx-auto w-full max-w-sm aspect-square rounded-3xl glass-panel overflow-hidden animate-float"
          >
            <Product3D product={PRODUCTS[0]} />
          </motion.div>
        </div>

        {/* Decorative orbs */}
        <div className="pointer-events-none absolute -top-40 -end-40 w-[500px] h-[500px] rounded-full opacity-30 blur-3xl"
             style={{ background: "radial-gradient(circle, rgba(109,184,172,0.5), transparent 70%)" }} />
      </section>

      {/* Feature strip */}
      <section className="container mx-auto px-6 grid md:grid-cols-3 gap-5 mb-20">
        {[
          { Icon: Box, title: lang === "ar" ? "هندسة دقيقة" : "Precision geometry", body: lang === "ar" ? "كل قطعة مُختبرة ميكانيكياً" : "Every piece mechanically tested" },
          { Icon: Sparkles, title: lang === "ar" ? "ذكاء توليدي" : "Generative AI", body: lang === "ar" ? "صِف الفكرة، نولّد التصميم" : "Describe the idea, get a design" },
          { Icon: ShoppingBag, title: lang === "ar" ? "شحن عالمي" : "Global shipping", body: lang === "ar" ? "من السعودية إلى العالم" : "From Saudi to the world" },
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
            <Link
              key={p.id}
              to="/store"
              className="glass-card rounded-2xl overflow-hidden group block"
              style={{ animationDelay: `${i * 0.08}s` }}
            >
              <div className="aspect-square" style={{ background: "rgba(106,125,122,0.14)" }}>
                <Product3D product={p} autoRotate />
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
          ))}
        </div>
      </section>
    </Layout>
  );
}
