import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { Bell, FileText } from "lucide-react";
import { Link } from "react-router-dom";
import { motion } from "framer-motion";

// NOTIFICATIONS, public page, no accounts. Updates are sent by email
// against the reference number issued with each quote request.
export default function Notifications() {
  const { lang } = useLang();
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

          <p className="text-foreground/70 leading-relaxed mb-7">
            {ar
              ? "لا توجد إشعارات حالياً. عند إرسال طلب عرض سعر، نتواصل معك عبر البريد الإلكتروني بتحديثات العرض والتصنيع والتسليم."
              : "No notifications right now. When you submit a quote request, we follow up by email with pricing, production and delivery updates."}
          </p>

          <Link to="/quote" className="btn-primary">
            <FileText className="w-4 h-4" />
            {ar ? "اطلب عرض سعر" : "Request a quote"}
          </Link>
        </motion.div>
      </section>
    </Layout>
  );
}
