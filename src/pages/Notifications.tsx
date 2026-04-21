import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Bell, LogIn, UserPlus } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";
import { supabase } from "@/integrations/supabase/client";
import { useEffect, useState } from "react";

export default function Notifications() {
  const { lang } = useLang();
  const [authed, setAuthed] = useState<boolean | null>(null);

  useEffect(() => {
    const { data: sub } = supabase.auth.onAuthStateChange((_e, session) => {
      setAuthed(!!session);
    });
    supabase.auth.getSession().then(({ data }) => setAuthed(!!data.session));
    return () => sub.subscription.unsubscribe();
  }, []);

  const ar = lang === "ar";

  return (
    <Layout>
      <section className="max-w-2xl mx-auto px-6 py-16">
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5, ease: [0.22, 1, 0.36, 1] }}
          className="glass-panel rounded-3xl p-10 text-center"
        >
          <div className="w-16 h-16 rounded-2xl mx-auto mb-5 flex items-center justify-center bg-[hsl(var(--accent))]/15 border border-[color:var(--card-border)]">
            <Bell className="w-7 h-7 text-[hsl(var(--accent))]" />
          </div>

          <h1 className="font-display text-3xl font-bold mb-3">
            {ar ? "الإشعارات" : "Notifications"}
          </h1>

          {authed ? (
            <p className="text-foreground/65 leading-relaxed">
              {ar
                ? "لا توجد إشعارات حتى الآن. ستصلك هنا تحديثات الطلبات ونتائج الذكاء الاصطناعي حال جاهزيتها."
                : "No notifications yet. Order updates and AI generation results will appear here as soon as they're ready."}
            </p>
          ) : (
            <>
              <p className="text-foreground/70 leading-relaxed mb-7">
                {ar
                  ? "سجِّل الدخول أو أنشئ حساباً لعرض إشعاراتك — مثل تأكيدات الطلبات وحالة الشحن وجاهزية تصاميم الذكاء الاصطناعي."
                  : "Sign in or create an account to view your notifications — like order confirmations, shipping updates, and AI design results."}
              </p>
              <div className="flex items-center justify-center gap-3 flex-wrap">
                <Link to="/auth" className="btn-primary">
                  <LogIn className="w-4 h-4" />
                  {ar ? "تسجيل الدخول" : "Sign in"}
                </Link>
                <Link
                  to="/auth?mode=signup"
                  className="px-5 py-2.5 rounded-xl border border-[color:var(--card-border)] text-sm font-medium hover:bg-[hsl(var(--accent))]/10 transition inline-flex items-center gap-2"
                >
                  <UserPlus className="w-4 h-4" />
                  {ar ? "إنشاء حساب" : "Create account"}
                </Link>
              </div>
            </>
          )}
        </motion.div>
      </section>
    </Layout>
  );
}
