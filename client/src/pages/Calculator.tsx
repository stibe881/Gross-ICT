import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Calculator as CalcIcon, ArrowRight, ArrowLeft, Server, Globe, Shield, Smartphone, LayoutTemplate, Palette, Zap, Mail, BarChart, Languages } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";

type Option = {
  id: string;
  label: { de: string; en: string };
  description: { de: string; en: string };
  price: number;
  icon?: React.ReactNode;
};

type Category = {
  id: string;
  title: { de: string; en: string };
  description: { de: string; en: string };
  type: "single" | "multiple";
  options: Option[];
};

export default function Calculator() {
  const [, setLocation] = useLocation();
  const { t, language } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Define categories and pricing with localized content
  const categories: Category[] = [
    {
      id: "type",
      title: { 
        de: "Projekttyp", 
        en: "Project Type" 
      },
      description: { 
        de: "Welche Art von digitaler Lösung suchen Sie?", 
        en: "What kind of digital solution are you looking for?" 
      },
      type: "single",
      options: [
        { 
          id: "landing", 
          label: { de: "Landing Page", en: "Landing Page" }, 
          description: { 
            de: "Eine einzelne Seite, ideal für Marketingkampagnen oder Produktvorstellungen.", 
            en: "A single page, ideal for marketing campaigns or product launches." 
          },
          price: 1500, 
          icon: <Globe className="w-6 h-6" /> 
        },
        { 
          id: "corporate", 
          label: { de: "Unternehmenswebsite", en: "Corporate Website" }, 
          description: { 
            de: "Mehrseitige Website zur professionellen Präsentation Ihres Unternehmens.", 
            en: "Multi-page website for professional presentation of your company." 
          },
          price: 3500, 
          icon: <Server className="w-6 h-6" /> 
        },
        { 
          id: "ecommerce", 
          label: { de: "E-Commerce Shop", en: "E-Commerce Shop" }, 
          description: { 
            de: "Online-Shop mit Warenkorb, Zahlungsabwicklung und Produktverwaltung.", 
            en: "Online store with shopping cart, payment processing, and product management." 
          },
          price: 8000, 
          icon: <Smartphone className="w-6 h-6" /> 
        },
        { 
          id: "webapp", 
          label: { de: "Web Applikation", en: "Web Application" }, 
          description: { 
            de: "Komplexe Softwarelösung mit Benutzerkonten und individuellen Funktionen.", 
            en: "Complex software solution with user accounts and custom features." 
          },
          price: 12000, 
          icon: <Shield className="w-6 h-6" /> 
        },
      ]
    },
    {
      id: "design",
      title: { 
        de: "Design-Komplexität", 
        en: "Design Complexity" 
      },
      description: { 
        de: "Wie einzigartig soll das visuelle Design sein?", 
        en: "How unique should the visual design be?" 
      },
      type: "single",
      options: [
        { 
          id: "template", 
          label: { de: "Template Basiert", en: "Template Based" }, 
          description: { 
            de: "Kosteneffizient durch Nutzung bewährter Vorlagen, angepasst an Ihre Farben.", 
            en: "Cost-efficient by using proven templates, adapted to your colors." 
          },
          price: 0,
          icon: <LayoutTemplate className="w-6 h-6" />
        },
        { 
          id: "custom", 
          label: { de: "Individuelles Design", en: "Custom Design" }, 
          description: { 
            de: "Maßgeschneidertes Design, das exakt Ihre Markenidentität widerspiegelt.", 
            en: "Tailor-made design that exactly reflects your brand identity." 
          },
          price: 2000,
          icon: <Palette className="w-6 h-6" />
        },
        { 
          id: "premium", 
          label: { de: "Premium / 3D", en: "Premium / 3D" }, 
          description: { 
            de: "High-End Design mit 3D-Elementen und aufwendigen Animationen.", 
            en: "High-end design with 3D elements and elaborate animations." 
          },
          price: 4500,
          icon: <Zap className="w-6 h-6" />
        },
      ]
    },
    {
      id: "features",
      title: { 
        de: "Zusatzfunktionen", 
        en: "Additional Features" 
      },
      description: { 
        de: "Wählen Sie zusätzliche Funktionen, die Sie benötigen.", 
        en: "Select any extra capabilities you need." 
      },
      type: "multiple",
      options: [
        { 
          id: "cms", 
          label: { de: "CMS Integration", en: "CMS Integration" }, 
          description: { 
            de: "Verwalten Sie Inhalte selbstständig ohne Programmierkenntnisse.", 
            en: "Manage content independently without programming knowledge." 
          },
          price: 1200,
          icon: <LayoutTemplate className="w-6 h-6" />
        },
        { 
          id: "seo", 
          label: { de: "SEO Optimierung", en: "SEO Optimization" }, 
          description: { 
            de: "Bessere Auffindbarkeit bei Google & Co. für mehr Besucher.", 
            en: "Better visibility on Google & Co. for more visitors." 
          },
          price: 800,
          icon: <BarChart className="w-6 h-6" />
        },
        { 
          id: "multilang", 
          label: { de: "Mehrsprachigkeit", en: "Multi-language" }, 
          description: { 
            de: "Erreichen Sie Kunden in verschiedenen Sprachen (z.B. DE/EN).", 
            en: "Reach customers in different languages (e.g., DE/EN)." 
          },
          price: 1500,
          icon: <Languages className="w-6 h-6" />
        },
        { 
          id: "analytics", 
          label: { de: "Erweiterte Analyse", en: "Advanced Analytics" }, 
          description: { 
            de: "Detaillierte Einblicke in das Besucherverhalten (DSGVO-konform).", 
            en: "Detailed insights into visitor behavior (GDPR compliant)." 
          },
          price: 500,
          icon: <BarChart className="w-6 h-6" />
        },
        { 
          id: "newsletter", 
          label: { de: "Newsletter Setup", en: "Newsletter Setup" }, 
          description: { 
            de: "Sammeln Sie E-Mail-Adressen und versenden Sie Updates.", 
            en: "Collect email addresses and send updates." 
          },
          price: 600,
          icon: <Mail className="w-6 h-6" />
        },
      ]
    }
  ];

  const [selections, setSelections] = useState<Record<string, string | string[]>>({
    type: "landing",
    design: "template",
    features: []
  });

  const toggleSelection = (categoryId: string, optionId: string, type: "single" | "multiple") => {
    setSelections(prev => {
      if (type === "single") {
        return { ...prev, [categoryId]: optionId };
      } else {
        const current = (prev[categoryId] as string[]) || [];
        const updated = current.includes(optionId)
          ? current.filter(id => id !== optionId)
          : [...current, optionId];
        return { ...prev, [categoryId]: updated };
      }
    });
  };

  const calculateTotal = () => {
    let total = 0;
    categories.forEach(cat => {
      const selected = selections[cat.id];
      if (Array.isArray(selected)) {
        selected.forEach(optId => {
          const opt = cat.options.find(o => o.id === optId);
          if (opt) total += opt.price;
        });
      } else {
        const opt = cat.options.find(o => o.id === selected);
        if (opt) total += opt.price;
      }
    });
    return total;
  };

  const handleNext = () => {
    if (currentStep < categories.length) {
      setCurrentStep(prev => prev + 1);
    } else {
      handleRequestQuote();
    }
  };

  const handleBack = () => {
    if (currentStep > 0) {
      setCurrentStep(prev => prev - 1);
    }
  };

  const handleRequestQuote = () => {
    const summary = categories.map(cat => {
      const selected = selections[cat.id];
      if (!selected || (Array.isArray(selected) && selected.length === 0)) return null;
      
      const label = cat.title[language as 'de' | 'en'];
      const values = Array.isArray(selected)
        ? selected.map(s => cat.options.find(o => o.id === s)?.label[language as 'de' | 'en']).join(", ")
        : cat.options.find(o => o.id === selected)?.label[language as 'de' | 'en'];
      
      return `${label}: ${values}`;
    }).filter(Boolean).join("\n");

    const total = calculateTotal();
    const message = language === 'de' 
      ? `Ich interessiere mich für ein Projekt mit folgender Konfiguration:\n\n${summary}\n\nGeschätztes Budget: CHF ${total.toLocaleString()}`
      : `I am interested in a project with the following configuration:\n\n${summary}\n\nEstimated Budget: CHF ${total.toLocaleString()}`;
    
    localStorage.setItem("contact_message", message);
    setLocation("/contact");
  };

  const currentCategory = categories[currentStep];
  const isLastStep = currentStep === categories.length;

  return (
    <Layout>
      <div className="min-h-screen pt-32 pb-20 px-4">
        <div className="container max-w-4xl mx-auto">
          {/* Header */}
          <div className="text-center mb-12">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium mb-4"
            >
              <CalcIcon className="w-4 h-4" />
              {language === 'de' ? 'Projekt-Kalkulator' : 'Project Estimator'}
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              {language === 'de' ? 'Kalkulieren Sie Ihr Projekt' : 'Calculate Your Project'}
            </h1>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto mt-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>{language === 'de' ? 'Schritt' : 'Step'} {Math.min(currentStep + 1, categories.length + 1)} {language === 'de' ? 'von' : 'of'} {categories.length + 1}</span>
                <span>{Math.round((Math.min(currentStep + 1, categories.length + 1) / (categories.length + 1)) * 100)}%</span>
              </div>
              <div className="h-2 bg-secondary rounded-full overflow-hidden">
                <motion.div 
                  className="h-full bg-primary"
                  initial={{ width: 0 }}
                  animate={{ width: `${(Math.min(currentStep + 1, categories.length + 1) / (categories.length + 1)) * 100}%` }}
                  transition={{ duration: 0.3 }}
                />
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Content Area */}
            <div className="lg:col-span-2">
              <AnimatePresence mode="wait">
                {!isLastStep ? (
                  <motion.div
                    key={currentCategory.id}
                    initial={{ opacity: 0, x: 20 }}
                    animate={{ opacity: 1, x: 0 }}
                    exit={{ opacity: 0, x: -20 }}
                    transition={{ duration: 0.3 }}
                    className="space-y-6"
                  >
                    <div className="mb-8">
                      <h2 className="text-2xl font-bold mb-2">{currentCategory.title[language as 'de' | 'en']}</h2>
                      <p className="text-muted-foreground">{currentCategory.description[language as 'de' | 'en']}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 gap-4">
                      {currentCategory.options.map((option) => {
                        const isSelected = currentCategory.type === "single"
                          ? selections[currentCategory.id] === option.id
                          : (selections[currentCategory.id] as string[]).includes(option.id);

                        return (
                          <div
                            key={option.id}
                            onClick={() => toggleSelection(currentCategory.id, option.id, currentCategory.type)}
                            className={cn(
                              "relative p-6 rounded-xl border cursor-pointer transition-all duration-300 group",
                              isSelected
                                ? "border-primary bg-primary/5 shadow-lg shadow-primary/5"
                                : "border-border bg-card hover:border-primary/50 hover:bg-accent/5"
                            )}
                          >
                            <div className="flex items-start gap-4">
                              <div className={cn(
                                "p-3 rounded-lg transition-colors shrink-0",
                                isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
                              )}>
                                {option.icon || <Check className="w-6 h-6" />}
                              </div>
                              
                              <div className="flex-1">
                                <div className="flex justify-between items-start mb-1">
                                  <h4 className="font-semibold text-lg">{option.label[language as 'de' | 'en']}</h4>
                                  {isSelected && (
                                    <motion.div
                                      initial={{ scale: 0 }}
                                      animate={{ scale: 1 }}
                                      className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center shrink-0 ml-2"
                                    >
                                      <Check className="w-3 h-3" />
                                    </motion.div>
                                  )}
                                </div>
                                <p className="text-sm text-muted-foreground mb-2">
                                  {option.description[language as 'de' | 'en']}
                                </p>
                                <p className="text-sm font-medium text-primary">
                                  {option.price > 0 ? `+ CHF ${option.price.toLocaleString()}` : (language === 'de' ? "Inklusive" : "Included")}
                                </p>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  </motion.div>
                ) : (
                  <motion.div
                    key="summary"
                    initial={{ opacity: 0, scale: 0.95 }}
                    animate={{ opacity: 1, scale: 1 }}
                    className="text-center py-12"
                  >
                    <div className="w-20 h-20 bg-primary/10 rounded-full flex items-center justify-center mx-auto mb-6 text-primary">
                      <Check className="w-10 h-10" />
                    </div>
                    <h2 className="text-3xl font-bold mb-4">{language === 'de' ? 'Bereit zum Start?' : 'Ready to Launch?'}</h2>
                    <p className="text-muted-foreground text-lg mb-8">
                      {language === 'de' 
                        ? 'Sie haben Ihr perfektes Projekt konfiguriert. Überprüfen Sie die Schätzung rechts und lassen Sie uns beginnen!' 
                        : 'You\'ve configured your perfect project. Review the estimate on the right and let\'s get started!'}
                    </p>
                    <Button 
                      onClick={handleRequestQuote}
                      className="w-full md:w-auto px-8 py-6 text-lg font-bold"
                    >
                      {language === 'de' ? 'Offizielle Offerte anfordern' : 'Request Official Quote'} <ArrowRight className="ml-2 w-5 h-5" />
                    </Button>
                  </motion.div>
                )}
              </AnimatePresence>

              {/* Navigation Buttons */}
              <div className="flex justify-between mt-12 pt-8 border-t border-border">
                <Button
                  variant="ghost"
                  onClick={handleBack}
                  disabled={currentStep === 0}
                  className={cn("gap-2", currentStep === 0 && "opacity-0 pointer-events-none")}
                >
                  <ArrowLeft className="w-4 h-4" /> {language === 'de' ? 'Zurück' : 'Back'}
                </Button>
                
                {!isLastStep && (
                  <Button onClick={handleNext} className="gap-2">
                    {language === 'de' ? 'Weiter' : 'Next'} <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Live Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <div className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-2xl">
                  <h3 className="text-xl font-bold mb-6">{language === 'de' ? 'Live Schätzung' : 'Live Estimate'}</h3>
                  
                  <div className="space-y-4 mb-8">
                    {categories.map(cat => {
                      const selected = selections[cat.id];
                      if (!selected || (Array.isArray(selected) && selected.length === 0)) return null;

                      return (
                        <div key={cat.id} className="text-sm">
                          <span className="text-muted-foreground block mb-1">{cat.title[language as 'de' | 'en']}</span>
                          {Array.isArray(selected) ? (
                            selected.map(s => {
                              const opt = cat.options.find(o => o.id === s);
                              return (
                                <div key={s} className="flex justify-between font-medium pl-2 border-l-2 border-primary/20 mb-1">
                                  <span>{opt?.label[language as 'de' | 'en']}</span>
                                  <span>{opt?.price ? `CHF ${opt.price}` : "0"}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex justify-between font-medium pl-2 border-l-2 border-primary/20">
                              <span>{cat.options.find(o => o.id === selected)?.label[language as 'de' | 'en']}</span>
                              <span>{cat.options.find(o => o.id === selected)?.price || "0"}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-border">
                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground">{language === 'de' ? 'Gesamtschätzung' : 'Total Estimate'}</span>
                      <span className="text-3xl font-bold text-primary">
                        CHF {calculateTotal().toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      {language === 'de' ? '*Grobe Schätzung. Endpreis kann variieren.' : '*Rough estimate. Final price may vary.'}
                    </p>
                  </div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

// Helper Button component since we don't have the UI library imported in this file context
function Button({ className, variant = "default", ...props }: React.ButtonHTMLAttributes<HTMLButtonElement> & { variant?: "default" | "ghost" | "outline" }) {
  return (
    <button
      className={cn(
        "inline-flex items-center justify-center rounded-md text-sm font-medium transition-colors focus-visible:outline-none focus-visible:ring-1 focus-visible:ring-ring disabled:pointer-events-none disabled:opacity-50",
        "h-9 px-4 py-2",
        variant === "default" && "bg-primary text-primary-foreground shadow hover:bg-primary/90",
        variant === "ghost" && "hover:bg-accent hover:text-accent-foreground",
        variant === "outline" && "border border-input bg-background shadow-sm hover:bg-accent hover:text-accent-foreground",
        className
      )}
      {...props}
    />
  );
}
