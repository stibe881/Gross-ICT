import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Check, ArrowRight, Globe, Smartphone, Search, Code } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function WebService() {
  return (
    <Layout>
      <SEO 
        title="Web Development" 
        description="Professionelle Webentwicklung von Gross ICT. Wir erstellen moderne, responsive und SEO-optimierte Webseiten für Ihren Erfolg."
        canonical="/services/web"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Web Development",
          "provider": {
            "@type": "ITService",
            "name": "Gross ICT"
          },
          "areaServed": "Switzerland",
          "description": "High-Performance Webseiten und Applikationen mit modernen Technologien."
        }}
      />
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[150px] pointer-events-none"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6 text-primary">
                <Globe className="h-4 w-4" /> Web Development
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient">
                Digitale Erlebnisse, <br />die begeistern.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Wir entwickeln moderne, hochperformante Webseiten und Applikationen, 
                die nicht nur gut aussehen, sondern auch Ergebnisse liefern.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <FeatureCard 
              icon={<Smartphone className="h-8 w-8 text-blue-400" />}
              title="Responsive Design"
              description="Perfekte Darstellung auf allen Geräten – vom Smartphone bis zum Desktop."
            />
            <FeatureCard 
              icon={<Search className="h-8 w-8 text-green-400" />}
              title="SEO Optimiert"
              description="Technische Optimierung für beste Rankings bei Google & Co."
            />
            <FeatureCard 
              icon={<Code className="h-8 w-8 text-purple-400" />}
              title="Modern Tech Stack"
              description="Einsatz neuester Technologien wie React, Next.js und Tailwind CSS."
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
              <div>
                <h2 className="text-3xl font-bold mb-6 text-white">Unser Prozess</h2>
                <div className="space-y-6">
                  <ProcessStep number="01" title="Analyse & Konzept" description="Wir verstehen Ihre Ziele und entwickeln eine maßgeschneiderte Strategie." />
                  <ProcessStep number="02" title="Design & Prototyping" description="Visuelle Gestaltung, die Ihre Marke perfekt repräsentiert." />
                  <ProcessStep number="03" title="Entwicklung" description="Sauberer Code und performante Umsetzung." />
                  <ProcessStep number="04" title="Launch & Support" description="Sicherer Go-Live und langfristige Betreuung." />
                </div>
              </div>
              <div className="relative h-[400px] rounded-2xl overflow-hidden bg-black/50 border border-white/10">
                <div className="absolute inset-0 bg-gradient-to-br from-primary/20 to-transparent"></div>
                <div className="absolute inset-0 flex items-center justify-center">
                  <div className="text-center">
                    <div className="text-6xl font-bold text-white mb-2">100%</div>
                    <div className="text-muted-foreground">Performance Score</div>
                  </div>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-20 text-center">
            <h2 className="text-3xl font-bold mb-8 text-white">Bereit für Ihre neue Webseite?</h2>
            <Link href="/contact">
              <Button size="lg" className="h-14 px-10 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-lg">
                Projekt anfragen <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function FeatureCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors">
      <div className="mb-6 p-3 bg-black/30 rounded-2xl w-fit border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}

function ProcessStep({ number, title, description }: { number: string, title: string, description: string }) {
  return (
    <div className="flex gap-6">
      <div className="text-2xl font-bold text-white/20">{number}</div>
      <div>
        <h4 className="text-lg font-bold text-white mb-1">{title}</h4>
        <p className="text-muted-foreground text-sm">{description}</p>
      </div>
    </div>
  );
}
