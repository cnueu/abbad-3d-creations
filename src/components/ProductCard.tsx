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

// Lightweight static SVG preview — no WebGL until the user hovers the card.
// Fixes Store page lag from running many Canvases at once.
function StaticPreview({ product }: { product: Product }) {
  const c = product.color;
  if (product.kind === "sheet") {
    return (
      <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 drop-shadow-lg">
        <polygon points="20,35 80,35 90,55 10,55" fill={c} stroke="#0b0d10" strokeWidth="1.5" />
        <polygon points="80,35 90,55 90,75 80,55" fill={c} stroke="#0b0d10" strokeWidth="1.5" opacity="0.85" />
        <polygon points="20,35 10,55 10,75 20,55" fill={c} stroke="#0b0d10" strokeWidth="1.5" opacity="0.7" />
      </svg>
    );
  }
  return (
    <svg viewBox="0 0 100 100" className="w-2/3 h-2/3 drop-shadow-lg">
      <polygon points="20,30 50,15 80,30 50,45" fill={c} stroke="#0b0d10" strokeWidth="1.5" />
      <polygon points="20,30 20,75 50,90 50,45" fill={c} stroke="#0b0d10" strokeWidth="1.5" opacity="0.78" />
      <polygon points="80,30 80,75 50,90 50,45" fill={c} stroke="#0b0d10" strokeWidth="1.5" opacity="0.62" />
    </svg>
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
      <div className="aspect-square w-full relative overflow-hidden flex items-center justify-center" style={{ background: "rgba(106,125,122,0.14)" }}>
        {hover ? (
          <Product3D product={product} autoRotate interactive />
        ) : (
          <StaticPreview product={product} />
        )}
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="px-4 pt-4 pb-5">
        <div className="flex items-center gap-2 mb-1">
          <span className="w-3 h-3 rounded-full ring-2 ring-white/10" style={{ background: product.color }} />
          <h3 className="font-display text-lg font-semibold">{title}</h3>
        </div>
        <p className="text-xs text-foreground/60 mb-1">{subtitle}</p>
        <p className="text-[11px] text-foreground/45 mb-3">
          {lang === "ar" ? product.colorName.ar : product.colorName.en}
        </p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-wider uppercase text-foreground/50">
            {t.store.material}: {product.materials.join(" , ")}
          </span>
          <span className="text-sm font-semibold text-green-100">
            {product.price} {t.common.sar}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
