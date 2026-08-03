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

// Glassy shiny preview, matches the homepage rotating-piece aesthetic.
// Real 3D loads on hover to keep the grid light.
function StaticPreview({ color }: { color: string }) {
  return (
    <div
      className="w-full h-full flex items-center justify-center relative",
      style={{
        background: `radial-gradient(ellipse at 30% 20%, ${color}ee 0%, ${color}aa 35%, ${color}55 70%, hsl(var(--bg-main)) 100%)`,
      }}
    >
      <div
        aria-hidden
        className="absolute inset-0 pointer-events-none",
        style={{ background: "radial-gradient(ellipse at 50% -10%, rgba(255,255,255,0.18) 0%, transparent 55%)" }}
      />
      <div
        className="w-24 h-24 rounded-2xl",
        style={{
          background: `linear-gradient(135deg, ${color} 0%, ${color}cc 50%, ${color}77 100%)`,
          boxShadow: [
            `0 18px 40px ${color}55`,
            "inset 0 -10px 24px rgba(0,0,0,0.35)",
            "inset 0 10px 22px rgba(255,255,255,0.22)",
            "0 0 0 1px rgba(255,255,255,0.08)",
          ].join(", "),
        }}
      />
    </div>
  );
}

export function ProductCard({ product, onClick, index = 0 }: Props) {
  const [hover, setHover] = useState(false);
  const { t, lang } = useLang();
  const title = lang === "ar" ? product.name.ar : product.name.en;
  const subtitle =
    product.kind === "cube" || product.kind === "cube-smooth"
      ? `${product.size} × ${product.size} × ${product.size} ${t.common.cm}`
      : `${product.dims.x} × ${product.dims.y} × ${product.dims.z} ${t.common.cm}`;

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
          <Product3D product={product} autoRotate interactive shinyWood />
        ) : (
          <StaticPreview color={product.color} />
        )}
        <span className="absolute top-3 start-3 text-[10px] tracking-[0.14em] uppercase px-2 py-1 rounded-full bg-background/70 border border-[color:var(--card-border)] text-foreground/75">
          {lang === "ar" ? `الجيل ${product.generation}` : `Gen ${product.generation}`}
        </span>
      </div>
      <div className="px-4 pt-4 pb-5">
        <h3 className="font-display text-base font-semibold text-foreground mb-1 leading-snug">{title}</h3>
        <p className="text-xs text-foreground/65 mb-2">{subtitle}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-wider uppercase text-foreground/55">
            {product.materials.join(" · ")}
          </span>
          <span className="text-[11px] font-medium text-[hsl(var(--accent))]">
            {lang === "ar" ? "ألوان مخصصة" : "Custom colors"}
          </span>
        </div>
      </div>
    </motion.button>
  );
}
