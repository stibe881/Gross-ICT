import { useState } from "react";
import { useLocation } from "wouter";
import { motion, AnimatePresence } from "framer-motion";
import { Check, Calculator as CalcIcon, ArrowRight, ArrowLeft, Server, Globe, Shield, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";
import Layout from "@/components/Layout";

type Option = {
  id: string;
  label: string;
  price: number;
  icon?: React.ReactNode;
};

type Category = {
  id: string;
  title: string;
  description: string;
  type: "single" | "multiple";
  options: Option[];
};

export default function Calculator() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  const [currentStep, setCurrentStep] = useState(0);
  
  // Define categories and pricing
  const categories: Category[] = [
    {
      id: "type",
      title: "Project Type",
      description: "What kind of digital solution are you looking for?",
      type: "single",
      options: [
        { id: "landing", label: "Landing Page", price: 1500, icon: <Globe className="w-6 h-6" /> },
        { id: "corporate", label: "Corporate Website", price: 3500, icon: <Server className="w-6 h-6" /> },
        { id: "ecommerce", label: "E-Commerce Shop", price: 8000, icon: <Smartphone className="w-6 h-6" /> },
        { id: "webapp", label: "Web Application", price: 12000, icon: <Shield className="w-6 h-6" /> },
      ]
    },
    {
      id: "design",
      title: "Design Complexity",
      description: "How unique should the visual design be?",
      type: "single",
      options: [
        { id: "template", label: "Template Based", price: 0 },
        { id: "custom", label: "Custom Design", price: 2000 },
        { id: "premium", label: "Premium / 3D", price: 4500 },
      ]
    },
    {
      id: "features",
      title: "Additional Features",
      description: "Select any extra capabilities you need.",
      type: "multiple",
      options: [
        { id: "cms", label: "CMS Integration", price: 1200 },
        { id: "seo", label: "SEO Optimization", price: 800 },
        { id: "multilang", label: "Multi-language", price: 1500 },
        { id: "analytics", label: "Advanced Analytics", price: 500 },
        { id: "newsletter", label: "Newsletter Setup", price: 600 },
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
      
      const label = cat.title;
      const values = Array.isArray(selected)
        ? selected.map(s => cat.options.find(o => o.id === s)?.label).join(", ")
        : cat.options.find(o => o.id === selected)?.label;
      
      return `${label}: ${values}`;
    }).filter(Boolean).join("\n");

    const total = calculateTotal();
    const message = `I am interested in a project with the following configuration:\n\n${summary}\n\nEstimated Budget: CHF ${total.toLocaleString()}`;
    
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
              Project Estimator
            </motion.div>
            <h1 className="text-4xl md:text-5xl font-bold mb-6 bg-clip-text text-transparent bg-gradient-to-r from-foreground to-foreground/70">
              Calculate Your Project
            </h1>
            
            {/* Progress Bar */}
            <div className="max-w-md mx-auto mt-8">
              <div className="flex justify-between text-sm text-muted-foreground mb-2">
                <span>Step {Math.min(currentStep + 1, categories.length + 1)} of {categories.length + 1}</span>
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
                      <h2 className="text-2xl font-bold mb-2">{currentCategory.title}</h2>
                      <p className="text-muted-foreground">{currentCategory.description}</p>
                    </div>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
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
                            <div className="flex items-start justify-between mb-4">
                              <div className={cn(
                                "p-2 rounded-lg transition-colors",
                                isSelected ? "bg-primary/20 text-primary" : "bg-muted text-muted-foreground group-hover:text-foreground"
                              )}>
                                {option.icon || <Check className="w-5 h-5" />}
                              </div>
                              {isSelected && (
                                <motion.div
                                  initial={{ scale: 0 }}
                                  animate={{ scale: 1 }}
                                  className="w-6 h-6 rounded-full bg-primary text-primary-foreground flex items-center justify-center"
                                >
                                  <Check className="w-3 h-3" />
                                </motion.div>
                              )}
                            </div>
                            
                            <h4 className="font-semibold mb-1">{option.label}</h4>
                            <p className="text-sm text-muted-foreground">
                              {option.price > 0 ? `+ CHF ${option.price.toLocaleString()}` : "Included"}
                            </p>
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
                    <h2 className="text-3xl font-bold mb-4">Ready to Launch?</h2>
                    <p className="text-muted-foreground text-lg mb-8">
                      You've configured your perfect project. Review the estimate on the right and let's get started!
                    </p>
                    <Button 
                      onClick={handleRequestQuote}
                      className="w-full md:w-auto px-8 py-6 text-lg font-bold"
                    >
                      Request Official Quote <ArrowRight className="ml-2 w-5 h-5" />
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
                  <ArrowLeft className="w-4 h-4" /> Back
                </Button>
                
                {!isLastStep && (
                  <Button onClick={handleNext} className="gap-2">
                    Next Step <ArrowRight className="w-4 h-4" />
                  </Button>
                )}
              </div>
            </div>

            {/* Live Summary Sidebar */}
            <div className="lg:col-span-1">
              <div className="sticky top-32">
                <div className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-2xl">
                  <h3 className="text-xl font-bold mb-6">Live Estimate</h3>
                  
                  <div className="space-y-4 mb-8">
                    {categories.map(cat => {
                      const selected = selections[cat.id];
                      if (!selected || (Array.isArray(selected) && selected.length === 0)) return null;

                      return (
                        <div key={cat.id} className="text-sm">
                          <span className="text-muted-foreground block mb-1">{cat.title}</span>
                          {Array.isArray(selected) ? (
                            selected.map(s => {
                              const opt = cat.options.find(o => o.id === s);
                              return (
                                <div key={s} className="flex justify-between font-medium pl-2 border-l-2 border-primary/20 mb-1">
                                  <span>{opt?.label}</span>
                                  <span>{opt?.price ? `CHF ${opt.price}` : "0"}</span>
                                </div>
                              );
                            })
                          ) : (
                            <div className="flex justify-between font-medium pl-2 border-l-2 border-primary/20">
                              <span>{cat.options.find(o => o.id === selected)?.label}</span>
                              <span>{cat.options.find(o => o.id === selected)?.price || "0"}</span>
                            </div>
                          )}
                        </div>
                      );
                    })}
                  </div>

                  <div className="pt-6 border-t border-border">
                    <div className="flex justify-between items-end">
                      <span className="text-muted-foreground">Total Estimate</span>
                      <span className="text-3xl font-bold text-primary">
                        CHF {calculateTotal().toLocaleString()}
                      </span>
                    </div>
                    <p className="text-xs text-muted-foreground mt-2">
                      *Rough estimate. Final price may vary.
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
