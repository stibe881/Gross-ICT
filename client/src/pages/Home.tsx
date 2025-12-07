import Layout from "@/components/Layout";
import Scene3D from "@/components/Scene3D";
import AnimatedBackground from "@/components/AnimatedBackground";
import Spotlight from "@/components/Spotlight";
import SEO from "@/components/SEO";

import { Button } from "@/components/ui/button";
import { ArrowRight, Globe, Cpu, Network, Shield, Zap, BarChart3, MessageCircle, Calendar } from "lucide-react";
import { Link } from "wouter";
import { motion, useScroll, useTransform } from "framer-motion";
import { cn } from "@/lib/utils";
import { useRef } from "react";

const fadeIn = {
  initial: { opacity: 0, y: 20 },
  animate: { opacity: 1, y: 0 },
  transition: { duration: 0.5, ease: "easeOut" }
};

const stagger = {
  animate: {
    transition: {
      staggerChildren: 0.1
    }
  }
};

function ScrollTypography() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const color = useTransform(scrollYProgress, [0, 0.5], ["#ffffff", "#ffd700"]);

  return (
    <motion.h1 ref={ref} variants={fadeIn} className="text-6xl md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[0.9] overflow-hidden py-4">
      <motion.span style={{ x: x1 }} className="block text-white drop-shadow-2xl">Future-Proof</motion.span>
      <motion.span style={{ x: x2, color }} className="block text-transparent bg-clip-text bg-gradient-to-r from-[#ffd700] via-[#fff] to-[#ffd700] bg-[length:200%_auto] animate-gradient">Infrastructure.</motion.span>
    </motion.h1>
  );
}

