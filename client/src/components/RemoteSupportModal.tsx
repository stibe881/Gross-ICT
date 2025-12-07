import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from "@/components/ui/dialog";
import { Button } from "@/components/ui/button";
import { Monitor, Download, Phone, Smartphone } from "lucide-react";
import { useLanguage } from "@/contexts/LanguageContext";
import { motion } from "framer-motion";
import { useEffect, useState } from "react";

export default function RemoteSupportModal({ children }: { children?: React.ReactNode }) {
  const { language } = useLanguage();
  const [os, setOs] = useState<'windows' | 'mac' | 'ios' | 'android' | 'unknown'>('unknown');

  useEffect(() => {
    const userAgent = navigator.userAgent.toLowerCase();
    if (/iphone|ipad|ipod/.test(userAgent)) {
      setOs('ios');
    } else if (/android/.test(userAgent)) {
      setOs('android');
    } else if (/mac/.test(userAgent)) {
      setOs('mac');
    } else if (/win/.test(userAgent)) {
      setOs('windows');
    }
  }, []);

  const handleSupportClick = (e: React.MouseEvent) => {
    // If mobile, try to open app or redirect to store
    if (os === 'ios') {
      e.preventDefault();
      // Try to open AnyDesk app scheme if possible, fallback to App Store
      window.location.href = "https://apps.apple.com/app/anydesk-remote-desktop/id1176131273";
    } else if (os === 'android') {
      e.preventDefault();
      // Try to open AnyDesk app scheme if possible, fallback to Play Store
      window.location.href = "https://play.google.com/store/apps/details?id=com.anydesk.anydeskandroid";
    } else if (os === 'windows') {
      // Direct download for Windows
      window.open("https://anydesk.com/de/downloads/thank-you?dv=win_exe", "_blank");
    } else if (os === 'mac') {
      // Direct download for Mac
      window.open("https://anydesk.com/de/downloads/thank-you?dv=mac_dmg", "_blank");
    }
    // For unknown OS or if we want to show the modal anyway, we let the Dialog trigger happen
    // But for mobile we want to prevent the dialog if we redirect
    if (os === 'ios' || os === 'android') {
      e.stopPropagation();
    }
  };

  // On mobile, we render a direct link/button instead of a DialogTrigger if we want to bypass the modal
  // However, the requirement says "If one clicks on remote support on smartphone...".
  // To keep it clean, we can use the Dialog but trigger the action immediately if it's mobile, 
  // OR we can just make the trigger button perform the action.
  
  // Let's make the trigger smart.
  
  const TriggerButton = children || (
    <Button 
      variant="outline" 
      className="hidden md:flex gap-2 border-primary/20 hover:bg-primary/10 hover:border-primary/50 transition-all"
    >
      <Monitor className="w-4 h-4 text-primary" />
      <span className="hidden lg:inline">{language === 'de' ? 'Fernwartung' : 'Remote Support'}</span>
    </Button>
  );

  // If mobile, we wrap in a simple div that handles the click, instead of DialogTrigger
  if (os === 'ios' || os === 'android') {
    return (
      <div onClick={handleSupportClick} className="cursor-pointer">
        {TriggerButton}
      </div>
    );
  }

  return (
    <Dialog>
      <DialogTrigger asChild>
        {TriggerButton}
      </DialogTrigger>
      <DialogContent className="sm:max-w-[600px] bg-background/95 backdrop-blur-xl border-primary/20">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold flex items-center gap-3">
            <div className="p-2 rounded-lg bg-primary/10 text-primary">
              <Monitor className="w-6 h-6" />
            </div>
            {language === 'de' ? 'Fernwartung starten' : 'Start Remote Support'}
          </DialogTitle>
        </DialogHeader>
        
        <div className="grid gap-6 py-4">
          <div className="text-muted-foreground">
            {language === 'de' 
              ? 'Laden Sie unser Fernwartungstool herunter, damit wir Ihnen direkt auf Ihrem Bildschirm helfen können.' 
              : 'Download our remote support tool so we can help you directly on your screen.'}
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <motion.a 
              href="https://anydesk.com/de/downloads/thank-you?dv=win_exe" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all group cursor-pointer ${os === 'windows' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/5'}`}
            >
              <div className="w-12 h-12 mb-4 rounded-full bg-[#ef4444]/10 flex items-center justify-center text-[#ef4444] group-hover:bg-[#ef4444] group-hover:text-white transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M0 3.449L9.75 2.1v9.451H0m10.949-9.602L24 0v11.4H10.949M0 12.6h9.75v9.451L0 20.699M10.949 12.6H24V24l-12.9-1.801"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-1">Windows</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                {os === 'windows' ? (language === 'de' ? 'Empfohlen' : 'Recommended') : 'Download'} <Download className="w-3 h-3" />
              </span>
            </motion.a>

            <motion.a 
              href="https://anydesk.com/de/downloads/thank-you?dv=mac_dmg" 
              target="_blank" 
              rel="noopener noreferrer"
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border transition-all group cursor-pointer ${os === 'mac' ? 'border-primary bg-primary/5 ring-1 ring-primary' : 'border-border bg-card hover:border-primary/50 hover:bg-accent/5'}`}
            >
              <div className="w-12 h-12 mb-4 rounded-full bg-foreground/5 flex items-center justify-center text-foreground group-hover:bg-foreground group-hover:text-background transition-colors">
                <svg viewBox="0 0 24 24" fill="currentColor" className="w-6 h-6">
                  <path d="M18.71 19.5c-.83 1.24-1.71 2.45-3.05 2.47-1.34.03-1.77-.79-3.29-.79-1.53 0-2 .77-3.27.82-1.31.05-2.3-1.32-3.14-2.53C4.25 17 2.94 12.45 4.7 9.39c.87-1.52 2.43-2.48 4.12-2.51 1.28-.02 2.5.87 3.29.87.78 0 2.26-1.07 3.81-.91.65.03 2.47.26 3.64 1.98-.09.06-2.17 1.28-2.15 3.81.03 3.02 2.65 4.03 2.68 4.04-.03.07-.42 1.44-1.38 2.83M13 3.5c.68-.83 1.14-1.99 1.01-3.15-1.03.06-2.27.69-3.01 1.55-.67.78-1.26 2.02-1.1 3.16 1.15.09 2.33-.63 3.1-1.56"/>
                </svg>
              </div>
              <h3 className="font-semibold mb-1">macOS</h3>
              <span className="text-xs text-muted-foreground flex items-center gap-1 group-hover:text-primary transition-colors">
                {os === 'mac' ? (language === 'de' ? 'Empfohlen' : 'Recommended') : 'Download'} <Download className="w-3 h-3" />
              </span>
            </motion.a>
          </div>

          <div className="bg-muted/50 rounded-lg p-4 flex items-start gap-4 mt-2">
            <div className="p-2 bg-primary/10 rounded-full text-primary shrink-0">
              <Phone className="w-5 h-5" />
            </div>
            <div>
              <h4 className="font-semibold text-sm mb-1">
                {language === 'de' ? 'Haben Sie uns am Telefon?' : 'Are you on the phone with us?'}
              </h4>
              <p className="text-sm text-muted-foreground mb-3">
                {language === 'de' 
                  ? 'Bitte teilen Sie uns Ihre AnyDesk-Adresse mit, die nach dem Start des Programms angezeigt wird.' 
                  : 'Please provide us with your AnyDesk address displayed after starting the program.'}
              </p>
              <div className="flex items-center gap-2 text-xs font-mono bg-background border border-border rounded px-2 py-1 w-fit text-muted-foreground">
                <span>Example ID:</span>
                <span className="text-foreground font-bold">123 456 789</span>
              </div>
            </div>
          </div>
          
          <div className="flex justify-center pt-2">
            <img src="/images/anydesk-logo.webp" alt="AnyDesk" className="h-8 opacity-50 grayscale hover:grayscale-0 transition-all" />
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
