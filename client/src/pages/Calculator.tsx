import { useState } from "react";
import { useLocation, useRoute } from "wouter";
import { motion } from "framer-motion";
import { Check, Calculator as CalcIcon, ArrowRight, Server, Globe, Shield, Smartphone } from "lucide-react";
import { cn } from "@/lib/utils";
import { useLanguage } from "@/contexts/LanguageContext";

type Option = {
  id: string;
  label: string;
  price: number;
  icon?: React.ReactNode;
};

type Category = {
  id: string;
  title: string;
  type: "single" | "multiple";
  options: Option[];
};

export default function Calculator() {
  const [, setLocation] = useLocation();
  const { t } = useLanguage();
  
  // Define categories and pricing
  // Note: Prices are indicative base prices in CHF
  const categories: Category[] = [
    {
      id: "type",
      title: "Project Type",
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

  const handleRequestQuote = () => {
    // Generate summary string
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
    
    // Navigate to contact with pre-filled message
    // We'll use localStorage to pass data since wouter doesn't support state in navigation easily
    localStorage.setItem("contact_message", message);
    setLocation("/contact");
  };

  return (
    <div className="min-h-screen pt-32 pb-20 px-4">
      <div className="container max-w-4xl mx-auto">
        <div className="text-center mb-16">
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
          <p className="text-muted-foreground text-lg max-w-2xl mx-auto">
            Select your requirements below to get an instant estimated budget range for your next digital project.
          </p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          {/* Options Column */}
          <div className="lg:col-span-2 space-y-12">
            {categories.map((category, idx) => (
              <motion.div
                key={category.id}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
                className="space-y-6"
              >
                <h3 className="text-xl font-semibold flex items-center gap-3">
                  <span className="flex items-center justify-center w-8 h-8 rounded-full bg-primary/10 text-primary text-sm">
                    {idx + 1}
                  </span>
                  {category.title}
                </h3>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {category.options.map((option) => {
                    const isSelected = category.type === "single"
                      ? selections[category.id] === option.id
                      : (selections[category.id] as string[]).includes(option.id);

                    return (
                      <div
                        key={option.id}
                        onClick={() => toggleSelection(category.id, option.id, category.type)}
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
            ))}
          </div>

          {/* Summary Column */}
          <div className="lg:col-span-1">
            <div className="sticky top-32">
              <div className="p-8 rounded-2xl border border-border bg-card/50 backdrop-blur-xl shadow-2xl">
                <h3 className="text-xl font-bold mb-6">Estimated Cost</h3>
                
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

                <div className="pt-6 border-t border-border mb-8">
                  <div className="flex justify-between items-end">
                    <span className="text-muted-foreground">Total Estimate</span>
                    <span className="text-3xl font-bold text-primary">
                      CHF {calculateTotal().toLocaleString()}
                    </span>
                  </div>
                  <p className="text-xs text-muted-foreground mt-2">
                    *This is a rough estimate. Final pricing may vary based on specific requirements.
                  </p>
                </div>

                <button
                  onClick={handleRequestQuote}
                  className="w-full py-4 rounded-xl bg-primary text-primary-foreground font-bold hover:opacity-90 transition-all active:scale-95 flex items-center justify-center gap-2"
                >
                  Request Quote <ArrowRight className="w-4 h-4" />
                </button>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
