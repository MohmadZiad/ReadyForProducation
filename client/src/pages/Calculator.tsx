// client/src/pages/Calculator.tsx
import * as React from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Calculator as CalcIcon, Copy, Check, Keyboard } from "lucide-react";
import Header from "@/components/Header";
import GlassCard from "@/components/GlassCard";
import { useLanguage } from "@/lib/language-context";
import { useToast } from "@/hooks/use-toast";
import {
  buildAllLines,
  fmt2Locale,
  lineToClipboardText,
  VOICE_RATE,
} from "@/lib/calc";

const fade = (i = 0) => ({
  initial: { opacity: 0, y: 16, scale: 0.98 },
  animate: {
    opacity: 1,
    y: 0,
    scale: 1,
    transition: { duration: 0.35, delay: i * 0.06 },
  },
});

function StatCard({
  title,
  net,
  vat,
  gross,
  after,
  onCopy,
  copied,
  lang,
}: {
  title: string;
  net: number;
  vat: number;
  gross: number;
  after: number;
  onCopy: () => void;
  copied: boolean;
  lang: "ar" | "en";
}) {
  return (
    <motion.div
      {...fade()}
      className="rounded-2xl border bg-white/70 dark:bg-neutral-900/40 p-5"
    >
      <div className="flex items-center justify-between mb-3">
        <div className="text-sm font-semibold">{title}</div>
        <button
          onClick={onCopy}
          className="inline-flex items-center gap-1 text-xs rounded-lg px-2 py-1 bg-orange-50 text-orange-600 hover:bg-orange-100 dark:bg-orange-900/20"
          title={
            copied
              ? lang === "ar"
                ? "نُسخ"
                : "Copied"
              : lang === "ar"
              ? "نسخ"
              : "Copy"
          }
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

      <div className="grid grid-cols-2 gap-3 text-sm">
        <div className="p-3 rounded-xl bg-background border">
          <div className="opacity-60 text-xs mb-1">
            {lang === "ar" ? "الصافي" : "Net"}
          </div>
          <div className="font-semibold num">JD {fmt2Locale(net, lang)}</div>
        </div>
        <div className="p-3 rounded-xl bg-background border">
          <div className="opacity-60 text-xs mb-1">
            {lang === "ar" ? "الضريبة" : "VAT"}
          </div>
          <div className="font-semibold num">JD {fmt2Locale(vat, lang)}</div>
        </div>
        <div className="p-3 rounded-xl bg-background border">
          <div className="opacity-60 text-xs mb-1">
            {lang === "ar" ? "الإجمالي" : "Total"}
          </div>
          <div className="font-semibold num">JD {fmt2Locale(gross, lang)}</div>
        </div>
        <div className="p-3 rounded-xl bg-background border">
          <div className="opacity-60 text-xs mb-1">
            {lang === "ar" ? "بعد الإضافة" : "After addon"}
          </div>
          <div className="font-semibold num">JD {fmt2Locale(after, lang)}</div>
        </div>
      </div>
    </motion.div>
  );
}

