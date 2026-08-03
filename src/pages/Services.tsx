import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import {
  Theater, School, Building2, Store as StoreIcon, Boxes, Wrench,
  ArrowRight, FileText, Truck, RefreshCw,
} from "lucide-react";

// ─────────────────────────────────────────────────────────────────────────────
// SERVICES, the B2B service catalogue.
// To add/remove a service, edit the SERVICES array below.
// ─────────────────────────────────────────────────────────────────────────────
export default function Services() {
  const { lang } = useLang();
  const ar = lang === "ar";

  const SERVICES = [
    {
      Icon: Theater,
      title: ar ? "ديكورات المسارح والفعاليات" : "Theatre & event sets",
      body: ar
        ? "بناء ديكورات كاملة قابلة للتفكيك وإعادة التركيب لكل عرض، بتسليم سريع وتخزين مضغوط."
        : "Full stage sets that disassemble and reassemble for every show, fast delivery, compact storage."
    },
    {
      Icon: School,
      title: ar ? "المدارس والجامعات" : "Schools & universities",
      body: ar
        ? "توريد وحدات البناء لمعامل الابتكار والمشاريع الطلابية مع أدلة استخدام وورش تدريبية."
        : "Building units for innovation labs and student projects, with usage guides and workshops.",
    },
    {
      Icon: StoreIcon,
      title: ar ? "العلامات التجارية والتجزئة" : "Brands & retail",
      body: ar
        ? "أجنحة عرض ومتاجر مؤقتة بألوان العلامة التجارية، تُبنى وتُفكّك في ساعات."
        : "Branded booths and pop-up retail in your brand colors, built and struck within hours.",
    },
    {
      Icon: Building2,
      title: ar ? "الجهات الحكومية والمعارض" : "Government & exhibitions",
      body: ar
        ? "تركيبات قابلة لإعادة الاستخدام للمعارض والفعاليات الوطنية بمواد صديقة للبيئة."
        : "Reusable installations for national exhibitions and events, using eco-friendly materials.",
    },
    {
      Icon: Boxes,
      title: ar ? "توريد بالجملة" : "Bulk supply",
      body: ar
        ? "طلبات كبيرة من مكعبات وموصِّلات الجيل الأول والثاني بألوان مخصصة وتسعير حسب الكمية."
        : "Large orders of Gen 1 and Gen 2 cubes and connecters in custom colors, priced by volume.",
    },
    {
      Icon: Wrench,
      title: ar ? "تصميم وتنفيذ مخصص" : "Custom design & build",
      body: ar
        ? "نصمم معك الهيكل، ننفّذ نموذجاً أولياً، ثم نسلّم المشروع كاملاً مع دعم في الموقع."
        : "We co-design the structure, deliver a prototype, then execute the full build with on-site support.",
    },
  ];

  const STEPS = [
    { Icon: FileText, title: ar ? "طلب عرض سعر" : "Request a quote", body: ar ? "ارفع صورك وأدخل الأبعاد." : "Upload images and enter dimensions." },
    { Icon: Wrench, title: ar ? "التصميم المشترك" : "Co-design", body: ar ? "نحدد القطع والألوان والجدول الزمني." : "We define parts, colors and timeline." },
    { Icon: Truck, title: ar ? "التصنيع والتسليم" : "Produce & deliver", body: ar ? "تصنيع داخل المملكة وتسليم للموقع." : "Made in KSA, delivered to your site." },
    { Icon: RefreshCw, title: ar ? "إعادة الاستخدام" : "Reuse", body: ar ? "فكّك القطع وابنِ مشروعك التالي." : "Disassemble and build the next project." },
  ];

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14">
        <header className="mb-12 max-w-3xl">
          <span className="text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--accent))]">
            {ar ? "خدماتنا" : "Our services"}
          </span>
          <h1 className="font-display text-3xl md:text-5xl font-bold mt-2 mb-3">
            <span className="text-gradient">{ar ? "ماذا نقدّم للجهات" : "What we deliver for businesses"}</span>
          </h1>
          <p className="text-foreground/65">
            {ar
              ? "أبعاد نظام بناء معياري يخدم المسارح والمدارس والعلامات التجارية والجهات الحكومية، من التوريد بالجملة حتى التنفيذ الكامل."
              : "Abaad is a modular building system for theatres, schools, brands and public institutions, from bulk supply to full turnkey builds."}
          </p>
        </header>

        <section className="grid md:grid-cols-2 lg:grid-cols-3 gap-5 mb-16">
          {SERVICES.map(({ Icon, title, body }, i) => (
            <motion.div
              key={i}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: (i % 3) * 0.08 }}
              className="glass-card rounded-2xl p-6"
            >
              <div className="w-11 h-11 rounded-xl flex items-center justify-center mb-4",
                style={{ background: "hsl(var(--accent) / 0.16)" }}>
                <Icon className="w-5 h-5 text-[hsl(var(--accent))]" />
              </div>
              <h2 className="font-display text-lg font-semibold mb-1.5">{title}</h2>
              <p className="text-sm text-foreground/65 leading-relaxed">{body}</p>
            </motion.div>
          ))}
        </section>

        <section className="mb-16">
          <h2 className="font-display text-2xl mb-6">{ar ? "كيف نعمل" : "How we work"}</h2>
          <div className="grid sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {STEPS.map(({ Icon, title, body }, i) => (
              <div key={i} className="glass-card rounded-2xl p-5">
                <div className="flex items-center gap-2 mb-3">
                  <span className="text-[11px] font-mono text-[hsl(var(--accent))]">0{i + 1}</span>
                  <Icon className="w-4 h-4 text-foreground/60" />
                </div>
                <h3 className="font-display text-base font-semibold mb-1">{title}</h3>
                <p className="text-xs text-foreground/60 leading-relaxed">{body}</p>
              </div>
            ))}
          </div>
        </section>

        <section className="glass-panel rounded-3xl p-8 md:p-12 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-bold mb-3">
            {ar ? "لديك مشروع؟" : "Have a project in mind?"}
          </h2>
          <p className="text-foreground/65 mb-6 max-w-xl mx-auto">
            {ar ? "ارفع صورك وأدخل أبعادك واحصل على تقدير فوري." : "Upload your images, enter your dimensions and get an instant estimate."}
          </p>
          <Link to="/quote" className="btn-primary">
            <FileText className="w-4 h-4" />
            {ar ? "اطلب عرض سعر" : "Request a quote"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </section>
      </div>
    </Layout>
  );
}
