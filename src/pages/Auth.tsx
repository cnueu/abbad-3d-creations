import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { motion, AnimatePresence } from "framer-motion";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { supabase } from "@/integrations/supabase/client";
import { toast } from "sonner";
import { Loader2 } from "lucide-react";

export default function Auth() {
  const { t, lang } = useLang();
  const nav = useNavigate();
  const [mode, setMode] = useState<"signin" | "signup">("signin");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [loading, setLoading] = useState(false);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    try {
      if (mode === "signup") {
        const { error } = await supabase.auth.signUp({
          email,
          password,
          options: {
            emailRedirectTo: window.location.origin,
            data: { display_name: name },
          },
        });
        if (error) throw error;
        toast.success(lang === "ar" ? "تم إنشاء الحساب" : "Account created");
        nav("/");
      } else {
        const { error } = await supabase.auth.signInWithPassword({ email, password });
        if (error) throw error;
        toast.success(lang === "ar" ? "تم تسجيل الدخول" : "Welcome back");
        nav("/");
      }
    } catch (err: any) {
      toast.error(err.message || "Auth failed");
    } finally {
      setLoading(false);
    }
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-20 flex justify-center">
        <div className="relative w-full max-w-md" style={{ perspective: 1400 }}>
          {/* Tabs */}
          <div className="flex items-center justify-center gap-1 mb-6 p-1 rounded-full glass-panel w-fit mx-auto">
            {(["signin", "signup"] as const).map((m) => (
              <button
                key={m}
                onClick={() => setMode(m)}
                className={`px-5 py-2 rounded-full text-sm font-medium transition ${
                  mode === m ? "bg-green-300 text-[hsl(var(--bg-root))]" : "text-foreground/65 hover:text-foreground"
                }`}
              >
                {m === "signin" ? t.auth.signin : t.auth.signup}
              </button>
            ))}
          </div>

          {/* Flip card */}
          <AnimatePresence mode="wait">
            <motion.form
              key={mode}
              initial={{ opacity: 0, rotateY: -20, y: 12 }}
              animate={{ opacity: 1, rotateY: 0, y: 0 }}
              exit={{ opacity: 0, rotateY: 20, y: -12 }}
              transition={{ duration: 0.45, ease: [0.22, 1, 0.36, 1] }}
              onSubmit={submit}
              className="glass-panel rounded-3xl p-8 space-y-4"
            >
              <h1 className="font-display text-2xl font-bold mb-2">
                {mode === "signin" ? t.auth.signin : t.auth.signup}
              </h1>

              {mode === "signup" && (
                <Field label={t.auth.name}>
                  <input className="input-field" value={name} onChange={(e) => setName(e.target.value)} required />
                </Field>
              )}
              <Field label={t.auth.email}>
                <input type="email" className="input-field" value={email} onChange={(e) => setEmail(e.target.value)} required />
              </Field>
              <Field label={t.auth.password}>
                <input type="password" className="input-field" value={password} onChange={(e) => setPassword(e.target.value)} required minLength={6} />
              </Field>

              <button type="submit" disabled={loading} className="btn-primary w-full">
                {loading && <Loader2 className="w-4 h-4 animate-spin" />}
                {mode === "signin" ? t.auth.submitSignin : t.auth.submitSignup}
              </button>

              <button
                type="button"
                onClick={() => setMode(mode === "signin" ? "signup" : "signin")}
                className="block w-full text-center text-sm text-foreground/65 hover:text-green-100 transition"
              >
                {mode === "signin" ? t.auth.switchToSignup : t.auth.switchToSignin}
              </button>
            </motion.form>
          </AnimatePresence>
        </div>
      </div>
    </Layout>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <label className="block">
      <span className="block text-[11px] tracking-[0.18em] uppercase text-foreground/55 mb-1.5">{label}</span>
      {children}
    </label>
  );
}
