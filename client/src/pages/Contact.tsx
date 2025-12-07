import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Mail, Phone, MapPin, Send } from "lucide-react";
import { motion } from "framer-motion";

export default function Contact() {
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
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-12">
            {/* Contact Info */}
            <motion.div 
              initial={{ opacity: 0, x: -20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.2, duration: 0.5 }}
              className="space-y-8"
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Kontaktinformationen</CardTitle>
                  <CardDescription>Wir sind für Sie da.</CardDescription>
                </CardHeader>
                <CardContent className="space-y-6">
                  <div className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <Mail className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Email</p>
                      <p>info@gross-ict.ch</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <Phone className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Telefon</p>
                      <p>+41 79 414 06 16</p>
                    </div>
                  </div>
                  
                  <div className="flex items-center gap-4 text-muted-foreground hover:text-primary transition-colors">
                    <div className="h-10 w-10 rounded-full bg-white/5 flex items-center justify-center border border-white/10">
                      <MapPin className="h-5 w-5" />
                    </div>
                    <div>
                      <p className="text-sm font-medium text-white">Standort</p>
                      <p>6144 Zell LU</p>
                    </div>
                  </div>
                </CardContent>
              </Card>

              <div className="p-6 rounded-2xl bg-gradient-to-br from-primary/20 to-transparent border border-primary/10">
                <h3 className="text-lg font-bold text-white mb-2">Support benötigt?</h3>
                <p className="text-muted-foreground mb-4">
                  Für dringende technische Notfälle nutzen Sie bitte unsere Support-Hotline.
                </p>
                <Button variant="outline" className="w-full border-primary/50 text-primary hover:bg-primary/10">
                  Support Center
                </Button>
              </div>
            </motion.div>

            {/* Contact Form */}
            <motion.div 
              initial={{ opacity: 0, x: 20 }}
              animate={{ opacity: 1, x: 0 }}
              transition={{ delay: 0.4, duration: 0.5 }}
            >
              <Card className="bg-white/5 border-white/10 backdrop-blur-sm h-full">
                <CardHeader>
                  <CardTitle className="text-2xl text-white">Nachricht senden</CardTitle>
                  <CardDescription>Füllen Sie das Formular aus und wir melden uns umgehend.</CardDescription>
                </CardHeader>
                <CardContent>
                  <form className="space-y-4" onSubmit={(e) => e.preventDefault()}>
                    <div className="grid grid-cols-2 gap-4">
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Vorname</label>
                        <Input placeholder="Max" className="bg-black/20 border-white/10 focus:border-primary/50" />
                      </div>
                      <div className="space-y-2">
                        <label className="text-sm font-medium text-muted-foreground">Nachname</label>
                        <Input placeholder="Muster" className="bg-black/20 border-white/10 focus:border-primary/50" />
                      </div>
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Email</label>
                      <Input type="email" placeholder="max@beispiel.ch" className="bg-black/20 border-white/10 focus:border-primary/50" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Betreff</label>
                      <Input placeholder="Projektanfrage..." className="bg-black/20 border-white/10 focus:border-primary/50" />
                    </div>
                    
                    <div className="space-y-2">
                      <label className="text-sm font-medium text-muted-foreground">Nachricht</label>
                      <Textarea placeholder="Wie können wir Ihnen helfen?" className="min-h-[150px] bg-black/20 border-white/10 focus:border-primary/50" />
                    </div>
                    
                    <Button type="submit" className="w-full bg-white text-black hover:bg-gray-200 font-bold">
                      Nachricht senden <Send className="ml-2 h-4 w-4" />
                    </Button>
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
