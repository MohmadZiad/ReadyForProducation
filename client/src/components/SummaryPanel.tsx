import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import GlassCard from "./GlassCard";
import { FileText, TrendingUp, Check } from "lucide-react";

export default function SummaryPanel() {
  const { t } = useLanguage();

  // Placeholder data - will be replaced with real data in integration phase
  const hasActivity = false;

  if (!hasActivity) {
    return (
      <section className="py-24 px-6">
        <div className="container mx-auto max-w-7xl">
          <motion.div
            className="text-center"
            initial={{ opacity: 0, y: 30 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
          >
            <h2 className="text-3xl md:text-4xl font-heading font-bold mb-4">
              {t("summaryTitle")}
            </h2>
            
            <GlassCard className="p-16 mt-8 max-w-2xl mx-auto">
              <div className="flex flex-col items-center gap-4">
                <div className="w-20 h-20 rounded-full bg-gradient-to-br from-orange-100 to-orange-50 dark:from-orange-900/30 dark:to-orange-800/20 flex items-center justify-center">
                  <FileText className="w-10 h-10 text-orange-400" />
                </div>
                <p className="text-lg text-muted-foreground">{t("summaryEmpty")}</p>
                <p className="text-sm text-muted-foreground/70">
                  Start using the calculator or assistant to see your activity here
                </p>
              </div>
            </GlassCard>
          </motion.div>
        </div>
      </section>
    );
  }

  // This will be shown when there's actual activity
  const activityItems = [
    { icon: FileText, title: "Calculation Completed", desc: "Complex formula calculated", time: "2m ago" },
    { icon: TrendingUp, title: "Pro-Rata Result", desc: "Monthly calculation finished", time: "15m ago" },
    { icon: Check, title: "Assistant Response", desc: "Query answered successfully", time: "1h ago" },
  ];

  return (
    <section className="py-24 px-6">
      <div className="container mx-auto max-w-7xl">
        <motion.div
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-3xl md:text-4xl font-heading font-bold mb-12 text-center">
            {t("summaryTitle")}
          </h2>

          <motion.div
            className="grid grid-cols-1 md:grid-cols-3 gap-6"
            initial="hidden"
            whileInView="visible"
            viewport={{ once: true }}
            variants={{
              visible: {
                transition: {
                  staggerChildren: 0.1,
                },
              },
            }}
          >
            {activityItems.map((item, index) => {
              const Icon = item.icon;
              return (
                <motion.div
                  key={index}
                  variants={{
                    hidden: { opacity: 0, scale: 0.95 },
                    visible: { opacity: 1, scale: 1 },
                  }}
                  transition={{ duration: 0.4 }}
                >
                  <GlassCard className="p-6">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-2xl bg-gradient-to-br from-orange-500 to-orange-400 flex items-center justify-center flex-shrink-0">
                        <Icon className="w-6 h-6 text-white" />
                      </div>
                      <div className="flex-1 min-w-0">
                        <h3 className="font-semibold text-foreground mb-1">{item.title}</h3>
                        <p className="text-sm text-muted-foreground mb-2">{item.desc}</p>
                        <p className="text-xs text-muted-foreground/70">{item.time}</p>
                      </div>
                    </div>
                  </GlassCard>
                </motion.div>
              );
            })}
          </motion.div>
        </motion.div>
      </div>
    </section>
  );
}
