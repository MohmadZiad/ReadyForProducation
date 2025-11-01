import { Moon, Sun } from "lucide-react";
import { useTheme } from "@/lib/theme";
import { motion } from "framer-motion";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className="relative w-14 h-8 rounded-full bg-orange-100 dark:bg-orange-900/30 transition-colors duration-200 hover-elevate active-elevate-2"
      aria-label="Toggle theme"
      data-testid="button-theme-toggle"
    >
      <motion.div
        className="absolute top-1 left-1 w-6 h-6 rounded-full bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-md"
        animate={{
          x: theme === "dark" ? 24 : 0,
        }}
        transition={{ type: "spring", stiffness: 500, damping: 30 }}
      >
        {theme === "light" ? (
          <Sun className="w-4 h-4 text-white" />
        ) : (
          <Moon className="w-4 h-4 text-white" />
        )}
      </motion.div>
    </button>
  );
}
