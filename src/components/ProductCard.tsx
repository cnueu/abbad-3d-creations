import { Product } from "@/data/products";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { useState } from "react";
import { Product3D } from "./Product3D";
import { RotateCw } from "lucide-react";

interface Props {
  product: Product;
  onClick: () => void;
  index?: number;
}

export function ProductCard({ product, onClick, index = 0 }: Props) {
  const { t, lang } = useLang();
  // The model renders as a still 3D frame. It only becomes rotatable after the
  // user clicks the preview (keeps the grid cheap on the GPU).
  const [live, setLive] = useState(false);
  const title = lang === "ar" ? product.name.ar : product.name.en;
  const subtitle =
    product.kind === "cube" || product.kind === "cube-smooth"
      ? `${product.size} × ${product.size} × ${product.size} ${t.common.cm}`
      : `${product.dims.x} × ${product.dims.y} × ${product.dims.z} ${t.common.cm}`;

  return (
    <motion.div
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: Math.min(index, 8) * 0.05, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="glass-card neon-edge rounded-2xl overflow-hidden text-start group"
    >
      {/* PREVIEW PANEL, tinted with the theme gradient so it never matches the page bg */}
      <div
        className="aspect-square w-full relative overflow-hidden cursor-pointer"
        onClick={() => setLive(true)}
        style={{
          background:
            "linear-gradient(165deg, hsl(var(--accent) / 0.16) 0%, hsl(var(--bg-sidebar)) 50%, hsl(var(--accent) / 0.08) 100%)",
        }}
      >
        <div
          aria-hidden
          className="absolute inset-0 pointer-events-none"
          style={{ background: "radial-gradient(ellipse at 50% 0%, rgba(255,255,255,0.12) 0%, transparent 65%)" }}
        />
        <Product3D
          product={product}
          autoRotate={live}
          interactive={live}
          shinyWood
          colorOverride={product.color}
        />
        {!live && (
          <span className="absolute bottom-3 end-3 z-10 flex items-center gap-1 text-[10px] px-2 py-1 rounded-full bg-background/70 border border-[color:var(--card-border)] text-foreground/70">
            <RotateCw className="w-3 h-3" />
            {lang === "ar" ? "اضغط للتدوير" : "Click to rotate"}
          </span>
        )}
        <span className="absolute top-3 start-3 z-10 text-[10px] tracking-[0.14em] uppercase px-2 py-1 rounded-full bg-background/70 border border-[color:var(--card-border)] text-foreground/75">
          {lang === "ar" ? `الجيل ${product.generation}` : `Gen ${product.generation}`}
        </span>
      </div>

      <button onClick={onClick} className="w-full text-start px-4 pt-4 pb-5">
        <h3 className="font-display text-base font-semibold text-foreground mb-1 leading-snug">{title}</h3>
        <p className="text-xs text-foreground/65 mb-2">{subtitle}</p>
        <div className="flex items-center justify-between">
          <span className="text-[11px] tracking-wider uppercase text-foreground/55">
            {product.materials.join(" · ")}
          </span>
          <span className="text-[11px] font-medium text-[hsl(var(--accent))]">
            {lang === "ar" ? "التفاصيل" : "Details"}
          </span>
        </div>
      </button>
    </motion.div>
  );
}
