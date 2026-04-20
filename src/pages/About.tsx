import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";
import { Building2, Target, Users } from "lucide-react";
import falakLogo from "@/assets/falak-logo.png";
import falakLogo from "@/assets/falak-logo.png";

export default function About() {
  const { t } = useLang();
  const about = t.about;

  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-5xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-center mb-8">
            <Logo className="w-32 h-32 spin-slow opacity-90" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-center mb-6">
            <span className="text-gradient">{about.title}</span>
          </h1>
          <p className="text-lg text-foreground/75 leading-relaxed text-center mb-10 max-w-2xl mx-auto">
            {about.body}
          </p>

          {/* Incubator badge */}
          <div className="flex justify-center mb-12">
            <div className="inline-flex items-center gap-3 px-5 py-3 rounded-full border border-[color:var(--card-border)] glass-card">
              <Building2 className="w-4 h-4 text-[hsl(var(--accent))]" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-foreground/60">
                {about.incubatorLabel}
              </span>
              <span className="font-display font-semibold text-foreground">{about.incubator}</span>
            </div>
          </div>

          {/* Mission */}
          <div className="glass-panel rounded-3xl p-8 md:p-10 mb-8">
            <div className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))] mb-2">
              {about.mission}
            </div>
            <p className="font-display text-2xl md:text-3xl leading-snug">{about.missionBody}</p>
          </div>

          {/* Goals */}
          <div className="glass-panel rounded-3xl p-8 md:p-10 mb-8">
            <div className="flex items-center gap-2 mb-5">
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
          </div>

          {/* Team */}
          <div className="glass-panel rounded-3xl p-8 md:p-10">
            <div className="flex items-center gap-2 mb-6">
              <Users className="w-4 h-4 text-[hsl(var(--accent))]" />
              <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">
                {about.teamTitle}
              </span>
            </div>
            <div className="grid sm:grid-cols-3 gap-4">
              {about.team.map((m: { name: string; role: string }, i: number) => (
                <motion.div
                  key={m.name}
                  initial={{ opacity: 0, y: 10 }}
                  whileInView={{ opacity: 1, y: 0 }}
                  viewport={{ once: true }}
                  transition={{ delay: i * 0.08 }}
                  className="rounded-2xl p-5 border border-[color:var(--card-border)] text-center"
                  style={{ background: "var(--card-bg)" }}
                >
                  <div className="w-14 h-14 mx-auto mb-3 rounded-full flex items-center justify-center font-display text-lg font-bold bg-[hsl(var(--accent))]/15 text-[hsl(var(--accent))]">
                    {m.name.charAt(0)}
                  </div>
                  <div className="font-display font-semibold text-foreground">{m.name}</div>
                  <div className="text-xs text-foreground/60 mt-1">{m.role}</div>
                </motion.div>
              ))}
            </div>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
