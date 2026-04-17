import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { PRODUCTS, Product } from "@/data/products";
import { useLang } from "@/i18n/LanguageContext";

export default function Store() {
  const { t } = useLang();
  const [selected, setSelected] = useState<Product | null>(null);

  const cubes = PRODUCTS.filter((p) => p.kind === "cube");
  const sheets = PRODUCTS.filter((p) => p.kind === "sheet");

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14">
        <header className="mb-10">
          <h1 className="font-display text-3xl md:text-5xl font-bold mb-3">
            <span className="text-gradient">{t.store.title}</span>
          </h1>
          <p className="text-foreground/65 max-w-2xl">{t.store.subtitle}</p>
        </header>

        <section className="mb-14">
          <h2 className="font-display text-xl mb-5 text-foreground/80">{t.store.title}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {cubes.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onClick={() => setSelected(p)} />
            ))}
          </div>
        </section>

        <section>
          <h2 className="font-display text-xl mb-5 text-foreground/80">{t.store.sheetTitle}</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {sheets.map((p, i) => (
              <ProductCard key={p.id} product={p} index={i} onClick={() => setSelected(p)} />
            ))}
          </div>
        </section>
      </div>

      <ProductDetail product={selected} onClose={() => setSelected(null)} />
    </Layout>
  );
}
