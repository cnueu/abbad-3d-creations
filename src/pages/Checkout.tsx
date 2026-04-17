import { useState } from "react";
import { Link } from "react-router-dom";
import { Layout } from "@/components/Layout";
import { useLang } from "@/i18n/LanguageContext";
import { useCart } from "@/hooks/useCart";
import { toast } from "sonner";
import { Trash2, CreditCard } from "lucide-react";

export default function Checkout() {
  const { t, lang } = useLang();
  const { items, remove, setQty, total, clear } = useCart();
  const [method, setMethod] = useState<"mada" | "visa">("mada");
  const [cardName, setCardName] = useState("");
  const [cardNumber, setCardNumber] = useState("");
  const [expiry, setExpiry] = useState("");
  const [cvc, setCvc] = useState("");

  function pay(e: React.FormEvent) {
    e.preventDefault();
    if (!items.length) return;
    toast.success(lang === "ar" ? "تم استلام الطلب (واجهة عرض)" : "Order received (UI demo)");
    clear();
  }

  return (
    <Layout>
      <div className="container mx-auto px-6 py-14 max-w-5xl">
        <h1 className="font-display text-3xl md:text-5xl font-bold mb-8">
          <span className="text-gradient">{t.checkout.title}</span>
        </h1>

        {items.length === 0 ? (
          <div className="glass-panel rounded-3xl p-10 text-center">
            <p className="text-foreground/70 mb-5">{t.checkout.empty}</p>
            <Link to="/store" className="btn-primary">{t.checkout.backToStore}</Link>
          </div>
        ) : (
          <div className="grid lg:grid-cols-5 gap-6">
            <form onSubmit={pay} className="glass-panel rounded-3xl p-6 lg:col-span-3 space-y-5">
              <div>
                <div className="text-[11px] tracking-[0.2em] uppercase text-foreground/55 mb-2">{t.checkout.method}</div>
                <div className="grid grid-cols-2 gap-3">
                  {(["mada", "visa"] as const).map((m) => (
                    <button
                      key={m}
                      type="button"
                      onClick={() => setMethod(m)}
                      className={`p-4 rounded-xl border-2 transition flex items-center justify-center gap-3 ${
                        method === m ? "border-green-200 bg-green-500/15" : "border-[color:var(--card-border)] hover:bg-green-500/10"
                      }`}
                    >
                      {m === "mada" ? (
                        <span className="font-display font-extrabold tracking-tight text-xl">
                          <span className="text-green-100">m</span>ada
                        </span>
                      ) : (
                        <>
                          <CreditCard className="w-5 h-5" />
                          <span className="font-medium">{t.checkout.visa}</span>
                        </>
                      )}
                    </button>
                  ))}
                </div>
              </div>

              <Field label={t.checkout.cardName}>
                <input className="input-field" value={cardName} onChange={(e) => setCardName(e.target.value)} required />
              </Field>
              <Field label={t.checkout.cardNumber}>
                <input
                  className="input-field tracking-widest"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value.replace(/\D/g, "").slice(0, 16))}
                  placeholder="•••• •••• •••• ••••"
                  required
                />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label={t.checkout.expiry}>
                  <input className="input-field" value={expiry} onChange={(e) => setExpiry(e.target.value)} placeholder="12 / 27" required />
                </Field>
                <Field label={t.checkout.cvc}>
                  <input className="input-field" value={cvc} onChange={(e) => setCvc(e.target.value.replace(/\D/g, "").slice(0, 4))} required />
                </Field>
              </div>

              <button type="submit" className="btn-primary w-full">
                {t.checkout.pay} · {total} {t.common.sar}
              </button>
            </form>

            <aside className="glass-panel rounded-3xl p-6 lg:col-span-2 h-fit">
              <h3 className="font-display text-lg mb-5">{t.checkout.orderSummary}</h3>
              <ul className="space-y-3 mb-5">
                {items.map((i) => (
                  <li key={i.product.id} className="flex items-center gap-3 pb-3 border-b border-[color:var(--card-border)]">
                    <div className="flex-1">
                      <div className="text-sm font-medium">
                        {i.product.kind === "cube" ? (lang === "ar" ? "مكعب" : "Cube") : t.store.sheetTitle} · {i.product.size}cm
                      </div>
                      <div className="text-[11px] text-foreground/55">{i.product.price} {t.common.sar}</div>
                    </div>
                    <input
                      type="number"
                      min={1}
                      value={i.qty}
                      onChange={(e) => setQty(i.product.id, +e.target.value)}
                      className="w-14 px-2 py-1 rounded-md bg-white/5 border border-[color:var(--card-border)] text-sm text-center"
                    />
                    <button onClick={() => remove(i.product.id)} className="text-foreground/55 hover:text-destructive transition">
                      <Trash2 className="w-4 h-4" />
                    </button>
                  </li>
                ))}
              </ul>
              <div className="flex justify-between font-display text-xl">
                <span>{t.studio.total}</span>
                <span className="text-green-100">{total} {t.common.sar}</span>
              </div>
            </aside>
          </div>
        )}
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
