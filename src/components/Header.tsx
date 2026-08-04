import { Link } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useState } from "react";
import { Logo } from "./Logo";

/**
 * HEADER
 * Intro: the logo starts large, dead-center of the viewport, then settles into
 * a full width rectangular header strip (not a circle) with the logo centered.
 * The strip sits behind the sidebar (z-30) and holds no navigation.
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

  const logoSize = !introDone ? "min(90vw, 540px)" : "56px";

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

      <div
        className={
          introDone
            ? "hidden lg:block absolute top-0 left-0 right-0 z-30 pointer-events-none"
            : "fixed inset-0 z-[100] pointer-events-none"
        }
        style={introDone ? { height: "72px" } : undefined}
      >
        {/* Rectangular header strip, behind the sidebar. */}
        {introDone && (
          <div
            aria-hidden
            className="absolute inset-x-0 top-0 h-[72px] border-b backdrop-blur-xl"
            style={{
              background: "hsl(var(--bg-sidebar) / 0.72)",
              borderColor: "var(--card-border)",
            }}
          />
        )}

        <Link
          to="/"
          className="absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 flex items-center pointer-events-auto"
        >
          <motion.div
            layout
            transition={{ duration: 0.9, ease: [0.22, 1, 0.36, 1] }}
            style={{ width: logoSize, height: logoSize }}
            className="flex items-center justify-center"
          >
            <Logo className="w-full h-full object-contain" />
          </motion.div>
        </Link>
      </div>
    </>
  );
}
