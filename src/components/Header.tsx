import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Mail, FileText, ArrowRight } from "lucide-react";
import { Logo } from "./Logo";
import { useLang } from "@/i18n/LanguageContext";

/**
 * HEADER (desktop only, the mobile bar lives in MobileNav.tsx)
 * Intro: the logo starts large, dead centre of the viewport, then settles into
 * the header strip on the start (right in Arabic) side.
 * WHERE TO CHANGE THINGS:
 *  • Contact email .......... CONTACT_EMAIL below
 *  • Strip content .......... the <div className="...header-bar"> block
 */
const CONTACT_EMAIL = "abaad.company.sa@gmail.com";

export function Header() {
  const { lang } = useLang();
  const ar = lang === "ar";
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("abaad_intro_seen");
    if (seen) {
      setIntroDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setIntroDone(true);
      sessionStorage.setItem("abaad_intro_seen", "1");
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  return (
    <>
      {/* Full screen wash during the opening animation only */}
      <AnimatePresence>
        {!introDone && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[90] flex items-center justify-center pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(var(--bg-main)) 0%, hsl(var(--bg-root)) 70%)",
            }}
          >
            <motion.div
              initial={{ scale: 0.9, opacity: 0 }}
              animate={{ scale: 1, opacity: 1 }}
              transition={{ duration: 0.8, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: "min(80vw, 460px)" }}
            >
              <Logo variant="name" className="w-full h-auto object-contain" />
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Header strip: brand on the start side, contact + quote on the end side */}
      <header className="hidden lg:block sticky top-0 z-30">
        <div
          className="h-[72px] border-b backdrop-blur-xl"
          style={{
            background: "hsl(var(--bg-sidebar) / 0.82)",
            borderColor: "var(--card-border)",
          }}
        >
          <div className="h-full container mx-auto px-6 flex items-center gap-6">
            <Link to="/" className="flex items-center gap-3 shrink-0">
              <Logo variant="icon" className="h-8 w-auto object-contain" />
              <span className="hidden xl:block text-[11px] tracking-[0.18em] uppercase text-foreground/50">
                {ar ? "وحدات بناء قابلة للتركيب" : "Modular building units"}
              </span>
            </Link>

            <div className="flex-1" />

            <a
              href={`mailto:${CONTACT_EMAIL}`}
              className="hidden xl:inline-flex items-center gap-2 text-xs text-foreground/65 hover:text-[hsl(var(--accent))] transition-colors"
              dir="ltr"
            >
              <Mail className="w-3.5 h-3.5" />
              {CONTACT_EMAIL}
            </a>

            <Link
              to="/quote"
              className="inline-flex items-center gap-2 px-4 py-2 rounded-full text-xs font-semibold border transition-colors"
              style={{
                background: "hsl(var(--accent) / 0.14)",
                borderColor: "var(--card-border)",
              }}
            >
              <FileText className="w-3.5 h-3.5 text-[hsl(var(--accent))]" />
              {ar ? "اطلب عرض سعر" : "Request a quote"}
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          </div>
        </div>
      </header>
    </>
  );
}
