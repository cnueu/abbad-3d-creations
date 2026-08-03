import { motion, AnimatePresence } from "framer-motion";
import { X, Palette, FileText, Ruler } from "lucide-react";
import { Product, COLORS } from "@/data/products";
import { Product3D } from "./Product3D";
import { useLang } from "@/i18n/LanguageContext";
import { useEffect, useState } from "react";
import { Link } from "react-router-dom";

interface Props {
  product: Product | null;
  onClose: () => void;
}

// B2B detail sheet: no prices. Every part is colour-customizable, and the
// primary action sends the visitor to the quote request page.
export function ProductDetail({ product, onClose }: Props) {
  const { t, lang } = useLang();
  const isCube = product?.kind === "cube" || product?.kind === "cube-smooth";
  const [hex, setHex] = useState("#075056");

  useEffect(() => {
    if (product) setHex(product.color);
  }, [product]);

  return (
    <AnimatePresence>
      {product && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-[120] flex items-end md:items-center justify-center bg-black/70 backdrop-blur-sm p-4"
          onClick={onClose}
        >
          <motion.div
            initial={{ y: 60, scale: 0.96, opacity: 0 }}
            animate={{ y: 0, scale: 1, opacity: 1 }}
            exit={{ y: 60, scale: 0.96, opacity: 0 }}
            transition={{ duration: 0.4, ease: [0.22, 1, 0.36, 1] }}
            onClick={(e) => e.stopPropagation()}
            className="glass-panel rounded-3xl w-full max-w-4xl max-h-[88vh] overflow-y-auto grid md:grid-cols-2"
          >
            <div className="aspect-square md:aspect-auto bg-[hsl(var(--muted))]/40">
              <Product3D product={product} colorOverride={hex} shinyWood />
            </div>
            <div className="p-7 md:p-9 relative">
              <button
                onClick={onClose}
                className="absolute top-5 end-5 w-9 h-9 rounded-full border border-[color:var(--card-border)] flex items-center justify-center hover:bg-[hsl(var(--accent))]/15 transition"
                aria-label="Close"
              >
                <X className="w-4 h-4" />
              </button>

              <span className="text-[10px] tracking-[0.18em] uppercase text-[hsl(var(--accent))]">
                {lang === "ar" ? `الجيل ${product.generation}` : `Generation ${product.generation}`}
              </span>
              <h2 className="font-display text-2xl md:text-3xl font-bold mb-1 mt-1">
                {lang === "ar" ? product.name.ar : product.name.en}
              </h2>
              <p className="text-sm text-foreground/60 mb-6 flex items-center gap-2">
                <Ruler className="w-3.5 h-3.5" />
                {isCube
                  ? `${product.size} × ${product.size} × ${product.size} ${t.common.cm}`
                  : `${product.dims.x} × ${product.dims.y} × ${product.dims.z} ${t.common.cm}`}
              </p>

              <div className="space-y-5 mb-7">
                <Detail label={t.store.description}>
                  {isCube
                    ? lang === "ar"
                      ? "مكعب وحدة دقيق يتركّب مع باقي القطع عبر الموصِّلات لبناء أي هيكل، ثم يُفكّك ويُعاد استخدامه."
                      : "A precision unit cube that locks to the rest of the system through connecters, build any structure, then disassemble and reuse it."
                    : lang === "ar"
                      ? "موصِّل منزلق يربط بين مكعبين ويمنحهما ثباتاً ميكانيكياً كاملاً."
                      : "A sliding connecter that joins two cubes and locks them mechanically."}
                </Detail>

                <div>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-foreground/45 mb-2 flex items-center gap-1.5">
                    <Palette className="w-3 h-3" /> {lang === "ar" ? "اللون (قابل للتخصيص)" : "Color (fully customizable)"}
                  </div>
                  <div className="flex flex-wrap gap-2 mb-3">
                    {COLORS.map((c) => (
                      <button
                        key={c.hex}
                        onClick={() => setHex(c.hex)}
                        title={lang === "ar" ? c.ar : c.en}
                        aria-label={lang === "ar" ? c.ar : c.en}
                        className="w-8 h-8 rounded-full transition-transform hover:scale-110"
                        style={{
                          background: c.hex,
                          boxShadow: hex.toLowerCase() === c.hex.toLowerCase()
                            ? "0 0 0 2px hsl(var(--accent))"
                            : "0 0 0 1px var(--card-border)",
                        }}
                      />
                    ))}
                  </div>
                  <div className="flex items-center gap-3">
                    <input
                      type="color"
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                      className="w-12 h-12 rounded-xl border border-[color:var(--card-border)] bg-transparent cursor-pointer"
                      aria-label="Pick color"
                    />
                    <input
                      type="text"
                      value={hex}
                      onChange={(e) => setHex(e.target.value)}
                      className="input-field flex-1 font-mono text-sm uppercase"
                      dir="ltr"
                      maxLength={7}
                    />
                  </div>
                </div>

                <Detail label={t.store.material}>{product.materials.join(" · ")}</Detail>
              </div>

              <div className="pt-5 border-t border-[color:var(--card-border)]">
                <p className="text-xs text-foreground/60 mb-4">
                  {lang === "ar"
                    ? "الأسعار للمشاريع والجهات، اطلب عرض سعر مخصص حسب الكمية والأبعاد."
                    : "Pricing is project based. Request a tailored quote for your quantity and dimensions."}
                </p>
                <Link to="/quote" className="btn-primary w-full">
                  <FileText className="w-4 h-4" />
                  {lang === "ar" ? "اطلب عرض سعر" : "Request a quote"}
                </Link>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

function Detail({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <div>
      <div className="text-[10px] tracking-[0.18em] uppercase text-foreground/45 mb-1">{label}</div>
      <div className="text-sm text-foreground/85 leading-relaxed">{children}</div>
    </div>
  );
}
