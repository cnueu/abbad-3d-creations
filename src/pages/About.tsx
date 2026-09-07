import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Mail, Linkedin, ArrowRight, FileText, Quote } from "lucide-react";
import falakLogo from "@/assets/falak-logo.png";
import bgBlueprint from "@/assets/bg-blueprint.jpg";
import bgCraft from "@/assets/bg-craft.jpg";

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT / من نحن  — rebuilt from scratch.
// Structure: statement → story → what we stand for → focus & milestones →
//            team → closing call to action. No large centred logo anywhere.
// WHERE TO CHANGE THINGS:
//  • Every sentence and every team member ... src/i18n/translations.ts → about
//  • Incubator badge image .................. src/assets/falak-logo.png
//  • Section background images .............. src/assets/bg-*.jpg
// ─────────────────────────────────────────────────────────────────────────────

interface TeamMember {
  name: string;
  role: string;
  email: string;
  linkedin: string;
  bio: string;
  studies?: string[];
  achievements?: string[];
}

export default function About() {
  const { t, lang } = useLang();
  const about = t.about;
  const ar = lang === "ar";

  return (
    <Layout>
      {/* 1 ── Statement band */}
      <section className="relative overflow-hidden border-b" style={{ borderColor: "var(--card-border)" }}>
        <img
          src={bgBlueprint}
          alt=""
          aria-hidden
          loading="lazy"
          className="absolute inset-0 w-full h-full object-cover opacity-[0.28]"
        />
        <div
          className="absolute inset-0"
          style={{ background: "linear-gradient(to bottom, hsl(var(--bg-root) / 0.55), hsl(var(--bg-root) / 0.92))" }}
        />
        <div className="relative container mx-auto px-6 py-20 md:py-28 max-w-4xl">
          <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
            <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">
              {about.short}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mt-3 mb-5 leading-[1.15]">
              <span className="text-gradient">{about.title}</span>
            </h1>
            <p className="text-lg md:text-xl text-foreground/80 leading-relaxed max-w-2xl">{about.body}</p>

            <div className="mt-8 inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-[color:var(--card-border)] glass-card">
              <img src={falakLogo} alt="Falak" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-[11px] tracking-[0.16em] uppercase text-foreground/55">
                {about.incubatorLabel}
              </span>
              <span className="font-display font-semibold text-sm">{about.incubator}</span>
            </div>
          </motion.div>
        </div>
      </section>

      {/* 2 ── Mission quote */}
      <section className="container mx-auto px-6 max-w-4xl py-16 md:py-20 text-center">
        <Quote className="w-6 h-6 mx-auto mb-5 text-[hsl(var(--accent))]" />
        <p className="font-display text-2xl md:text-4xl leading-snug">{about.missionBody}</p>
        <div className="mt-5 text-[11px] tracking-[0.22em] uppercase text-foreground/50">{about.mission}</div>
      </section>

      {/* 3 ── Story next to a product photograph */}
      <section className="container mx-auto px-6 max-w-6xl pb-16 md:pb-20">
        <div className="grid md:grid-cols-2 gap-6 items-stretch">
          <div className="glass-panel rounded-3xl p-8 md:p-10 flex flex-col justify-center">
            <SectionLabel text={about.storyTitle} />
            <p className="text-base md:text-lg text-foreground/78 leading-loose">{about.storyBody}</p>
          </div>
          <div className="rounded-3xl overflow-hidden border min-h-[260px]" style={{ borderColor: "var(--card-border)" }}>
            <img
              src={bgCraft}
              alt={ar ? "وحدة أبعاد الخشبية عن قرب" : "Close up of an Abaad wooden unit"}
              loading="lazy"
              className="w-full h-full object-cover"
            />
          </div>
        </div>
      </section>

      {/* 4 ── Values */}
      <section className="container mx-auto px-6 max-w-6xl pb-16 md:pb-20">
        <SectionLabel text={about.valuesTitle} center />
        <div className="grid sm:grid-cols-3 gap-5 mt-6">
          {about.values.map((v: { title: string; body: string }, i: number) => (
            <motion.div
              key={v.title}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-card rounded-2xl p-7"
            >
              <div className="font-display text-4xl font-bold text-[hsl(var(--accent))]/35 mb-3">
                {String(i + 1).padStart(2, "0")}
              </div>
              <h3 className="font-display text-lg font-semibold mb-2">{v.title}</h3>
              <p className="text-sm text-foreground/68 leading-relaxed">{v.body}</p>
            </motion.div>
          ))}
        </div>
      </section>

      {/* 5 ── Focus + milestones */}
      <section className="container mx-auto px-6 max-w-6xl pb-16 md:pb-20 grid md:grid-cols-2 gap-6">
        <div className="glass-panel rounded-3xl p-8 md:p-10">
          <SectionLabel text={about.goalsTitle} />
          <Bullets items={about.goals} />
        </div>
        <div className="glass-panel rounded-3xl p-8 md:p-10">
          <SectionLabel text={about.milestonesTitle} />
          <Bullets items={about.milestones} />
        </div>
      </section>

      {/* 6 ── Team */}
      <section className="container mx-auto px-6 max-w-6xl pb-16 md:pb-20">
        <SectionLabel text={about.teamTitle} center />
        <p className="text-center text-foreground/65 max-w-xl mx-auto mt-2 mb-8">
          {ar
            ? "فريق سعودي شاب يجمع بين الهندسة والعلوم والأعمال، ويعمل على المنتج بشكل مباشر."
            : "A young Saudi team combining engineering, science and business, working on the product hands on."}
        </p>

        <div className="grid md:grid-cols-3 gap-5">
          {about.team.map((m: TeamMember, i: number) => (
            <motion.article
              key={m.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-3xl p-7 flex flex-col"
            >
              <div className="flex items-center gap-3 mb-4">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center font-display text-xl font-bold bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]">
                  {m.name.charAt(0)}
                </div>
                <div>
                  <h2 className="font-display text-lg font-semibold leading-tight">{m.name}</h2>
                  <div className="text-[10px] tracking-[0.18em] uppercase text-foreground/50">{m.role}</div>
                </div>
              </div>

              <p className="text-sm text-foreground/72 leading-relaxed mb-4">{m.bio}</p>

              {m.studies?.length ? <Bullets items={m.studies} small /> : null}
              {m.achievements?.length ? <Bullets items={m.achievements} small /> : null}

              <div className="flex flex-wrap gap-2 mt-auto pt-4">
                <a
                  href={`mailto:${m.email}`}
                  dir="ltr"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--card-border)] text-xs hover:bg-[hsl(var(--accent))]/10 transition-colors"
                >
                  <Mail className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                  {ar ? "البريد" : "Email"}
                </a>
                <a
                  href={m.linkedin}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--card-border)] text-xs hover:bg-[hsl(var(--accent))]/10 transition-colors"
                >
                  <Linkedin className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                  LinkedIn
                </a>
              </div>
            </motion.article>
          ))}
        </div>
      </section>

      {/* 7 ── Closing call to action */}
      <section className="container mx-auto px-6 max-w-6xl pb-20">
        <div className="glass-panel rounded-3xl p-10 md:p-14 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
            {ar ? "لنبنِ مشروعك القادم معاً" : "Let us build your next project together"}
          </h2>
          <p className="text-foreground/70 mb-7 max-w-xl mx-auto">
            {ar
              ? "شاركنا تفاصيل المساحة والغرض، ونعود إليك بعرض واضح يشمل الوحدات والتركيب والجدول الزمني."
              : "Share the space and the purpose, and we come back with a clear offer covering units, installation and timeline."}
          </p>
          <Link to="/quote" className="btn-primary">
            <FileText className="w-4 h-4" />
            {ar ? "اطلب عرض سعر" : "Request a quote"}
            <ArrowRight className="w-4 h-4" />
          </Link>
        </div>
      </section>
    </Layout>
  );
}

function SectionLabel({ text, center = false }: { text: string; center?: boolean }) {
  return (
    <div className={`flex items-center gap-3 mb-4 ${center ? "justify-center" : ""}`}>
      <span className="h-px w-8" style={{ background: "hsl(var(--accent))" }} />
      <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">{text}</span>
      {center && <span className="h-px w-8" style={{ background: "hsl(var(--accent))" }} />}
    </div>
  );
}

function Bullets({ items, small = false }: { items: string[]; small?: boolean }) {
  return (
    <ul className={small ? "space-y-1.5 mb-3" : "space-y-3"}>
      {items.map((it, i) => (
        <li
          key={i}
          className={`flex gap-3 text-foreground/80 ${small ? "text-xs leading-relaxed" : "text-base leading-relaxed"}`}
        >
          <span
            className={`rounded-full bg-[hsl(var(--accent))] shrink-0 ${small ? "mt-1.5 w-1 h-1" : "mt-2 w-1.5 h-1.5"}`}
          />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
