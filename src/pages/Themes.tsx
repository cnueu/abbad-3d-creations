import { Layout } from "@/components/Layout";
import { Product3D } from "@/components/Product3D";
import { PRODUCTS } from "@/data/products";
import { useLang } from "@/i18n/LanguageContext";
import { motion, AnimatePresence } from "framer-motion";
import { ArrowRight, Box, Sparkles, MapPin, ShoppingBag, Shuffle } from "lucide-react";
import { Link } from "react-router-dom";
import { useEffect, useState } from "react";

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
  const isLight = false;

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

// ===== All-cubes showcase: 5 cubes (one per theme accent) re-arranged in 5 layouts =====

type Pos = { x: number; y: number; scale: number; rot: number };

// Each layout returns positions (in % of container) + scale + rotation for the 5 cubes.
const LAYOUTS: { id: string; name: { en: string; ar: string }; positions: Pos[] }[] = [
  {
    id: "line",
    name: { en: "Line-up", ar: "صفّ" },
    positions: [
      { x: 10, y: 50, scale: 0.7, rot: 0 },
      { x: 30, y: 50, scale: 0.7, rot: 0 },
      { x: 50, y: 50, scale: 0.7, rot: 0 },
      { x: 70, y: 50, scale: 0.7, rot: 0 },
      { x: 90, y: 50, scale: 0.7, rot: 0 },
    ],
  },
  {
    id: "circle",
    name: { en: "Orbit", ar: "مدار" },
    positions: Array.from({ length: 5 }, (_, i) => {
      const a = (i / 5) * Math.PI * 2 - Math.PI / 2;
      return { x: 50 + Math.cos(a) * 32, y: 50 + Math.sin(a) * 32, scale: 0.65, rot: (i * 72) % 360 };
    }),
  },
  {
    id: "cross",
    name: { en: "Plus", ar: "زائد" },
    positions: [
      { x: 50, y: 50, scale: 0.85, rot: 0 },
      { x: 50, y: 18, scale: 0.6, rot: 0 },
      { x: 82, y: 50, scale: 0.6, rot: 0 },
      { x: 50, y: 82, scale: 0.6, rot: 0 },
      { x: 18, y: 50, scale: 0.6, rot: 0 },
    ],
  },
  {
    id: "tower",
    name: { en: "Tower", ar: "برج" },
    positions: [
      { x: 50, y: 86, scale: 0.95, rot: 0 },
      { x: 50, y: 68, scale: 0.8, rot: 12 },
      { x: 50, y: 50, scale: 0.68, rot: 24 },
      { x: 50, y: 33, scale: 0.56, rot: 36 },
      { x: 50, y: 17, scale: 0.45, rot: 48 },
    ],
  },
  {
    id: "stagger",
    name: { en: "Cascade", ar: "تتابع" },
    positions: [
      { x: 18, y: 22, scale: 0.55, rot: -8 },
      { x: 34, y: 38, scale: 0.65, rot: 4 },
      { x: 50, y: 54, scale: 0.75, rot: 0 },
      { x: 66, y: 70, scale: 0.65, rot: -4 },
      { x: 82, y: 86, scale: 0.55, rot: 8 },
    ],
  },
];

