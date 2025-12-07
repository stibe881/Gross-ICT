import { useState, useEffect } from "react";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { Switch } from "@/components/ui/switch";
import { ShieldCheck, X, ChevronDown, ChevronUp } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";

type CookieSettings = {
  essential: boolean;
  analytics: boolean;
  marketing: boolean;
};

export default function CookieConsent() {
  const { language } = useLanguage();
  const [isVisible, setIsVisible] = useState(false);
  const [showDetails, setShowDetails] = useState(false);
  const [settings, setSettings] = useState<CookieSettings>({
    essential: true, // Always true and disabled
    analytics: true,
    marketing: false,
  });

  useEffect(() => {
    const consent = localStorage.getItem("cookie-consent");
    if (!consent) {
      const timer = setTimeout(() => setIsVisible(true), 1000);
      return () => clearTimeout(timer);
    } else {
      // Load saved settings if available
      try {
        const savedSettings = JSON.parse(consent);
        if (typeof savedSettings === 'object') {
          setSettings({ ...settings, ...savedSettings });
        }
      } catch (e) {
        // Legacy format or error, ignore
      }
    }
  }, []);

  const handleAcceptAll = () => {
    const allAccepted = { essential: true, analytics: true, marketing: true };
    saveConsent(allAccepted);
  };

  const handleSaveSelection = () => {
    saveConsent(settings);
  };

  const handleDeclineAll = () => {
    const allDeclined = { essential: true, analytics: false, marketing: false };
    saveConsent(allDeclined);
  };

  const saveConsent = (finalSettings: CookieSettings) => {
    localStorage.setItem("cookie-consent", JSON.stringify(finalSettings));
    setSettings(finalSettings);
    setIsVisible(false);
    
    // Here you would trigger/block scripts based on finalSettings
    if (finalSettings.analytics) {
      // Enable Plausible/GA
      (window as any).plausible?.enableAutoPageviews?.();
    }
  };

  if (!isVisible) return null;

  const t = {
    de: {
      title: "Datenschutz & Cookies",
      text: "Wir nutzen Cookies, um Ihr Erlebnis auf unserer Webseite zu verbessern. Einige sind technisch notwendig, andere helfen uns, unser Angebot zu optimieren.",
      acceptAll: "Alle akzeptieren",
      saveSelection: "Auswahl speichern",
      decline: "Nur Essenzielle",
      details: "Einstellungen",
      essential: "Technisch notwendig",
      essentialDesc: "Diese Cookies sind für die Grundfunktionen der Website erforderlich.",
      analytics: "Statistik",
      analyticsDesc: "Helfen uns zu verstehen, wie Besucher mit der Website interagieren.",
      marketing: "Marketing",
      marketingDesc: "Werden verwendet, um Besuchern relevante Werbung anzuzeigen.",
    },
    en: {
      title: "Privacy & Cookies",
      text: "We use cookies to improve your experience on our website. Some are technically necessary, others help us optimize our offer.",
      acceptAll: "Accept All",
      saveSelection: "Save Selection",
      decline: "Essential Only",
      details: "Settings",
      essential: "Essential",
      essentialDesc: "These cookies are required for basic website functions.",
      analytics: "Analytics",
      analyticsDesc: "Help us understand how visitors interact with the website.",
      marketing: "Marketing",
      marketingDesc: "Used to display relevant ads to visitors.",
    }
  };

  const content = language === 'de' ? t.de : t.en;

  return (
    <div className="fixed bottom-4 left-4 right-4 md:left-auto md:right-4 md:max-w-lg z-50 animate-in slide-in-from-bottom-10 duration-500">
      <div className="bg-card/95 backdrop-blur-xl border border-border rounded-2xl p-6 shadow-2xl relative overflow-hidden">
        {/* Spotlight effect */}
        <div className="absolute -top-20 -right-20 w-40 h-40 bg-primary/20 rounded-full blur-3xl pointer-events-none"></div>
        
        <div className="flex items-start gap-4 relative z-10">
          <div className="p-2 bg-background/50 rounded-full shrink-0 hidden sm:block">
            <ShieldCheck className="h-6 w-6 text-primary" />
          </div>
          <div className="space-y-4 w-full">
            <h3 className="font-bold text-foreground text-lg flex items-center gap-2">
              <ShieldCheck className="h-5 w-5 text-primary sm:hidden" />
              {content.title}
            </h3>
            <p className="text-sm text-muted-foreground leading-relaxed">
              {content.text}
            </p>

            {showDetails && (
              <div className="space-y-4 py-2 animate-in slide-in-from-top-2">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{content.essential}</p>
                    <p className="text-xs text-muted-foreground">{content.essentialDesc}</p>
                  </div>
                  <Switch checked={true} disabled />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{content.analytics}</p>
                    <p className="text-xs text-muted-foreground">{content.analyticsDesc}</p>
                  </div>
                  <Switch 
                    checked={settings.analytics} 
                    onCheckedChange={(c) => setSettings({...settings, analytics: c})} 
                  />
                </div>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-foreground">{content.marketing}</p>
                    <p className="text-xs text-muted-foreground">{content.marketingDesc}</p>
                  </div>
                  <Switch 
                    checked={settings.marketing} 
                    onCheckedChange={(c) => setSettings({...settings, marketing: c})} 
                  />
                </div>
              </div>
            )}

            <div className="flex flex-wrap gap-2 pt-2">
              <Button 
                onClick={handleAcceptAll}
                className="bg-primary text-primary-foreground hover:bg-primary/90 rounded-full text-xs font-semibold px-4 flex-1"
              >
                {content.acceptAll}
              </Button>
              
              {showDetails ? (
                <Button 
                  onClick={handleSaveSelection}
                  variant="secondary"
                  className="bg-secondary text-secondary-foreground hover:bg-secondary/80 rounded-full text-xs font-semibold px-4 flex-1"
                >
                  {content.saveSelection}
                </Button>
              ) : (
                <Button 
                  onClick={handleDeclineAll}
                  variant="outline"
                  className="bg-transparent border-border text-foreground hover:bg-foreground/5 rounded-full text-xs flex-1"
                >
                  {content.decline}
                </Button>
              )}

              <Button
                onClick={() => setShowDetails(!showDetails)}
                variant="ghost"
                size="icon"
                className="rounded-full text-muted-foreground hover:text-foreground"
              >
                {showDetails ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
              </Button>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
