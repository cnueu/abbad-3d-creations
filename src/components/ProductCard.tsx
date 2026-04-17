import { Product } from "@/data/products";
import { Product3D } from "./Product3D";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";

interface Props {
  product: Product;
  onClick: () => void;
  index?: number;
}

export function ProductCard({ product, onClick, index = 0 }: Props) {
  const { t, lang } = useLang();
  const title =
    product.kind === "cube"
      ? lang === "ar" ? "مكعب" : "Cube"
      : lang === "ar" ? t.store.sheetTitle : t.store.sheetTitle;
  const subtitle =
    product.kind === "cube"
      ? `${product.size} × ${product.size} × ${product.size} ${t.common.cm}`
      : `${product.dims.y} × ${product.dims.x} × ${product.dims.z} ${t.common.cm}`;

  return (
    <motion.button
      onClick={onClick}
      initial={{ opacity: 0, y: 20 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ delay: index * 0.08, duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
      whileHover={{ y: -6 }}
      className="glass-card rounded-2xl overflow-hidden text-start group"
    >
      <div className="aspect-[4/3] w-full relative overflow-hidden" style={{ background: "rgba(106,125,122,0.18)" }}>
        <Product3D product={product} />
        <div className="pointer-events-none absolute inset-0 bg-gradient-to-t from-black/30 to-transparent" />
      </div>
      <div className="px-4 pt-4 pb-5">
        <h3 className="font-display text-lg font-semibold mb-0.5">{title}</h3>
        <p className="text-xs text-foreground/60 mb-3">{subtitle}</p>
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
