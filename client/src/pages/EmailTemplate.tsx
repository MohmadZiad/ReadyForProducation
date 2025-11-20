import * as React from "react";
import clsx from "clsx";
import { motion, AnimatePresence } from "framer-motion";
import { AlertTriangle, LayoutGrid, Loader2, Sparkles, Languages } from "lucide-react";

import Header from "@/components/Header";
import { Textarea } from "@/components/ui/textarea";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectTrigger,
  SelectValue,
  SelectContent,
  SelectItem,
} from "@/components/ui/select";
import {
  useSmartEmailGenerator,
  toneOptions,
  templateOptions,
  type OutputMode,
  type ToneValue,
  type TemplateValue,
} from "@/hooks/useSmartEmailGenerator";
import { useLanguage } from "@/lib/language-context";
import { translations, type Language } from "@/lib/i18n";

const toneLabelMap: Record<ToneValue, Record<Language, string>> = {
  veryFormal: {
    en: "Very Formal",
    ar: "رسمي للغاية",
  },
  professional: {
    en: "Professional & Friendly",
    ar: "مهني وودود",
  },
  direct: {
    en: "Short & Direct",
    ar: "قصير ومباشر",
  },
};

const templateLabelMap: Record<TemplateValue, Record<Language, string>> = {
  escalation: {
    en: "Escalation to Technical Team",
    ar: "تصعيد إلى الفريق التقني",
  },
  request: {
    en: "Request for More Info",
    ar: "طلب معلومات إضافية",
  },
  followUp: {
    en: "Follow-up on Previous Case",
    ar: "متابعة حالة سابقة",
  },
  refund: {
    en: "Refund / Compensation Request",
    ar: "طلب استرداد / تعويض",
  },
};

