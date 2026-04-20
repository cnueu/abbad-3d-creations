import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { motion } from "framer-motion";
import { Handshake, Sparkles, Mail, Send, CheckCircle2 } from "lucide-react";
import { useState, FormEvent } from "react";
import falakLogo from "@/assets/falak-logo.png";

export default function Partners() {
  const { t, lang } = useLang();
  const p = t.partners;
  const [sent, setSent] = useState(false);

  const onSubmit = (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    // TODO: wire to backend / email function
    setSent(true);
  };

  return (
    <Layout>
      <div className="container mx-auto px-6 py-20 max-w-5xl">
        {/* Hero */}
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full border border-[color:var(--card-border)] glass-card mb-5">
            <Handshake className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-foreground/65">
              {lang === "ar" ? "تعاون · شراكات" : "Collaborate · Partner"}
            </span>
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold mb-5">
            <span className="text-gradient">{p.title}</span>
          </h1>
          <p className="text-lg text-foreground/75 max-w-2xl mx-auto leading-relaxed">{p.subtitle}</p>
        </motion.div>

        {/* Why partner */}
        <section className="glass-panel rounded-3xl p-8 md:p-12 mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Sparkles className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">
              {p.whyTitle}
            </span>
          </div>
          <ul className="grid md:grid-cols-2 gap-4">
            {p.why.map((w: string, i: number) => (
              <li
                key={i}
                className="flex gap-3 text-base text-foreground/80 p-4 rounded-2xl border border-[color:var(--card-border)]"
                style={{ background: "var(--card-bg)" }}
              >
                <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent))] shrink-0 mt-0.5" />
                <span>{w}</span>
              </li>
            ))}
          </ul>

          <div className="mt-6 inline-flex items-center gap-3 px-4 py-2.5 rounded-full border border-[color:var(--card-border)] glass-card">
            <img src={falakLogo} alt="Falak" className="w-5 h-5 rounded-full object-cover" />
            <span className="text-xs text-foreground/70">
              {lang === "ar"
                ? "بدعم من شركة فلك للأعمال والاستثمار"
                : "Backed by Falak Business & Investment Company"}
            </span>
          </div>
        </section>

        {/* Forms of collaboration */}
        <section className="mb-10">
          <div className="flex items-center gap-2 mb-6">
            <Handshake className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))]">
              {p.formsTitle}
            </span>
          </div>
          <div className="grid sm:grid-cols-2 gap-4">
            {p.forms.map((f: { title: string; body: string }, i: number) => (
              <motion.div
                key={f.title}
                initial={{ opacity: 0, y: 15 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: i * 0.06 }}
                className="glass-card rounded-2xl p-6"
              >
                <h3 className="font-display text-lg font-semibold mb-2">{f.title}</h3>
                <p className="text-sm text-foreground/70 leading-relaxed">{f.body}</p>
              </motion.div>
            ))}
          </div>
        </section>

        {/* Contact form */}
        <section className="glass-panel rounded-3xl p-8 md:p-12">
          <div className="text-[11px] tracking-[0.22em] uppercase text-[hsl(var(--accent))] mb-2">
            {p.ctaTitle}
          </div>
          <h2 className="font-display text-2xl md:text-3xl font-semibold mb-3">{p.ctaBody}</h2>

          {sent ? (
            <div className="flex items-center gap-3 mt-6 p-5 rounded-2xl border border-[color:var(--card-border)] bg-[hsl(var(--accent))]/10">
              <CheckCircle2 className="w-5 h-5 text-[hsl(var(--accent))]" />
              <span className="text-sm text-foreground/85">{p.contactSent}</span>
            </div>
          ) : (
            <form onSubmit={onSubmit} className="grid sm:grid-cols-2 gap-4 mt-6">
              <input
                required
                placeholder={p.contactName}
                className="px-4 py-3 rounded-xl bg-background/50 border border-[color:var(--card-border)] text-sm focus:outline-none focus:border-[hsl(var(--accent))]"
              />
              <input
                required
                type="email"
                placeholder={p.contactEmail}
                className="px-4 py-3 rounded-xl bg-background/50 border border-[color:var(--card-border)] text-sm focus:outline-none focus:border-[hsl(var(--accent))]"
              />
              <input
                placeholder={p.contactCompany}
                className="px-4 py-3 rounded-xl bg-background/50 border border-[color:var(--card-border)] text-sm focus:outline-none focus:border-[hsl(var(--accent))] sm:col-span-2"
              />
              <textarea
                required
                placeholder={p.contactMessage}
                rows={5}
                className="px-4 py-3 rounded-xl bg-background/50 border border-[color:var(--card-border)] text-sm focus:outline-none focus:border-[hsl(var(--accent))] sm:col-span-2 resize-none"
              />
              <button type="submit" className="btn-primary sm:col-span-2 justify-self-start">
                <Send className="w-4 h-4" />
                {p.contactSend}
              </button>
            </form>
          )}

          <div className="mt-6 pt-6 border-t border-[color:var(--card-border)] text-sm text-foreground/65 flex flex-wrap items-center gap-2">
            <Mail className="w-4 h-4 text-[hsl(var(--accent))]" />
            <span>{p.directEmail}:</span>
            <a href="mailto:partners@abbad.sa" className="text-[hsl(var(--text-accent))] hover:underline" dir="ltr">
              partners@abbad.sa
            </a>
          </div>
        </section>
      </div>
    </Layout>
  );
}
