import { Product } from "@/data/products";
import { Product3D } from "./Product3D";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { useState } from "react";

interface Props {
  product: Product;
  onClick: () => void;
  index?: number;
}

// Flat color tile preview — no cube illustration, no WebGL until hover.
// Real 3D model loads on hover/focus only (keeps Store snappy).
function StaticPreview({ product }: { product: Product }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center"
      style={{
        background: `radial-gradient(circle at 35% 30%, ${product.color}, ${product.color}cc 55%, ${product.color}88 100%)`,
      }}
    >
      <div
        className="w-20 h-20 rounded-full"
        style={{
          background: product.color,
          boxShadow: `0 12px 32px ${product.color}66, inset 0 -8px 24px rgba(0,0,0,0.18), inset 0 8px 20px rgba(255,255,255,0.18)`,
        }}
      />
    </div>
  );
}

export function ProductCard({ product, onClick, index = 0 }: Props) {
  const [hover, setHover] = useState(false);
  const { t, lang } = useLang();
  const title =
    product.kind === "cube"
      ? lang === "ar" ? "مكعب" : "Cube"
      : t.store.sheetTitle;
  const subtitle =
    product.kind === "cube"
      ? `${product.size} × ${product.size} × ${product.size} ${t.common.cm}`
      : `${product.dims.y} × ${product.dims.x} × ${product.dims.z} ${t.common.cm}`;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      onMouseEnter={() => setHover(true)}
      onMouseLeave={() => setHover(false)}
      onFocus={() => setHover(true)}
      onBlur={() => setHover(false)}
      className="glass-card rounded-2xl overflow-hidden text-start group"
    >
      <div className="aspect-square w-full relative overflow-hidden flex items-center justify-center">
        {hover ? (
          <Product3D product={product} autoRotate interactive />
        ) : (
          <StaticPreview product={product} />
        )}
      </div>
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full ring-2 ring-foreground/15" style={{ background: product.color }} />
          <h3 className="font-display text-lg font-semibold text-foreground">{title}</h3>
        </div>
        <p className="text-xs text-foreground/65 mb-1">{subtitle}</p>
        <p className="text-[11px] text-foreground/50 mb-3">
          {lang === "ar" ? product.colorName.ar : product.colorName.en}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-wider uppercase text-foreground/55">
            {t.store.material}: {product.materials.join(" , ")}
          </span>
          <span className="text-sm font-semibold text-[hsl(var(--accent))]">
            {product.price} {t.common.sar}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
