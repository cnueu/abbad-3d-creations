import { useEffect, useState } from "react";
import { Link, NavLink } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Logo } from "./Logo";
import { useLang } from "@/i18n/LanguageContext";
import { Globe } from "lucide-react";

export function Header() {
  const { t, lang, setLang } = useLang();
  const [scrolled, setScrolled] = useState(false);
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const onScroll = () => setScrolled(window.scrollY > 80);
    window.addEventListener("scroll", onScroll);
    return () => window.removeEventListener("scroll", onScroll);
  }, []);

  useEffect(() => {
    const seen = sessionStorage.getItem("abbad_intro_seen");
    if (seen) {
      setIntroDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setIntroDone(true);
      sessionStorage.setItem("abbad_intro_seen", "1");
    }, 2000);
    return () => clearTimeout(timer);
  }, []);

  const logoSize = !introDone ? "min(60vw, 380px)" : scrolled ? "36px" : "60px";

  const links = [
    { to: "/", label: t.nav.home },
    { to: "/store", label: t.nav.store },
    { to: "/studio", label: t.nav.studio },
    { to: "/about", label: t.nav.about },
  ];

  return (
    <>
      {/* Intro overlay */}
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
          />
        )}
      </AnimatePresence>

      <header
        className="fixed top-0 left-0 right-0 z-[100] transition-all duration-500"
        style={{
          background: "transparent",
          height: introDone ? (scrolled ? "60px" : "84px") : "100vh",
          pointerEvents: introDone ? "auto" : "none",
        }}
      >
        <div className="container h-full mx-auto px-6 flex items-center justify-between relative">
          {/* Center logo (animated) */}
          <Link
            to="/"
            className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center"
            style={{ pointerEvents: introDone ? "auto" : "none" }}
          >
            <motion.div
              layout
              transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
              style={{ width: logoSize, height: logoSize }}
              className="flex items-center justify-center"
            >
              <Logo className="w-full h-full object-contain drop-shadow-[0_0_24px_rgba(109,184,172,0.45)]" />
            </motion.div>
          </Link>

          {/* Right utilities (lang only — keep header minimal as requested) */}
          <div
            className="ml-auto hidden md:flex items-center gap-3 transition-opacity duration-500"
            style={{ opacity: introDone ? 1 : 0 }}
          >
            {links.map((l) => (
              <NavLink
                key={l.to}
                to={l.to}
                className={({ isActive }) =>
                  `text-sm font-medium px-2 py-1 transition-colors hover:text-[hsl(var(--accent))] ${
                    isActive ? "text-[hsl(var(--accent))]" : "text-foreground/80"
                  }`
                }
              >
                {l.label}
              </NavLink>
            ))}
            <button
              onClick={() => setLang(lang === "en" ? "ar" : "en")}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-full border border-[color:var(--card-border)] bg-background/40 backdrop-blur-md hover:bg-[hsl(var(--accent))]/15 transition"
              aria-label="Toggle language"
            >
              <Globe className="w-3.5 h-3.5" />
              <span className="text-xs">{lang === "en" ? "العربية" : "EN"}</span>
            </button>
          </div>

          {/* Mobile lang toggle */}
          <button
            onClick={() => setLang(lang === "en" ? "ar" : "en")}
            className="md:hidden ml-auto flex items-center gap-1 px-2.5 py-1 rounded-full border border-[color:var(--card-border)] bg-background/40 backdrop-blur-md text-xs"
            style={{ opacity: introDone ? 1 : 0 }}
          >
            <Globe className="w-3 h-3" /> {lang === "en" ? "ع" : "EN"}
          </button>
        </div>
      </header>
    </>
  );
}
