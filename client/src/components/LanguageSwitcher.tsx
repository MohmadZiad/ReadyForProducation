import { useLanguage } from "@/lib/language-context";
import { motion } from "framer-motion";
import { Languages } from "lucide-react";

export default function LanguageSwitcher() {
  const { language, setLanguage } = useLanguage();

  return (
    <button
      onClick={() => setLanguage(language === "en" ? "ar" : "en")}
      className="relative flex items-center gap-2 px-4 py-2 rounded-2xl bg-orange-50 dark:bg-orange-900/20 text-orange-900 dark:text-orange-100 hover-elevate active-elevate-2 transition-colors duration-200"
      aria-label="Switch language"
      data-testid="button-language-toggle"
    >
      <Languages className="w-4 h-4" />
      <motion.span
        key={language}
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        exit={{ opacity: 0, y: 10 }}
        transition={{ duration: 0.2 }}
        className="font-medium text-sm"
      >
        {language.toUpperCase()}
      </motion.span>
    </button>
  );
}
