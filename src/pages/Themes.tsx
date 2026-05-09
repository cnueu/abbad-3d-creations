import { Layout } from "@/components/Layout";
import { Product3D } from "@/components/Product3D";
import { PRODUCTS } from "@/data/products";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { ArrowRight, Box, Sparkles, MapPin, ShoppingBag } from "lucide-react";
import { Link } from "react-router-dom";

/**
 * Themes preview page — five full-height sections, each a re-skin of the
 * Home hero in a distinct palette following the 60 / 30 / 10 color rule.
 *   60 = base/background
 *   30 = secondary/surface
 *   10 = accent/highlight
 */

type Theme = {
  id: string;
  name: { en: string; ar: string };
  tagline: { en: string; ar: string };
  base: string;       // 60% — page background
  secondary: string;  // 30% — surface / cards
  accent: string;     // 10% — accents / CTA
  text: string;
  textMuted: string;
  cubeColor: string;
  fontDisplay?: string;
};

// All themes share the Mercury Hg base (black / steel / silver).
// Only the cube accent color changes — that's the "10%" pop that breaks the room.
const MERCURY = {
  base: "#0d0d0f",
  secondary: "#9aa0a8",
  text: "#f5f7fa",
  textMuted: "#9aa0a8",
} as const;

const THEMES: Theme[] = [
  {
    id: "desert",
    name: { en: "Mercury · Desert", ar: "زئبق · صحراء" },
    tagline: { en: "Saudi dune sand on chrome", ar: "رمل الكثبان على الكروم" },
    ...MERCURY,
    accent: "#e2b97a",
    cubeColor: "#e2b97a",
  },
  {
    id: "scream",
    name: { en: "Mercury · Scream", ar: "زئبق · صرخة" },
    tagline: { en: "Pure neon red, 255/0/0", ar: "أحمر نيون صافي" },
    ...MERCURY,
    accent: "#ff0033",
    cubeColor: "#ff0033",
  },
  {
    id: "cyan",
    name: { en: "Mercury · Voltage", ar: "زئبق · فولت" },
    tagline: { en: "Electric cyan on steel", ar: "سماوي كهربائي على الفولاذ" },
    ...MERCURY,
    accent: "#00f0ff",
    cubeColor: "#00f0ff",
  },
  {
    id: "acid",
    name: { en: "Mercury · Acid", ar: "زئبق · حمضي" },
    tagline: { en: "Toxic lime on chrome", ar: "ليموني سام على الكروم" },
    ...MERCURY,
    accent: "#c6ff00",
    cubeColor: "#c6ff00",
  },
  {
    id: "magenta",
    name: { en: "Mercury · Hyper", ar: "زئبق · هايبر" },
    tagline: { en: "Hot magenta pop", ar: "ماجنتا حارّ" },
    ...MERCURY,
    accent: "#ff00aa",
    cubeColor: "#ff00aa",
  },
];