function ShowcaseSection() {
  const { lang } = useLang();
  const [layoutIdx, setLayoutIdx] = useState(0);

  useEffect(() => {
    const id = setInterval(() => setLayoutIdx((i) => (i + 1) % LAYOUTS.length), 3800);
    return () => clearInterval(id);
  }, []);

  const current = LAYOUTS[layoutIdx];

  return (
    <section
      className="relative min-h-screen flex flex-col items-center justify-center snap-start overflow-hidden"
      style={{ background: MERCURY.base, color: MERCURY.text }}
      aria-label="All themes showcase"
    >
      {/* ambient glows from each accent */}
      <div className="absolute inset-0 pointer-events-none">
        {THEMES.map((t, i) => (
          <motion.div
            key={t.id}
            className="absolute rounded-full blur-3xl"
            style={{
              width: 380,
              height: 380,
              background: `${t.accent}22`,
              left: `${current.positions[i].x}%`,
              top: `${current.positions[i].y}%`,
              translateX: "-50%",
              translateY: "-50%",
            }}
            animate={{
              left: `${current.positions[i].x}%`,
              top: `${current.positions[i].y}%`,
            }}
            transition={{ duration: 1.4, ease: [0.22, 1, 0.36, 1] }}
          />
        ))}
      </div>

      {/* Header */}
      <div className="relative z-10 text-center px-6 pt-24">
        <span
          className="inline-flex items-center gap-2 text-[11px] tracking-[0.3em] uppercase mb-4 px-3 py-1.5 rounded-full border backdrop-blur-md"
          style={{ borderColor: `${MERCURY.secondary}66`, color: MERCURY.text, background: `${MERCURY.secondary}33` }}
        >
          <Shuffle className="w-3.5 h-3.5" />
          {lang === "ar" ? "كل الثيمات معاً" : "All themes together"}
        </span>
        <h2
          className="font-display text-4xl md:text-6xl font-bold mb-3"
          style={{
            backgroundImage: `linear-gradient(135deg, #ffffff, #d8dde3, #8a8f96, #e8ecf1, #ffffff)`,
            WebkitBackgroundClip: "text",
            WebkitTextFillColor: "transparent",
            backgroundClip: "text",
          }}
        >
          {lang === "ar" ? "خمسة مكعبات · خمسة ترتيبات" : "Five Cubes · Five Arrangements"}
        </h2>
        <AnimatePresence mode="wait">
          <motion.p
            key={current.id}
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -6 }}
            transition={{ duration: 0.4 }}
            className="text-sm tracking-[0.3em] uppercase"
            style={{ color: MERCURY.textMuted }}
          >
            {String(layoutIdx + 1).padStart(2, "0")} · {lang === "ar" ? current.name.ar : current.name.en}
          </motion.p>
        </AnimatePresence>
      </div>

      {/* Stage */}
      <div className="relative w-full max-w-5xl aspect-[16/10] mx-auto my-6">
        {THEMES.map((t, i) => {
          const p = current.positions[i];
          return (
            <motion.div
              key={t.id}
              className="absolute"
              style={{
                width: "26%",
                aspectRatio: "1 / 1",
                translateX: "-50%",
                translateY: "-50%",
              }}
              animate={{
                left: `${p.x}%`,
                top: `${p.y}%`,
                scale: p.scale,
                rotate: p.rot,
              }}
              transition={{ duration: 1.2, ease: [0.22, 1, 0.36, 1] }}
            >
              <div
                className="absolute inset-0 rounded-full blur-2xl -z-10"
                style={{ background: `${t.accent}55` }}
              />
              <Product3D product={PRODUCTS[0]} autoRotate shinyWood colorOverride={t.cubeColor} />
            </motion.div>
          );
        })}
      </div>

      {/* Layout selector dots */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-2 pb-10 px-6">
        {LAYOUTS.map((l, i) => {
          const active = i === layoutIdx;
          return (
            <button
              key={l.id}
              onClick={() => setLayoutIdx(i)}
              className="px-4 py-2 rounded-full text-xs tracking-[0.2em] uppercase border transition-all"
              style={{
                borderColor: active ? "#f5f7fa" : `${MERCURY.secondary}55`,
                background: active ? `${MERCURY.secondary}44` : "transparent",
                color: active ? MERCURY.text : MERCURY.textMuted,
              }}
            >
              {lang === "ar" ? l.name.ar : l.name.en}
            </button>
          );
        })}
      </div>

      {/* Accent legend */}
      <div className="relative z-10 flex flex-wrap items-center justify-center gap-4 pb-12 px-6">
        {THEMES.map((t) => (
          <div key={t.id} className="flex items-center gap-2 text-xs" style={{ color: MERCURY.textMuted }}>
            <span
              className="inline-block w-3 h-3 rounded-full"
              style={{ background: t.accent, boxShadow: `0 0 12px ${t.accent}aa` }}
            />
            {lang === "ar" ? t.name.ar : t.name.en}
          </div>
        ))}
      </div>
    </section>
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
              ? "مرّر للأسفل بين خمسة ثيمات مختلفة، ثم شاهدها كلها مجتمعة في النهاية."
              : "Scroll through five palette directions, then see them all combined at the end."}
          </p>
        </div>
        {THEMES.map((th, i) => (
          <ThemeSection key={th.id} theme={th} index={i} />
        ))}
        <ShowcaseSection />
      </div>
    </Layout>
  );
}
