import { motion, AnimatePresence } from "framer-motion";
import { X, ShoppingCart } from "lucide-react";
import { Product } from "@/data/products";
import { Product3D } from "./Product3D";
import { useLang } from "@/i18n/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";

interface Props {
  product: Product | null;
  onClose: () => void;
}

export function ProductDetail({ product, onClose }: Props) {
  const { t, lang } = useLang();
  const { add } = useCart();

  const title = product
    ? product.kind === "cube"
      ? lang === "ar" ? "مكعب" : "Cube"
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
            <div className="aspect-square md:aspect-auto bg-gradient-to-br from-green-500/30 to-green-300/10">
              <Product3D product={product} />
            </div>
            <div className="p-7 md:p-9 relative">
              <button
                onClick={onClose}
                className="absolute top-5 end-5 w-9 h-9 rounded-full border border-[color:var(--card-border)] flex items-center justify-center hover:bg-green-500/20 transition"
              >
                <X className="w-4 h-4" />
              </button>
              <h2 className="font-display text-3xl font-bold mb-1">{title}</h2>
              <p className="text-sm text-foreground/60 mb-6">
                {product.kind === "cube"
                  ? `${product.size} × ${product.size} × ${product.size} ${t.common.cm}`
                  : `${product.dims.y} × ${product.dims.x} × ${product.dims.z} ${t.common.cm}`}
              </p>

              <div className="space-y-4 mb-7">
                <Detail label={t.store.description}>
                  {product.kind === "cube" ? t.store.cubeDesc : t.store.sheetDesc}
                </Detail>
                <Detail label={t.store.material}>{product.materials.join(" , ")}</Detail>
                <Detail label={t.store.size}>
                  {product.kind === "cube"
                    ? `${product.size}³ ${t.common.cm}`
                    : t.store.sheetSize}
                </Detail>
              </div>

              <div className="flex items-center justify-between gap-4 pt-5 border-t border-[color:var(--card-border)]">
                <span className="font-display text-2xl font-bold text-green-100">
                  {product.price} {t.common.sar}
                </span>
                <button
                  onClick={() => {
                    add(product, 1);
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
