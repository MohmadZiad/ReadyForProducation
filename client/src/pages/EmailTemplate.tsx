import * as React from "react";
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

const detectedLabels: Record<string, string> = {
  unknown: "Waiting for agent input",
  en: "Auto: English",
  ar: "Auto: Arabic",
  mixed: "Auto: Arabic + English",
};

const outputModes: { value: OutputMode; label: string; accent: string }[] = [
  { value: "en", label: "English Only", accent: "from-slate-900 to-slate-800" },
  { value: "ar", label: "Arabic Only", accent: "from-[#1b1f3a] to-[#24142b]" },
  { value: "bi", label: "Bilingual", accent: "from-orange-500/80 to-amber-400/60" },
];

const languageCardTitle: Record<"en" | "ar", string> = {
  en: "Internal email – English",
  ar: "مراسلة داخلية – العربية",
};

export default function EmailTemplatePage() {
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
  } = useSmartEmailGenerator();

  const renderEmailCard = (lang: "en" | "ar") => {
    const copy = result?.[lang];
    return (
      <motion.div
        layout
        className="rounded-3xl border border-white/10 bg-white/5 p-5 backdrop-blur-xl shadow-[0_25px_60px_rgba(15,23,42,0.35)]"
      >
        <p className="text-xs uppercase tracking-[0.35em] text-orange-200/90 flex items-center gap-2">
          <span className="inline-flex h-2 w-2 rounded-full bg-orange-400 animate-pulse" />
          {languageCardTitle[lang]}
        </p>
        <div className="mt-4 space-y-4">
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Subject</p>
            <p className="text-lg font-semibold text-white/90 mt-1">
              {copy?.subject ?? "Awaiting generation"}
            </p>
          </div>
          <div>
            <p className="text-[11px] uppercase tracking-[0.3em] text-slate-400">Body</p>
            <p className="mt-2 text-sm leading-6 text-slate-200 whitespace-pre-line">
              {copy?.body ?? "Add notes and trigger Smart Generate to preview the internal handoff."}
            </p>
          </div>
        </div>
      </motion.div>
    );
  };

  const showBilingualStack = outputMode === "bi";
  const detectedLabel = detectedLabels[detectedLanguage] ?? detectedLabels.unknown;

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-950 via-slate-900 to-[#1a1f2b] text-white">
      <Header />
      <div className="mx-auto max-w-6xl px-6 pt-24 pb-16 space-y-10">
        <motion.div
          initial={{ opacity: 0, y: 16 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
          className="text-center"
        >
          <div className="inline-flex items-center gap-3 rounded-full border border-white/10 bg-white/5 px-4 py-2 text-xs uppercase tracking-[0.4em] text-orange-200">
            <LayoutGrid className="h-4 w-4" />
            Orange Agent Dashboard
          </div>
          <h1 className="mt-6 text-4xl font-semibold leading-tight text-white">
            Email Generator · Internal Handoff Console
          </h1>
          <p className="mt-3 text-base text-slate-300">
            Craft bilingual-ready, on-brand emails for agent-to-agent collaboration with live language intelligence.
          </p>
        </motion.div>

        <div className="grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
          <div className="space-y-6">
            <motion.div
              layout
              className="relative overflow-hidden rounded-[32px] border border-white/10 bg-gradient-to-br from-white/8 via-white/3 to-white/5 p-6 backdrop-blur-2xl"
            >
              <div
                className="pointer-events-none absolute inset-0 opacity-30"
                style={{ backgroundImage: "radial-gradient(circle at 20% 20%, rgba(255,255,255,0.35), transparent 45%)" }}
              />
              <div className="relative space-y-4">
                <div className="flex flex-wrap items-center justify-between gap-4">
                  <div>
                    <p className="text-xs uppercase tracking-[0.35em] text-orange-200">Input Detected</p>
                    <p className="text-lg font-semibold text-white">{detectedLabel}</p>
                  </div>
                  <div className="flex items-center gap-2 rounded-full border border-white/10 bg-black/20 px-4 py-2 text-xs text-slate-300">
                    <Languages className="h-4 w-4 text-orange-300" />
                    Auto-detect active
                  </div>
                </div>
                <Textarea
                  value={notes}
                  onChange={(event) => setNotes(event.target.value)}
                  placeholder="Drop field notes, agent comments, investigation summaries..."
                  className="min-h-[240px] rounded-[24px] border border-white/10 bg-black/30 text-base text-slate-100 focus-visible:ring-2 focus-visible:ring-orange-400"
                />
                {needsContactNumber && (
                  <motion.div
                    initial={{ opacity: 0, y: 8 }}
                    animate={{ opacity: 1, y: 0 }}
                    className="flex items-center gap-3 rounded-2xl border border-amber-400/40 bg-amber-500/10 px-4 py-3 text-sm text-amber-100 shadow-[0_0_25px_rgba(251,191,36,0.35)]"
                  >
                    <AlertTriangle className="h-4 w-4 text-amber-300" />
                    ⚠️ Missing Contact Number. Add a reachable number for callback-related requests.
                  </motion.div>
                )}
              </div>
            </motion.div>

            <motion.div
              layout
              className="rounded-[28px] border border-white/10 bg-white/5 p-5 backdrop-blur-2xl"
            >
              <div className="flex flex-col gap-6">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-300">Smart Controls</p>
                  <p className="text-lg font-semibold">Tone & Templates</p>
                </div>
                <div className="grid gap-4 md:grid-cols-2">
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Tone & Style</label>
                    <Select value={tone} onValueChange={(value) => setTone(value as ToneValue)}>
                      <SelectTrigger className="h-12 rounded-2xl border border-white/15 bg-black/30 text-slate-100">
                        <SelectValue placeholder="Select tone" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-slate-100">
                        {toneOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="space-y-2">
                    <label className="text-xs uppercase tracking-[0.3em] text-slate-400">Template Library</label>
                    <Select value={templateKey} onValueChange={(value) => applyTemplatePreview(value as TemplateValue)}>
                      <SelectTrigger className="h-12 rounded-2xl border border-white/15 bg-black/30 text-slate-100">
                        <SelectValue placeholder="Select template" />
                      </SelectTrigger>
                      <SelectContent className="bg-slate-900 text-slate-100">
                        {templateOptions.map((option) => (
                          <SelectItem key={option.value} value={option.value}>
                            {option.label}
                          </SelectItem>
                        ))}
                      </SelectContent>
                    </Select>
                  </div>
                </div>

                <div className="flex flex-wrap gap-3">
                  <Button
                    onClick={() => generateEmail("en")}
                    disabled={!notes.trim() || isGenerating}
                    className="rounded-2xl bg-gradient-to-r from-slate-800 to-slate-700 text-sm"
                  >
                    {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate English Email"}
                  </Button>
                  {(detectedLanguage === "ar" || detectedLanguage === "mixed") && (
                    <Button
                      onClick={() => generateEmail("ar")}
                      disabled={!notes.trim() || isGenerating}
                      className="rounded-2xl bg-gradient-to-r from-[#5a2c5f] to-[#2f1e55] text-sm"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Arabic Email"}
                    </Button>
                  )}
                  {(detectedLanguage === "ar" || detectedLanguage === "mixed") && (
                    <Button
                      onClick={() => generateEmail("bi")}
                      disabled={!notes.trim() || isGenerating}
                      className="rounded-2xl bg-gradient-to-r from-orange-500 to-amber-400 text-sm text-slate-950"
                    >
                      {isGenerating ? <Loader2 className="h-4 w-4 animate-spin" /> : "Generate Bilingual Email"}
                    </Button>
                  )}
                </div>

                {contactNumber && (
                  <div className="rounded-2xl border border-emerald-400/40 bg-emerald-500/10 px-4 py-3 text-xs text-emerald-100">
                    Contact number captured: <span className="font-semibold">{contactNumber}</span>
                  </div>
                )}
              </div>
            </motion.div>
          </div>

          <motion.div
            layout
            className="rounded-[32px] border border-white/10 bg-gradient-to-br from-[#0f172a]/80 to-[#111936]/40 p-6 backdrop-blur-3xl"
          >
            <div className="flex flex-col gap-5">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <div>
                  <p className="text-xs uppercase tracking-[0.35em] text-slate-400">Preview Intelligence</p>
                  <p className="text-lg font-semibold text-white">Internal-ready drafts</p>
                </div>
                <div className="flex gap-2">
                  {outputModes.map((mode) => (
                    <Button
                      key={mode.value}
                      size="sm"
                      variant={outputMode === mode.value ? "default" : "ghost"}
                      onClick={() => setOutputMode(mode.value)}
                      className={`rounded-full border border-white/10 bg-gradient-to-r ${
                        outputMode === mode.value ? mode.accent : "from-transparent to-transparent"
                      } text-xs`}
                    >
                      {mode.label}
                    </Button>
                  ))}
                </div>
              </div>

              <div className="rounded-[24px] border border-white/10 bg-black/20 p-4 text-sm text-slate-300">
                <p className="flex items-center gap-2 text-xs uppercase tracking-[0.35em] text-slate-400">
                  <Sparkles className="h-4 w-4 text-orange-300" />
                  Smart Language Engine
                </p>
                <p className="mt-2 text-slate-200">
                  Output Format: <span className="font-semibold">{outputModes.find((m) => m.value === outputMode)?.label}</span>
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