/** Number Pad بسيطة */
function NumberPad({
  initial,
  onClose,
  onApply,
  lang,
}: {
  initial: number;
  onClose: () => void;
  onApply: (v: number) => void;
  lang: "ar" | "en";
}) {
  const [raw, setRaw] = React.useState<string>(String(initial ?? 0));
  const press = (c: string) =>
    setRaw((s) =>
      c === "C"
        ? "0"
        : c === "←"
        ? s.length > 1
          ? s.slice(0, -1)
          : "0"
        : s === "0" && c !== "."
        ? c
        : s + c
    );
  return (
    <div
      className="fixed inset-0 z-50 bg-black/30 flex items-end md:items-center md:justify-center p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-sm rounded-2xl bg-white dark:bg-neutral-900 border p-4"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="mb-3 text-sm opacity-70">
          {lang === "ar" ? "آلة الأرقام" : "Number Pad"}
        </div>
        <input
          value={raw}
          readOnly
          className="w-full text-2xl font-mono p-3 rounded-xl border bg-background mb-3 text-end"
        />
        <div className="grid grid-cols-3 gap-2">
          {["7", "8", "9", "4", "5", "6", "1", "2", "3", ".", "0", "←"].map(
            (k) => (
              <button
                key={k}
                onClick={() => press(k)}
                className="py-3 rounded-xl border bg-background hover:bg-white"
              >
                {k}
              </button>
            )
          )}
          <button
            onClick={() => press("C")}
            className="col-span-1 py-3 rounded-xl border bg-rose-50 text-rose-600"
          >
            C
          </button>
          <button
            onClick={() => onApply(parseFloat(raw) || 0)}
            className="col-span-2 py-3 rounded-xl border bg-gradient-to-r from-orange-500 to-orange-400 text-white"
          >
            {lang === "ar" ? "اعتماد" : "Apply"}
          </button>
        </div>
      </div>
    </div>
  );
}

