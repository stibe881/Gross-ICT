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
import { useLanguage } from "@/contexts/LanguageContext";
import NewsSection from "@/components/NewsSection";
import Newsletter from "@/components/Newsletter";
import PartnerMarquee from "@/components/PartnerMarquee";
import ProcessTimeline from "@/components/ProcessTimeline";
import FAQSection from "@/components/FAQSection";
import SecurityCheck from "@/components/SecurityCheck";
import StatusDashboard from "@/components/StatusDashboard";

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
  const { t } = useLanguage();
  const { scrollYProgress } = useScroll({
    target: ref,
    offset: ["start end", "end start"]
  });

  const x1 = useTransform(scrollYProgress, [0, 1], [0, 100]);
  const x2 = useTransform(scrollYProgress, [0, 1], [0, -100]);
  const color = useTransform(scrollYProgress, [0, 0.5], ["#1a1a1a", "#FAC863"]); // Dark to corporate orange

  return (
    <motion.h1 ref={ref} variants={fadeIn} className="text-[12vw] md:text-8xl lg:text-9xl font-bold tracking-tighter leading-[1.1] overflow-visible py-4 px-2">
      <motion.span style={{ x: x1 }} className="block text-foreground drop-shadow-sm whitespace-nowrap">{t.hero.title_prefix}</motion.span>
      <motion.span style={{ x: x2, color }} className="block text-transparent bg-clip-text bg-gradient-to-r from-primary via-foreground to-primary bg-[length:200%_auto] animate-gradient whitespace-nowrap">{t.hero.title_suffix}</motion.span>
    </motion.h1>
  );
}

export default function Home() {
  const ref = useRef(null);
  const { t } = useLanguage();
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
            <motion.div variants={fadeIn} className="inline-flex items-center gap-3 px-5 py-2 rounded-full bg-primary/10 border border-primary/20 text-sm font-medium backdrop-blur-xl hover:bg-primary/20 transition-all cursor-default shadow-sm">
              <span className="relative flex h-2.5 w-2.5">
                <span className="animate-ping absolute inline-flex h-full w-full rounded-full bg-primary opacity-75"></span>
                <span className="relative inline-flex rounded-full h-2.5 w-2.5 bg-primary"></span>
              </span>
              <span className="text-primary tracking-wide uppercase text-xs font-bold">{t.hero.badge}</span>
            </motion.div>

            <ScrollTypography />

            <motion.p variants={fadeIn} className="text-xl md:text-2xl text-foreground/80 max-w-3xl mx-auto leading-relaxed font-light">
              {t.hero.subtitle}
            </motion.p>

            <motion.div variants={fadeIn} className="flex flex-col items-center gap-8 pt-8">
              <div className="flex flex-col sm:flex-row justify-center gap-6">
                <Button asChild size="lg" className="h-14 px-10 rounded-full bg-primary text-primary-foreground hover:opacity-90 font-bold text-lg transition-all shadow-lg shadow-primary/20 hover:scale-105">
                  <Link href="/contact">
                    {t.hero.cta_primary} <ArrowRight className="ml-2 h-5 w-5" />
                  </Link>
                </Button>
                <Button asChild variant="outline" size="lg" className="h-14 px-10 rounded-full border-primary/20 bg-white/50 hover:bg-primary/5 text-foreground backdrop-blur-md transition-all hover:scale-105 font-medium text-lg">
                  <Link href="/services/web">
                    {t.hero.cta_secondary}
                  </Link>
                </Button>
              </div>

              <div className="flex gap-4 text-sm text-foreground/60">
                <a href="https://wa.me/41794140616" target="_blank" rel="noopener noreferrer" className="flex items-center gap-2 hover:text-primary transition-colors">
                  <MessageCircle className="h-4 w-4" /> {t.hero.whatsapp}
                </a>
                <span className="text-border">|</span>
                <Link href="/contact" className="flex items-center gap-2 hover:text-primary transition-colors cursor-pointer">
                  <Calendar className="h-4 w-4" /> {t.hero.schedule}
                </Link>
              </div>
            </motion.div>
          </motion.div>
        </motion.div>

        {/* Modern Scroll Indicator */}
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 1.5, duration: 1 }}
          className="absolute bottom-12 left-1/2 -translate-x-1/2 flex flex-col items-center gap-3 text-muted-foreground/30 text-xs tracking-[0.2em] uppercase font-medium cursor-pointer hover:text-primary transition-colors"
          onClick={() => window.scrollTo({ top: window.innerHeight, behavior: 'smooth' })}
        >
          <span>{t.hero.scroll}</span>
          <div className="w-[1px] h-16 bg-gradient-to-b from-border to-transparent"></div>
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
            style={{ y: useTransform(scrollYProgress, [0, 1], [0, -50]) }}
            className="mb-16"
          >
            <h2 className="text-4xl md:text-5xl font-bold mb-6 text-foreground">{t.services.title}</h2>
            <p className="text-xl text-foreground/60 max-w-2xl">
              {t.services.subtitle}
            </p>
          </motion.div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 md:gap-6 auto-rows-[250px] md:auto-rows-[300px]">
            {/* Large Card - Web */}
            <Spotlight className="col-span-1 md:col-span-2 md:row-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-foreground/30 tracking-widest uppercase">SYS.01 // WEB_CORE</div>
              <BentoCard
                className="h-full border-none bg-transparent"
                title={t.services.web.title}
                description={t.services.web.desc}
                icon={<Globe className="h-8 w-8 text-primary" />}
                bgImage="/images/service-web.webp"
                href="/services/web"
                delay={0.1}
              />
            </Spotlight>

            {/* Medium Card - Support */}
            <Spotlight className="col-span-1 md:col-span-1 md:row-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-foreground/30 tracking-widest uppercase">SYS.02 // SUPPORT</div>
              <BentoCard
                className="h-full border-none bg-transparent"
                title={t.services.support.title}
                description={t.services.support.desc}
                icon={<Cpu className="h-8 w-8 text-blue-400" />}
                bgImage="/images/service-support.webp"
                href="/services/support"
                delay={0.2}
              />
            </Spotlight>

            {/* Small Cards Row */}
            <Spotlight className="col-span-1 md:col-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-foreground/30 tracking-widest uppercase">SEC.02 // SHIELD</div>
              <BentoCard
                className="h-full border-none bg-transparent"
                title={t.services.security.title}
                description={t.services.security.desc}
                icon={<Shield className="h-6 w-6 text-purple-400" />}
                bgImage="/images/service-security.webp"
                href="/services/network"
                delay={0.4}
              />
            </Spotlight>

            <Spotlight className="col-span-1 md:col-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-foreground/30 tracking-widest uppercase">OPT.03 // SPEED</div>
              <BentoCard
                className="h-full border-none bg-transparent"
                title={t.services.performance.title}
                description={t.services.performance.desc}
                icon={<Zap className="h-6 w-6 text-yellow-400" />}
                bgImage="/images/service-performance.webp"
                href="/services/web"
                delay={0.5}
              />
            </Spotlight>

            <Spotlight className="col-span-1 md:col-span-1">
              <div className="absolute top-4 right-4 text-[10px] font-mono text-foreground/30 tracking-widest uppercase">DAT.04 // INSIGHT</div>
              <BentoCard
                className="h-full border-none bg-transparent"
                title={t.services.analytics.title}
                description={t.services.analytics.desc}
                icon={<BarChart3 className="h-6 w-6 text-pink-400" />}
                bgImage="/images/service-analytics.webp"
                href="/services/web"
                delay={0.6}
              />
            </Spotlight>
          </div>
        </div>
      </section>

      <FAQSection />

      <SecurityCheck />

      <StatusDashboard />

      <NewsSection />
      <PartnerMarquee />
      <Newsletter />
    </Layout>
  );
}

