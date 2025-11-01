import { useEffect, useState } from "react";
import { Link, useLocation } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import ThemeToggle from "./ThemeToggle";
import LanguageSwitcher from "./LanguageSwitcher";
import GradientButton from "./GradientButton";
import { Menu, X } from "lucide-react";
import DocsButton from "./DocsButton";

export default function Header() {
  const [scrolled, setScrolled] = useState(false);
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);
  const { t, language } = useLanguage();
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { path: "/", label: t("home") },
    { path: "/calculator", label: t("calculator") },
    { path: "/pro-rata", label: t("proRata") },
    { path: "/assistant", label: t("assistant") },
    { path: "/docs", label: t("docs") },
  ];

  return (
    <motion.header
      className={`
        fixed top-0 left-0 right-0 z-40 transition-all duration-300
        ${scrolled 
          ? "bg-white/80 dark:bg-neutral-900/80 backdrop-blur-lg border-b border-white/20 dark:border-white/10" 
          : "bg-transparent"
        }
      `}
      initial={{ y: -100 }}
      animate={{ y: 0 }}
      transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
    >
      <div className="container mx-auto px-6 lg:px-8">
        <div className="flex items-center justify-between h-20">
          {/* Logo */}
          <Link href="/">
            <motion.div
              className="flex items-center gap-2 cursor-pointer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              data-testid="link-logo"
            >
              <div className="w-10 h-10 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center shadow-md">
                <span className="text-white font-bold text-xl">O</span>
              </div>
              <span className="font-heading font-bold text-xl bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                {t("logo")}
              </span>
            </motion.div>
          </Link>

          {/* Desktop Navigation */}
          <nav className="hidden lg:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  className={`
                    relative text-sm font-medium transition-colors duration-200
                    ${location === item.path 
                      ? "text-orange-500" 
                      : "text-foreground/80 hover:text-orange-500"
                    }
                  `}
                  data-testid={`link-${item.label.toLowerCase()}`}
                >
                  {item.label}
                  {location === item.path && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute -bottom-1 left-0 right-0 h-0.5 bg-orange-500 rounded-full"
                      transition={{ type: "spring", stiffness: 500, damping: 30 }}
                    />
                  )}
                </a>
              </Link>
            ))}
          </nav>

          {/* Right section */}
          <div className="flex items-center gap-4">
            <DocsButton lang={language} />
            <LanguageSwitcher />
            <ThemeToggle />
            
            <div className="hidden md:flex items-center gap-3">
              <Link href="/assistant">
                <GradientButton variant="secondary" data-testid="button-open-assistant">
                  {t("openAssistant")}
                </GradientButton>
              </Link>
              <Link href="/calculator">
                <GradientButton data-testid="button-launch-calculator">
                  {t("launchCalculator")}
                </GradientButton>
              </Link>
            </div>

            {/* Mobile menu button */}
            <button
              onClick={() => setMobileMenuOpen(!mobileMenuOpen)}
              className="lg:hidden p-2 rounded-xl hover-elevate active-elevate-2"
              aria-label="Toggle menu"
              data-testid="button-mobile-menu"
            >
              {mobileMenuOpen ? <X className="w-6 h-6" /> : <Menu className="w-6 h-6" />}
            </button>
          </div>
        </div>

        {/* Mobile Navigation */}
        <motion.div
          className="lg:hidden overflow-hidden"
          initial={false}
          animate={{
            height: mobileMenuOpen ? "auto" : 0,
            opacity: mobileMenuOpen ? 1 : 0,
          }}
          transition={{ duration: 0.3, ease: [0.22, 1, 0.36, 1] }}
        >
          <nav className="py-4 space-y-2">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <a
                  onClick={() => setMobileMenuOpen(false)}
                  className={`
                    block px-4 py-3 rounded-2xl text-sm font-medium transition-colors duration-200
                    ${location === item.path 
                      ? "bg-orange-50 dark:bg-orange-900/20 text-orange-500" 
                      : "text-foreground/80 hover:bg-orange-50/50 dark:hover:bg-orange-900/10"
                    }
                  `}
                  data-testid={`link-mobile-${item.label.toLowerCase()}`}
                >
                  {item.label}
                </a>
              </Link>
            ))}
            <div className="flex flex-col gap-2 pt-2">
              <Link href="/assistant">
                <GradientButton 
                  variant="secondary" 
                  className="w-full justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="button-mobile-open-assistant"
                >
                  {t("openAssistant")}
                </GradientButton>
              </Link>
              <Link href="/calculator">
                <GradientButton 
                  className="w-full justify-center"
                  onClick={() => setMobileMenuOpen(false)}
                  data-testid="button-mobile-launch-calculator"
                >
                  {t("launchCalculator")}
                </GradientButton>
              </Link>
            </div>
          </nav>
        </motion.div>
      </div>
    </motion.header>
  );
}
