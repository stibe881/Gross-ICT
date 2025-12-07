import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowRight, Network, Wifi, Server, Lock } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function NetworkService() {
  return (
    <Layout>
      <SEO 
        title="Netzwerk & Infrastruktur" 
        description="Professionelle Netzwerklösungen von Gross ICT. Wir planen und realisieren sichere, skalierbare Netzwerke, Server-Infrastrukturen und WLAN-Lösungen."
        canonical="/services/network"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "Service",
          "serviceType": "Network Services",
          "provider": {
            "@type": "ITService",
            "name": "Gross ICT"
          },
          "areaServed": "Switzerland",
          "description": "Sichere und skalierbare Netzwerklösungen, Server-Konfiguration und WLAN."
        }}
      />
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-green-500/5 blur-[150px] pointer-events-none"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6 text-green-400">
                <Network className="h-4 w-4" /> Netzwerk & Infrastruktur
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient">
                Verbindungen, auf die <br />Sie bauen können.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Von der Verkabelung bis zur Cloud-Anbindung. Wir planen und realisieren
                Netzwerke, die sicher, schnell und skalierbar sind.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <NetworkCard 
              icon={<Wifi className="h-8 w-8 text-green-400" />}
              title="WLAN Lösungen"
              description="Flächendeckendes, schnelles WLAN für Büros, Hotels und öffentliche Bereiche."
            />
            <NetworkCard 
              icon={<Server className="h-8 w-8 text-blue-400" />}
              title="Server & Storage"
              description="Zentrale Datenspeicherung und Server-Virtualisierung für maximale Effizienz."
            />
            <NetworkCard 
              icon={<Lock className="h-8 w-8 text-red-400" />}
              title="Network Security"
              description="Firewalls, VPNs und Zugriffskontrollen zum Schutz Ihrer sensiblen Daten."
            />
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-center bg-white/5 border border-white/10 rounded-3xl p-8 md:p-12">
            <div>
              <h2 className="text-3xl font-bold mb-6 text-white">Client & Server Konfiguration</h2>
              <p className="text-muted-foreground mb-6 leading-relaxed">
                Eine solide IT-Infrastruktur beginnt bei der korrekten Konfiguration. Wir richten Ihre
                Arbeitsplätze und Server so ein, dass sie perfekt in Ihre Arbeitsabläufe passen.
              </p>
              <ul className="space-y-4 mb-8">
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-xs">✓</div>
                  Automatisierte Software-Verteilung
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-xs">✓</div>
                  Zentrales Benutzer-Management (AD/LDAP)
                </li>
                <li className="flex items-center gap-3 text-gray-300">
                  <div className="h-6 w-6 rounded-full bg-green-500/20 flex items-center justify-center text-green-500 text-xs">✓</div>
                  Backup-Strategien & Disaster Recovery
                </li>
              </ul>
              <Link href="/contact">
                <Button variant="outline" className="border-white/20 text-white hover:bg-white/10">
                  Beratungstermin vereinbaren
                </Button>
              </Link>
            </div>
            <div className="relative h-[300px] lg:h-full min-h-[300px] rounded-2xl overflow-hidden bg-black/50 border border-white/10 flex items-center justify-center">
               {/* Abstract Network Visualization Placeholder */}
               <div className="absolute inset-0 flex items-center justify-center opacity-30">
                 <div className="w-64 h-64 border border-green-500/30 rounded-full animate-ping duration-[3000ms]"></div>
                 <div className="absolute w-48 h-48 border border-green-500/50 rounded-full animate-ping duration-[3000ms] delay-700"></div>
                 <div className="absolute w-32 h-32 border border-green-500/70 rounded-full animate-ping duration-[3000ms] delay-1000"></div>
               </div>
               <Network className="h-20 w-20 text-green-500 relative z-10" />
            </div>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function NetworkCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="group p-8 rounded-3xl bg-black/20 border border-white/10 hover:bg-white/5 transition-all hover:-translate-y-1">
      <div className="mb-6">{icon}</div>
      <h3 className="text-xl font-bold mb-3 text-white group-hover:text-green-400 transition-colors">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
