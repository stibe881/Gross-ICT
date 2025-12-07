import Layout from "@/components/Layout";
import { Button } from "@/components/ui/button";
import { ArrowRight, Cpu, Clock, ShieldCheck, Wrench } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function SupportService() {
  return (
    <Layout>
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-blue-500/5 blur-[150px] pointer-events-none"></div>
        
        <div className="container relative z-10">
          <div className="max-w-4xl mx-auto text-center mb-20">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6 text-blue-400">
                <Cpu className="h-4 w-4" /> IT Support & Wartung
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient">
                Technik, die einfach <br />funktioniert.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Wir kümmern uns um Ihre IT, damit Sie sich auf Ihr Geschäft konzentrieren können.
                Schnell, kompetent und persönlich.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-20">
            <ServiceDetailCard 
              title="PC & Mac Support"
              description="Egal ob Windows oder macOS – wir lösen Hardware- und Softwareprobleme schnell und effizient."
              features={["Fehlerdiagnose & Reparatur", "Software-Installation", "Virus-Entfernung", "Datenrettung"]}
              icon={<Wrench className="h-6 w-6 text-blue-400" />}
            />
            <ServiceDetailCard 
              title="Wartungsverträge"
              description="Proaktive Überwachung und regelmäßige Updates für maximale Ausfallsicherheit."
              features={["24/7 Monitoring", "Automatische Updates", "Priorisierter Support", "Monatliche Berichte"]}
              icon={<ShieldCheck className="h-6 w-6 text-green-400" />}
            />
          </div>

          <div className="bg-blue-500/5 border border-blue-500/10 rounded-3xl p-12 text-center">
            <Clock className="h-12 w-12 text-blue-400 mx-auto mb-6" />
            <h2 className="text-3xl font-bold mb-4 text-white">Schnelle Reaktionszeiten</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Bei kritischen Problemen sind wir sofort zur Stelle. Unser Remote-Support ermöglicht
              oft eine Lösung innerhalb weniger Minuten.
            </p>
            <Link href="/contact">
              <Button size="lg" className="h-12 px-8 rounded-full bg-blue-500 text-white hover:bg-blue-600 font-bold">
                Support anfordern
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ServiceDetailCard({ title, description, features, icon }: { title: string, description: string, features: string[], icon: React.ReactNode }) {
  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:border-white/20 transition-all">
      <div className="flex items-center gap-4 mb-6">
        <div className="p-3 bg-white/5 rounded-xl border border-white/5">
          {icon}
        </div>
        <h3 className="text-2xl font-bold text-white">{title}</h3>
      </div>
      <p className="text-muted-foreground mb-8 leading-relaxed">{description}</p>
      <ul className="space-y-3">
        {features.map((feature, i) => (
          <li key={i} className="flex items-center gap-3 text-sm text-gray-300">
            <div className="h-1.5 w-1.5 rounded-full bg-primary"></div>
            {feature}
          </li>
        ))}
      </ul>
    </div>
  );
}