function ThemeSection({ theme, index }: { theme: Theme; index: number }) {
  const { lang } = useLang();
  const isLight = theme.id === "saudi";

  return (
    <section
      className="relative min-h-screen flex items-center snap-start overflow-hidden"
      style={{
        background: theme.base,
        color: theme.text,
      }}
      aria-label={theme.name.en}
    >
      {/* Surface gradient (30%) */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: `radial-gradient(ellipse at 20% 20%, ${theme.secondary}55, transparent 60%),
                       radial-gradient(ellipse at 80% 80%, ${theme.secondary}33, transparent 65%)`,
        }}
      />

      {/* 3D cube background */}
      <div className="absolute inset-0 pointer-events-none flex items-center justify-center">
        <div className="w-[min(80vw,720px)] h-[min(80vw,720px)] opacity-90">
          <Product3D product={PRODUCTS[0]} autoRotate shinyWood colorOverride={theme.cubeColor} />
        </div>
        <div
          className="absolute inset-0"
          style={{
            background: `radial-gradient(ellipse at center, transparent 50%, ${theme.base}cc 95%)`,
          }}
        />
      </div>

      {/* Theme number badge top-right */}
      <div
        className="absolute top-6 right-6 text-[11px] tracking-[0.3em] uppercase px-3 py-1.5 rounded-full border backdrop-blur-md"
        style={{
          borderColor: `${theme.accent}55`,
          color: theme.accent,
          background: `${theme.secondary}33`,
        }}
      >
        {String(index + 1).padStart(2, "0")} / {THEMES.length}
      </div>

      <div className="container relative z-10 mx-auto px-6 py-24 text-center">
        <motion.div
          initial={{ opacity: 0, y: 24 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true, amount: 0.3 }}
          transition={{ duration: 0.7 }}
          className="max-w-3xl mx-auto"
        >
          <span
            className="inline-block text-[11px] tracking-[0.22em] uppercase mb-5 px-3 py-1 rounded-full border backdrop-blur-md"
            style={{
              color: theme.accent,
              borderColor: `${theme.accent}66`,
              background: `${theme.secondary}55`,
            }}
          >
            {lang === "ar" ? theme.tagline.ar : theme.tagline.en}
          </span>

          <h1
            className="font-display text-5xl md:text-7xl font-bold leading-[1.05] mb-6"
            style={{
              backgroundImage: `linear-gradient(135deg, ${theme.text}, ${theme.accent}, ${theme.text})`,
              WebkitBackgroundClip: "text",
              WebkitTextFillColor: "transparent",
              backgroundClip: "text",
            }}
          >
            {lang === "ar" ? theme.name.ar : theme.name.en}
          </h1>

          <p
            className="text-base md:text-lg mb-8 max-w-xl mx-auto leading-relaxed"
            style={{ color: theme.textMuted }}
          >
            {lang === "ar"
              ? "أبعاد · صُنع في السعودية · معاينة لوحة الألوان بقاعدة 60/30/10"
              : "ABBAD · Made in Saudi · 60/30/10 palette preview"}
          </p>

          <div className="flex flex-wrap gap-3 justify-center mb-12">
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold transition-transform hover:scale-105"
              style={{
                background: theme.accent,
                color: isLight ? "#fff" : theme.base,
                boxShadow: `0 8px 28px ${theme.accent}55`,
              }}
            >
              <ShoppingBag className="w-4 h-4" />
              {lang === "ar" ? "تسوّق الآن" : "Shop now"}
              <ArrowRight className="w-4 h-4" />
            </button>
            <button
              className="inline-flex items-center gap-2 px-6 py-3 rounded-full text-sm font-semibold border transition-colors"
              style={{
                borderColor: `${theme.accent}88`,
                color: theme.text,
                background: `${theme.secondary}44`,
              }}
            >
              <Sparkles className="w-4 h-4" />
              {lang === "ar" ? "استوديو الذكاء" : "AI Studio"}
            </button>
          </div>

          {/* 60/30/10 swatch ribbon */}
          <div className="flex justify-center gap-2 mb-10">
            <Swatch label="60" color={theme.base} ring={theme.accent} />
            <Swatch label="30" color={theme.secondary} ring={theme.accent} />
            <Swatch label="10" color={theme.accent} ring={theme.accent} />
          </div>

          {/* Feature strip */}
          <div className="grid md:grid-cols-3 gap-3 mt-4">
            {[
              { Icon: Box, t: lang === "ar" ? "هندسة دقيقة" : "Precision geometry" },
              { Icon: Sparkles, t: lang === "ar" ? "ذكاء توليدي" : "Generative AI" },
              { Icon: MapPin, t: lang === "ar" ? "شحن داخل السعودية" : "Ships in KSA" },
            ].map(({ Icon, t }, i) => (
              <div
                key={i}
                className="rounded-2xl p-4 border backdrop-blur-md text-start"
                style={{
                  borderColor: `${theme.accent}33`,
                  background: `${theme.secondary}55`,
                }}
              >
                <div
                  className="w-9 h-9 rounded-lg flex items-center justify-center mb-2"
                  style={{ background: `${theme.accent}33`, color: theme.accent }}
                >
                  <Icon className="w-4 h-4" />
                </div>
                <div className="text-sm font-semibold">{t}</div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </section>
  );
}

function Swatch({ label, color, ring }: { label: string; color: string; ring: string }) {
  return (
    <div className="flex flex-col items-center gap-1">
      <div
        className="w-12 h-12 rounded-full border-2"
        style={{ background: color, borderColor: `${ring}55` }}
      />
      <span className="text-[10px] tracking-[0.2em] opacity-60">{label}%</span>
    </div>
  );
}

export default function Themes() {
  const { lang } = useLang();
  return (
    <Layout>
      <div className="snap-y snap-mandatory">
        <div className="px-6 pt-28 pb-6 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-2">
            {lang === "ar" ? "معرض الثيمات" : "Theme Gallery"}
          </h2>
          <p className="text-sm text-foreground/65 max-w-xl mx-auto">
            {lang === "ar"
              ? "مرّر للأسفل بين خمسة ثيمات مختلفة لاختيار اتجاه الهوية البصرية."
              : "Scroll through five palette directions and pick the one that fits."}
          </p>
        </div>
        {THEMES.map((th, i) => (
          <ThemeSection key={th.id} theme={th} index={i} />
        ))}
      </div>
    </Layout>
  );
}
