import * as React from "react";
import { AnimatePresence, motion } from "framer-motion";
import { Sparkles } from "lucide-react";

type Props = {
  show?: boolean;
  onComplete: () => void;
  durationMs?: number;
};

export default function SplashScreen({
  show = true,
  onComplete,
  durationMs = 2000,
}: Props) {
  React.useEffect(() => {
    if (!show) return;
    const timeout = setTimeout(() => onComplete(), durationMs);
    return () => clearTimeout(timeout);
  }, [show, durationMs, onComplete]);

  if (!show) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 z-[9999] pointer-events-auto"
      >
        <div className="absolute inset-0 bg-gradient-to-br from-neutral-950 via-neutral-900 to-neutral-900">
          <div
            className="absolute -right-20 -top-20 h-[55vw] w-[55vw] rounded-full blur-3xl opacity-30"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,140,0,.45), transparent 70%)",
            }}
          />
          <div
            className="absolute -left-28 -bottom-28 h-[60vw] w-[60vw] rounded-full blur-[120px] opacity-30"
            style={{
              background:
                "radial-gradient(closest-side, rgba(255,98,0,.35), transparent 70%)",
            }}
          />
        </div>

        <div className="relative h-full flex flex-col items-center justify-center text-center text-white px-6">
          <div className="absolute top-6 right-6">
            <span className="inline-flex items-center gap-2 rounded-xl bg-orange-500/15 text-orange-300 px-3 py-1 text-xs">
              <Sparkles className="w-4 h-4" /> Orange Tool
            </span>
          </div>

          <motion.div
            initial={{ y: 12, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ duration: 0.45 }}
            className="space-y-4"
          >
            <div className="tracking-[0.35em] text-xs text-white/60">
              ORANGE TOOL
            </div>

            <h1 className="text-4xl md:text-6xl font-extrabold">
              <span className="bg-gradient-to-r from-orange-400 to-orange-200 bg-clip-text text-transparent">
                Welcome to Orange Tool
              </span>
            </h1>

            <p className="text-white/70 max-w-2xl mx-auto">
              Precision utilities, smart pro-rata and a silky <strong>2026</strong>
              experience.
            </p>

            <div className="flex items-center justify-center gap-3 pt-2">
              <span className="relative inline-flex h-3 w-3">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-orange-400 opacity-75"></span>
                <span className="relative inline-flex rounded-full h-3 w-3 bg-orange-500"></span>
              </span>
              <span className="text-sm text-white/70">Preparing the experience…</span>
            </div>

            <div className="text-xs text-white/50">
              Fixed taxes: <span className="font-medium text-white/70">16%</span> |{" "}
              <span className="font-medium text-white/70">46.10%</span>
            </div>

            <div className="pt-4">
              <button
                onClick={onComplete}
                className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/15 text-white text-sm backdrop-blur transition"
              >
                Skip
              </button>
            </div>
          </motion.div>

          <div className="absolute bottom-6 left-6 text-[11px] text-white/60">
            Made with <span className="mx-1">🧡</span> by <span className="font-medium">Mohammad Z</span>
          </div>
        </div>
      </motion.div>
    </AnimatePresence>
  );
}
