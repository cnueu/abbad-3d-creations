import { useEffect, useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  LayoutTemplate,
  Handshake,
  Menu,
  X,
  Sun,
  Moon,
  Languages,
  Home as HomeIcon,
  FileText,
  Briefcase,
  Sparkles,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { Logo } from "./Logo";

/**
 * MOBILE NAVIGATION (shown under the `lg` breakpoint only).
 * A sticky top bar with the wordmark plus a slide-in drawer that mirrors
 * the desktop sidebar. Edit the `items` array to add or remove a page.
 */
export function MobileNav({
  theme,
  toggleTheme,
}: {
  theme: "dark" | "light";
  toggleTheme: () => void;
}) {
  const { lang, setLang } = useLang();
  const loc = useLocation();
  const nav = useNavigate();
  const [open, setOpen] = useState(false);

  useEffect(() => setOpen(false), [loc.pathname]);
  useEffect(() => {
    document.body.style.overflow = open ? "hidden" : "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  const items = [
    { id: "home", label: lang === "ar" ? "الرئيسية" : "Home", icon: HomeIcon, to: "/" },
    { id: "store", label: lang === "ar" ? "المنتجات" : "Products", icon: LayoutGrid, to: "/store" },
    { id: "services", label: lang === "ar" ? "الخدمات" : "Services", icon: Briefcase, to: "/services" },
    { id: "quote", label: lang === "ar" ? "طلب سعر" : "Request a quote", icon: FileText, to: "/quote" },
    { id: "partners", label: lang === "ar" ? "الشراكات" : "Partners", icon: Handshake, to: "/partners" },
    { id: "models", label: lang === "ar" ? "نماذجنا" : "Our models", icon: LayoutTemplate, to: "/models" },
    {
      id: "about",
      label: lang === "ar" ? "من نحن" : "About",
      icon: Sparkles,
      to: "/about",
    },
  ];

  const active = (to: string) => (to === "/" ? loc.pathname === "/" : loc.pathname.startsWith(to));

  return (
    <>
      <div
        className="lg:hidden sticky top-0 z-[95] flex items-center justify-between px-4 h-14 border-b backdrop-blur-xl"
        style={{ background: "hsl(var(--bg-sidebar) / 0.88)", borderColor: "var(--card-border)" }}
      >
        <Link to="/" className="flex items-center">
          <Logo variant="name" className="h-7 w-auto object-contain" />
        </Link>
        <button
          onClick={() => setOpen(true)}
          aria-label="Open menu"
          className="w-10 h-10 rounded-xl border flex items-center justify-center"
          style={{ borderColor: "var(--card-border)" }}
        >
          <Menu className="w-5 h-5" />
        </button>
      </div>

      {open && (
        <div className="lg:hidden fixed inset-0 z-[120]">
          <div className="absolute inset-0 bg-black/55" onClick={() => setOpen(false)} />
          <div
            className="absolute inset-y-0 end-0 w-[82%] max-w-[320px] flex flex-col border-s backdrop-blur-xl"
            style={{ background: "hsl(var(--bg-sidebar) / 0.97)", borderColor: "var(--card-border)" }}
          >
            <div className="flex items-center justify-between px-4 h-14 border-b" style={{ borderColor: "var(--card-border)" }}>
              <Logo variant="name" className="h-7 w-auto object-contain" />
              <button onClick={() => setOpen(false)} aria-label="Close menu" className="w-9 h-9 flex items-center justify-center">
                <X className="w-5 h-5" />
              </button>
            </div>

            <nav className="flex-1 overflow-y-auto p-3 space-y-1">
              {items.map((item) => {
                const Icon = item.icon;
                const on = active(item.to);
                return (
                  <button
                    key={item.id}
                    onClick={() => nav(item.to)}
                    className="w-full flex items-center gap-3 px-3 py-3 rounded-xl text-sm"
                    style={{
                      background: on ? "hsl(var(--accent) / 0.18)" : "transparent",
                      color: on ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.8)",
                    }}
                  >
                    <Icon className="w-[18px] h-[18px] shrink-0" />
                    <span className="text-start">{item.label}</span>
                  </button>
                );
              })}
            </nav>

            <div className="border-t p-3 space-y-2" style={{ borderColor: "var(--card-border)" }}>
              <button
                onClick={toggleTheme}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium border"
                style={{ borderColor: "var(--card-border)", color: "hsl(var(--foreground))" }}
              >
                {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
                {theme === "dark"
                  ? lang === "ar" ? "وضع فاتح" : "Light mode"
                  : lang === "ar" ? "وضع داكن" : "Dark mode"}
              </button>
              <button
                onClick={() => setLang(lang === "ar" ? "en" : "ar")}
                className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-medium border"
                style={{ borderColor: "var(--card-border)", color: "hsl(var(--foreground))" }}
              >
                <Languages className="w-4 h-4" />
                {lang === "ar" ? "English" : "العربية"}
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