export default function EmailTemplatePage() {
  const { language } = useLanguage();
  const emailConsoleCopy = translations[language].emailConsole;
  const isRTL = language === "ar";
  const {
    notes,
    setNotes,
    detectedLanguage,
    outputMode,
    setOutputMode,
    tone,
    setTone,
    templateKey,
    applyTemplatePreview,
    result,
    generateEmail,
    isGenerating,
    needsContactNumber,
    contactNumber,
    customerData,
  } = useSmartEmailGenerator();

  const outputModes: { value: OutputMode; label: string; accent: string }[] = [
    { value: "en", label: emailConsoleCopy.outputModes.en, accent: "from-orange-500 to-orange-400" },
    { value: "ar", label: emailConsoleCopy.outputModes.ar, accent: "from-[#ff7f32] to-[#f75590]" },
    { value: "bi", label: emailConsoleCopy.outputModes.bi, accent: "from-slate-900 to-slate-700" },
  ];

  const renderEmailCard = (lang: "en" | "ar") => {
    const copy = result?.[lang];
    const alignClass = lang === "ar" ? "text-right" : "text-left";
    return (
      <motion.div
        layout
        dir={lang === "ar" ? "rtl" : "ltr"}
        className="rounded-3xl border border-orange-100/60 bg-white/80 p-5 text-slate-900 shadow-xl backdrop-blur-md dark:border-white/10 dark:bg-white/5 dark:text-white"
      >
        <p
          className={clsx(
            "flex items-center gap-2 text-xs font-semibold uppercase tracking-[0.35em] text-orange-500 dark:text-orange-200",
            lang === "ar" && "flex-row-reverse"
          )}
        >
          <span className="inline-flex h-2 w-2 rounded-full bg-orange-500 animate-pulse" />
          {emailConsoleCopy.cardTitles[lang]}
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <p className={clsx("text-[11px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500", alignClass)}>
              {emailConsoleCopy.subjectLabel}
            </p>
            <p className={clsx("mt-1 text-lg font-semibold text-slate-900 dark:text-white", alignClass)}>
              {copy?.subject ?? emailConsoleCopy.awaitingSubject}
            </p>
          </div>
          <div>
            <p className={clsx("text-[11px] uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500", alignClass)}>
              {emailConsoleCopy.bodyLabel}
            </p>
            <p className={clsx("mt-2 text-sm leading-6 text-slate-600 whitespace-pre-line dark:text-slate-200", alignClass)}>
              {copy?.body ?? emailConsoleCopy.emptyPreview}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  const showBilingualStack = outputMode === "bi";
  const detectedLabel = emailConsoleCopy.detected[detectedLanguage] ?? emailConsoleCopy.detected.unknown;

  const intelBadges: { label: string; value?: string }[] = [
    { label: emailConsoleCopy.intelLabels.customer, value: customerData?.name },
    { label: emailConsoleCopy.intelLabels.ticket, value: customerData?.ticketId },
    { label: emailConsoleCopy.intelLabels.subscription, value: customerData?.subscriptionNumber },
    { label: emailConsoleCopy.intelLabels.contact, value: contactNumber },
  ];

  const actionDisabled = !notes.trim() || isGenerating;
  const contactCapturedSegments = React.useMemo(
    () => emailConsoleCopy.contactCaptured.split("{{value}}"),
    [emailConsoleCopy.contactCaptured]
  );

  return (
    <div className="min-h-screen bg-gradient-to-br from-orange-50 via-white to-white text-slate-900 transition-colors dark:from-slate-950 dark:via-slate-900 dark:to-slate-950 dark:text-white">
      <Header />
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-orange-100 bg-white/80 px-4 py-2 text-xs font-semibold uppercase tracking-[0.4em] text-orange-500 dark:border-white/10 dark:bg-white/10 dark:text-orange-200">
            <LayoutGrid className="h-4 w-4" />
            {emailConsoleCopy.heroBadge}
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-slate-900 dark:text-white">
            {emailConsoleCopy.heroTitle}
          </h1>
          <p className="mt-3 text-base text-slate-500 dark:text-slate-300">{emailConsoleCopy.heroSubtitle}</p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <motion.div
              layout
              className="relative overflow-hidden rounded-[32px] border border-orange-100 bg-white/90 p-6 shadow-[0_30px_90px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-60"
                style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,153,0,0.25), transparent 45%)" }}
              />
              <div className="relative space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-orange-500 dark:text-orange-200">
                      {emailConsoleCopy.inputDetectedLabel}
                    </p>
                    <p className="text-lg font-semibold">{detectedLabel}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-orange-100 bg-white/80 px-4 py-2 text-xs text-slate-500 dark:border-white/10 dark:bg-black/30 dark:text-slate-200">
                    <Languages className="h-4 w-4 text-orange-500" />
                    {emailConsoleCopy.autoDetect}
                  </div>
                </div>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder={emailConsoleCopy.notesPlaceholder}
                  dir={isRTL ? "rtl" : "ltr"}
                  className="min-h-[240px] rounded-[24px] border border-orange-100 bg-white/90 text-base text-slate-900 shadow-inner focus-visible:ring-2 focus-visible:ring-orange-400 dark:border-white/10 dark:bg-black/30 dark:text-slate-100"
                />
                {needsContactNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl border border-amber-200 bg-amber-50/80 px-4 py-3 text-sm text-amber-900 shadow-[0_0_25px_rgba(251,191,36,0.35)] dark:border-amber-400/40 dark:bg-amber-500/10 dark:text-amber-100"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-500" />
                    {emailConsoleCopy.missingContact}
                  </motion.div>
                )}

                <div className="grid gap-3 sm:grid-cols-2">
                  {intelBadges.map((badge) => (
                    <div
                      key={badge.label}
                      className={clsx(
                        "rounded-2xl border px-4 py-3 text-sm transition-colors",
                        badge.value
                          ? "border-orange-200 bg-orange-50/80 text-slate-900 dark:border-orange-400/40 dark:bg-orange-400/10 dark:text-orange-50"
                          : "border-slate-100 bg-white/70 text-slate-400 dark:border-white/10 dark:bg-white/5 dark:text-slate-500",
                        isRTL && "text-right"
                      )}
                    >
                      <p className="text-[11px] uppercase tracking-[0.3em]">{badge.label}</p>
                      <p className="mt-1 font-semibold">{badge.value ?? emailConsoleCopy.addDetail}</p>
                    </div>
                  ))}
                </div>
              </div>
            </motion.div>

            <motion.div
              layout
              className="rounded-[28px] border border-orange-100 bg-white/90 p-5 shadow-[0_20px_70px_rgba(15,23,42,0.08)] backdrop-blur-xl dark:border-white/10 dark:bg-white/5"
            >
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                    {emailConsoleCopy.smartControlsTitle}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {emailConsoleCopy.toneTemplatesTitle}
                  </p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                      {emailConsoleCopy.toneLabel}
                    </label>
                    <Select value={tone} onValueChange={(value) => setTone(value as ToneValue)}>
                      <SelectTrigger
                        className={clsx(
                          "h-12 rounded-2xl border border-orange-100 bg-white/80 text-slate-900 dark:border-white/15 dark:bg-black/30 dark:text-slate-100",
                          isRTL && "text-right"
                        )}
                      >
                        <SelectValue placeholder={emailConsoleCopy.tonePlaceholder} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-orange-100 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                        {toneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {toneLabelMap[option.value][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-slate-400 dark:text-slate-500">
                      {emailConsoleCopy.templateLabel}
                    </label>
                    <Select value={templateKey} onValueChange={(value) => applyTemplatePreview(value as TemplateValue)}>
                      <SelectTrigger
                        className={clsx(
                          "h-12 rounded-2xl border border-orange-100 bg-white/80 text-slate-900 dark:border-white/15 dark:bg-black/30 dark:text-slate-100",
                          isRTL && "text-right"
                        )}
                      >
                        <SelectValue placeholder={emailConsoleCopy.templatePlaceholder} />
                      </SelectTrigger>
                      <SelectContent className="rounded-2xl border border-orange-100 bg-white text-slate-900 dark:border-white/10 dark:bg-slate-900 dark:text-white">
                        {templateOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {templateLabelMap[option.value][language]}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => generateEmail("en")}
                    disabled={actionDisabled}
                    className="rounded-2xl bg-gradient-to-r from-orange-500 to-orange-400 text-sm text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : emailConsoleCopy.actions.english}
                  </Button>
                  {(detectedLanguage === "ar" || detectedLanguage === "mixed") && (
                    <Button
                      onClick={() => generateEmail("ar")}
                      disabled={actionDisabled}
                      className="rounded-2xl bg-gradient-to-r from-[#ff7f32] to-[#f75590] text-sm text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : emailConsoleCopy.actions.arabic}
                    </Button>
                  )}
                  {(detectedLanguage === "ar" || detectedLanguage === "mixed") && (
                    <Button
                      onClick={() => generateEmail("bi")}
                      disabled={actionDisabled}
                      className="rounded-2xl bg-gradient-to-r from-slate-900 to-slate-700 text-sm text-white shadow-lg hover:shadow-xl disabled:opacity-50"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : emailConsoleCopy.actions.bilingual}
                    </Button>
                  )}
                </div>

                {contactNumber && (
                  <div className={clsx("rounded-2xl border border-emerald-200 bg-emerald-50/90 px-4 py-3 text-xs text-emerald-900 dark:border-emerald-400/40 dark:bg-emerald-500/10 dark:text-emerald-100", isRTL && "text-right")}
                  >
                    {contactCapturedSegments[0] ?? ""}
                    <span className="font-semibold mx-1">{contactNumber}</span>
                    {contactCapturedSegments[1] ?? ""}
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            layout
            className="rounded-[32px] border border-orange-100 bg-white/90 p-6 shadow-[0_25px_80px_rgba(15,23,42,0.12)] backdrop-blur-2xl dark:border-white/10 dark:bg-gradient-to-br dark:from-[#0f172a]/80 dark:to-[#111936]/40"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400 dark:text-slate-500">
                    {emailConsoleCopy.previewTitle}
                  </p>
                  <p className="text-lg font-semibold text-slate-900 dark:text-white">
                    {emailConsoleCopy.previewSubtitle}
                  </p>
                </div>
                <div className="flex flex-wrap gap-2">
                  {outputModes.map((mode) => (
                    <Button
                      key={mode.value}
                      size="sm"
                      variant={outputMode === mode.value ? "default" : "outline"}
                      onClick={() => setOutputMode(mode.value)}
                      className={`rounded-full border border-orange-100 text-xs text-slate-700 shadow-sm transition dark:border-white/10 dark:text-white ${
                        outputMode === mode.value
                          ? `bg-gradient-to-r ${mode.accent} text-white`
                          : "bg-white/70 hover:bg-orange-50 dark:bg-white/10"
                      }`}
                    >
                      {mode.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-orange-100 bg-orange-50/80 p-4 text-sm text-slate-700 dark:border-white/10 dark:bg-black/30 dark:text-slate-100">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-orange-500 dark:text-orange-200">
                  <Sparkles className="h-4 w-4 text-orange-500" />
                  {emailConsoleCopy.smartEngineLabel}
                </p>
                <p className="mt-2 text-slate-700 dark:text-slate-100">
                  {emailConsoleCopy.outputFormatLabel}: {" "}
                  <span className="font-semibold">{outputModes.find((m) => m.value === outputMode)?.label}</span>
                </p>
              </div>

              <AnimatePresence initial={false} mode="wait">
                {showBilingualStack ? (
                  <motion.div
                    key="bi"
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                    className="grid gap-4"
                  >
                    {renderEmailCard("en")}
                    {renderEmailCard("ar")}
                  </motion.div>
                ) : (
                  <motion.div
                    key={outputMode}
                    initial={{ opacity: 0, y: 12 }}
                    animate={{ opacity: 1, y: 0 }}
                    exit={{ opacity: 0, y: -12 }}
                  >
                    {outputMode === "ar" ? renderEmailCard("ar") : renderEmailCard("en")}
                  </motion.div>
                )}
              </AnimatePresence>
            </div>
          </motion.div>
        </div>
      </div>
    </div>
  );
}
