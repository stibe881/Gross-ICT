import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { ArrowRight, Users, Target, Award } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

export default function About() {
  return (
    <Layout>
      <SEO 
        title="Über uns" 
        description="Erfahren Sie mehr über Gross ICT. Wir sind Ihr kompetenter Partner für IT-Lösungen, Webentwicklung und Netzwerkinfrastruktur in der Schweiz."
        canonical="/about"
        structuredData={{
          "@context": "https://schema.org",
          "@type": "AboutPage",
          "mainEntity": {
            "@type": "ITService",
            "name": "Gross ICT",
            "description": "Kompetenz, Zuverlässigkeit und Innovation für Ihre digitale Transformation.",
            "foundingLocation": {
              "@type": "Place",
              "name": "Zell LU"
            }
          }
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
                <Users className="h-4 w-4" /> Über Gross ICT
              </div>
              <h1 className="text-5xl md:text-7xl font-bold mb-6 text-gradient">
                Wir verbinden Menschen <br />durch Technologie.
              </h1>
              <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
                Gross ICT steht für Kompetenz, Zuverlässigkeit und Innovation. 
                Wir sind Ihr Partner für die digitale Transformation.
              </p>
            </motion.div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-20">
            <ValueCard 
              icon={<Target className="h-8 w-8 text-blue-400" />}
              title="Unsere Mission"
              description="Wir machen komplexe IT-Lösungen einfach und zugänglich für Unternehmen jeder Grösse."
            />
            <ValueCard 
              icon={<Users className="h-8 w-8 text-green-400" />}
              title="Unser Team"
              description="Ein Netzwerk aus erfahrenen Spezialisten, die ihre Leidenschaft für Technik teilen."
            />
            <ValueCard 
              icon={<Award className="h-8 w-8 text-purple-400" />}
              title="Qualität"
              description="Wir setzen auf nachhaltige Lösungen und höchste Standards bei der Umsetzung."
            />
          </div>

          <div className="bg-white/5 border border-white/10 rounded-3xl p-12 text-center">
            <h2 className="text-3xl font-bold mb-6 text-white">Lernen Sie uns kennen</h2>
            <p className="text-muted-foreground max-w-2xl mx-auto mb-8">
              Jedes Projekt beginnt mit einem guten Gespräch. Lassen Sie uns herausfinden,
              wie wir Sie unterstützen können.
            </p>
            <Link href="/contact">
              <Button size="lg" className="h-12 px-8 rounded-full bg-white text-black hover:bg-gray-200 font-bold">
                Kontakt aufnehmen <ArrowRight className="ml-2 h-4 w-4" />
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </Layout>
  );
}

function ValueCard({ icon, title, description }: { icon: React.ReactNode, title: string, description: string }) {
  return (
    <div className="p-8 rounded-3xl bg-white/5 border border-white/10 hover:bg-white/10 transition-colors text-center">
      <div className="mb-6 p-4 bg-black/30 rounded-full w-fit mx-auto border border-white/5">
        {icon}
      </div>
      <h3 className="text-xl font-bold mb-3 text-white">{title}</h3>
      <p className="text-muted-foreground leading-relaxed">{description}</p>
    </div>
  );
}
