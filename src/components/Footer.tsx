import { Link } from "react-router-dom";
import { Mail, Instagram, Linkedin } from "lucide-react";
import { useLang } from "@/i18n/LanguageContext";
import { Logo } from "./Logo";

// ─────────────────────────────────────────────────────────────────────────────
// FOOTER
// WHERE TO CHANGE THINGS:
//  • Contact email .... CONTACT_EMAIL below (single official address)
//  • Social links ..... SOCIALS array below
// ─────────────────────────────────────────────────────────────────────────────
export const CONTACT_EMAIL = "abaad.company.sa@gmail.com";

/** X (Twitter) mark, lucide still ships the old bird. */
function XIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M17.53 3H20.5l-6.49 7.41L21.75 21h-5.98l-4.68-6.11L5.7 21H2.73l6.94-7.93L2.25 3h6.13l4.23 5.59L17.53 3Zm-1.04 16.2h1.65L7.6 4.71H5.83l10.66 14.49Z" />
    </svg>
  );
}

/** TikTok note mark. */
function TikTokIcon({ className }: { className?: string }) {
  return (
    <svg viewBox="0 0 24 24" fill="currentColor" className={className} aria-hidden>
      <path d="M16.5 2h-2.9v13.2a2.6 2.6 0 1 1-2.6-2.6c.2 0 .4 0 .6.1V9.7a5.7 5.7 0 1 0 4.9 5.6V8.9a6.6 6.6 0 0 0 3.8 1.2V7.2a3.8 3.8 0 0 1-3.8-3.8V2Z" />
    </svg>
  );
}

const SOCIALS = [
  { Icon: TikTokIcon, href: "https://www.tiktok.com/@abaad030", label: "TikTok" },
  { Icon: Instagram, href: "https://www.instagram.com/abaad_units", label: "Instagram" },
  { Icon: XIcon, href: "https://x.com/abaadunits", label: "X" },
  { Icon: Linkedin, href: "https://www.linkedin.com/in/abaad-units-287790431", label: "LinkedIn" },
];

export function Footer() {
  const { t, lang } = useLang();
  const ar = lang === "ar";
  return (
    <footer className="mt-24 border-t border-[color:var(--card-border)] backdrop-blur-md" style={{ background: "hsl(var(--bg-sidebar) / 0.6)" }}>
      <div className="container mx-auto px-6 py-14 grid md:grid-cols-4 gap-10">
        <div>
          <div className="flex items-center gap-3 mb-4">
            <Logo className="w-10 h-10" />
            <span className="font-display font-bold text-xl">{t.brand}</span>
          </div>
          <p className="text-sm text-foreground/60 leading-relaxed">{t.tagline}</p>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">{ar ? "الشركة" : "Company"}</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li><Link to="/store" className="hover:text-[hsl(var(--accent))]">{ar ? "المنتجات" : "Products"}</Link></li>
            <li><Link to="/services" className="hover:text-[hsl(var(--accent))]">{ar ? "الخدمات" : "Services"}</Link></li>
            <li><Link to="/models" className="hover:text-[hsl(var(--accent))]">{ar ? "نماذجنا" : "Our models"}</Link></li>
            <li><Link to="/quote" className="hover:text-[hsl(var(--accent))]">{ar ? "طلب عرض سعر" : "Request a quote"}</Link></li>
            <li><Link to="/partners" className="hover:text-[hsl(var(--accent))]">{ar ? "الشراكات" : "Partners"}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">{t.footer.contact}</h4>
          <ul className="space-y-2 text-sm text-foreground/70">
            <li>
              <a href={`mailto:${CONTACT_EMAIL}`} className="flex items-center gap-2 hover:text-[hsl(var(--accent))]" dir="ltr">
                <Mail className="w-4 h-4" />{CONTACT_EMAIL}
              </a>
            </li>
            <li className="text-foreground/60">{ar ? "التوصيل داخل المملكة العربية السعودية" : "Delivery within Saudi Arabia"}</li>
            <li><Link to="/about" className="hover:text-[hsl(var(--accent))]">{t.about.title}</Link></li>
          </ul>
        </div>

        <div>
          <h4 className="font-display text-base mb-4">{t.footer.follow}</h4>
          <div className="flex gap-3">
            {SOCIALS.map(({ Icon, href, label }) => (
              <a
                key={label}
                href={href}
                target="_blank"
                rel="noreferrer"
                aria-label={label}
                className="w-10 h-10 rounded-full border border-[color:var(--card-border)] flex items-center justify-center hover:bg-[hsl(var(--accent))]/15 hover:border-[color:var(--card-border-hover)] transition"
              >
                <Icon className="w-4 h-4" />
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className="border-t border-[color:var(--card-border)] py-5 text-center text-xs text-foreground/50">
        © {new Date().getFullYear()} {ar ? "أبعاد" : "Abaad"}. {t.footer.rights}
      </div>
    </footer>
  );
}
