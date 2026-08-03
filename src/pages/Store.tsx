import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { GENERATIONS, Product } from "@/data/products";
import { useLang } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { FileText } from "lucide-react";

// B2B catalogue, parts are grouped by generation and shown WITHOUT prices.
// To add a part or a generation, edit src/data/products.ts.
export default function Store() {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState<Product | null>(null);

  const genMeta: Record<1 | 2, { title: string; body: string }> = {
    2: {
      title: lang === "ar" ? "الجيل الثاني · نظام 20 سم موحّد" : "Generation 2 · Unified 20cm system",
      body:
        lang === "ar"
          ? "أربع قطع: مكعب، مكعب بسطح أملس، موصِّل، ونصف موصِّل. مقاس موحّد 20 سم وألوان قابلة للتخصيص بالكامل."
          : "Four parts: cube, smooth-top cube, connecter and half connecter. One 20cm module, fully customizable colors.",
    },
    1: {
      title: lang === "ar" ? "الجيل الأول · النظام الأصلي" : "Generation 1 · The original system",
      body:
        lang === "ar"
          ? "المكعب الأصلي بمقاسات 10 و20 و30 سم مع موصِّله. ما زال متاحاً للمشاريع القائمة."
          : "The original cube in 10, 20 and 30cm with its connecter. Still available for existing projects.",
    },
  };

  // Only one generation is shown at a time, switch with the tabs below.
  const [gen, setGen] = useState<1 | 2>(2);
  const current = GENERATIONS.find((g) => g.gen === gen)!;

  return (
    <Layout>
      <div className="container mx-auto px-4 sm:px-6 py-10 md:py-14">
        <header className="mb-8 max-w-3xl">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--accent))]">
            {lang === "ar" ? "للمشاريع والجهات" : "For businesses & institutions"}
          </span>
          <h1 className="font-display text-2xl sm:text-3xl md:text-5xl font-bold mb-3 mt-2">
            <span className="text-gradient">{t.store.title}</span>
          </h1>
          <p className="text-foreground/65 mb-5 text-sm sm:text-base">
            {lang === "ar"
              ? "هندسة دقيقة مُختبرة. الأسعار حسب المشروع، اطلب عرض سعر مخصص."
              : "Precision engineered parts. Pricing is project based, request a tailored quote."}
          </p>
          <Link to="/quote" className="btn-primary">
            <FileText className="w-4 h-4" />
            {lang === "ar" ? "اطلب عرض سعر" : "Request a quote"}
          </Link>
        </header>

        {/* GENERATION TABS, each generation lives in its own section. */}
        <div
          className="flex gap-2 p-1 rounded-2xl border w-full sm:w-auto sm:inline-flex mb-7"
          style={{ borderColor: "var(--card-border)", background: "var(--card-bg)" }}
        >
          {GENERATIONS.map(({ gen: g }) => (
            <button
              key={g}
              onClick={() => setGen(g)}
              className="flex-1 sm:flex-none px-4 sm:px-6 py-2.5 rounded-xl text-sm font-medium transition-colors"
              style={{
                background: gen === g ? "hsl(var(--accent) / 0.20)" : "transparent",
                color: gen === g ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.7)",
              }}
            >
              {lang === "ar" ? (g === 2 ? "الجيل الثاني" : "الجيل الأول") : `Generation ${g}`}
            </button>
          ))}
        </div>

        <section key={current.gen}>
          <h2 className="font-display text-lg sm:text-xl md:text-2xl mb-1">{genMeta[current.gen].title}</h2>
          <p className="text-sm text-foreground/60 mb-5 max-w-2xl">{genMeta[current.gen].body}</p>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-3 sm:gap-4">
            {current.items.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onClick={() => setSelected(p)} />
            ))}
          </div>
        </section>
      </div>

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </Layout>
  );
}

