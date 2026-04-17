import { useState } from "react";
import { Link, useLocation, useNavigate } from "react-router-dom";
import {
  LayoutGrid,
  Cpu,
  Wallet,
  Bell,
  ChevronDown,
  ChevronLeft,
  ChevronRight,
  Sun,
  Moon,
  LogIn,
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
      label: lang === "ar" ? "وحدات البناء" : "Game Jams",
      icon: LayoutGrid,
      children: [
        { id: "store", label: lang === "ar" ? "المتجر" : "Building Blocks", to: "/store" },
        { id: "sheets", label: lang === "ar" ? "الصفائح" : "Sheets", to: "/store?filter=sheet" },
        { id: "about", label: lang === "ar" ? "من نحن" : "About", to: "/about" },
      ],
    },
    { id: "ai", label: lang === "ar" ? "الذكاء" : "AI", icon: Cpu, to: "/studio" },
    { id: "pay", label: lang === "ar" ? "الدفع" : "Pay", icon: Wallet, to: "/checkout" },
    { id: "notif", label: lang === "ar" ? "الإشعارات" : "Notification", icon: Bell, to: "/" },
  ];

  // expand the parent that contains the active route
  const initialExpanded =
    items.find((i) => i.children?.some((c) => loc.pathname.startsWith(c.to.split("?")[0])))?.id ??
    "blocks";
  const [expanded, setExpanded] = useState<string | null>(initialExpanded);

  const isPathActive = (to: string) => {
    const p = to.split("?")[0];
    return p === "/" ? loc.pathname === "/" : loc.pathname.startsWith(p);
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
      {/* Header / user */}
      <div className="relative flex items-center gap-2.5 px-4 pt-5 pb-4 min-h-[72px] overflow-hidden">
        <div
          className="w-9 h-9 rounded-full shrink-0 shadow-[0_0_0_2px_rgba(255,255,255,0.15),0_4px_12px_rgba(0,0,0,0.4)]"
          style={{
            background:
              "conic-gradient(#ff6b6b 0deg,#ffd93d 60deg,#6bcb77 120deg,#4ecdc4 180deg,#667eea 240deg,#f77f00 300deg,#ff6b6b 360deg)",
          }}
        />
        <div
          className="overflow-hidden transition-opacity duration-200"
          style={{ opacity: collapsed ? 0 : 1 }}
        >
          <div className="text-[9px] font-semibold tracking-[0.12em] uppercase text-foreground/45 mb-1 leading-none">
            {lang === "ar" ? "حساب المستخدم" : "ACCOUNT USER"}
          </div>
          <Link
            to="/auth"
            className="text-xs font-medium text-green-100 hover:text-[#a8d5cc] whitespace-nowrap transition-colors"
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
          {collapsed ? (
            <ChevronRight className="w-3.5 h-3.5" />
          ) : (
            <ChevronLeft className="w-3.5 h-3.5" />
          )}
        </button>
      </div>

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
                  color: active ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.75)",
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
                            color: sActive ? "hsl(var(--text-accent))" : "hsl(var(--foreground) / 0.6)",
                            background: sActive ? "rgba(45,125,111,0.18)" : "transparent",
                          }}
                        >
                          <span
                            className="w-1.5 h-1.5 rounded-full transition-all"
                            style={{
                              background: sActive ? "#6db8ac" : "rgba(255,255,255,0.2)",
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
        >
          {theme === "dark" ? (
            <Sun className="w-4 h-4 text-green-100" />
          ) : (
            <Moon className="w-4 h-4 text-green-100" />
          )}
          <span
            className="transition-all overflow-hidden whitespace-nowrap"
            style={{ width: collapsed ? 0 : "auto", opacity: collapsed ? 0 : 1 }}
          >
            {theme === "dark"
              ? lang === "ar"
                ? "وضع فاتح"
                : "Light mode"
              : lang === "ar"
              ? "وضع داكن"
              : "Dark mode"}
          </span>
        </button>
        {!collapsed && (
          <Link
            to="/auth"
            className="mt-2 w-full flex items-center justify-center gap-2 px-3 py-2 rounded-lg text-xs font-medium bg-green-500/30 text-green-100 hover:bg-green-500/50 transition-colors"
          >
            <LogIn className="w-3.5 h-3.5" />
            {t.nav.auth}
          </Link>
        )}
      </div>
    </aside>
  );
}
