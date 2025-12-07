import { Accordion, AccordionContent, AccordionItem, AccordionTrigger } from "@/components/ui/accordion";
import { useLanguage } from "@/contexts/LanguageContext";

export default function FAQSection() {
  const { language } = useLanguage();

  const faqs = [
    {
      question: language === 'de' ? "Wie schnell reagieren Sie im Notfall?" : "How fast do you react in an emergency?",
      answer: language === 'de' 
        ? "Für Vertragskunden garantieren wir Reaktionszeiten von unter 2 Stunden. Bei kritischen Ausfällen sind wir oft sofort verfügbar."
        : "For contract customers, we guarantee response times of under 2 hours. For critical outages, we are often available immediately."
    },
    {
      question: language === 'de' ? "Bieten Sie auch Support für Privatkunden?" : "Do you also offer support for private customers?",
      answer: language === 'de'
        ? "Unser Fokus liegt auf KMUs, aber wir betreuen auch anspruchsvolle Privatkunden mit professioneller IT-Infrastruktur."
        : "Our focus is on SMEs, but we also support demanding private customers with professional IT infrastructure."
    },
    {
      question: language === 'de' ? "Was kostet eine Erstberatung?" : "How much does an initial consultation cost?",
      answer: language === 'de'
        ? "Das erste Kennenlerngespräch (ca. 30 Min.) ist bei uns immer kostenlos. Wir analysieren Ihren Bedarf und erstellen eine grobe Kostenschätzung."
        : "The first introductory meeting (approx. 30 min) is always free of charge. We analyze your needs and provide a rough cost estimate."
    },
    {
      question: language === 'de' ? "Arbeiten Sie auch remote?" : "Do you also work remotely?",
      answer: language === 'de'
        ? "Ja, ca. 90% unserer Support-Fälle lösen wir per Fernwartung. Das spart Ihnen Anfahrtskosten und Zeit."
        : "Yes, we solve approx. 90% of our support cases via remote maintenance. This saves you travel costs and time."
    },
    {
      question: language === 'de' ? "Welche Hardware empfehlen Sie?" : "Which hardware do you recommend?",
      answer: language === 'de'
        ? "Wir setzen auf bewährte Business-Hardware von Lenovo, HP und Ubiquiti, da diese langlebiger und zuverlässiger als Consumer-Geräte sind."
        : "We rely on proven business hardware from Lenovo, HP, and Ubiquiti, as these are more durable and reliable than consumer devices."
    }
  ];

  return (
    <section className="py-24 bg-black/20">
      <div className="container max-w-3xl px-4 md:px-6">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4">
            {language === 'de' ? "Häufige Fragen" : "Frequently Asked Questions"}
          </h2>
          <p className="text-muted-foreground">
            {language === 'de' 
              ? "Antworten auf die wichtigsten Fragen zu unserer Zusammenarbeit."
              : "Answers to the most important questions about our cooperation."}
          </p>
        </div>

        <Accordion type="single" collapsible className="w-full space-y-4">
          {faqs.map((faq, index) => (
            <AccordionItem key={index} value={`item-${index}`} className="border border-white/10 bg-white/5 rounded-lg px-4">
              <AccordionTrigger className="text-left hover:text-primary transition-colors text-lg font-medium py-4">
                {faq.question}
              </AccordionTrigger>
              <AccordionContent className="text-muted-foreground pb-4 leading-relaxed">
                {faq.answer}
              </AccordionContent>
            </AccordionItem>
          ))}
        </Accordion>
      </div>
    </section>
  );
}
