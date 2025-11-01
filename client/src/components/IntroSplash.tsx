import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
// (اختياري) إذا بدك أيقونة:
// import { Sparkles } from "lucide-react";

type Lang = "en" | "ar";

type IntroSplashProps = {
  /** اسم المنتج للعرض */
  productName?: string;
  /** اللغة الافتراضية */
  initialLang?: Lang;
  /** إخفاء تلقائي بعد مدة (ms). ضع null لتعطيل الإخفاء التلقائي. */
  autoHideMs?: number | null;
  /** نداء عند الإغلاق (للتتبع/التحليلات) */
  onDone?: () => void;
  /** هل نعرض سويتش اللغة أعلى يمين؟ */
  showLangSwitcher?: boolean;
};

/**
 * IntroSplash (Production-Ready)
 * - يظهر مرة واحدة لكل تحميل (refresh) عبر راية window.__orangeIntroShown
 * - نسخة مبسطة وعالمية + A11y + Reduced Motion
 * - نصوص EN/AR، وتبديل RTL تلقائي
 */
export default function IntroSplash({
  productName = "Orange Tool",
  initialLang = "en",
  autoHideMs = 1800,
  onDone,
  showLangSwitcher = true,
}: IntroSplashProps) {
  // يظهر مرة واحدة فقط في كل تحميل للصفحة:
  const [show, setShow] = React.useState<boolean>(() => {
    if (typeof window === "undefined") return false;
    return !(window as any).__orangeIntroShown;
  });

  // لغة قابلة للتبديل:
  const [lang, setLang] = React.useState<Lang>(initialLang);

  // احترام "تقليل الحركة" للمتصفح:
  const prefersReducedMotion =
    typeof window !== "undefined" &&
    window.matchMedia?.("(prefers-reduced-motion: reduce)").matches;

  // إعداد الإخفاء مرة واحدة
  React.useEffect(() => {
    if (typeof window === "undefined") return;
    if ((window as any).__orangeIntroShown) {
      setShow(false);
      return;
    }
    (window as any).__orangeIntroShown = true;
    if (autoHideMs && autoHideMs > 0) {
      const id = window.setTimeout(handleClose, autoHideMs);
      return () => window.clearTimeout(id);
    }
  }, [autoHideMs]);

  // إغلاق موحد
  const handleClose = React.useCallback(() => {
    setShow(false);
    onDone?.();
  }, [onDone]);

  // دعم لوحة المفاتيح
  React.useEffect(() => {
    if (!show) return;
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "Enter" || e.key === " ") handleClose();
      if (e.key === "Escape") handleClose();
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [show, handleClose]);

  const t = translate(lang, productName);

  // حركات أخف لو Reduced Motion
  const fade = prefersReducedMotion
    ? {}
    : {
        initial: { opacity: 0 },
        animate: { opacity: 1 },
        exit: { opacity: 0 },
      };

  const slide = prefersReducedMotion
    ? {}
    : {
        initial: { y: 12, opacity: 0 },
        animate: { y: 0, opacity: 1 },
        transition: { duration: 0.35 },
      };

  return (
    <AnimatePresence>
      {show && (
        <motion.div
          {...fade}
          className="fixed inset-0 z-[9999] pointer-events-auto"
          role="dialog"
          aria-modal="true"
          aria-labelledby="intro-title"
          aria-describedby="intro-desc"
          dir={lang === "ar" ? "rtl" : "ltr"}
        >
          {/* الخلفية (هادئة) */}
          <div className="absolute inset-0 bg-neutral-950">
            <div
              aria-hidden
              className="absolute -right-24 -top-24 h-[55vw] w-[55vw] rounded-full blur-3xl opacity-25"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,140,0,.45), transparent 70%)",
              }}
            />
            <div
              aria-hidden
              className="absolute -left-32 -bottom-32 h-[60vw] w-[60vw] rounded-full blur-[120px] opacity-20"
              style={{
                background:
                  "radial-gradient(closest-side, rgba(255,98,0,.35), transparent 70%)",
              }}
            />
          </div>

          {/* المحتوى */}
          <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-6">
            {/* شريط علوي: سويتش اللغة */}
            {showLangSwitcher && (
              <div className="absolute top-6 right-6 flex items-center gap-3 text-sm">
                <button
                  onClick={() => setLang((p) => (p === "en" ? "ar" : "en"))}
                  className="rounded-xl bg-white/5 hover:bg-white/10 px-3 py-1 transition focus:outline-none focus:ring-2 focus:ring-white/40"
                  aria-label={
                    lang === "ar"
                      ? "Switch language to English"
                      : "تبديل اللغة إلى العربية"
                  }
                >
                  {lang === "ar" ? "EN" : "AR"}
                </button>
              </div>
            )}

            <motion.div className="space-y-4 max-w-xl" {...slide}>
              {/* شارة صغيرة */}
              <div className="tracking-[0.35em] text-[11px] text-white/60">
                {productName.toUpperCase()}
              </div>

              {/* العنوان */}
              <h1
                id="intro-title"
                className="text-4xl md:text-6xl font-extrabold"
              >
                <span className="bg-gradient-to-r from-orange-400 to-orange-200 bg-clip-text text-transparent">
                  {t.title}
                </span>
              </h1>

              {/* الوصف */}
              <p id="intro-desc" className="text-white/70 mx-auto">
                {t.subtitle}
              </p>

              {/* شريط تقدم خطّي (هادئ) */}
              <div className="pt-2">
                <div
                  className="h-1 w-48 mx-auto bg-white/10 rounded overflow-hidden"
                  aria-hidden
                >
                  <div
                    className={`h-1 w-1/3 rounded ${
                      prefersReducedMotion
                        ? ""
                        : "animate-[grow_1.6s_ease-in-out_infinite]"
                    }`}
                    style={{
                      background:
                        "linear-gradient(90deg, #fff 0%, #f5d0a9 100%)",
                    }}
                  />
                </div>
              </div>

              {/* الأزرار */}
              <div className="pt-4">
                <button
                  onClick={handleClose}
                  className="px-5 py-2.5 rounded-2xl bg-white text-black font-medium hover:opacity-90 focus:outline-none focus:ring-2 focus:ring-white/40 transition"
                >
                  {t.cta}
                </button>

                {/* زر تخطي ثانوي (اختياري) */}
                <button
                  onClick={handleClose}
                  className="ml-3 px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm backdrop-blur focus:outline-none focus:ring-2 focus:ring-white/30 transition"
                  aria-label={t.skipAria}
                >
                  {t.skip}
                </button>
              </div>

              {/* سياسة قصيرة */}
              <p className="text-[11px] text-white/45">{t.legal}</p>
            </motion.div>

            {/* تذييل */}
            <div className="absolute bottom-6 left-6 text-[11px] text-white/60">
              {t.madeWith}{" "}
              <span className="mx-1" aria-hidden>
                🧡
              </span>{" "}
              {t.by} <span className="font-medium">Mohammad Z</span>
            </div>
          </div>

          {/* Keyframes محلية (Tailwind-compatible) */}
          {/* Keyframes محلية */}
          <style>{`
  @keyframes grow {
    0% { width: 12%; transform: translateX(0); }
    50% { width: 80%; transform: translateX(20%); }
    100% { width: 12%; transform: translateX(0); }
  }
`}</style>
        </motion.div>
      )}
    </AnimatePresence>
  );
}

/** ترجمة بسيطة EN/AR */
function translate(lang: Lang, productName: string) {
  if (lang === "ar") {
    return {
      title: `مرحباً بك في ${productName}`,
      subtitle: "أدوات دقيقة للفرق. سريعة، خاصة، وموثوقة.",
      cta: "ابدأ",
      skip: "تخطي",
      skipAria: "تخطي المقدمة",
      legal: "بالمتابعة، أنت توافق على الشروط وسياسة الخصوصية.",
      madeWith: "صنع بحب",
      by: "بواسطة",
    };
  }
  return {
    title: `Welcome to ${productName}`,
    subtitle: "Precision tools for teams. Fast, private, and reliable.",
    cta: "Continue",
    skip: "Skip",
    skipAria: "Skip intro",
    legal: "By continuing, you agree to our Terms & Privacy.",
    madeWith: "Made with",
    by: "by",
  };
}
