import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Logo } from "@/components/Logo";
import { motion } from "framer-motion";

export default function About() {
  const { t } = useLang();
  return (
    <Layout>
      <div className="container mx-auto px-6 py-16 max-w-4xl">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}>
          <div className="flex justify-center mb-8">
            <Logo className="w-32 h-32 spin-slow opacity-90" />
          </div>
          <h1 className="font-display text-4xl md:text-6xl font-bold text-center mb-6">
            <span className="text-gradient">{t.about.title}</span>
          </h1>
          <p className="text-lg text-foreground/75 leading-relaxed text-center mb-12 max-w-2xl mx-auto">
            {t.about.body}
          </p>

          <div className="glass-panel rounded-3xl p-8 md:p-10">
            <div className="text-[11px] tracking-[0.22em] uppercase text-green-100 mb-2">{t.about.mission}</div>
            <p className="font-display text-2xl md:text-3xl leading-snug">{t.about.missionBody}</p>
          </div>
        </motion.div>
      </div>
    </Layout>
  );
}
