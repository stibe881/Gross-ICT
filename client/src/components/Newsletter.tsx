import { useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Mail, CheckCircle2, Loader2 } from "lucide-react";
import { toast } from "sonner";

export default function Newsletter() {
  const { language } = useLanguage();
  const [email, setEmail] = useState("");
  const [isLoading, setIsLoading] = useState(false);
  const [isSuccess, setIsSuccess] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!email) return;

    setIsLoading(true);
    
    // Simulate API call
    await new Promise(resolve => setTimeout(resolve, 1500));
    
    setIsLoading(false);
    setIsSuccess(true);
    toast.success(language === 'de' ? 'Erfolgreich angemeldet!' : 'Successfully subscribed!');
    setEmail("");
  };

  return (
    <section className="py-24 relative border-t border-white/5 overflow-hidden">
      {/* Background Glow */}
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[500px] h-[500px] bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>

      <div className="container relative z-10">
        <div className="max-w-4xl mx-auto bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm">
          <div className="grid md:grid-cols-2 gap-12 items-center">
            <div>
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-medium mb-6 border border-primary/20">
                <Mail className="w-3 h-3" />
                {language === 'de' ? 'Newsletter' : 'Newsletter'}
              </div>
              <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
                {language === 'de' ? 'Immer informiert bleiben' : 'Stay informed'}
              </h2>
              <p className="text-muted-foreground text-lg">
                {language === 'de' 
                  ? 'Erhalten Sie Updates zu IT-Sicherheit, Tech-Trends und exklusive Angebote.' 
                  : 'Get updates on IT security, tech trends, and exclusive offers.'}
              </p>
            </div>

            <div className="relative">
              {isSuccess ? (
                <motion.div 
                  initial={{ opacity: 0, scale: 0.9 }}
                  animate={{ opacity: 1, scale: 1 }}
                  className="bg-green-500/10 border border-green-500/20 rounded-2xl p-8 text-center"
                >
                  <div className="w-16 h-16 bg-green-500/20 rounded-full flex items-center justify-center mx-auto mb-4">
                    <CheckCircle2 className="w-8 h-8 text-green-500" />
                  </div>
                  <h3 className="text-xl font-bold text-white mb-2">
                    {language === 'de' ? 'Willkommen an Bord!' : 'Welcome aboard!'}
                  </h3>
                  <p className="text-muted-foreground">
                    {language === 'de' 
                      ? 'Sie haben sich erfolgreich für unseren Newsletter angemeldet.' 
                      : 'You have successfully subscribed to our newsletter.'}
                  </p>
                </motion.div>
              ) : (
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div className="space-y-2">
                    <Input 
                      type="email" 
                      placeholder={language === 'de' ? 'Ihre E-Mail Adresse' : 'Your email address'}
                      value={email}
                      onChange={(e) => setEmail(e.target.value)}
                      required
                      className="h-12 bg-black/20 border-white/10 text-white placeholder:text-white/30 focus:border-primary/50"
                    />
                  </div>
                  <Button 
                    type="submit" 
                    disabled={isLoading}
                    className="w-full h-12 text-lg font-medium"
                  >
                    {isLoading ? (
                      <Loader2 className="w-5 h-5 animate-spin" />
                    ) : (
                      language === 'de' ? 'Jetzt anmelden' : 'Subscribe now'
                    )}
                  </Button>
                  <p className="text-xs text-center text-muted-foreground">
                    {language === 'de' 
                      ? 'Wir respektieren Ihre Privatsphäre. Abmeldung jederzeit möglich.' 
                      : 'We respect your privacy. Unsubscribe at any time.'}
                  </p>
                </form>
              )}
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}
