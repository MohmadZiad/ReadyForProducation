import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator, Percent, FileText, Copy, Check } from "lucide-react";

import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";

import {
  computeFromFullInvoice,
  buildScriptFromFullInvoice,
  type Lang,
  fmt3,
} from "@/lib/proRata";

/* ---------------------------
 * تنظيف السكربت من ** و LRM
 * -------------------------*/
const cleanScript = (s: string) =>
  s
    .replace(/\*\*/g, "") // إزالة التغليظ الماركداون
    .replace(/\u200E/g, "") // إزالة LRM
    .replace(/\s+([،:])/g, "$1") // شيل المسافة قبل الفاصلة/النقطتين
    .replace(/\s{2,}/g, " ")
    .trim();

const fadeIn = (i = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, delay: i * 0.06 },
  },
});

function Stat({
  icon: Icon,
  label,
  value,
  testid,
}: {
  icon: any;
  label: string;
  value: React.ReactNode;
  testid?: string;
}) {
  return (
    <motion.div
      {...fadeIn()}
      className="rounded-2xl border bg-white/70 dark:bg-neutral-900/40 p-5"
    >
      <div className="flex items-center gap-3 mb-3">
        <div className="w-10 h-10 rounded-xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow">
          <Icon className="w-5 h-5 text-white" />
        </div>
        <div className="text-xs opacity-70">{label}</div>
      </div>
      <div data-testid={testid} className="text-2xl font-bold">
        {value}
      </div>
    </motion.div>
  );
}