export default function Calculator() {
  const { language } = useLanguage();
  const lang = (language ?? "ar") as "ar" | "en";
  const { toast } = useToast();

  // القيم الافتراضية
  const [A, setA] = React.useState<number>(0);
  const VAT_FIXED = 16; // ثابت 16%
  const [addon, setAddon] = React.useState<number>(0);

  const [padOpen, setPadOpen] = React.useState<null | ("A" | "addon")>(null);
  const [copiedKey, setCopiedKey] = React.useState<string | null>(null);

  const lines = React.useMemo(
    () => buildAllLines(A, 0.16, addon || 0),
    [A, addon]
  );

  const doCopy = (key: "A" | "Nos" | "Voice" | "Data") => {
    const map = {
      A: { ...lines.A, title: "الأساسي (A)" },
      Nos: { ...lines.Nos, title: "Nos + b + Nos" },
      Voice: { ...lines.Voice, title: "المكالمات الصوتية فقط" },
      Data: { ...lines.Data, title: "البيانات فقط" },
    } as const;
    navigator.clipboard.writeText(lineToClipboardText(map[key])).then(() => {
      setCopiedKey(key);
      toast({ title: lang === "ar" ? "تم النسخ" : "Copied" });
      setTimeout(() => setCopiedKey(null), 1500);
    });
  };

  return (
    <div
      className={`min-h-screen bg-gradient-to-b from-background to-orange-50/30 dark:to-orange-950/10 ${
        lang === "en" ? "ltr" : "rtl"
      }`}
    >
      <Header />
      <div className="container mx-auto px-6 pt-28 pb-16 max-w-6xl">
        <motion.div
          className="text-center mb-10"
          initial={{ opacity: 0, y: 14 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.35 }}
        >
          <div className="inline-flex items-center justify-center w-20 h-20 rounded-3xl bg-gradient-to-br from-orange-500 to-orange-400 mb-5 shadow-xl">
            <CalcIcon className="w-10 h-10 text-white" />
          </div>
          <h1 className="text-4xl font-heading font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            {lang === "ar" ? "حاسبة السعر الأساسية" : "Base Pricing Calculator"}
          </h1>
          <p className="text-muted-foreground mt-2">
            {lang === "ar"
              ? "أدخل السعر الأساسي (A). الضريبة ثابتة 16%، وضريبة الصوت 46.16%. يمكنك إضافة مبلغ ثابت اختياري."
              : "Enter base A. VAT is fixed at 16%, Voice uplift is 46.16%. Optional fixed addon."}
          </p>
        </motion.div>

        {/* المدخلات */}
        <GlassCard className="p-6 mb-6">
          <div className="grid gap-4 md:grid-cols-3">
            {/* A */}
            <label className="flex flex-col gap-1 text-sm">
              <span className="opacity-70">
                {lang === "ar" ? "السعر الأساسي A (صافي)" : "Base A (net)"}
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={A}
                  onChange={(e) => setA(Number(e.target.value))}
                  className="flex-1 rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setPadOpen("A")}
                  className="px-3 rounded-xl border bg-background hover:bg-white"
                >
                  <Keyboard className="w-5 h-5" />
                </button>
              </div>
            </label>

            {/* VAT fixed + Voice fixed badges */}
            <div className="flex flex-col gap-1 text-sm">
              <span className="opacity-70">
                {lang === "ar" ? "الثوابت" : "Fixed rates"}
              </span>
              <div className="flex flex-wrap items-center gap-2">
                <span className="px-3 py-2 rounded-2xl border bg-muted/60 text-muted-foreground cursor-not-allowed">
                  {lang === "ar" ? "VAT" : "VAT"}&nbsp;{VAT_FIXED}%
                </span>
                <span className="px-3 py-2 rounded-2xl border bg-muted/60 text-muted-foreground cursor-not-allowed">
                  {lang === "ar" ? "Voice" : "Voice"}&nbsp;
                  {(VOICE_RATE * 100).toFixed(2)}%
                </span>
              </div>
            </div>

            {/* Addon */}
            <label className="flex flex-col gap-1 text-sm">
              <span className="opacity-70">
                {lang === "ar" ? "إضافة ثابتة (اختياري)" : "Fixed Addon"}
              </span>
              <div className="flex gap-2">
                <input
                  type="number"
                  inputMode="decimal"
                  step="any"
                  value={addon}
                  onChange={(e) => setAddon(Number(e.target.value))}
                  className="flex-1 rounded-2xl border-2 px-4 py-3 bg-background focus:border-orange-500 focus:ring-2 focus:ring-orange-500/20 outline-none transition-all"
                />
                <button
                  type="button"
                  onClick={() => setPadOpen("addon")}
                  className="px-3 rounded-xl border bg-background hover:bg-white"
                >
                  <Keyboard className="w-5 h-5" />
                </button>
              </div>
            </label>
          </div>
        </GlassCard>

        {/* النتائج */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          <StatCard
            title={lang === "ar" ? "الأساسي (A)" : "Base (A)"}
            net={lines.A.net}
            vat={lines.A.vat}
            gross={lines.A.gross}
            after={lines.A.afterAddon}
            onCopy={() => doCopy("A")}
            copied={copiedKey === "A"}
            lang={lang}
          />
          <StatCard
            title="Nos + b + Nos"
            net={lines.Nos.net}
            vat={lines.Nos.vat}
            gross={lines.Nos.gross}
            after={lines.Nos.afterAddon}
            onCopy={() => doCopy("Nos")}
            copied={copiedKey === "Nos"}
            lang={lang}
          />
          <StatCard
            title={lang === "ar" ? "المكالمات الصوتية فقط" : "Voice only"}
            net={lines.Voice.net}
            vat={lines.Voice.vat}
            gross={lines.Voice.gross}
            after={lines.Voice.afterAddon}
            onCopy={() => doCopy("Voice")}
            copied={copiedKey === "Voice"}
            lang={lang}
          />
          <StatCard
            title={lang === "ar" ? "البيانات فقط" : "Data only"}
            net={lines.Data.net}
            vat={lines.Data.vat}
            gross={lines.Data.gross}
            after={lines.Data.afterAddon}
            onCopy={() => doCopy("Data")}
            copied={copiedKey === "Data"}
            lang={lang}
          />
        </div>
      </div>

      {/* Number Pad */}
      <AnimatePresence>
        {padOpen && (
          <NumberPad
            initial={padOpen === "A" ? A : addon}
            onClose={() => setPadOpen(null)}
            onApply={(v) => {
              padOpen === "A" ? setA(v) : setAddon(v);
              setPadOpen(null);
            }}
            lang={lang}
          />
        )}
      </AnimatePresence>
    </div>
  );
}
