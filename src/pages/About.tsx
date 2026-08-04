import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { Building2, Target, Users, Award, Mail, Linkedin } from "lucide-react";
import falakLogo from "@/assets/falak-logo.png";

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

  return (
    <Layout>
      <div className="container mx-auto px-6 py-20 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          {/* Hero */}
          {/* Large wordmark, roughly half a section tall. */}
          <div className="flex justify-center items-center mb-10 min-h-[38vh]">
            <Logo variant="name" className="w-[min(90vw,720px)] h-auto object-contain" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-center mb-6">
            <span className="text-gradient">{about.title}</span>
          </h1>
          <p className="text-lg text-foreground/75 leading-relaxed text-center mb-10 max-w-2xl mx-auto">
            {about.body}
          </p>

          {/* Incubator badge with Falak logo */}
          <div className="flex justify-center mb-16">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-[color:var(--card-border)] glass-card">
              <img src={falakLogo} alt="Falak" className="w-6 h-6 rounded-full object-cover" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-foreground/60">
                {about.incubatorLabel}
              </span>
              <span className="font-display font-semibold text-foreground">{about.incubator}</span>
            </div>
          </div>
        </motion.div>

        {/* Mission */}
        <section className="glass-panel rounded-3xl p-8 md:p-12 mb-10">
          <div className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))] mb-3">
            {about.mission}
          </div>
          <p className="font-display text-2xl md:text-3xl leading-snug">{about.missionBody}</p>
        </section>

        {/* Goals */}
        <section className="glass-panel rounded-3xl p-8 md:p-12 mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Target className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">
              {about.goalsTitle}
            </span>
          </div>
          <ul className="space-y-3">
            {about.goals.map((g: string, i: number) => (
              <li key={i} className="flex gap-3 text-base md:text-lg text-foreground/80">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] shrink-0" />
                <span>{g}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Milestones */}
        <section className="glass-panel rounded-3xl p-8 md:p-12 mb-16">
          <div className="flex items-center gap-2 mb-6">
            <Award className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">
              {about.milestonesTitle}
            </span>
          </div>
          <ul className="space-y-3">
            {about.milestones.map((m: string, i: number) => (
              <li key={i} className="flex gap-3 text-base md:text-lg text-foreground/80">
                <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] shrink-0" />
                <span>{m}</span>
              </li>
            ))}
          </ul>
        </section>

        {/* Team, one section per person */}
        <div className="flex items-center gap-2 mb-8">
          <Users className="w-4 h-4 text-[hsl(var(--accent))]" />
          <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">
            {about.teamTitle}
          </span>
        </div>

        <div className="space-y-8">
          {about.team.map((m: TeamMember, i: number) => (
            <motion.section
              key={m.name}
              initial={{ opacity: 0, y: 20 }}
              whileInView={{ opacity: 1, y: 0 }}
              viewport={{ once: true }}
              transition={{ delay: i * 0.08 }}
              className="glass-panel rounded-3xl p-8 md:p-10"
            >
              <div className="flex flex-col md:flex-row gap-8 items-start">
                <div className="shrink-0 w-24 h-24 md:w-32 md:h-32 rounded-2xl flex items-center justify-center font-display text-3xl md:text-4xl font-bold bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]">
                  {m.name.charAt(0)}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-[11px] tracking-[0.22em] uppercase text-foreground/55 mb-1">
                    {m.role}
                  </div>
                  <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">{m.name}</h2>
                  <p className="text-base text-foreground/75 leading-relaxed mb-4">{m.bio}</p>

                  {m.studies && m.studies.length > 0 && (
                    <ul className="space-y-2 mb-5">
                      {m.studies.map((s, si) => (
                        <li key={si} className="flex gap-3 text-sm md:text-base text-foreground/80">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] shrink-0" />
                          <span>{s}</span>
                        </li>
                      ))}
                    </ul>
                  )}

                  {m.achievements && m.achievements.length > 0 && (
                    <ul className="space-y-2 mb-5">
                      {m.achievements.map((a, ai) => (
                        <li key={ai} className="flex gap-3 text-sm md:text-base text-foreground/80">
                          <span className="mt-2 w-1.5 h-1.5 rounded-full bg-[hsl(var(--accent))] shrink-0" />
                          <span>{a}</span>
                        </li>
                      ))}
                    </ul>
                  )}
                  <div className="flex flex-wrap gap-3">
                    <a
                      href={`mailto:${m.email}`}
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[color:var(--card-border)] text-sm hover:bg-[hsl(var(--accent))]/10 transition-colors"
                      dir="ltr"
                    >
                      <Mail className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                      {m.email}
                    </a>
                    <a
                      href={m.linkedin}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="inline-flex items-center gap-2 px-3.5 py-2 rounded-full border border-[color:var(--card-border)] text-sm hover:bg-[hsl(var(--accent))]/10 transition-colors"
                    >
                      <Linkedin className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
                      LinkedIn
                    </a>
                  </div>
                </div>
              </div>
            </motion.section>
          ))}
        </div>
      </div>
    </Layout>
  );
}
