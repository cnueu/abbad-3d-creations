import { Link } from "react-router-dom";
import { Mail, Instagram, Twitter, Youtube, Linkedin } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { Logo } from "./Logo";

export function Footer() {
  const { t, lang } = useLang();
  return (
    <footer className="mt-24 border-t border-[color:var(--card-border)] bg-black/30 backdrop-blur-md">
      <div className="container mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Logo className="w-10 h-10" />
            <span className="font-display font-bold text-xl">{t.brand}</span>
          </div>
          <p className="text-sm text-foreground/60 leading-relaxed">{t.tagline}</p>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">{t.nav.store}</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li><Link to="/store" className="hover:text-green-100">{t.store.title}</Link></li>
            <li><Link to="/studio" className="hover:text-green-100">{t.nav.studio}</Link></li>
            <li><Link to="/checkout" className="hover:text-green-100">{t.nav.checkout}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">{t.footer.contact}</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li><a href="mailto:hello@abbad.studio" className="flex items-center gap-2 hover:text-green-100"><Mail className="w-4 h-4" />hello@abbad.studio</a></li>
            <li><a href="mailto:support@abbad.studio" className="flex items-center gap-2 hover:text-green-100"><Mail className="w-4 h-4" />support@abbad.studio</a></li>
            <li className="text-foreground/60">{lang === "ar" ? "نشحن داخل المملكة العربية السعودية فقط" : "Shipping within Saudi Arabia only"}</li>
            <li><Link to="/about" className="hover:text-green-100">{t.about.title}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">{t.footer.follow}</h4>
          <div className="flex gap-3">
            {[
              { Icon: Instagram, href: "https://instagram.com" },
              { Icon: Twitter, href: "https://x.com" },
              { Icon: Youtube, href: "https://youtube.com" },
              { Icon: Linkedin, href: "https://linkedin.com" },
            ].map(({ Icon, href }, i) => (
              <a
                key={i}
                href={href}
                target="_blank"
                rel="noreferrer"
                className="w-10 h-10 rounded-full border border-[color:var(--card-border)] flex items-center justify-center hover:bg-green-500/20 hover:border-green-200 transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[color:var(--card-border)] py-5 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} {lang === "ar" ? "أبعاد" : "ABBAD"}. {t.footer.rights}
      </div>
    </footer>
  );
}
