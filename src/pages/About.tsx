import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Link } from "react-router-dom";
import { Target, Users, Award, Mail, Linkedin, Sparkles, ArrowRight, FileText } from "lucide-react";
import falakLogo from "@/assets/falak-logo.png";
import { Logo } from "@/components/Logo";

// ─────────────────────────────────────────────────────────────────────────────
// ABOUT / من نحن
// Rewritten from scratch: a calm top-to-bottom read, no oversized centre logo.
// WHERE TO CHANGE THINGS:
//  • All copy and team members ..... src/i18n/translations.ts → about
//  • Incubator badge image ......... src/assets/falak-logo.png
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
      <div className="container mx-auto px-6 py-14 max-w-5xl">
        {/* Intro, small wordmark on the side instead of a giant centred logo */}
        <motion.header
          initial={{ opacity: 0, y: 18 }}
          animate={{ opacity: 1, y: 0 }}
          className="grid md:grid-cols-[1.4fr_1fr] gap-10 items-center mb-14"
        >
          <div>
            <span className="text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--accent))]">
              {about.short}
            </span>
            <h1 className="font-display text-3xl md:text-5xl font-bold mt-2 mb-4">
              <span className="text-gradient">{about.title}</span>
            </h1>
            <p className="text-base md:text-lg text-foreground/75 leading-relaxed mb-6">{about.body}</p>
            <div className="inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-[color:var(--card-border)] glass-card">
              <img src={falakLogo} alt="Falak" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-[11px] tracking-[0.18em] uppercase text-foreground/55">
                {about.incubatorLabel}
              </span>
              <span className="font-display font-semibold text-foreground text-sm">{about.incubator}</span>
            </div>
          </div>
          <div className="glass-panel rounded-3xl p-8 flex items-center justify-center">
            <Logo variant="name" className="w-full max-w-[260px] h-auto object-contain" />
          </div>
        </motion.header>

        {/* Mission + story side by side */}
        <div className="grid md:grid-cols-2 gap-5 mb-5">
          <section className="glass-panel rounded-3xl p-8">
            <Label icon={Sparkles} text={about.mission} />
            <p className="font-display text-xl md:text-2xl leading-snug">{about.missionBody}</p>
          </section>
          <section className="glass-panel rounded-3xl p-8">
            <Label icon={Award} text={about.storyTitle} />
            <p className="text-base text-foreground/75 leading-relaxed">{about.storyBody}</p>
          </section>
        </div>

        {/* Values */}
        <section className="grid sm:grid-cols-3 gap-4 mb-5">
          {about.values.map((v: { title: string; body: string }) => (
            <div key={v.title} className="glass-card rounded-2xl p-6">
              <h3 className="font-display text-lg font-semibold mb-1.5">{v.title}</h3>
              <p className="text-sm text-foreground/65 leading-relaxed">{v.body}</p>
            </div>
          ))}
        </section>

        {/* Goals + milestones */}
        <div className="grid md:grid-cols-2 gap-5 mb-16">
          <section className="glass-panel rounded-3xl p-8">
            <Label icon={Target} text={about.goalsTitle} />
            <Bullets items={about.goals} />
          </section>
          <section className="glass-panel rounded-3xl p-8">
            <Label icon={Award} text={about.milestonesTitle} />
            <Bullets items={about.milestones} />
          </section>
        </div>

        {/* Team */}
        <div className="flex items-center gap-2 mb-6">
          <Users className="w-4 h-4 text-[hsl(var(--accent))]" />
          <span className="text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--accent))]">
            {about.teamTitle}
          </span>
        </div>

        <div className="grid md:grid-cols-3 gap-5 mb-16">
          {about.team.map((m: TeamMember, i: number) => (
            <motion.article
              key={m.name}
              initial={{ opacity: 0, y: 18 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.07 }}
              className="glass-card rounded-3xl p-7 flex flex-col"
            >
              <div className="w-14 h-14 rounded-2xl flex items-center justify-center font-display text-2xl font-bold mb-4 bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]">
                {m.name.charAt(0)}
              </div>
              <div className="text-[10px] tracking-[0.2em] uppercase text-foreground/50 mb-1">{m.role}</div>
              <h2 className="font-display text-xl font-semibold mb-2">{m.name}</h2>
              <p className="text-sm text-foreground/70 leading-relaxed mb-4">{m.bio}</p>

              {m.studies && m.studies.length > 0 && (
                <Bullets items={m.studies} small />
              )}
              {m.achievements && m.achievements.length > 0 && (
                <Bullets items={m.achievements} small />
              )}

              <div className="flex flex-wrap gap-2 mt-auto pt-4">
                <a
                  href={`mailto:${m.email}`}
                  className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--card-border)] text-xs hover:bg-[hsl(var(--accent))]/10 transition-colors"
                  dir="ltr"
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

        {/* Closing CTA */}
        <section className="glass-panel rounded-3xl p-8 md:p-10 text-center">
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">
            {ar ? "عندك فكرة تبي تبنيها؟" : "Have something you want to build?"}
          </h2>
          <p className="text-foreground/70 mb-6">
            {ar ? "أرسل لنا التفاصيل ونرجع لك بعرض واضح." : "Send us the details and we reply with a clear offer."}
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

function Label({ icon: Icon, text }: { icon: React.ComponentType<{ className?: string }>; text: string }) {
  return (
    <div className="flex items-center gap-2 mb-4">
      <Icon className="w-4 h-4 text-[hsl(var(--accent))]" />
      <span className="text-[11px] tracking-[0.2em] uppercase text-[hsl(var(--accent))]">{text}</span>
    </div>
  );
}

function Bullets({ items, small = false }: { items: string[]; small?: boolean }) {
  return (
    <ul className={small ? "space-y-1.5 mb-3" : "space-y-3"}>
      {items.map((it, i) => (
        <li
          key={i}
          className={`flex gap-3 text-foreground/80 ${small ? "text-xs leading-relaxed" : "text-base"}`}
        >
          <span className={`rounded-full bg-[hsl(var(--accent))] shrink-0 ${small ? "mt-1.5 w-1 h-1" : "mt-2 w-1.5 h-1.5"}`} />
          <span>{it}</span>
        </li>
      ))}
    </ul>
  );
}
