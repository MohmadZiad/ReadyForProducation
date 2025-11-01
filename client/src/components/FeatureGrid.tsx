import { motion } from "framer-motion";
import { useLanguage } from "@/lib/language-context";
import GlassCard from "./GlassCard";
import { Sparkles, Calculator, BookOpen } from "lucide-react";

const features = [
  { icon: Sparkles, titleKey: "feature1Title", descKey: "feature1Description", color: "from-orange-500 to-orange-400" },
  { icon: Calculator, titleKey: "feature2Title", descKey: "feature2Description", color: "from-orange-400 to-orange-300" },
  { icon: BookOpen, titleKey: "feature3Title", descKey: "feature3Description", color: "from-orange-500 to-orange-400" },
];

export default function FeatureGrid() {
  const { t } = useLanguage();

  return (
    <section className="py-24 px-6 bg-gradient-to-b from-transparent to-orange-50/30 dark:to-orange-950/10">
      <div className="container mx-auto max-w-7xl">
        {/* Section header */}
        <motion.div
          className="text-center mb-16"
          initial={{ opacity: 0, y: 30 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
        >
          <h2 className="text-4xl md:text-5xl font-heading font-bold mb-4 bg-gradient-to-r from-orange-500 to-orange-400 bg-clip-text text-transparent">
            Powerful Features
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            Everything you need to succeed, all in one place
          </p>
        </motion.div>

        {/* Feature cards */}
        <motion.div
          className="grid grid-cols-1 md:grid-cols-3 gap-8"
          initial="hidden"
          whileInView="visible"
          viewport={{ once: true, margin: "-100px" }}
          variants={{
            visible: {
              transition: {
                staggerChildren: 0.15,
              },
            },
          }}
        >
          {features.map((feature, index) => {
            const Icon = feature.icon;
            return (
              <motion.div
                key={index}
                variants={{
                  hidden: { opacity: 0, y: 40 },
                  visible: { opacity: 1, y: 0 },
                }}
                transition={{ duration: 0.6, ease: [0.22, 1, 0.36, 1] }}
              >
                <GlassCard 
                  className="p-8 h-full group"
                  data-testid={`card-feature-${index + 1}`}
                >
                  {/* Icon */}
                  <div className={`w-16 h-16 rounded-3xl bg-gradient-to-br ${feature.color} flex items-center justify-center mb-6 shadow-xl group-hover:scale-110 transition-transform duration-200`}>
                    <Icon className="w-8 h-8 text-white" />
                  </div>

                  {/* Title */}
                  <h3 className="text-2xl font-heading font-bold mb-4 text-foreground" data-testid={`text-feature-${index + 1}-title`}>
                    {t(feature.titleKey as any)}
                  </h3>

                  {/* Description */}
                  <p className="text-muted-foreground leading-relaxed" data-testid={`text-feature-${index + 1}-description`}>
                    {t(feature.descKey as any)}
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
