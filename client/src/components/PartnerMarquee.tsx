import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";

const partners = [
  { name: "Microsoft", logo: "/images/partners/microsoft.png" },
  { name: "Cisco", logo: "/images/partners/cisco.png" },
  { name: "React", logo: "/images/partners/react.png" },
  { name: "Hetzner", logo: "/images/partners/hetzner.png" },
  { name: "Hosttech", logo: "/images/partners/hosttech.jpg" },
  { name: "VMware", logo: "/images/partners/vmware.png" },
  { name: "Docker", logo: "/images/partners/docker.png" },
  { name: "HP", logo: "/images/partners/hp.png" },
  { name: "Lenovo", logo: "/images/partners/lenovo.png" },
  { name: "Swisscom", logo: "/images/partners/swisscom.png" },
  { name: "Ubiquiti", logo: "/images/partners/ubiquiti.png" },
  { name: "PRTG", logo: "/images/prtg.png" },
];

export default function PartnerMarquee() {
  const { language } = useLanguage();

  return (
    <section className="py-16 bg-background border-y border-border/50 overflow-hidden relative">
      <div className="container mx-auto px-4 mb-8 text-center">
        <p className="text-sm font-medium text-muted-foreground uppercase tracking-widest">
          {language === 'de' ? 'Unsere Technologie-Partner' : 'Our Technology Partners'}
        </p>
      </div>

      <div className="relative flex overflow-x-hidden group">
        <div className="flex animate-marquee whitespace-nowrap">
          {partners.map((partner, index) => (
            <div
              key={`p1-${index}`}
              className="mx-8 w-32 h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-w-full max-h-full object-contain invert dark:invert-0"
              />
            </div>
          ))}
        </div>

        <div className="absolute top-0 flex animate-marquee2 whitespace-nowrap">
          {partners.map((partner, index) => (
            <div
              key={`p2-${index}`}
              className="mx-8 w-32 h-16 flex items-center justify-center grayscale hover:grayscale-0 transition-all duration-300 opacity-60 hover:opacity-100"
            >
              <img
                src={partner.logo}
                alt={partner.name}
                className="max-w-full max-h-full object-contain invert dark:invert-0"
              />
            </div>
          ))}
        </div>
      </div>
      
      {/* Gradient Fade Edges */}
      <div className="absolute top-0 left-0 w-20 h-full bg-gradient-to-r from-background to-transparent z-10 pointer-events-none" />
      <div className="absolute top-0 right-0 w-20 h-full bg-gradient-to-l from-background to-transparent z-10 pointer-events-none" />
    </section>
  );
}
