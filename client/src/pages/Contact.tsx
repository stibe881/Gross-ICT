import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Checkbox } from "@/components/ui/checkbox";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send, Loader2 } from "lucide-react";
import { motion } from "framer-motion";
import { useState, useEffect } from "react";
import { Link } from "wouter";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";

export default function Contact() {
  const [consent, setConsent] = useState(false);
  const [formData, setFormData] = useState({
    firstName: "",
    lastName: "",
    email: "",
    subject: "",
    message: ""
  });

  const contactMutation = trpc.contact.submit.useMutation({
    onSuccess: (data) => {
      toast.success(data.message);
      setFormData({
        firstName: "",
        lastName: "",
        email: "",
        subject: "",
        message: ""
      });
      setConsent(false);
    },
    onError: (error) => {
      toast.error(error.message);
    }
  });

  useEffect(() => {
    const prefilledMessage = localStorage.getItem("contact_message");
    if (prefilledMessage) {
      setFormData(prev => ({ ...prev, message: prefilledMessage }));
      localStorage.removeItem("contact_message"); // Clear after use
    }
  }, []);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.firstName || !formData.lastName || !formData.email || !formData.subject || !formData.message) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus.");
      return;
    }

    if (!consent) {
      toast.error("Bitte stimmen Sie der Datenschutzerklärung zu.");
      return;
    }

    contactMutation.mutate(formData);
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) => {
    const { id, value } = e.target;
    const fieldMap: Record<string, string> = {
      "first-name": "firstName",
      "last-name": "lastName",
      "email": "email",
      "subject": "subject",
      "message": "message"
    };
    const field = fieldMap[id] || id;
    setFormData(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout>
      <SEO
        title="Kontakt"
        description="Kontaktieren Sie Gross ICT in Zell LU. Wir freuen uns auf Ihre Anfrage zu Webentwicklung, IT-Support oder Netzwerklösungen."
        canonical="/contact"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ContactPage",
          "mainEntity": {
            "@type": "ITService",
            "name": "Gross ICT",
            "telephone": "+41 79 414 06 16",
            "email": "info@gross-ict.ch",
            "address": {
              "@type": "PostalAddress",
              "streetAddress": "Neuhushof 3",
              "addressLocality": "Zell",
              "postalCode": "6144",
              "addressRegion": "LU",
              "addressCountry": "CH"
            }
          }
        }}
      />
      <div className="container py-32">
        <div className="max-w-5xl mx-auto">
          <motion.div
            initial={{ opacity: 0, y: 20 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.5 }}
            className="text-center mb-16"
          >
            <h1 className="text-4xl md:text-6xl font-bold mb-6 text-gradient">Kontaktieren Sie uns</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Bereit für den nächsten Schritt? Wir freuen uns auf Ihr Projekt.
            </p>
          </motion.div> contemplation

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-8"
            >
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl">Kontaktinformationen</CardTitle>
                  <CardDescription>Wir sind für Sie da.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <a href="mailto:info@gross-ict.ch" className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Email</p>
                      <p className="hover:underline">info@gross-ict.ch</p>
                    </div>
                  </a>

                  <a href="tel:+41794140616" className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors cursor-pointer">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Telefon</p>
                      <p className="hover:underline">+41 79 414 06 16</p>
                    </div>
                  </a>

                  <div className="flex items-center gap-4 text-muted-foreground">
                    <div className="h-10 w-10 rounded-full bg-primary/5 flex items-center justify-center border border-primary/10">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-foreground">Standort</p>
                      <p>6144 Zell LU</p>
                    </div>
                  </div>
                </CardContent>
              </Card> contemplation

              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/10 to-transparent border border-primary/10">
                <h3 className="text-lg font-bold mb-2">Support benötigt?</h3>
                <p className="text-muted-foreground mb-4">
                  Für dringende technische Notfälle nutzen Sie bitte unsere Support-Hotline.
                </p>
                <Link href="/support-center">
                  <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                    Support Center
                  </Button>
                </Link>
              </div>
            </motion.div> contemplation

            {/* Contact Form */}
            <motion.div
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="bg-card/50 border-border/50 backdrop-blur-sm h-full">
                <CardHeader>
                  <CardTitle className="text-2xl">Nachricht senden</CardTitle>
                  <CardDescription>Füllen Sie das Formular aus und wir melden uns umgehend.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={handleSubmit}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Vorname</label>
                        <Input
                          id="first-name"
                          placeholder="Max"
                          value={formData.firstName}
                          onChange={handleChange}
                          className="bg-background/50 border-border focus:border-primary/50"
                        />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nachname</label>
                        <Input
                          id="last-name"
                          placeholder="Muster"
                          value={formData.lastName}
                          onChange={handleChange}
                          className="bg-background/50 border-border focus:border-primary/50"
                        />
                      </div>
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <Input
                        id="email"
                        type="email"
                        placeholder="max@beispiel.ch"
                        value={formData.email}
                        onChange={handleChange}
                        className="bg-background/50 border-border focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Betreff</label>
                      <Input
                        id="subject"
                        placeholder="Projektanfrage..."
                        value={formData.subject}
                        onChange={handleChange}
                        className="bg-background/50 border-border focus:border-primary/50"
                      />
                    </div>

                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Nachricht</label>
                      <Textarea
                        id="message"
                        placeholder="Wie können wir Ihnen helfen?"
                        className="min-h-[150px] bg-background/50 border-border focus:border-primary/50"
                        value={formData.message}
                        onChange={handleChange}
                      />
                    </div>

                    <div className="flex items-start space-x-2">
                      <Checkbox
                        id="contact-consent"
                        checked={consent}
                        onCheckedChange={(checked) => setConsent(checked as boolean)}
                        className="mt-1 border-border data-[state=checked]:bg-primary data-[state=checked]:text-primary-foreground"
                      />
                      <label
                        htmlFor="contact-consent"
                        className="text-xs text-muted-foreground leading-tight cursor-pointer"
                      >
                        Ich stimme zu, dass meine Angaben zur Kontaktaufnahme und für Rückfragen dauerhaft gespeichert werden. Weitere Informationen finden Sie in der <Link href="/privacy" className="underline hover:text-foreground transition-colors">Datenschutzerklärung</Link>.
                      </label>
                    </div>

                    <Button
                      type="submit"
                      disabled={contactMutation.isPending}
                      className="w-full bg-primary text-primary-foreground hover:bg-primary/90 font-bold transition-all"
                    >
                      {contactMutation.isPending ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <>Nachricht senden <Send className="ml-2 h-4 w-4" /></>
                      )}
                    </Button> contemplation
                  </form>
                </CardContent>
              </Card>
            </motion.div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

