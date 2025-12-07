import Layout from "@/components/Layout";
import Scene3D from "@/components/Scene3D";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { ArrowRight, Monitor, Server, Network, ShieldCheck, Cpu, Globe } from "lucide-react";
import { Link } from "wouter";
import { motion } from "framer-motion";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.6 }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

export default function Home() {
  return (
    <Layout>
      <Scene3D />
      
      {/* Hero Section */}
      <section className="relative min-h-[80vh] flex items-center justify-center overflow-hidden">
        <div className="container relative z-10 grid grid-cols-1 lg:grid-cols-2 gap-12 items-center">
          <motion.div 
            initial="initial"
            animate="animate"
            variants={stagger}
            className="space-y-8"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-primary/10 text-primary text-sm font-medium border border-primary/20">
              <span className="relative flex h-2 w-2">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2 w-2 bg-primary"></span>
              </span>
              Ihr IT-Partner für die Zukunft
            </motion.div>
            
            <motion.h1 variants={fadeIn} className="text-5xl md:text-7xl font-heading font-bold leading-tight text-foreground">
              Technologie <br />
              <span className="text-transparent bg-clip-text bg-gradient-to-r from-primary to-primary/60">
                Verstehen & Verbinden
              </span>
            </motion.h1>
            
            <motion.p variants={fadeIn} className="text-xl text-muted-foreground max-w-lg leading-relaxed">
              Wir bieten professionelle ICT-Dienstleistungen von Webentwicklung bis hin zu komplexen Netzwerklösungen. Zuverlässig, modern und persönlich.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-wrap gap-4">
              <Link href="/contact">
                <Button size="lg" className="text-base px-8 h-12 rounded-full shadow-lg shadow-primary/20 hover:shadow-primary/40 transition-all">
                  Jetzt Kontaktieren <ArrowRight className="ml-2 h-4 w-4" />
                </Button>
              </Link>
              <Link href="/services/web">
                <Button variant="outline" size="lg" className="text-base px-8 h-12 rounded-full bg-background/50 backdrop-blur-sm border-primary/20 hover:bg-primary/5">
                  Unsere Services
                </Button>
              </Link>
            </motion.div>
          </motion.div>
          
          {/* Right side is left empty for the 3D scene to shine through, 
              but we can add some floating stats or glass cards here later */}
          <div className="hidden lg:block h-full min-h-[400px]"></div>
        </div>
      </section>

      {/* Services Section */}
      <section className="py-24 relative">
        <div className="container">
          <div className="text-center max-w-2xl mx-auto mb-16">
            <h2 className="text-3xl md:text-4xl font-bold mb-4">Unsere Expertise</h2>
            <p className="text-muted-foreground text-lg">
              Maßgeschneiderte IT-Lösungen für Unternehmen und Privatpersonen.
              Alles aus einer Hand.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <ServiceCard 
              icon={<Globe className="h-10 w-10 text-primary" />}
              title="Webseiten Entwicklung"
              description="Moderne, responsive Webseiten, die Ihre Marke perfekt repräsentieren. Von der Konzeption bis zum Hosting."
              link="/services/web"
              image="/images/service-web.png"
            />
            <ServiceCard 
              icon={<Cpu className="h-10 w-10 text-primary" />}
              title="PC-Support & Wartung"
              description="Schnelle Hilfe bei Hardware- und Softwareproblemen. Installation, Reparatur und regelmäßige Wartung."
              link="/services/support"
              image="/images/service-support.png"
            />
            <ServiceCard 
              icon={<Network className="h-10 w-10 text-primary" />}
              title="Netzwerk & Server"
              description="Planung und Installation von sicheren Netzwerken. Konfiguration von Client-Geräten und Server-Infrastruktur."
              link="/services/network"
              image="/images/service-network.png"
            />
          </div>
        </div>
      </section>

      {/* Feature Section */}
      <section className="py-24 bg-secondary/30 border-y border-border/50">
        <div className="container grid grid-cols-1 lg:grid-cols-2 gap-16 items-center">
          <div className="relative">
            <div className="absolute inset-0 bg-primary/20 blur-3xl rounded-full opacity-20"></div>
            <img 
              src="/images/hero-bg.png" 
              alt="Abstract Tech Background" 
              className="relative rounded-2xl shadow-2xl border border-white/10 w-full object-cover aspect-video"
            />
            <div className="absolute -bottom-6 -right-6 bg-card p-6 rounded-xl shadow-xl border border-border/50 max-w-xs hidden md:block">
              <div className="flex items-center gap-4 mb-2">
                <div className="h-10 w-10 rounded-full bg-green-500/10 flex items-center justify-center text-green-500">
                  <ShieldCheck className="h-6 w-6" />
                </div>
                <div>
                  <p className="font-bold text-sm">Sicherheit garantiert</p>
                  <p className="text-xs text-muted-foreground">24/7 Monitoring</p>
                </div>
              </div>
            </div>
          </div>
          
          <div className="space-y-8">
            <h2 className="text-3xl md:text-4xl font-bold">Warum Gross ICT?</h2>
            <div className="space-y-6">
              <FeatureItem 
                title="Persönliche Beratung" 
                description="Wir nehmen uns Zeit, Ihre Bedürfnisse zu verstehen und bieten keine Lösungen von der Stange."
              />
              <FeatureItem 
                title="Technische Exzellenz" 
                description="Unser Team ist stets auf dem neuesten Stand der Technik und bildet sich kontinuierlich weiter."
              />
              <FeatureItem 
                title="Schnelle Reaktionszeiten" 
                description="Wenn es brennt, sind wir da. Unser Support reagiert schnell und effizient auf Ihre Anliegen."
              />
            </div>
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-24">
        <div className="container">
          <div className="bg-primary/5 border border-primary/20 rounded-3xl p-12 text-center relative overflow-hidden">
            <div className="absolute top-0 left-0 w-full h-full bg-[url('/images/hero-bg.png')] opacity-5 bg-cover bg-center"></div>
            <div className="relative z-10 max-w-2xl mx-auto space-y-6">
              <h2 className="text-3xl md:text-4xl font-bold">Bereit für das nächste Level?</h2>
              <p className="text-lg text-muted-foreground">
                Lassen Sie uns gemeinsam Ihre IT-Infrastruktur optimieren oder Ihren neuen Webauftritt realisieren.
              </p>
              <Link href="/contact">
                <Button size="lg" className="mt-4 text-base px-10 py-6 rounded-full shadow-xl shadow-primary/20">
                  Kostenloses Erstgespräch vereinbaren
                </Button>
              </Link>
            </div>
          </div>
        </div>
      </section>
    </Layout>
  );
}

