import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Cpu,
  Wallet,
  Bell,
  Info,
  Handshake,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogIn,
  Sparkles,
} from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";

interface NavChild {
  id: string;
  label: string;
  to: string;
}
interface NavItem {
  id: string;
  label: string;
  icon: React.ComponentType<{ className?: string }>;
  to?: string;
  children?: NavChild[];
}

/** 4-point star account avatar */
function FourPointStar({ className = "" }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M12 1.5 L13.6 9.2 L21.5 12 L13.6 14.8 L12 22.5 L10.4 14.8 L2.5 12 L10.4 9.2 Z" />
    </svg>
  );
}

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
  const { t, lang } = useLang();
  const loc = useLocation();
  const nav = useNavigate();

  const items: NavItem[] = [
    {
      id: "blocks",
      label: lang === "ar" ? "أدوات البناء" : "Build Tools",
      icon: LayoutGrid,
      children: [
        { id: "store", label: lang === "ar" ? "المتجر" : "Building Blocks", to: "/store" },
        { id: "sheets", label: lang === "ar" ? "الصفائح" : "Sheets", to: "/store?filter=sheet" },
      ],
    },
    { id: "ai", label: lang === "ar" ? "الذكاء" : "AI", icon: Cpu, to: "/studio" },
    { id: "pay", label: lang === "ar" ? "الدفع" : "Pay", icon: Wallet, to: "/checkout" },
    { id: "about", label: lang === "ar" ? "من نحن" : "About", icon: Info, to: "/about" },
    { id: "partners", label: lang === "ar" ? "الشراكات" : "Partners", icon: Handshake, to: "/partners" },
    { id: "notif", label: lang === "ar" ? "الإشعارات" : "Notifications", icon: Bell, to: "/notifications" },
  ];

  const initialExpanded =
    items.find((i) => i.children?.some((c) => loc.pathname.startsWith(c.to.split("?")[0])))?.id ??
    null;
  const [expanded, setExpanded] = useState<string | null>(initialExpanded);

  // Strict matcher — exact path only (so Notification doesn't auto-light on "/")
  const isPathActive = (to: string) => {
    const p = to.split("?")[0];
    if (p === "/") return loc.pathname === "/";
    return loc.pathname === p || loc.pathname.startsWith(p + "/");
  };

  return (
    <aside
      className="abbad-sidebar relative h-screen flex flex-col border-r transition-[width] duration-300 ease-in-out shrink-0"
      style={{
        width: collapsed ? 60 : 220,
        background: "hsl(var(--bg-sidebar))",
        borderColor: "var(--card-border)",
      }}
    >
      {/* Account header — no extra top padding (no global header anymore) */}
      <div className="relative flex items-center gap-2.5 px-4 pt-5 pb-4 min-h-[72px] overflow-hidden">
        <div
          className="w-9 h-9 rounded-full shrink-0 flex items-center justify-center shadow-[0_0_0_2px_rgba(255,255,255,0.12),0_4px_12px_rgba(0,0,0,0.4)]"
          style={{
            background: "linear-gradient(135deg, hsl(var(--green-300)), hsl(var(--green-200)))",
            color: "hsl(var(--bg-root))",
          }}
        >
          <FourPointStar className="w-5 h-5" />
        </div>
        <div
          className="overflow-hidden transition-opacity duration-200"
          style={{ opacity: collapsed ? 0 : 1 }}
        >
          <div className="text-[9px] font-semibold tracking-[0.12em] uppercase text-foreground/45 mb-1 leading-none">
            {lang === "ar" ? "حساب المستخدم" : "ACCOUNT USER"}
          </div>
          <Link
            to="/auth"
            className="text-xs font-medium hover:text-[hsl(var(--accent))] whitespace-nowrap transition-colors"
            style={{ color: "hsl(var(--text-accent))" }}
          >
            {lang === "ar" ? "إنشاء حساب" : "Create Account"}
          </Link>
        </div>

        <button
          onClick={() => setCollapsed(!collapsed)}
          className="absolute end-2.5 top-1/2 -translate-y-1/2 w-[26px] h-[26px] rounded-full flex items-center justify-center border border-[color:var(--card-border)] hover:bg-green-500/20 transition-colors"
          style={{ background: "hsl(var(--bg-main))" }}
          aria-label="Toggle sidebar"
        >
          {collapsed ? <ChevronRight className="w-3.5 h-3.5" /> : <ChevronLeft className="w-3.5 h-3.5" />}
        </button>
      </div>

      {/* Promo / ad above Build Tools */}
      {!collapsed && (
        <div className="px-3 mb-3">
          <div
            className="rounded-xl p-3 border text-[11px] leading-snug"
            style={{
              borderColor: "var(--card-border)",
              background:
                "linear-gradient(135deg, hsl(var(--green-500) / 0.45), hsl(var(--green-300) / 0.18))",
              color: "hsl(var(--text-accent))",
            }}
          >
            <div className="flex items-center gap-1.5 mb-1 font-semibold">
              <Sparkles className="w-3 h-3" />
              {lang === "ar" ? "جديد · جرّب استوديو الذكاء" : "NEW · Try AI Studio"}
            </div>
            <div className="text-foreground/65">
              {lang === "ar"
                ? "صِف شكلاً، نحوّله إلى تصميم قابل للبناء."
                : "Describe a shape — get a buildable plan."}
            </div>
          </div>
        </div>
      )}

      {/* Section label */}
      <div
        className="px-4 mb-2 text-[10px] font-semibold tracking-[0.15em] uppercase text-foreground/35 transition-opacity"
        style={{ opacity: collapsed ? 0 : 1 }}
      >
        {lang === "ar" ? "القائمة" : "Menu"}
      </div>

      {/* Nav */}
      <nav className="flex-1 overflow-y-auto px-2 space-y-0.5">
        {items.map((item) => {
          const Icon = item.icon;
          const active =
            (item.to && isPathActive(item.to)) ||
            (item.children?.some((c) => isPathActive(c.to)) ?? false);
          const isExpanded = expanded === item.id;

          return (
            <div key={item.id}>
              <button
                onClick={() => {
                  if (item.children) {
                    setExpanded(isExpanded ? null : item.id);
                  } else if (item.to) {
                    nav(item.to);
                  }
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-sm transition-colors group"
                style={{
                  background: active ? "rgba(45,125,111,0.22)" : "transparent",
                  color: active ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.78)",
                }}
                onMouseEnter={(e) => {
                  if (!active) e.currentTarget.style.background = "rgba(45,125,111,0.15)";
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
                {item.children && !collapsed && (
                  <ChevronDown
                    className="w-3.5 h-3.5 transition-transform"
                    style={{ transform: isExpanded ? "rotate(0deg)" : "rotate(-90deg)" }}
                  />
                )}
              </button>

              {item.children && isExpanded && !collapsed && (
                <ul className="ms-7 mt-0.5 mb-1 border-s border-[color:var(--card-border)] ps-3 space-y-0.5">
                  {item.children.map((c) => {
                    const sActive = isPathActive(c.to);
                    return (
                      <li key={c.id}>
                        <Link
                          to={c.to}
                          className="flex items-center gap-2 px-2 py-1.5 rounded-md text-xs transition-colors hover:bg-green-500/15"
                          style={{
                            color: sActive ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.65)",
                            background: sActive ? "rgba(45,125,111,0.18)" : "transparent",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full transition-all"
                            style={{
                              background: sActive ? "hsl(var(--accent))" : "hsl(var(--foreground) / 0.25)",
                            }}
                          />
                          {c.label}
                        </Link>
                      </li>
                    );
                  })}
                </ul>
              )}
            </div>
          );
        })}
      </nav>

      {/* Footer: theme toggle */}
      <div className="border-t p-3" style={{ borderColor: "var(--card-border)" }}>
        <button
          onClick={toggleTheme}
          className="w-full flex items-center gap-2.5 px-3 py-2 rounded-lg text-xs font-medium border border-[color:var(--card-border)] hover:bg-green-500/15 transition-colors"
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
        {!collapsed && (
          <Link
            to="/auth"
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/30 hover:bg-green-500/50 transition-colors"
            style={{ color: "hsl(var(--text-accent))" }}
          >
            <LogIn className="w-3.5 h-3.5" />
            {t.nav.auth}
          </Link>
        )}
      </div>
    </aside>
  );
}
