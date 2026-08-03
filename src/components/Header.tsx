import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

/**
 * Minimal header: logo only, no background, no nav items.
 * All navigation lives in the sidebar.
 */
export function Header() {
  const [introDone, setIntroDone] = useState(false);

  useEffect(() => {
    const seen = sessionStorage.getItem("abbad_intro_seen");
    if (seen) {
      setIntroDone(true);
      return;
    }
    const timer = setTimeout(() => {
      setIntroDone(true);
      sessionStorage.setItem("abbad_intro_seen", "1");
    }, 1600);
    return () => clearTimeout(timer);
  }, []);

  // Intro: 50% larger than before (was min(60vw, 360px) → now min(90vw, 540px))
  const logoSize = !introDone ? "min(90vw, 540px)" : "72px";

  return (
    <>
      <AnimatePresence>
        {!introDone && (
          <motion.div
            initial={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.6 }}
            className="fixed inset-0 z-[90] pointer-events-none"
            style={{
              background:
                "radial-gradient(ellipse at center, hsl(var(--bg-main)) 0%, hsl(var(--bg-root)) 70%)",
            }}
          />
        )}
      </AnimatePresence>

      {/*
        While intro is playing, anchor to the full viewport (fixed) so the logo
        sits dead-center regardless of the sidebar. After the intro, switch to
        the in-pane absolute header position (top-right area of the content pane).
      */}
      <div
        className={
          introDone
            ? "hidden lg:block absolute top-0 left-0 right-0 z-[100] pointer-events-none"
            : "fixed inset-0 z-[100] pointer-events-none"
        }
        style={introDone ? { height: "72px" } : undefined}
      >

        <Link
          to="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-auto"
        >
          <motion.div
            layout
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: logoSize, height: logoSize }}
            className={
              introDone
                ? "flex items-center justify-center px-4 py-1.5 rounded-full border border-[color:var(--card-border)] bg-background/55 backdrop-blur-md shadow-[0_4px_18px_rgba(0,0,0,0.18)]"
                : "flex items-center justify-center"
            }
          >
            <Logo className={introDone ? "w-[88%] h-[88%] object-contain" : "w-full h-full object-contain"} />
          </motion.div>
        </Link>
      </div>
    </>
  );
}