export default function ProRataPage() {
  const { language } = useLanguage();
  const { toast } = useToast();

  const [lang, setLang] = React.useState<Lang>((language as Lang) ?? "ar");
  const [anchor, setAnchor] = React.useState<number>(15);

  // مُدخلان فقط
  const [invoice, setInvoice] = React.useState<number>(50);
  const [activation, setActivation] = React.useState<string>("2025-10-12");

  const [out, setOut] = React.useState<ReturnType<
    typeof computeFromFullInvoice
  > | null>(null);

  const [copied, setCopied] = React.useState(false);

  React.useEffect(() => setLang(language as Lang), [language]);

  const onCalc = () => {
    try {
      const r = computeFromFullInvoice(invoice, activation, anchor);
      setOut(r);
      setCopied(false);
    } catch (e) {
      toast({
        title: lang === "ar" ? "خطأ" : "Error",
        description: (e as Error).message,
        variant: "destructive",
      });
    }
  };

  const onCopy = async () => {
    if (!out) return;
    const raw = buildScriptFromFullInvoice(out, lang);
    const s = cleanScript(raw);
    await navigator.clipboard.writeText(s);
    setCopied(true);
    toast({
      title: lang === "ar" ? "تم النسخ" : "Copied",
      description:
        lang === "ar"
          ? "النص الجاهز تم نسخه إلى الحافظة."
          : "The ready script has been copied.",
    });
    setTimeout(() => setCopied(false), 1800);
  };

  return (
    <div className="min-h-screen bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10">
      <Header />

      <div className="container mx-auto px-6 pt-28 pb-16 max-w-5xl">
        {/* عنوان الصفحة */}
        <motion.div
          className="text-center mb-8"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 mb-5 shadow-xl">
            <Calculator className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            {lang === "ar" ? "حاسبة النسبة والتناسب" : "Proration Calculator"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {lang === "ar"
              ? "أدخل قيمة فاتورة هذا الشهر وتاريخ التفعيل، وسنولّد لك النص الجاهز للتوضيح."
              : "Enter this month’s invoice (net) and activation date. We’ll generate a ready-to-send explanation."}
          </p>
        </motion.div>

        {/* البطاقة الرئيسية */}
        <motion.div {...fadeIn()} transition={{ delay: 0.1 }}>
          <GlassCard className="p-6">
            {/* المدخلات */}
            <div className="grid gap-4 md:grid-cols-4">
              <label className="flex flex-col gap-1 text-sm md:col-span-2">
                <span className="opacity-70">
                  {lang === "ar"
                    ? "قيمة فاتورة هذا الشهر (صافي)"
                    : "This month's invoice (net)"}
                </span>
                <input
                  type="number"
                  value={invoice}
                  onChange={(e) => setInvoice(Number(e.target.value))}
                  onKeyDown={(e) => e.key === "Enter" && onCalc()}
                  className="rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="opacity-70">
                  {lang === "ar" ? "تاريخ التفعيل" : "Activation date"}
                </span>
                <input
                  type="date"
                  value={activation}
                  onChange={(e) => setActivation(e.target.value)}
                  onKeyDown={(e) => e.key === "Enter" && onCalc()}
                  className="rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
              </label>

              <label className="flex flex-col gap-1 text-sm">
                <span className="opacity-70">
                  {lang === "ar" ? "يوم الفوترة" : "Anchor day"}
                </span>
                <select
                  value={anchor}
                  onChange={(e) => setAnchor(Number(e.target.value))}
                  className="rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                >
                  {[5, 10, 12, 15, 20].map((d) => (
                    <option key={d} value={d}>
                      {lang === "ar" ? `${d} يوم` : `${d}th`}
                    </option>
                  ))}
                </select>
              </label>
            </div>

            {/* الأزرار */}
            <div className="flex flex-wrap gap-3 mt-5">
              <button
                onClick={onCalc}
                className="px-6 py-3 rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-white font-medium shadow hover:-translate-y-0.5 active:translate-y-0 transition-all"
              >
                {lang === "ar" ? "احسب" : "Calculate"}
              </button>

              <button
                onClick={onCopy}
                disabled={!out}
                className="px-6 py-3 rounded-2xl border-2 border-orange-300/70 bg-white/70 dark:bg-neutral-900/40 hover:bg-white text-orange-600 hover:text-orange-700 disabled:opacity-50 transition-all flex items-center gap-2"
              >
                {copied ? (
                  <>
                    <Check className="w-5 h-5" />
                    {lang === "ar" ? "تم النسخ" : "Copied"}
                  </>
                ) : (
                  <>
                    <Copy className="w-5 h-5" />
                    {lang === "ar" ? "نسخ النص" : "Copy script"}
                  </>
                )}
              </button>
            </div>

            {/* النتائج */}
            <AnimatePresence mode="popLayout">
              {out && (
                <motion.div
                  key="out"
                  initial={{ opacity: 0, y: 6 }}
                  animate={{ opacity: 1, y: 0 }}
                  exit={{ opacity: 0 }}
                  className="mt-6 grid gap-4 md:grid-cols-3"
                >
                  <Stat
                    icon={Percent}
                    label={lang === "ar" ? "نسبة الأيام" : "Days ratio"}
                    value={`${(out.ratio * 100).toFixed(2)}%`}
                    testid="ratio"
                  />
                  <Stat
                    icon={FileText}
                    label={
                      lang === "ar" ? "قيمة النسبة والتناسب" : "Proration value"
                    }
                    value={`JD ${fmt3(out.proAmountNet)}`}
                    testid="proration"
                  />
                  <Stat
                    icon={Calculator}
                    label={
                      lang === "ar" ? "الاشتراك الشهري المعتاد" : "Base monthly"
                    }
                    value={`JD ${fmt3(out.monthlyNet)}`}
                    testid="monthly"
                  />

                  {/* النص الجاهز */}
                  <motion.div {...fadeIn(1)} className="md:col-span-3">
                    <div className="text-sm opacity-70 mb-2">
                      {lang === "ar" ? "النص الجاهز" : "Ready-to-send script"}
                    </div>
                    <div className="relative">
                      <pre className="whitespace-pre-wrap text-sm bg-white/80 dark:bg-neutral-900/40 p-4 rounded-2xl border">
                        {cleanScript(buildScriptFromFullInvoice(out, lang))}
                      </pre>
                      <button
                        onClick={onCopy}
                        disabled={!out}
                        className="absolute -top-3 -end-3 rounded-xl bg-gradient-to-r from-orange-500 to-orange-400 text-white shadow px-3 py-2 text-xs flex items-center gap-1 disabled:opacity-50"
                        aria-label="copy-script"
                      >
                        {copied ? (
                          <Check className="w-4 h-4" />
                        ) : (
                          <Copy className="w-4 h-4" />
                        )}
                        {copied
                          ? lang === "ar"
                            ? "نُسخ"
                            : "Copied"
                          : lang === "ar"
                          ? "نسخ"
                          : "Copy"}
                      </button>
                    </div>
                  </motion.div>
                </motion.div>
              )}
            </AnimatePresence>
          </GlassCard>
        </motion.div>
      </div>
    </div>
  );
}
