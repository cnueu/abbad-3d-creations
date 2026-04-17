import { ReactNode, useEffect, useState } from "react";
import { Header } from "./Header";
import { Footer } from "./Footer";
import { AppSidebar } from "./AppSidebar";

export function Layout({ children }: { children: ReactNode }) {
  const [collapsed, setCollapsed] = useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return localStorage.getItem("abbad_sidebar_collapsed") === "1";
  });
  const [theme, setTheme] = useState<"dark" | "light">(() => {
    if (typeof window === "undefined") return "dark";
    return (localStorage.getItem("abbad_theme") as "dark" | "light") || "dark";
  });

  useEffect(() => {
    document.documentElement.setAttribute("data-theme", theme);
    localStorage.setItem("abbad_theme", theme);
  }, [theme]);

  useEffect(() => {
    localStorage.setItem("abbad_sidebar_collapsed", collapsed ? "1" : "0");
  }, [collapsed]);

  return (
    <div className="min-h-screen flex bg-background">
      {/* Desktop sidebar */}
      <div className="hidden lg:block sticky top-0 h-screen z-40">
        <AppSidebar
          collapsed={collapsed}
          setCollapsed={setCollapsed}
          theme={theme}
          toggleTheme={() => setTheme(theme === "dark" ? "light" : "dark")}
        />
      </div>

      <div className="flex-1 min-w-0 flex flex-col">
        <Header />
        <main className="flex-1 pt-[84px]">{children}</main>
        <Footer />
      </div>
    </div>
  );
}
