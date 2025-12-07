import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, Monitor, Server, Network, LifeBuoy } from "lucide-react";
import { useState, useEffect } from "react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    return () => window.removeEventListener("scroll", handleScroll);
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Webseiten", path: "/services/web" },
    { name: "PC-Support", path: "/services/support" },
    { name: "Netzwerke", path: "/services/network" },
    { name: "Kontakt", path: "/contact" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground bg-transparent">
      <header
        className={cn(
          "fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b border-transparent",
          isScrolled ? "bg-background/80 backdrop-blur-md border-border/50 py-3 shadow-sm" : "bg-transparent py-6"
        )}
      >
        <div className="container flex items-center justify-between">
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group">
              <img 
                src="/images/logo.png" 
                alt="Gross ICT Logo" 
                className="h-10 w-auto transition-transform duration-300 group-hover:scale-105" 
              />
              <span className={cn(
                "text-xl font-heading font-bold tracking-tight transition-colors",
                isScrolled ? "text-foreground" : "text-foreground"
              )}>
                Gross <span className="text-primary">ICT</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden md:flex items-center gap-8">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span className={cn(
                  "text-sm font-medium transition-colors hover:text-primary cursor-pointer relative group",
                  location === item.path ? "text-primary" : "text-muted-foreground"
                )}>
                  {item.name}
                  <span className={cn(
                    "absolute -bottom-1 left-0 w-0 h-0.5 bg-primary transition-all duration-300 group-hover:w-full",
                    location === item.path ? "w-full" : ""
                  )} />
                </span>
              </Link>
            ))}
            <Link href="/contact">
              <button className="bg-primary text-primary-foreground px-5 py-2 rounded-full text-sm font-semibold hover:bg-primary/90 transition-all shadow-lg hover:shadow-primary/25 active:scale-95">
                Angebot anfordern
              </button>
            </Link>
          </nav>

          {/* Mobile Menu Toggle */}
          <button 
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
          >
            {isMobileMenuOpen ? <X /> : <Menu />}
          </button>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-background/95 backdrop-blur-xl pt-24 px-6 md:hidden animate-in slide-in-from-top-10 duration-200">
          <nav className="flex flex-col gap-6 text-lg">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span 
                  className="block py-2 border-b border-border/50 hover:text-primary transition-colors cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </span>
              </Link>
            ))}
            <button className="w-full bg-primary text-primary-foreground py-3 rounded-lg font-bold mt-4">
              Angebot anfordern
            </button>
          </nav>
        </div>
      )}

      <main className="flex-grow pt-24 relative z-10">
        {children}
      </main>

      <footer className="bg-card border-t border-border/50 py-12 mt-20 relative z-10">
        <div className="container grid grid-cols-1 md:grid-cols-4 gap-10">
          <div className="col-span-1 md:col-span-2">
            <div className="flex items-center gap-2 mb-4">
              <img src="/images/logo.png" alt="Gross ICT" className="h-8 w-auto" />
              <span className="text-lg font-bold">Gross ICT</span>
            </div>
            <p className="text-muted-foreground max-w-md mb-6">
              Ihr Partner für professionelle ICT-Dienstleistungen. 
              Wir verbinden Technik mit Verstand und sorgen für reibungslose Abläufe.
            </p>
          </div>
          
          <div>
            <h3 className="font-bold mb-4 text-foreground">Dienstleistungen</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li><Link href="/services/web"><span className="hover:text-primary cursor-pointer">Webseiten Entwicklung</span></Link></li>
              <li><Link href="/services/support"><span className="hover:text-primary cursor-pointer">PC-Support & Wartung</span></Link></li>
              <li><Link href="/services/network"><span className="hover:text-primary cursor-pointer">Netzwerk Installation</span></Link></li>
              <li><Link href="/services/support"><span className="hover:text-primary cursor-pointer">Client & Server Config</span></Link></li>
            </ul>
          </div>

          <div>
            <h3 className="font-bold mb-4 text-foreground">Kontakt</h3>
            <ul className="space-y-2 text-sm text-muted-foreground">
              <li>info@gross-ict.ch</li>
              <li>+41 XX XXX XX XX</li>
              <li>Schweiz</li>
            </ul>
          </div>
        </div>
        <div className="container mt-12 pt-8 border-t border-border/30 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} Gross ICT. Alle Rechte vorbehalten.
        </div>
      </footer>
    </div>
  );
}
