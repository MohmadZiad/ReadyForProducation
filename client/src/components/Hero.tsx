import { motion, useReducedMotion, useScroll, useTransform } from "framer-motion";
import { useRef } from "react";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import GradientButton from "./GradientButton";
import { Sparkles, Zap } from "lucide-react";

const PARTICLE_CONFIG = [
  { left: 12, top: 18, delay: 0, duration: 3.5 },
  { left: 24, top: 62, delay: 0.6, duration: 4.2 },
  { left: 38, top: 28, delay: 1.1, duration: 3.8 },
  { left: 52, top: 12, delay: 0.3, duration: 4.6 },
  { left: 68, top: 22, delay: 1.4, duration: 3.4 },
  { left: 80, top: 40, delay: 0.2, duration: 4.9 },
  { left: 70, top: 68, delay: 1.2, duration: 3.7 },
  { left: 55, top: 74, delay: 0.9, duration: 4.1 },
  { left: 35, top: 70, delay: 0.5, duration: 3.6 },
  { left: 18, top: 48, delay: 1.5, duration: 4.3 },
  { left: 10, top: 32, delay: 0.7, duration: 4.7 },
  { left: 88, top: 58, delay: 1.7, duration: 3.9 },
  { left: 60, top: 50, delay: 0.1, duration: 4.4 },
  { left: 46, top: 44, delay: 1, duration: 3.3 },
  { left: 28, top: 14, delay: 1.8, duration: 4.8 },
];

export default function Hero() {
  const { t } = useLanguage();
  const ref = useRef<HTMLDivElement>(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"],
  });
  const prefersReducedMotion = useReducedMotion();

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "30%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <div ref={ref} className="relative min-h-screen flex items-center justify-center overflow-hidden pt-20">
      {/* Animated gradient background */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-br from-orange-500 via-orange-400 to-orange-100 dark:from-orange-600 dark:via-orange-500 dark:to-orange-300"
        style={{ opacity }}
      />

      {/* Radial glow overlay */}
      <div
        className="absolute inset-0 pointer-events-none"
        style={{
          background: "radial-gradient(60% 60% at 50% 50%, rgba(255,255,255,0.3), rgba(255,255,255,0) 70%)",
        }}
      />

      {/* Animated decorative elements */}
      <motion.div
        className="absolute top-1/4 left-1/4 w-64 h-64 rounded-full bg-white/10 blur-3xl"
        animate={{
          scale: [1, 1.2, 1],
          opacity: [0.3, 0.5, 0.3],
        }}
        transition={{ duration: 4, repeat: Infinity }}
        style={{ y }}
      />
      <motion.div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 rounded-full bg-white/10 blur-3xl"
        animate={{
          scale: [1.2, 1, 1.2],
          opacity: [0.4, 0.6, 0.4],
        }}
        transition={{ duration: 5, repeat: Infinity, delay: 1 }}
        style={{ y }}
      />

      {/* Floating particles */}
      {!prefersReducedMotion &&
        PARTICLE_CONFIG.map(({ left, top, delay, duration }, index) => (
          <motion.div
            key={index}
            className="absolute w-2 h-2 bg-white rounded-full opacity-40"
            style={{ left: `${left}%`, top: `${top}%` }}
            animate={{
              y: [-20, 20, -20],
              x: [-10, 10, -10],
              opacity: [0.2, 0.6, 0.2],
            }}
            transition={{
              duration,
              repeat: Infinity,
              delay,
            }}
          />
        ))}

      {/* Content */}
      <motion.div
        className="relative z-10 text-center px-6 max-w-5xl mx-auto"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.8, delay: 0.2, ease: [0.22, 1, 0.36, 1] }}
      >
        {/* Badge */}
        <motion.div
          className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white/20 backdrop-blur-sm border border-white/30 mb-8"
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          transition={{ duration: 0.6, delay: 0.4 }}
        >
          <Sparkles className="w-4 h-4 text-white" />
          <span className="text-sm font-medium text-white">Powered by Intelligence</span>
        </motion.div>

        {/* Title */}
        <motion.h1
          className="font-heading font-bold text-white mb-6"
          style={{ fontSize: "clamp(2.5rem, 8vw, 5rem)", lineHeight: 1.1 }}
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.5 }}
        >
          {t("heroTitle")}
          <br />
          <span className="relative inline-block">
            {t("heroTitleHighlight")}
            <motion.div
              className="absolute -bottom-2 left-0 right-0 h-3 bg-white/30 rounded-full"
              initial={{ scaleX: 0 }}
              animate={{ scaleX: 1 }}
              transition={{ duration: 0.8, delay: 1 }}
            />
          </span>
        </motion.h1>

        {/* Subtitle */}
        <motion.p
          className="text-xl md:text-2xl text-white/90 mb-12 max-w-3xl mx-auto leading-relaxed"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.7 }}
        >
          {t("heroSubtitle")}
        </motion.p>

        {/* CTAs */}
        <motion.div
          className="flex flex-col sm:flex-row items-center justify-center gap-4"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.8, delay: 0.9 }}
        >
          <Link href="/assistant">
            <GradientButton 
              className="bg-white text-orange-500 hover:bg-white/90 shadow-xl min-w-[200px] justify-center flex items-center gap-2"
              data-testid="button-hero-assistant"
            >
              <Zap className="w-4 h-4" />
              {t("openAssistant")}
            </GradientButton>
          </Link>
          <Link href="/calculator">
            <GradientButton 
              variant="secondary" 
              className="border-white text-white backdrop-blur-md bg-white/10 hover:bg-white/20 min-w-[200px] justify-center"
              data-testid="button-hero-calculator"
            >
              {t("launchCalculator")}
            </GradientButton>
          </Link>
        </motion.div>

        {/* Scroll indicator */}
        <motion.div
          className="absolute bottom-12 left-1/2 -translate-x-1/2"
          animate={{ y: [0, 10, 0] }}
          transition={{ duration: 2, repeat: Infinity }}
        >
          <div className="w-6 h-10 rounded-full border-2 border-white/50 flex items-start justify-center p-2">
            <motion.div
              className="w-1 h-2 bg-white rounded-full"
              animate={{ y: [0, 12, 0] }}
              transition={{ duration: 2, repeat: Infinity }}
            />
          </div>
        </motion.div>
      </motion.div>
    </div>
  );
}
