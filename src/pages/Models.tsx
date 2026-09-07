import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { ArrowRight, FileText, Boxes, Ruler, Clock } from "lucide-react";
import stage from "@/assets/model-stage.jpg";
import booth from "@/assets/model-booth.jpg";
import classroom from "@/assets/model-classroom.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// نماذجنا / OUR MODELS
// Ready made designs built from the Abaad system.
//
// WHERE TO CHANGE THINGS:
//  • Add / edit a model .......... MODELS array below (image, names, specs)
//  • Images ...................... src/assets/model-*.jpg
//  • CTA target .................. /quote
// ─────────────────────────────────────────────────────────────────────────────

const MODELS = [
  {
    id: "stage",
    image: stage,
    name: { ar: "منصة مسرح معيارية", en: "Modular stage" },
    body: {
      ar: "منصة عرض قابلة للتوسعة مع جدران خلفية، تُركّب في ساعات وتُفكّك بعد الفعالية.",
      en: "An expandable performance platform with back walls, installed in hours and struck after the event.",
    },
    size: { ar: "٦ × ٤ × ٢٫٤ م", en: "6 × 4 × 2.4 m" },
    cubes: 420,
    days: { ar: "التركيب من ٣ إلى ٨ ساعات", en: "3 to 8 hours to install" },
  },
  {
    id: "booth",
    image: booth,
    name: { ar: "جناح معارض", en: "Exhibition booth" },
    body: {
      ar: "جناح بأرفف عرض وكاونتر استقبال، ألوان الجهة قابلة للتخصيص بالكامل.",
      en: "A booth with display shelving and a reception counter, fully customizable to your brand colors.",
    },
    size: { ar: "٥ × ٣ × ٢٫٤ م", en: "5 × 3 × 2.4 m" },
    cubes: 310,
    days: { ar: "التركيب من ٣ إلى ٥ ساعات", en: "3 to 5 hours to install" },
  },
  {
    id: "classroom",
    image: classroom,
    name: { ar: "فصل تعليمي مرن", en: "Flexible classroom" },
    body: {
      ar: "وحدات جلوس وتخزين تُعاد ترتيبها حسب النشاط، مناسبة للمدارس ومراكز التدريب.",
      en: "Seating and storage units rearranged per activity, made for schools and training centres.",
    },
    size: { ar: "٧ × ٦ × ٢ م", en: "7 × 6 × 2 m" },
    cubes: 560,
    days: { ar: "التركيب من ٣ إلى ٥ ساعات", en: "3 to 5 hours to install" },
  },
];

export default function Models() {
  const { lang } = useLang();
  const ar = lang === "ar";

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14 max-w-6xl">
        <header className="mb-12 max-w-3xl">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--accent))]">
            {ar ? "جاهزة للتنفيذ" : "Ready to build"}
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold mt-2 mb-3">
            <span className="text-gradient">{ar ? "نماذجنا" : "Our models"}</span>
          </h1>
          <p className="text-foreground/70 leading-relaxed">
            {ar
              ? "تصاميم جاهزة صمّمها فريق أبعاد بنظام المكعبات والموصِّلات، اختر النموذج الأقرب لمشروعك وسنكيّفه على أبعادك وألوانك."
              : "Ready made designs by the Abaad team, built from cubes and connecters. Pick the closest model and we adapt it to your dimensions and colors."}
          </p>
        </header>

        <div className="space-y-8">
          {MODELS.map((m, i) => (
            <motion.article
              key={m.id}
              initial={{ opacity: 0, y: 24 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.06 }}
              className="glass-card neon-edge rounded-3xl overflow-hidden grid md:grid-cols-2"
            >
              <img
                src={m.image}
                alt={ar ? m.name.ar : m.name.en}
                loading="lazy"
                width={1024}
                height={768}
                className="w-full h-full max-h-[340px] object-cover"
              />
              <div className="p-7 md:p-9">
                <h2 className="font-display text-2xl font-semibold mb-2">{ar ? m.name.ar : m.name.en}</h2>
                <p className="text-sm text-foreground/70 leading-relaxed mb-6">{ar ? m.body.ar : m.body.en}</p>
                <div className="grid grid-cols-3 gap-3 mb-7">
                  <Spec icon={Ruler} label={ar ? "الأبعاد" : "Size"} value={ar ? m.size.ar : m.size.en} />
                  <Spec icon={Boxes} label={ar ? "القطع" : "Parts"} value={`≈ ${m.cubes}`} />
                  <Spec icon={Clock} label={ar ? "التركيب" : "Install"} value={ar ? m.days.ar : m.days.en} />
                </div>
                <Link to="/quote" className="btn-primary">
                  <FileText className="w-4 h-4" />
                  {ar ? "اطلب هذا النموذج" : "Request this model"}
                  <ArrowRight className="w-4 h-4" />
                </Link>
              </div>
            </motion.article>
          ))}
        </div>
      </div>
    </Layout>
  );
}

function Spec({
  icon: Icon,
  label,
  value,
}: {
  icon: React.ComponentType<{ className?: string }>;
  label: string;
  value: string;
}) {
  return (
    <div className="rounded-xl p-3 border" style={{ borderColor: "var(--card-border)" }}>
      <div className="flex items-center gap-1.5 text-[10px] tracking-[0.14em] uppercase text-foreground/50 mb-1">
        <Icon className="w-3 h-3" />
        {label}
      </div>
      <div className="text-sm font-medium">{value}</div>
    </div>
  );
}
