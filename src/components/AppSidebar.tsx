import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  LayoutTemplate,
  Handshake,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  Languages,
  Home as HomeIcon,
  FileText,
  Sparkles,
  Briefcase,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { Logo } from "./Logo";

interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to: string;
}

/** "About" ("من نحن") uses the star icon. */
function AbaadMark({ className = "" }: { className?: string }) {
  return <Sparkles className={className} />;
}

// SIDEBAR NAVIGATION, add or remove a page in the `items` array below.
// There is no authentication in the app, so no account/login entries here.
export function AppSidebar({
  collapsed,
  setCollapsed,
  theme,
  toggleTheme,
}: {
  collapsed: boolean;
  setCollapsed: (v: boolean) => void;
  theme: "dark" | "light";
  toggleTheme: () => void;
}) {
  const { lang, setLang } = useLang();
  const loc = useLocation();
  const nav = useNavigate();

  const items: NavItem[] = [
    { id: "home", label: lang === "ar" ? "الرئيسية" : "Home", icon: HomeIcon, to: "/" },
    { id: "store", label: lang === "ar" ? "المنتجات" : "Products", icon: LayoutGrid, to: "/store" },
    { id: "services", label: lang === "ar" ? "الخدمات" : "Services", icon: Briefcase, to: "/services" },
    { id: "quote", label: lang === "ar" ? "طلب سعر" : "Request a quote", icon: FileText, to: "/quote" },
    { id: "partners", label: lang === "ar" ? "الشراكات" : "Partners", icon: Handshake, to: "/partners" },
    { id: "models", label: lang === "ar" ? "نماذجنا" : "Our models", icon: LayoutTemplate, to: "/models" },
    { id: "about", label: lang === "ar" ? "من نحن" : "About", icon: AbaadMark, to: "/about" },
  ];

  const isPathActive = (to: string) => {
    if (to === "/") return loc.pathname === "/";
    return loc.pathname === to || loc.pathname.startsWith(to + "/");
  };

  return (
    <aside
      className="abbad-sidebar relative h-screen flex flex-col border-r transition-[width] duration-300 ease-in-out shrink-0"
      style={{
        width: collapsed ? 60 : 220,
        background: "hsl(var(--bg-sidebar) / 0.9)",
        backdropFilter: "blur(18px) saturate(1.2)",
        WebkitBackdropFilter: "blur(18px) saturate(1.2)",
        borderColor: "var(--card-border)",
      }}
    >
      {/* Brand. The theme toggle lives at the bottom of the sidebar, not here. */}
      <div className="relative flex items-center gap-2.5 px-4 pt-5 pb-4 min-h-[72px] overflow-hidden">
        <Link
          to="/"
          className="overflow-hidden transition-opacity"
          style={{ opacity: collapsed ? 0 : 1 }}
        >
          <Logo variant="name" className="h-9 w-auto object-contain" />
        </Link>


        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute end-2.5 top-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full flex items-center justify-center border border-[color:var(--card-border)] hover:bg-[hsl(var(--accent))]/20 transition-colors"
          style={{ background: "hsl(var(--bg-main))" }}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Promo */}
      {!collapsed && (
        <div className="px-3 mb-3">
          <Link
            to="/quote"
            className="block rounded-xl p-3 border text-[11px] leading-snug transition-colors"
            style={{
              borderColor: "var(--card-border)",
              background: "linear-gradient(135deg, hsl(var(--green-500) / 0.45), hsl(var(--green-300) / 0.18))",
              color: "hsl(var(--text-accent))",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              {lang === "ar" ? "للجهات والمشاريع" : "For businesses"}
            </div>
            <div className="text-foreground/70">
              {lang === "ar" ? "احصل على تقدير سعر فوري لمشروعك." : "Get an instant estimate for your project."}
            </div>
          </Link>
        </div>
      )}

      <div
        className="px-4 mb-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-foreground/35 transition-opacity"
        style={{ opacity: collapsed ? 0 : 1 }}
      >
        {lang === "ar" ? "القائمة" : "Menu"}
      </div>

      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active = isPathActive(item.to);
          return (
            <button
              key={item.id}
              onClick={() => nav(item.to)}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors"
              style={{
                background: active ? "hsl(var(--accent) / 0.18)" : "transparent",
                color: active ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.78)",
              }}
              onMouseEnter={(e) => {
                if (!active) e.currentTarget.style.background = "hsl(var(--accent) / 0.10)";
              }}
              onMouseLeave={(e) => {
                if (!active) e.currentTarget.style.background = "transparent";
              }}
            >
              <Icon className="w-[18px] h-[18px] shrink-0" />
              <span
                className="flex-1 text-start whitespace-nowrap transition-opacity"
                style={{ opacity: collapsed ? 0 : 1 }}
              >
                {item.label}
              </span>
            </button>
          );
        })}
      </nav>

      {/* Footer: theme + language */}
      <div className="border-t p-3 space-y-2" style={{ borderColor: "var(--card-border)" }}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border border-[color:var(--card-border)] hover:bg-[hsl(var(--accent))]/12 transition-colors"
          aria-label="Toggle theme"
          style={{ color: "hsl(var(--foreground))" }}
        >
          {theme === "dark" ? <Sun className="w-4 h-4" /> : <Moon className="w-4 h-4" />}
          <span
            className="transition-all overflow-hidden whitespace-nowrap"
            style={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
          >
            {theme === "dark"
              ? lang === "ar" ? "وضع فاتح" : "Light mode"
              : lang === "ar" ? "وضع داكن" : "Dark mode"}
          </span>
        </button>

        <button
          onClick={() => setLang(lang === "ar" ? "en" : "ar")}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border border-[color:var(--card-border)] hover:bg-[hsl(var(--accent))]/12 transition-colors"
          aria-label="Toggle language"
          style={{ color: "hsl(var(--foreground))" }}
        >
          <Languages className="w-4 h-4" />
          <span
            className="transition-all overflow-hidden whitespace-nowrap"
            style={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
          >
            {lang === "ar" ? "English" : "العربية"}
          </span>
        </button>
      </div>
    </aside>
  );
}
