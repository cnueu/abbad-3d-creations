import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { PRODUCTS, Product } from "@/data/products";
import { useLang } from "@/i18n/LanguageContext";

export default function Store() {
  const { t, lang } = useLang();
  const [selected, setSelected] = useState<Product | null>(null);

  const groups: { size: 10 | 20 | 30; label: string }[] = [
    { size: 30, label: lang === "ar" ? "مكعبات كبيرة · 30 سم · 6 ر.س" : "Large cubes · 30cm · 6 SAR" },
    { size: 20, label: lang === "ar" ? "مكعبات وسط · 20 سم · 4 ر.س" : "Medium cubes · 20cm · 4 SAR" },
    { size: 10, label: lang === "ar" ? "مكعبات صغيرة · 10 سم · 2 ر.س" : "Small cubes · 10cm · 2 SAR" },
  ];
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

        {groups.map((g) => {
          const items = PRODUCTS.filter((p) => p.kind === "cube" && p.size === g.size);
          return (
            <section key={g.size} className="mb-14">
              <h2 className="font-display text-xl mb-5 text-foreground/80">{g.label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} onClick={() => setSelected(p)} />
                ))}
              </div>
            </section>
          );
        })}

        <section>
          <h2 className="font-display text-xl mb-5 text-foreground/80">{t.store.sheetTitle}</h2>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
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
