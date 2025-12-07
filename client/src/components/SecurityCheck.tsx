import { useState, useMemo } from "react";
import { useLanguage } from "@/contexts/LanguageContext";
import { Shield, AlertTriangle, CheckCircle, ArrowRight, RefreshCw, Lock, Smartphone, Wifi, FileText, HardDrive, Info, XCircle } from "lucide-react";
import { Button } from "@/components/ui/button";
import { motion, AnimatePresence } from "framer-motion";
import { useLocation } from "wouter";
import { Tooltip, TooltipContent, TooltipProvider, TooltipTrigger } from "@/components/ui/tooltip";

export default function SecurityCheck() {
  const { language } = useLanguage();
  const [started, setStarted] = useState(false);
  const [step, setStep] = useState(0);
  const [score, setScore] = useState(0);
  const [answers, setAnswers] = useState<number[]>([]);
  const [showResult, setShowResult] = useState(false);
  const [, setLocation] = useLocation();

  const questions = useMemo(() => [
    {
      question: language === 'de' ? "Haben Sie eine 2-Faktor-Authentifizierung (2FA) aktiviert?" : "Do you have 2-Factor Authentication (2FA) enabled?",
      info: language === 'de' ? "2FA schützt Ihre Konten selbst dann, wenn Ihr Passwort gestohlen wird." : "2FA protects your accounts even if your password is stolen.",
      icon: Lock,
      options: [
        { text: language === 'de' ? "Ja, überall" : "Yes, everywhere", points: 2 },
        { text: language === 'de' ? "Teilweise" : "Partially", points: 1 },
        { text: language === 'de' ? "Nein / Weiß nicht" : "No / Don't know", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Wie oft führen Sie Backups durch?" : "How often do you perform backups?",
      info: language === 'de' ? "Regelmäßige Backups sind Ihre Lebensversicherung gegen Ransomware und Datenverlust." : "Regular backups are your insurance against ransomware and data loss.",
      icon: RefreshCw,
      options: [
        { text: language === 'de' ? "Täglich automatisch" : "Daily automatically", points: 2 },
        { text: language === 'de' ? "Wöchentlich / Manuell" : "Weekly / Manually", points: 1 },
        { text: language === 'de' ? "Selten / Nie" : "Rarely / Never", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Nutzen Sie einen Passwort-Manager?" : "Do you use a password manager?",
      info: language === 'de' ? "Ein Passwort-Manager ermöglicht komplexe, einzigartige Passwörter für jeden Dienst." : "A password manager enables complex, unique passwords for every service.",
      icon: Shield,
      options: [
        { text: language === 'de' ? "Ja, für alles" : "Yes, for everything", points: 2 },
        { text: language === 'de' ? "Nur für Wichtiges" : "Only for important things", points: 1 },
        { text: language === 'de' ? "Nein, ich merke sie mir" : "No, I memorize them", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Sind Ihre Systeme (Windows/Mac) auf dem neuesten Stand?" : "Are your systems (Windows/Mac) up to date?",
      info: language === 'de' ? "Veraltete Software ist das Einfallstor Nr. 1 für Hacker." : "Outdated software is the #1 gateway for hackers.",
      icon: RefreshCw,
      options: [
        { text: language === 'de' ? "Ja, Updates sind automatisch" : "Yes, updates are automatic", points: 2 },
        { text: language === 'de' ? "Ich klicke Updates oft weg" : "I often dismiss updates", points: 0 },
        { text: language === 'de' ? "Weiß nicht" : "Don't know", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Haben Sie eine Firewall / Antivirus-Lösung?" : "Do you have a firewall / antivirus solution?",
      info: language === 'de' ? "Moderne Endpoint-Protection erkennt Angriffe in Echtzeit." : "Modern endpoint protection detects attacks in real-time.",
      icon: Shield,
      options: [
        { text: language === 'de' ? "Ja, Managed Antivirus" : "Yes, Managed Antivirus", points: 2 },
        { text: language === 'de' ? "Nur Windows Defender" : "Only Windows Defender", points: 1 },
        { text: language === 'de' ? "Nein" : "No", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Sind Ihre Mitarbeiter geschult (Phishing)?" : "Are your employees trained (Phishing)?",
      info: language === 'de' ? "Der Mensch ist oft das schwächste Glied in der Sicherheitskette." : "Humans are often the weakest link in the security chain.",
      icon: FileText,
      options: [
        { text: language === 'de' ? "Ja, regelmäßige Trainings" : "Yes, regular training", points: 2 },
        { text: language === 'de' ? "Einmalig / Selten" : "Once / Rarely", points: 1 },
        { text: language === 'de' ? "Nein" : "No", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Sind Firmendaten auf Handys geschützt (MDM)?" : "Are company data on phones protected (MDM)?",
      info: language === 'de' ? "Mobile Device Management (MDM) trennt private und geschäftliche Daten sicher." : "Mobile Device Management (MDM) securely separates private and business data.",
      icon: Smartphone,
      options: [
        { text: language === 'de' ? "Ja, zentral verwaltet" : "Yes, centrally managed", points: 2 },
        { text: language === 'de' ? "Teilweise" : "Partially", points: 1 },
        { text: language === 'de' ? "Nein / Privatgeräte" : "No / Personal devices", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Ist Ihr Firmen-WLAN vom Gast-WLAN getrennt?" : "Is your company Wi-Fi separated from guest Wi-Fi?",
      info: language === 'de' ? "Gäste sollten niemals Zugriff auf Ihr internes Firmennetzwerk haben." : "Guests should never have access to your internal company network.",
      icon: Wifi,
      options: [
        { text: language === 'de' ? "Ja, strikt getrennt" : "Yes, strictly separated", points: 2 },
        { text: language === 'de' ? "Weiß nicht" : "Don't know", points: 0 },
        { text: language === 'de' ? "Nein, gleiches Passwort" : "No, same password", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Sind Ihre Festplatten verschlüsselt (BitLocker)?" : "Are your hard drives encrypted (BitLocker)?",
      info: language === 'de' ? "Verschlüsselung schützt Daten bei Diebstahl oder Verlust des Geräts." : "Encryption protects data in case of theft or loss of the device.",
      icon: HardDrive,
      options: [
        { text: language === 'de' ? "Ja, alle Geräte" : "Yes, all devices", points: 2 },
        { text: language === 'de' ? "Nur Laptops" : "Only laptops", points: 1 },
        { text: language === 'de' ? "Nein / Weiß nicht" : "No / Don't know", points: 0 }
      ]
    },
    {
      question: language === 'de' ? "Gibt es einen Notfallplan für Cyber-Angriffe?" : "Is there an emergency plan for cyber attacks?",
      info: language === 'de' ? "Im Ernstfall zählt jede Minute. Ein Plan verhindert Panik und Chaos." : "In an emergency, every minute counts. A plan prevents panic and chaos.",
      icon: AlertTriangle,
      options: [
        { text: language === 'de' ? "Ja, dokumentiert & getestet" : "Yes, documented & tested", points: 2 },
        { text: language === 'de' ? "Nur im Kopf" : "Only in mind", points: 1 },
        { text: language === 'de' ? "Nein" : "No", points: 0 }
      ]
    }
  ], [language]);

  const handleAnswer = (points: number) => {
    const newScore = score + points;
    setScore(newScore);
    setAnswers([...answers, points]);
    
    if (step < questions.length - 1) {
      setStep(step + 1);
    } else {
      setShowResult(true);
    }
  };

  const startQuiz = () => {
    setStarted(true);
    setStep(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
  };

  const resetQuiz = () => {
    setStarted(false);
    setStep(0);
    setScore(0);
    setAnswers([]);
    setShowResult(false);
  };

  const getResult = () => {
    const maxScore = questions.length * 2;
    const percentage = (score / maxScore) * 100;

    if (percentage >= 85) return {
      title: language === 'de' ? "Exzellente Sicherheit!" : "Excellent Security!",
      desc: language === 'de' ? "Ihre IT-Sicherheit ist vorbildlich. Weiter so!" : "Your IT security is exemplary. Keep it up!",
      color: "text-green-500",
      borderColor: "border-green-500/50",
      icon: CheckCircle
    };
    if (percentage >= 60) return {
      title: language === 'de' ? "Gute Basis, aber Lücken" : "Good basis, but gaps",
      desc: language === 'de' ? "Sie haben wichtige Schutzmaßnahmen, aber es gibt Angriffsflächen." : "You have important safeguards, but there are attack surfaces.",
      color: "text-yellow-500",
      borderColor: "border-yellow-500/50",
      icon: AlertTriangle
    };
    return {
      title: language === 'de' ? "Kritisches Risiko!" : "Critical Risk!",
      desc: language === 'de' ? "Dringender Handlungsbedarf! Ihre Daten sind stark gefährdet." : "Urgent action required! Your data is at high risk.",
      color: "text-red-500",
      borderColor: "border-red-500/50",
      icon: AlertTriangle
    };
  };

  return (
    <section className="py-24 relative overflow-hidden">
      <div className="container max-w-3xl px-4">
        <div className="text-center mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-xs font-bold uppercase tracking-wider mb-4">
            <Shield className="w-3 h-3" />
            {language === 'de' ? "Sicherheits-Check" : "Security Check"}
          </div>
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'de' ? "Wie sicher ist Ihre IT?" : "How secure is your IT?"}
          </h2>
          <p className="text-muted-foreground max-w-xl mx-auto">
            {language === 'de' 
              ? "Machen Sie den erweiterten Schnelltest (10 Fragen) und erhalten Sie eine sofortige Einschätzung."
              : "Take the extended quick test (10 questions) and get an immediate assessment."}
          </p>
        </div>

        <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12 backdrop-blur-sm relative overflow-hidden min-h-[500px] flex flex-col justify-center shadow-2xl">
          <AnimatePresence initial={false}>
            {!started ? (
              <motion.div
                key="start"
                initial={{ opacity: 0, scale: 0.95 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0, scale: 0.95 }}
                className="flex flex-col items-center text-center w-full"
              >
                <div className="w-20 h-20 rounded-full bg-primary/10 flex items-center justify-center mb-6 animate-pulse">
                  <Shield className="w-10 h-10 text-primary" />
                </div>
                <h3 className="text-2xl font-bold mb-4">
                  {language === 'de' ? "Bereit für den Check?" : "Ready for the check?"}
                </h3>
                <p className="text-muted-foreground mb-8 max-w-md">
                  {language === 'de' 
                    ? "Finden Sie in weniger als 2 Minuten heraus, wo Ihre IT-Sicherheitslücken liegen."
                    : "Find out where your IT security gaps are in less than 2 minutes."}
                </p>
                <Button onClick={startQuiz} size="lg" className="gap-2 text-lg px-8 rounded-full">
                  {language === 'de' ? "Check starten" : "Start Check"}
                  <ArrowRight className="w-5 h-5" />
                </Button>
              </motion.div>
            ) : !showResult ? (
              <motion.div
                key={`question-${step}`}
                initial={{ opacity: 0, x: 20 }}
                animate={{ opacity: 1, x: 0 }}
                exit={{ opacity: 0, x: -20 }}
                transition={{ duration: 0.2 }}
                className="w-full"
              >
                <div className="flex justify-between items-center mb-8 text-sm font-medium text-muted-foreground">
                  <span>{language === 'de' ? "Frage" : "Question"} {step + 1} / {questions.length}</span>
                  <div className="w-32 h-2 bg-white/10 rounded-full overflow-hidden">
                    <div 
                      className="h-full bg-primary transition-all duration-500 ease-out" 
                      style={{ width: `${((step + 1) / questions.length) * 100}%` }}
                    />
                  </div>
                </div>
                
                <div className="flex items-start gap-4 mb-8">
                  {(() => {
                    const QuestionIcon = questions[step].icon || Shield;
                    return (
                      <div className="p-3 rounded-xl bg-primary/10 text-primary shrink-0 hidden sm:flex">
                        <QuestionIcon className="w-6 h-6" />
                      </div>
                    );
                  })()}
                  <div className="flex-1">
                    <h3 className="text-xl md:text-2xl font-bold text-foreground leading-tight mb-2">
                      {questions[step].question}
                    </h3>
                    <div className="flex items-center gap-2 text-sm text-muted-foreground bg-white/5 p-2 rounded-lg inline-flex">
                      <Info className="w-4 h-4 text-primary" />
                      {questions[step].info}
                    </div>
                  </div>
                </div>
                
                <div className="grid gap-3">
                  {questions[step].options.map((option, idx) => (
                    <button
                      key={idx}
                      onClick={() => handleAnswer(option.points)}
                      className="w-full text-left p-5 rounded-xl bg-white/5 hover:bg-primary/10 border border-white/10 hover:border-primary/50 transition-all flex justify-between items-center group active:scale-[0.99]"
                    >
                      <span className="font-medium">{option.text}</span>
                      <ArrowRight className="w-5 h-5 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all text-primary" />
                    </button>
                  ))}
                </div>
              </motion.div>
            ) : (
              <motion.div
                key="result"
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                className="text-center w-full"
              >
                {(() => {
                  const result = getResult();
                  const ResultIcon = result.icon;
                  return (
                    <>
                      <div className={`w-24 h-24 rounded-full bg-white/5 border-4 ${result.borderColor} flex items-center justify-center mx-auto mb-6 ${result.color}`}>
                        <ResultIcon className="w-12 h-12" />
                      </div>
                      <h3 className={`text-3xl font-bold mb-3 ${result.color}`}>{result.title}</h3>
                      <p className="text-xl text-muted-foreground mb-8 max-w-lg mx-auto leading-relaxed">{result.desc}</p>
                      
                      {/* Detailed Breakdown */}
                      <div className="bg-white/5 rounded-xl p-6 mb-8 text-left max-h-60 overflow-y-auto custom-scrollbar">
                        <h4 className="font-bold mb-4 text-sm uppercase tracking-wider text-muted-foreground">
                          {language === 'de' ? "Detailanalyse" : "Detailed Analysis"}
                        </h4>
                        <div className="space-y-3">
                          {answers.map((points, idx) => (
                            <div key={idx} className="flex items-center justify-between text-sm border-b border-white/5 pb-2 last:border-0">
                              <span className="truncate pr-4 flex-1">{questions[idx].question}</span>
                              {points === 2 ? (
                                <CheckCircle className="w-4 h-4 text-green-500 shrink-0" />
                              ) : points === 1 ? (
                                <AlertTriangle className="w-4 h-4 text-yellow-500 shrink-0" />
                              ) : (
                                <XCircle className="w-4 h-4 text-red-500 shrink-0" />
                              )}
                            </div>
                          ))}
                        </div>
                      </div>

                      <div className="flex flex-col sm:flex-row gap-4 justify-center">
                        <Button onClick={resetQuiz} variant="outline" size="lg" className="gap-2 rounded-full">
                          <RefreshCw className="w-4 h-4" />
                          {language === 'de' ? "Wiederholen" : "Retry"}
                        </Button>
                        <Button 
                          size="lg"
                          className="gap-2 bg-primary text-primary-foreground hover:bg-primary/90 rounded-full shadow-lg shadow-primary/20"
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
