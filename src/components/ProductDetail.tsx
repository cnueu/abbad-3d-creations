import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart, Palette, Info } from "lucide-react";
import { Product } from "@/data/products";
import { Product3D } from "./Product3D";
import { useLang } from "@/i18n/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { useEffect, useState } from "react";

interface Props {
  product: Product | null;
  onClose: () => void;
}

// Sheets-included formula: 6n − 2 sheets per n cubes (min 0).
function sheetsFor(n: number) {
  return Math.max(0, 6 * n - 2);
}

export function ProductDetail({ product, onClose }: Props) {
  const { t, lang } = useLang();
  const { add } = useCart();
  const isCube = product?.kind === "cube" || product?.kind === "custom-cube";
  const isCustom = product?.kind === "custom-cube";

  const [qty, setQty] = useState(1);
  const [customHex, setCustomHex] = useState("#a47148");

  useEffect(() => {
    if (product) {
      setQty(product.minQty ?? 1);
      setCustomHex(product.color || "#a47148");
    }
  }, [product]);

  const title = product
    ? isCube
      ? isCustom
        ? t.store.customColor
        : lang === "ar" ? "مكعب" : "Cube"
      : t.store.sheetTitle
    : "";

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
              <Product3D product={product} colorOverride={isCustom ? customHex : undefined} />
            </div>
            <div className="p-7 md:p-9 relative">
              <button
                onClick={onClose}
                className="absolute top-5 end-5 w-9 h-9 rounded-full border border-[color:var(--card-border)] flex items-center justify-center hover:bg-[hsl(var(--accent))]/15 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-display text-3xl font-bold mb-1">{title}</h2>
              <p className="text-sm text-foreground/60 mb-6">
                {isCube
                  ? `${product.size} × ${product.size} × ${product.size} ${t.common.cm}`
                  : `${product.dims.y} × ${product.dims.x} × ${product.dims.z} ${t.common.cm}`}
              </p>

              <div className="space-y-4 mb-7">
                <Detail label={t.store.description}>
                  {isCube ? t.store.cubeDesc : t.store.sheetDesc}
                </Detail>

                {isCube && (
                  <div className="flex items-start gap-2.5 p-3 rounded-xl bg-[hsl(var(--accent))]/10 border border-[color:var(--card-border)]">
                    <Info className="w-4 h-4 mt-0.5 text-[hsl(var(--accent))] shrink-0" />
                    <div className="text-xs text-foreground/80 leading-relaxed">
                      <div className="font-medium mb-0.5">{t.store.includesNote}</div>
                      <div className="text-foreground/65">
                        {t.store.includesFormula
                          .replace("{n}", String(qty))
                          .replace("{s}", String(sheetsFor(qty)))}
                      </div>
                    </div>
                  </div>
                )}

                {isCustom && (
                  <div>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-foreground/45 mb-2 flex items-center gap-1.5">
                      <Palette className="w-3 h-3" /> {t.store.pickColor}
                    </div>
                    <div className="flex items-center gap-3">
                      <input
                        type="color"
                        value={customHex}
                        onChange={(e) => setCustomHex(e.target.value)}
                        className="w-14 h-14 rounded-xl border border-[color:var(--card-border)] bg-transparent cursor-pointer"
                        aria-label={t.store.pickColor}
                      />
                      <input
                        type="text"
                        value={customHex}
                        onChange={(e) => setCustomHex(e.target.value)}
                        className="input-field flex-1 font-mono text-sm uppercase"
                        dir="ltr"
                        maxLength={7}
                      />
                    </div>
                    {product.minQty && (
                      <p className="text-[11px] text-foreground/55 mt-2">
                        {lang === "ar"
                          ? `الحد الأدنى ${product.minQty} مكعب`
                          : `Minimum order: ${product.minQty} cubes`}
                      </p>
                    )}
                  </div>
                )}

                <Detail label={t.store.material}>{product.materials.join(" , ")}</Detail>
                <Detail label={t.store.size}>
                  {isCube ? `${product.size}³ ${t.common.cm}` : t.store.sheetSize}
                </Detail>

                {isCube && (
                  <div>
                    <div className="text-[10px] tracking-[0.18em] uppercase text-foreground/45 mb-1.5">
                      {lang === "ar" ? "الكمية" : "Quantity"}
                    </div>
                    <input
                      type="number"
                      min={product.minQty ?? 1}
                      value={qty}
                      onChange={(e) => setQty(Math.max(product.minQty ?? 1, Number(e.target.value) || 1))}
                      className="input-field w-32"
                    />
                  </div>
                )}
              </div>

              <div className="flex items-center justify-between gap-4 pt-5 border-t border-[color:var(--card-border)]">
                <span className="font-display text-2xl font-bold text-[hsl(var(--accent))]">
                  {(product.price * (isCube ? qty : 1)).toFixed(2)} {t.common.sar}
                </span>
                <button
                  onClick={() => {
                    add(product, isCube ? qty : 1, isCustom ? { customColor: customHex } : undefined);
                    toast.success(lang === "ar" ? "أُضيف إلى السلة" : "Added to cart");
                  }}
                  className="btn-primary"
                >
                  <ShoppingCart className="w-4 h-4" />
                  {t.store.addToCart}
                </button>
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
