import { motion, type HTMLMotionProps } from "framer-motion";
import { type ReactNode } from "react";

interface GradientButtonProps extends Omit<HTMLMotionProps<"button">, "children"> {
  children: ReactNode;
  variant?: "primary" | "secondary";
}

export default function GradientButton({ 
  children, 
  variant = "primary",
  className = "",
  ...props 
}: GradientButtonProps) {
  if (variant === "secondary") {
    return (
      <motion.button
        className={`
          relative px-5 py-2.5 rounded-2xl font-medium text-sm
          border-2 border-orange-500 text-orange-500
          bg-transparent backdrop-blur-sm
          transition-all duration-180
          hover:-translate-y-0.5 active:translate-y-0
          ${className}
        `}
        whileHover={{ boxShadow: "0 4px 16px rgba(255,122,26,0.3)" }}
        whileTap={{ scale: 0.98 }}
        {...props}
      >
        {children}
      </motion.button>
    );
  }

  return (
    <motion.button
      className={`
        relative px-5 py-2.5 rounded-2xl font-medium text-sm
        text-white
        bg-gradient-to-r from-orange-500 to-orange-400
        transition-all duration-180
        hover:-translate-y-0.5 active:translate-y-0
        overflow-hidden
        ${className}
      `}
      style={{
        boxShadow: "0 4px 12px rgba(255,122,26,0.4)",
      }}
      whileHover={{
        boxShadow: "0 6px 20px rgba(255,122,26,0.5)",
      }}
      whileTap={{ scale: 0.98 }}
      {...props}
    >
      {/* Shine effect */}
      <motion.div
        className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent"
        initial={{ x: "-100%" }}
        whileHover={{
          x: "100%",
          transition: { duration: 0.6, ease: "easeInOut" },
        }}
      />
      <span className="relative z-10">{children}</span>
    </motion.button>
  );
}
