import { useState } from "react";
import { Layout } from "@/components/Layout";
import { ProductCard } from "@/components/ProductCard";
import { ProductDetail } from "@/components/ProductDetail";
import { PRODUCTS, CUSTOM_CUBES, Product } from "@/data/products";
import { useLang } from "@/i18n/LanguageContext";
import { Palette } from "lucide-react";

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
          const custom = CUSTOM_CUBES.find((c) => c.size === g.size);
          return (
            <section key={g.size} className="mb-14">
              <h2 className="font-display text-xl mb-5 text-foreground/80">{g.label}</h2>
              <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-4 gap-4">
                {items.map((p, i) => (
                  <ProductCard key={p.id} product={p} index={i} onClick={() => setSelected(p)} />
                ))}
                {custom && (
                  <button
                    onClick={() => setSelected(custom)}
                    className="glass-card rounded-2xl overflow-hidden text-start group flex flex-col"
                  >
                    <div
                      className="aspect-square w-full relative overflow-hidden flex items-center justify-center"
                      style={{
                        background:
                          "conic-gradient(from 90deg at 50% 50%, #ffffff, #c8ccd2, #6b7079, #131312, #6b7079, #c8ccd2, #ffffff)",
                      }}
                    >
                      <div className="w-20 h-20 rounded-full bg-background/85 backdrop-blur-md flex items-center justify-center shadow-lg">
                        <Palette className="w-9 h-9 text-foreground/80" />
                      </div>
                    </div>
                    <div className="px-4 pt-4 pb-5 flex-1">
                      <div className="flex items-center gap-2 mb-1">
                        <Palette className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                        <h3 className="font-display text-lg font-semibold text-foreground">
                          {lang === "ar" ? "لون مخصص" : "Custom color"}
                        </h3>
                      </div>
                      <p className="text-xs text-foreground/65 mb-1">
                        {custom.size} × {custom.size} × {custom.size} {t.common.cm}
                      </p>
                      <p className="text-[11px] text-foreground/55 mb-3">
                        {lang === "ar"
                          ? `الحد الأدنى ${custom.minQty} مكعب`
                          : `Min order: ${custom.minQty} cubes`}
                      </p>
                      <div className="flex items-center justify-between">
                        <span className="text-[11px] tracking-wider uppercase text-foreground/55">
                          {lang === "ar" ? "حسب الطلب" : "On request"}
                        </span>
                        <span className="text-sm font-semibold text-[hsl(var(--accent))]">
                          {custom.price} {t.common.sar}
                        </span>
                      </div>
                    </div>
                  </button>
                )}
              </div>
            </section>
          );
        })}

        <section>
          <h2 className="font-display text-xl mb-1 text-foreground/80">
            {t.store.extraSheetsTitle} · {lang === "ar" ? "0.25 ر.س" : "0.25 SAR"}
          </h2>
          <p className="text-sm text-foreground/60 mb-5 max-w-2xl">{t.store.extraSheetsBody}</p>
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
