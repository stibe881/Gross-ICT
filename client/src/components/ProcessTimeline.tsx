import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Search, Lightbulb, Rocket, ShieldCheck } from "lucide-react";

export default function ProcessTimeline() {
  const { language } = useLanguage();

  const steps = [
    {
      icon: Search,
      title: language === 'de' ? "Analyse & Beratung" : "Analysis & Consulting",
      description: language === 'de' 
        ? "Wir analysieren Ihre bestehende Infrastruktur und identifizieren Optimierungspotenziale."
        : "We analyze your existing infrastructure and identify potential for optimization."
    },
    {
      icon: Lightbulb,
      title: language === 'de' ? "Konzept & Strategie" : "Concept & Strategy",
      description: language === 'de'
        ? "Wir entwickeln eine maßgeschneiderte Lösung, die perfekt auf Ihre Geschäftsziele einzahlt."
        : "We develop a tailored solution that perfectly aligns with your business goals."
    },
    {
      icon: Rocket,
      title: language === 'de' ? "Umsetzung & Migration" : "Implementation & Migration",
      description: language === 'de'
        ? "Reibungslose Installation und Migration Ihrer Systeme mit minimaler Ausfallzeit."
        : "Smooth installation and migration of your systems with minimal downtime."
    },
    {
      icon: ShieldCheck,
      title: language === 'de' ? "Wartung & Support" : "Maintenance & Support",
      description: language === 'de'
        ? "Proaktives Monitoring und schneller Support garantieren dauerhafte Sicherheit."
        : "Proactive monitoring and fast support guarantee lasting security."
    }
  ];

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container px-4 md:px-6">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'de' ? "Wie wir arbeiten" : "How We Work"}
          </h2>
          <p className="text-muted-foreground max-w-2xl mx-auto">
            {language === 'de' 
              ? "Unser bewährter Prozess für Ihren IT-Erfolg."
              : "Our proven process for your IT success."}
          </p>
        </div>

        <div className="relative max-w-4xl mx-auto">
          {/* Vertical Line */}
          <div className="absolute left-[20px] md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-transparent via-primary/50 to-transparent md:-translate-x-1/2" />

          <div className="space-y-12 md:space-y-24">
            {steps.map((step, index) => (
              <motion.div 
                key={index}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true, margin: "-100px" }}
                transition={{ duration: 0.5, delay: index * 0.2 }}
                className={`relative flex flex-col md:flex-row gap-8 md:gap-0 items-start md:items-center ${
                  index % 2 === 0 ? "md:flex-row-reverse" : ""
                }`}
              >
                {/* Content Side */}
                <div className="flex-1 md:w-1/2 pl-12 md:pl-0 md:px-12">
                  <div className={`bg-white/5 border border-white/10 p-6 rounded-2xl hover:border-primary/30 transition-colors ${
                    index % 2 === 0 ? "md:text-left" : "md:text-right"
                  }`}>
                    <h3 className="text-xl font-bold mb-2 text-primary">{step.title}</h3>
                    <p className="text-muted-foreground">{step.description}</p>
                  </div>
                </div>

                {/* Center Icon */}
                <div className="absolute left-0 md:left-1/2 w-10 h-10 rounded-full bg-background border-2 border-primary flex items-center justify-center z-10 md:-translate-x-1/2 shadow-[0_0_20px_rgba(var(--primary),0.3)]">
                  <step.icon className="w-5 h-5 text-primary" />
                </div>

                {/* Empty Side for spacing */}
                <div className="hidden md:block flex-1 md:w-1/2" />
              </motion.div>
            ))}
          </div>
        </div>
      </div>
    </section>
  );
}