function BentoCard({ className, title, description, icon, bgImage, href, delay }: any) {
  return (
    <Link href={href}>
      <motion.div
        initial={{ opacity: 0, scale: 0.95 }}
        whileInView={{ opacity: 1, scale: 1 }}
        viewport={{ once: true }}
        transition={{ duration: 0.4, delay }}
        className={cn(
          "group relative overflow-hidden rounded-3xl border border-border bg-white/50 backdrop-blur-sm p-6 transition-all hover:border-primary/50 hover:shadow-2xl hover:shadow-primary/5 cursor-pointer",
          className
        )}
      >
        {/* Background Image with Overlay */}
        <div className="absolute inset-0 z-0">
          <div className="absolute inset-0 bg-gradient-to-t from-white via-white/40 to-transparent z-10" />
          <img
            src={bgImage}
            alt={title}
            className="h-full w-full object-cover transition-transform duration-700 group-hover:scale-110 opacity-30 group-hover:opacity-20"
          />
        </div>

        {/* Content */}
        <div className="relative z-20 h-full flex flex-col justify-end">
          <div className="mb-auto p-3 rounded-2xl bg-black/5 w-fit backdrop-blur-md border border-border group-hover:bg-primary/20 group-hover:border-primary/30 transition-colors">
            {icon}
          </div>

          <div className="space-y-2 transform transition-transform duration-300 group-hover:-translate-y-2">
            <h3 className="text-2xl font-bold text-foreground group-hover:text-primary transition-colors">{title}</h3>
            <p className="text-sm text-foreground/60 line-clamp-2 group-hover:text-foreground/80 transition-colors">
              {description}
            </p>
          </div>

          {/* Hover Indicator */}
          <div className="absolute bottom-6 right-6 opacity-0 transform translate-x-4 group-hover:opacity-100 group-hover:translate-x-0 transition-all duration-300">
            <div className="p-2 rounded-full bg-primary text-primary-foreground shadow-sm">
              <ArrowRight className="h-4 w-4" />
            </div>
          </div>
        </div>
      </motion.div>
    </Link>
  );
}