function ServiceCard({ icon, title, description, link, image }: { icon: React.ReactNode, title: string, description: string, link: string, image: string }) {
  return (
    <Link href={link}>
      <Card className="group h-full cursor-pointer border-border/50 bg-card/50 backdrop-blur-sm hover:bg-card hover:shadow-xl hover:shadow-primary/5 transition-all duration-300 overflow-hidden">
        <div className="h-48 overflow-hidden bg-secondary/50 relative">
          <div className="absolute inset-0 bg-primary/10 mix-blend-overlay z-10 group-hover:opacity-0 transition-opacity"></div>
          <img src={image} alt={title} className="w-full h-full object-cover transition-transform duration-500 group-hover:scale-110" />
        </div>
        <CardHeader>
          <div className="mb-4 p-3 bg-background rounded-xl w-fit shadow-sm border border-border/50 group-hover:scale-110 transition-transform duration-300 group-hover:text-primary">
            {icon}
          </div>
          <CardTitle className="text-xl group-hover:text-primary transition-colors">{title}</CardTitle>
        </CardHeader>
        <CardContent>
          <CardDescription className="text-base leading-relaxed">
            {description}
          </CardDescription>
          <div className="mt-6 flex items-center text-sm font-medium text-primary opacity-0 -translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            Mehr erfahren <ArrowRight className="ml-2 h-4 w-4" />
          </div>
        </CardContent>
      </Card>
    </Link>
  );
}

function FeatureItem({ title, description }: { title: string, description: string }) {
  return (
    <div className="flex gap-4">
      <div className="h-6 w-6 rounded-full bg-primary/20 flex items-center justify-center shrink-0 mt-1">
        <div className="h-2 w-2 rounded-full bg-primary"></div>
      </div>
      <div>
        <h3 className="font-bold text-lg mb-1">{title}</h3>
        <p className="text-muted-foreground">{description}</p>
      </div>
    </div>
  );
}