export default function Home() {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start start", "end start"]
  });

  const y = useTransform(scrollYProgress, [0, 1], ["0%", "50%"]);
  const opacity = useTransform(scrollYProgress, [0, 0.5], [1, 0]);

  return (
    <Layout>
      <SEO 
        title="Home" 
        description="Gross ICT - Ihr Partner für Next-Gen IT-Lösungen, Webentwicklung und Netzwerkinfrastruktur in Zell LU."
        structuredData={{
          "@context": "https://schema.org",
          "@type": "ITService",
          "name": "Gross ICT",
          "address": {
            "@type": "PostalAddress",
            "streetAddress": "Neuhushof 3",
            "addressLocality": "Zell",
            "postalCode": "6144",
            "addressRegion": "LU",
            "addressCountry": "CH"
          },
          "telephone": "+41 79 414 06 16",
          "url": "https://gross-ict.ch",
          "priceRange": "$$"
        }}
      />
      <AnimatedBackground />
      <Scene3D />
      
      {/* Hero Section */}
      <section ref={ref} className="relative min-h-screen flex flex-col items-center justify-center overflow-hidden w-full">
        {/* Network Visualization Background */}
        <div className="absolute inset-0 z-0 opacity-30 pointer-events-none">
          <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,#000_100%)] z-10"></div>
          <svg className="w-full h-full" xmlns="http://www.w3.org/2000/svg">
            <defs>
              <pattern id="network-pattern" x="0" y="0" width="100" height="100" patternUnits="userSpaceOnUse">
                <circle cx="2" cy="2" r="1" className="fill-white/20" />
                <path d="M2 2 L102 102 M2 102 L102 2" className="stroke-white/5" strokeWidth="0.5" />
              </pattern>
            </defs>
            <rect width="100%" height="100%" fill="url(#network-pattern)" />
          </svg>
        </div>

        <motion.div 
          style={{ y, opacity }}
          className="w-full px-4 md:px-8 relative z-10 flex flex-col items-center text-center"
        >
          <motion.div 
            initial="initial"
            whileInView="animate"
            viewport={{ once: true }}
            variants={stagger}
            className="space-y-12 max-w-[90vw] mx-auto"
          >
            <motion.div variants={fadeIn} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-white/5 border border-white/10 text-sm font-medium backdrop-blur-xl hover:bg-white/10 transition-all cursor-default shadow-lg shadow-black/20">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-gray-200 tracking-wide uppercase text-xs font-bold">Next-Gen IT Services</span>
            </motion.div>
            
            <ScrollTypography />
            
            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-gray-400 max-w-3xl mx-auto leading-relaxed font-light">
              Wir transformieren Unternehmen mit modernster Web-Technologie, 
              robusten Netzwerken und proaktivem Support.
            </motion.p>
            
            <motion.div variants={fadeIn} className="flex flex-col items-center gap-8 pt-8">
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Link href="/contact">
                  <Button size="lg" className="h-14 px-10 rounded-full bg-white text-black hover:bg-gray-100 font-bold text-lg transition-all shadow-[0_0_40px_-10px_rgba(255,255,255,0.3)] hover:scale-105 hover:shadow-[0_0_60px_-15px_rgba(255,255,255,0.4)]">
                    Start Project <ArrowRight className="ml-2 h-5 w-5" />
                  </Button>
                </Link>
                <Link href="/services/web">
                  <Button variant="outline" size="lg" className="h-14 px-10 rounded-full border-white/10 bg-white/5 hover:bg-white/10 text-white backdrop-blur-md transition-all hover:scale-105 font-medium text-lg">
                    Explore Services
                  </Button>
                </Link>
              </div>
              
              <div className="flex gap-4 text-sm text-muted-foreground">
                <a href="https://wa.me/41794140616" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-white transition-colors">
                  <MessageCircle className="h-4 w-4" /> WhatsApp
                </a>
                <span className="text-white/20">|</span>
                <a href="mailto:info@gross-ict.ch" className="flex items-center gap-2 hover:text-white transition-colors">
                  <Calendar className="h-4 w-4" /> Termin vereinbaren
                </a>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>
        
        {/* Modern Scroll Indicator */}
        <motion.div 
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-white/30 text-xs tracking-[0.2em] uppercase font-medium"
        >
          <span>Scroll</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-white/30 to-transparent"></div>
        </motion.div>
      </section>



      {/* Bento Grid Services Section */}
      <section className="py-32 relative">
        <div className="container">
          <motion.div 
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true }}
            transition={{ duration: 0.6 }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-gradient">Unsere Expertise</h2>
            <p className="text-xl text-muted-foreground max-w-2xl">
              Ein ganzheitliches Ökosystem für Ihre digitale Performance.
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
            {/* Large Card - Web */}
            <Spotlight className="col-span-1 md:col-span-2 md:row-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-white/30 tracking-widest">SYS.01 // WEB_CORE</div>
              <BentoCard 
                className="h-full border-none bg-transparent"
                title="Web Development"
                description="High-Performance Webseiten und Applikationen. Gebaut mit Next-Gen Technologien für maximale Geschwindigkeit und SEO-Ranking."
                icon={<Globe className="h-8 w-8 text-primary" />}
                bgImage="/images/service-web.png"
                href="/services/web"
                delay={0.1}
              />
            </Spotlight>
            
            {/* Medium Card - Support */}
            <Spotlight className="col-span-1 md:col-span-1 md:row-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-white/30 tracking-widest">SYS.02 // SUPPORT</div>
              <BentoCard 
                className="h-full border-none bg-transparent"
                title="IT Support"
                description="24/7 Monitoring und schnelle Hilfe bei allen Hardware-Problemen."
                icon={<Cpu className="h-8 w-8 text-blue-400" />}
                bgImage="/images/service-support.png"
                href="/services/support"
                delay={0.2}
              />
            </Spotlight>

            {/* Small Cards Row */}
            <Spotlight className="col-span-1 md:col-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-white/30 tracking-widest">SEC.02 // SHIELD</div>
              <BentoCard 
                className="h-full border-none bg-transparent"
                title="Security"
                description="Umfassender Schutz vor Cyber-Bedrohungen durch modernste Firewalls, Verschlüsselung und proaktives Monitoring Ihrer gesamten Infrastruktur."
                icon={<Shield className="h-6 w-6 text-purple-400" />}
                bgImage="/images/service-security.png"
                href="/services/network"
                delay={0.4}
              />
            </Spotlight>

            <Spotlight className="col-span-1 md:col-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-white/30 tracking-widest">OPT.03 // SPEED</div>
              <BentoCard 
                className="h-full border-none bg-transparent"
                title="Performance"
                description="Maximale Geschwindigkeit für Ihre Systeme. Wir optimieren Ladezeiten, Datenbankabfragen und Server-Ressourcen für reibungslose Abläufe."
                icon={<Zap className="h-6 w-6 text-yellow-400" />}
                bgImage="/images/service-performance.png"
                href="/services/web"
                delay={0.5}
              />
            </Spotlight>

            <Spotlight className="col-span-1 md:col-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-white/30 tracking-widest">DAT.04 // INSIGHT</div>
              <BentoCard 
                className="h-full border-none bg-transparent"
                title="Analytics"
                description="Verwandeln Sie Daten in Wissen. Unsere Dashboards liefern Echtzeit-Einblicke in Nutzerverhalten und Systemstatus für fundierte Entscheidungen."
                icon={<BarChart3 className="h-6 w-6 text-pink-400" />}
                bgImage="/images/service-analytics.png"
                href="/services/web"
                delay={0.6}
              />
            </Spotlight>
          </div>
        </div>
      </section>

      {/* Stats / Trust Section */}
      <section className="py-24 border-y border-white/5 bg-white/[0.02]">
        <div className="container">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <StatItem number="99.9%" label="Uptime" delay={0} />
            <StatItem number="24/7" label="Support" delay={0.1} />
            <StatItem number="50+" label="Clients" delay={0.2} />
            <StatItem number="100%" label="Swiss Made" delay={0.3} />
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-32 relative overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[100px] rounded-full pointer-events-none"></div>
        <motion.div 
          initial={{ opacity: 0, scale: 0.9 }}
          whileInView={{ opacity: 1, scale: 1 }}
          viewport={{ once: true }}
          transition={{ duration: 0.6 }}
          className="container relative z-10 text-center"
        >
          <h2 className="text-4xl md:text-6xl font-bold mb-8 tracking-tight">
            Ready to <span className="text-primary">Upgrade?</span>
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10">
            Lassen Sie uns Ihre IT-Infrastruktur auf das nächste Level heben.
            Vereinbaren Sie heute ein unverbindliches Gespräch.
          </p>
          <Link href="/contact">
            <Button size="lg" className="h-14 px-10 rounded-full bg-white text-black hover:bg-gray-200 font-bold text-lg transition-all shadow-2xl shadow-white/10 hover:scale-105">
              Kontakt aufnehmen
            </Button>
          </Link>
        </motion.div>
      </section>
    </Layout>
  );
}

