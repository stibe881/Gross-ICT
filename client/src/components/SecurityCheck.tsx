import { useState } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, AlertTriangle, CheckCircle, ArrowRight, RefreshCw } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";

export default function SecurityCheck() {
  const { language } = useLanguage();
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [showResult, setShowResult] = useState(false);
  const [, setLocation] = useLocation();

  const questions = [
    {
      question: language === 'de' ? "Haben Sie eine 2-Faktor-Authentifizierung (2FA) aktiviert?" : "Do you have 2-Factor Authentication (2FA) enabled?",
      options: [
        { text: language === 'de' ? "Ja, überall" : "Yes, everywhere", points: 2 },
        { text: language === 'de' ? "Teilweise" : "Partially", points: 1 },
        { text: language === 'de' ? "Nein / Weiß nicht" : "No / Don't know", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Wie oft führen Sie Backups durch?" : "How often do you perform backups?",
      options: [
        { text: language === 'de' ? "Täglich automatisch" : "Daily automatically", points: 2 },
        { text: language === 'de' ? "Wöchentlich / Manuell" : "Weekly / Manually", points: 1 },
        { text: language === 'de' ? "Selten / Nie" : "Rarely / Never", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Nutzen Sie einen Passwort-Manager?" : "Do you use a password manager?",
      options: [
        { text: language === 'de' ? "Ja, für alles" : "Yes, for everything", points: 2 },
        { text: language === 'de' ? "Nur für Wichtiges" : "Only for important things", points: 1 },
        { text: language === 'de' ? "Nein, ich merke sie mir" : "No, I memorize them", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Sind Ihre Systeme (Windows/Mac) auf dem neuesten Stand?" : "Are your systems (Windows/Mac) up to date?",
      options: [
        { text: language === 'de' ? "Ja, Updates sind automatisch" : "Yes, updates are automatic", points: 2 },
        { text: language === 'de' ? "Ich klicke Updates oft weg" : "I often dismiss updates", points: 0 },
        { text: language === 'de' ? "Weiß nicht" : "Don't know", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Haben Sie eine Firewall / Antivirus-Lösung?" : "Do you have a firewall / antivirus solution?",
      options: [
        { text: language === 'de' ? "Ja, Managed Antivirus" : "Yes, Managed Antivirus", points: 2 },
        { text: language === 'de' ? "Nur Windows Defender" : "Only Windows Defender", points: 1 },
        { text: language === 'de' ? "Nein" : "No", points: 0 }
      ]
    }
  ];

  const handleAnswer = (points: number) => {
    setScore(score + points);
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const resetQuiz = () => {
    setStep(0);
    setScore(0);
    setShowResult(false);
  };

  const getResult = () => {
    const maxScore = questions.length * 2;
    const percentage = (score / maxScore) * 100;

    if (percentage >= 80) return {
      title: language === 'de' ? "Exzellent!" : "Excellent!",
      desc: language === 'de' ? "Ihre IT-Sicherheit ist auf einem sehr hohen Niveau." : "Your IT security is at a very high level.",
      color: "text-green-500",
      icon: CheckCircle
    };
    if (percentage >= 50) return {
      title: language === 'de' ? "Gut, aber ausbaufähig" : "Good, but room for improvement",
      desc: language === 'de' ? "Sie haben die Grundlagen, aber es gibt Lücken." : "You have the basics, but there are gaps.",
      color: "text-yellow-500",
      icon: AlertTriangle
    };
    return {
      title: language === 'de' ? "Kritisches Risiko!" : "Critical Risk!",
      desc: language === 'de' ? "Handlungsbedarf! Ihre Daten sind gefährdet." : "Action required! Your data is at risk.",
      color: "text-red-500",
      icon: AlertTriangle
    };
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container max-w-2xl px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Shield className="w-3 h-3" />
            {language === 'de' ? "Sicherheits-Check" : "Security Check"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'de' ? "Wie sicher ist Ihre IT?" : "How secure is your IT?"}
          </h2>
          <p className="text-muted-foreground">
            {language === 'de' 
              ? "Machen Sie den 1-Minuten-Schnelltest und finden Sie es heraus."
              : "Take the 1-minute quick test and find out."}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-2xl p-8 backdrop-blur-sm relative overflow-hidden min-h-[300px] flex flex-col justify-center">
          <AnimatePresence mode="wait">
            {!showResult ? (
              <motion.div
                key={step}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.3 }}
              >
                <div className="flex justify-between items-center mb-6 text-sm text-muted-foreground">
                  <span>{language === 'de' ? "Frage" : "Question"} {step + 1} / {questions.length}</span>
                  <div className="w-24 h-1 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500" 
                      style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-8 text-foreground">{questions[step].question}</h3>
                
                <div className="space-y-3">
                  {questions[step].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.points)}
                      className="w-full text-left p-4 rounded-xl bg-white/5 hover:bg-primary/20 border border-white/5 hover:border-primary/50 transition-all flex justify-between items-center group"
                    >
                      <span>{option.text}</span>
                      <ArrowRight className="w-4 h-4 opacity-0 group-hover:opacity-100 transition-opacity text-primary" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center"
              >
                {(() => {
                  const result = getResult();
                  const ResultIcon = result.icon;
                  return (
                    <>
                      <div className={`w-16 h-16 rounded-full bg-white/5 flex items-center justify-center mx-auto mb-6 ${result.color}`}>
                        <ResultIcon className="w-8 h-8" />
                      </div>
                      <h3 className={`text-2xl font-bold mb-2 ${result.color}`}>{result.title}</h3>
                      <p className="text-muted-foreground mb-8">{result.desc}</p>
                      
                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={resetQuiz} variant="outline" className="gap-2">
                          <RefreshCw className="w-4 h-4" />
                          {language === 'de' ? "Wiederholen" : "Retry"}
                        </Button>
                        <Button 
                          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90"
                          onClick={() => setLocation("/contact")}
                        >
                          <Shield className="w-4 h-4" />
                          {language === 'de' ? "Beratung anfordern" : "Request Consultation"}
                        </Button>
                      </div>
                    </>
                  );
                })()}
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
    </section>
  );
}
