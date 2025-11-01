import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

interface GlassCardProps extends Omit<HTMLMotionProps<"div">, "children"> {
  children: ReactNode;
  hover?: boolean;
}

export default function GlassCard({ children, hover = true, className = "", ...props }: GlassCardProps) {
  return (
    <motion.div
      className={`
        relative overflow-hidden rounded-3xl
        bg-white/70 dark:bg-neutral-900/50
        border border-white/20 dark:border-white/10
        backdrop-blur-xl
        ${hover ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg" : ""}
        ${className}
      `}
      style={{
        boxShadow: "0 10px 30px -15px rgba(0,0,0,0.25)",
      }}
      {...props}
    >
      {children}
    </motion.div>
  );
}
