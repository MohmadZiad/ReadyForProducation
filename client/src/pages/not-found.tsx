import { motion } from "framer-motion";
import { Link } from "wouter";
import { useLanguage } from "@/lib/language-context";
import GradientButton from "@/components/GradientButton";
import { Home, Search } from "lucide-react";

export default function NotFound() {
  const { t } = useLanguage();

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-orange-500 via-orange-400 to-orange-100">
      <motion.div
        className="text-center px-6"
        initial={{ opacity: 0, y: 30 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
      >
        <motion.div
          className="text-9xl font-bold text-white mb-4"
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          transition={{ duration: 0.8, delay: 0.2 }}
        >
          404
        </motion.div>
        
        <h1 className="text-4xl font-heading font-bold text-white mb-4">
          Page Not Found
        </h1>
        
        <p className="text-xl text-white/90 mb-8 max-w-md mx-auto">
          The page you're looking for doesn't exist or has been moved.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4">
          <Link href="/">
            <GradientButton 
              className="bg-white text-orange-500 hover:bg-white/90 shadow-xl min-w-[200px] justify-center flex items-center gap-2"
              data-testid="button-home"
            >
              <Home className="w-4 h-4" />
              {t("home")}
            </GradientButton>
          </Link>
          <Link href="/docs">
            <GradientButton 
              variant="secondary" 
              className="border-white text-white backdrop-blur-md bg-white/10 hover:bg-white/20 min-w-[200px] justify-center flex items-center gap-2"
              data-testid="button-docs"
            >
              <Search className="w-4 h-4" />
              {t("docs")}
            </GradientButton>
          </Link>
        </div>
      </motion.div>
    </div>
  );
}