function BentoCard({ 
  className, 
  title, 
  description, 
  icon, 
  bgImage, 
  href,
  minimal = false,
  delay = 0
}: { 
  className?: string, 
  title: string, 
  description: string, 
  icon: React.ReactNode, 
  bgImage?: string,
  href: string,
  minimal?: boolean,
  delay?: number
}) {
  const ref = useRef(null);
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });
  
  const y = useTransform(scrollYProgress, [0, 1], ["-10%", "10%"]);

  return (
    <Link href={href}>
      <motion.div 
        ref={ref}
        initial={{ opacity: 0, scale: 0.9, filter: "blur(10px)" }}
        whileInView={{ opacity: 1, scale: 1, filter: "blur(0px)" }}
        viewport={{ once: true, margin: "-50px" }}
        transition={{ duration: 0.8, delay, ease: [0.22, 1, 0.36, 1] }}
        whileHover={{ scale: 0.98, y: -5 }}
        animate={{ y: [0, -5, 0] }}
        // @ts-ignore
        transition={{ 
          y: {
            duration: 4,
            repeat: Infinity,
            ease: "easeInOut",
            delay: Math.random() * 2
          },
          default: { duration: 0.5 }
        }}
        className={cn(
          "bento-card group relative flex flex-col justify-between p-6 cursor-pointer h-full overflow-hidden rounded-3xl border border-white/5 bg-black/40 backdrop-blur-sm",
          className
        )}
      >
        {bgImage && (
          <div className="absolute inset-0 z-0 overflow-hidden rounded-3xl">
            {/* Cinematic Vignette & Gradient */}
            <div className="absolute inset-0 bg-gradient-to-t from-black via-black/60 to-transparent z-20"></div>
            <div className="absolute inset-0 bg-[radial-gradient(circle_at_center,transparent_0%,rgba(0,0,0,0.4)_100%)] z-20"></div>
            
            {/* Film Grain Overlay */}
            <div className="absolute inset-0 opacity-[0.03] pointer-events-none z-30 mix-blend-overlay" 
                 style={{ backgroundImage: 'url("data:image/svg+xml,%3Csvg viewBox=%220 0 200 200%22 xmlns=%22http://www.w3.org/2000/svg%22%3E%3Cfilter id=%22noiseFilter%22%3E%3CfeTurbulence type=%22fractalNoise%22 baseFrequency=%220.65%22 numOctaves=%223%22 stitchTiles=%22stitch%22/%3E%3C/filter%3E%3Crect width=%22100%25%22 height=%22100%25%22 filter=%22url(%23noiseFilter)%22/%3E%3C/svg%3E")' }}>
            </div>

            <motion.img 
              src={bgImage} 
              alt={title} 
              loading="lazy"
              style={{ y }}
              className="w-full h-[120%] -top-[10%] absolute object-cover opacity-60"
              initial={{ scale: 1.1 }}
              whileHover={{ scale: 1.2 }}
              transition={{ duration: 1.2, ease: "easeOut" }}
            />
          </div>
        )}
        
        <div className="relative z-10">
          <motion.div 
            className="mb-4 p-3 bg-white/10 rounded-2xl w-fit backdrop-blur-md border border-white/10 group-hover:bg-white/20 transition-colors"
            whileHover={{ rotate: [0, -10, 10, -10, 0], scale: 1.1 }}
            transition={{ duration: 0.5 }}
          >
            {icon}
          </motion.div>
        </div>
        
        <div className="relative z-10">
          <h3 className={cn("font-bold mb-2 text-white group-hover:text-primary transition-colors", minimal ? "text-lg" : "text-2xl")}>
            {title}
          </h3>
          <p className={cn("text-muted-foreground leading-relaxed", minimal ? "text-sm line-clamp-2" : "text-base")}>
            {description}
          </p>
        </div>

        {/* Hover Glow Effect */}
        <div className="absolute inset-0 border-2 border-white/0 rounded-3xl group-hover:border-white/10 transition-all duration-500 pointer-events-none"></div>
        <div className="absolute inset-0 bg-primary/0 group-hover:bg-primary/5 transition-colors duration-500 rounded-3xl pointer-events-none"></div>
      </motion.div>
    </Link>
  );
}

function StatItem({ number, label, delay }: { number: string, label: string, delay: number }) {
  return (
    <motion.div 
      initial={{ opacity: 0, scale: 0.5 }}
      whileInView={{ opacity: 1, scale: 1 }}
      viewport={{ once: true }}
      transition={{ duration: 0.5, delay }}
      className="space-y-2"
    >
      <div className="text-4xl md:text-5xl font-bold text-white">{number}</div>
      <div className="text-sm text-muted-foreground uppercase tracking-wider font-medium">{label}</div>
    </motion.div>
  );
}
