import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import GlassCard from "./GlassCard";
import { Zap, Activity, Clock, Target } from "lucide-react";

const kpis = [
  { icon: Zap, valueKey: "kpi1Value", labelKey: "kpi1Label", titleKey: "kpi1Title", color: "from-orange-500 to-orange-400" },
  { icon: Activity, valueKey: "kpi2Value", labelKey: "kpi2Label", titleKey: "kpi2Title", color: "from-orange-400 to-orange-300" },
  { icon: Clock, valueKey: "kpi3Value", labelKey: "kpi3Label", titleKey: "kpi3Title", color: "from-orange-500 to-orange-400" },
  { icon: Target, valueKey: "kpi4Value", labelKey: "kpi4Label", titleKey: "kpi4Title", color: "from-orange-400 to-orange-300" },
];

export default function KPICards() {
  const { t } = useLanguage();

  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.1,
              },
            },
          }}
        >
          {kpis.map((kpi, index) => {
            const Icon = kpi.icon;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 30 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard 
                  className="p-8 group relative overflow-hidden"
                  data-testid={`card-kpi-${index + 1}`}
                >
                  {/* Shine effect on hover */}
                  <motion.div
                    className="absolute inset-0 bg-gradient-to-r from-transparent via-white/10 to-transparent"
                    initial={{ x: "-100%", opacity: 0 }}
                    whileHover={{
                      x: "100%",
                      opacity: 1,
                      transition: { duration: 0.6, ease: "easeInOut" },
                    }}
                  />

                  {/* Icon */}
                  <div className={`w-14 h-14 rounded-2xl bg-gradient-to-br ${kpi.color} flex items-center justify-center mb-6 shadow-lg group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-7 h-7 text-white" />
                  </div>

                  {/* Value */}
                  <div className="mb-2" data-testid={`text-kpi-${index + 1}-value`}>
                    <span className="text-4xl font-bold bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
                      {t(kpi.valueKey as any)}
                    </span>
                  </div>

                  {/* Label */}
                  <p className="text-sm font-medium text-muted-foreground mb-1" data-testid={`text-kpi-${index + 1}-label`}>
                    {t(kpi.labelKey as any)}
                  </p>

                  {/* Title */}
                  <p className="text-xs text-muted-foreground/70" data-testid={`text-kpi-${index + 1}-title`}>
                    {t(kpi.titleKey as any)}
                  </p>
                </GlassCard>
              </motion.div>
            );
          })}
        </motion.div>
      </div>
    </section>
  );
}
