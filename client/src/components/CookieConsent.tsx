import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ShieldCheck, X } from "lucide-react";

export default function CookieConsent() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    // Check if user has already consented
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      // Show banner after a short delay
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    }
  }, []);

  const handleAccept = () => {
    localStorage.setItem("cookie-consent", "accepted");
    setIsVisible(false);
  };

  const handleDecline = () => {
    localStorage.setItem("cookie-consent", "declined");
    setIsVisible(false);
  };

  if (!isVisible) return null;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-md z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-black/80 backdrop-blur-xl border border-white/10 rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Spotlight effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-2 bg-white/5 rounded-full shrink-0">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-3">
            <h3 className="font-bold text-white text-lg">Datenschutz & Cookies</h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              Wir nutzen Cookies, um Ihr Erlebnis auf unserer Webseite zu verbessern und anonyme Nutzungsstatistiken zu erstellen. 
              Ihre Daten werden vertraulich behandelt und nicht an Dritte weitergegeben.
            </p>
            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                onClick={handleAccept}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-semibold px-6"
              >
                Akzeptieren
              </Button>
              <Button 
                onClick={handleDecline}
                variant="outline"
                className="bg-transparent border-white/10 text-white hover:bg-white/5 rounded-full text-xs"
              >
                Ablehnen
              </Button>
              <a href="/privacy" className="text-xs text-muted-foreground hover:text-white underline underline-offset-4 self-center ml-2">
                Details
              </a>
            </div>
          </div>
          <button 
            onClick={() => setIsVisible(false)}
            className="absolute -top-2 -right-2 p-2 text-muted-foreground hover:text-white transition-colors"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
      </div>
    </div>
  );
}
