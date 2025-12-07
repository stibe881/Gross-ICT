import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight } from "lucide-react";
import { useState, useEffect } from "react";
import Lenis from "lenis";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();

  useEffect(() => {
    const lenis = new Lenis({
      duration: 1.2,
      easing: (t) => Math.min(1, 1.001 - Math.pow(2, -10 * t)),
      orientation: 'vertical',
      gestureOrientation: 'vertical',
      smoothWheel: true,
    });

    function raf(time: number) {
      lenis.raf(time);
      requestAnimationFrame(raf);
    }

    requestAnimationFrame(raf);

    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener("scroll", handleScroll);
    
    return () => {
      window.removeEventListener("scroll", handleScroll);
      lenis.destroy();
    };
  }, []);

  const navItems = [
    { name: "Home", path: "/" },
    { name: "Web", path: "/services/web" },
    { name: "Support", path: "/services/support" },
    { name: "Netzwerk", path: "/services/network" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground bg-background selection:bg-primary/20">
      
      {/* Floating Island Navigation */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none">
        <div className={cn(
          "pointer-events-auto flex items-center gap-2 p-2 rounded-full border border-white/10 bg-black/50 backdrop-blur-xl shadow-2xl transition-all duration-500",
          isScrolled ? "w-auto px-4" : "w-full max-w-4xl justify-between px-6"
        )}>
          
          {/* Logo Area */}
          <Link href="/">
            <div className="flex items-center gap-3 cursor-pointer group px-2">
              <div className="h-8 w-8 rounded-full bg-gradient-to-br from-primary to-primary/50 flex items-center justify-center text-black font-bold text-xs shadow-lg shadow-primary/20">
                G
              </div>
              <span className={cn(
                "font-bold tracking-tight transition-all duration-300",
                isScrolled ? "hidden md:block" : "block"
              )}>
                Gross <span className="text-primary">ICT</span>
              </span>
            </div>
          </Link>

          {/* Desktop Nav Items */}
          <nav className="hidden md:flex items-center gap-1 bg-white/5 rounded-full p-1 border border-white/5">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span className={cn(
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer hover:text-white",
                  location === item.path 
                    ? "bg-white/10 text-white shadow-inner" 
                    : "text-muted-foreground hover:bg-white/5"
                )}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* CTA Button */}
          <div className="flex items-center gap-2">
            <Link href="/contact">
              <button className="bg-white text-black px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-2">
                Kontakt <ArrowRight className="h-3 w-3" />
              </button>
            </Link>
            
            {/* Mobile Menu Toggle */}
            <button 
              className="md:hidden p-2 text-foreground bg-white/5 rounded-full"
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
            >
              {isMobileMenuOpen ? <X className="h-5 w-5" /> : <Menu className="h-5 w-5" />}
            </button>
          </div>
        </div>
      </header>

      {/* Mobile Menu Overlay */}
      {isMobileMenuOpen && (
        <div className="fixed inset-0 z-40 bg-black/95 backdrop-blur-xl pt-32 px-6 md:hidden animate-in slide-in-from-top-5 duration-300">
          <nav className="flex flex-col gap-4">
            {navItems.map((item) => (
              <Link key={item.path} href={item.path}>
                <span 
                  className="block p-4 rounded-2xl bg-white/5 border border-white/5 text-xl font-medium hover:bg-white/10 transition-colors cursor-pointer"
                  onClick={() => setIsMobileMenuOpen(false)}
                >
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>
        </div>
      )}

      <main className="flex-grow relative z-10">
        {children}
      </main>

      <footer className="border-t border-white/10 bg-black py-20 relative z-10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-white">Gross ICT</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Next-Generation IT Solutions.<br/>
                Wir bauen die digitale Infrastruktur von morgen.
              </p>
              <div className="text-muted-foreground text-sm leading-relaxed pt-2">
                <p>Neuhushof 3</p>
                <p>6144 Zell LU</p>
                <p className="pt-2">+41 79 414 06 16</p>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-white mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/services/web"><span className="hover:text-primary transition-colors cursor-pointer">Web Development</span></Link></li>
                <li><Link href="/services/support"><span className="hover:text-primary transition-colors cursor-pointer">IT Support</span></Link></li>
                <li><Link href="/services/network"><span className="hover:text-primary transition-colors cursor-pointer">Network Solutions</span></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/about"><span className="hover:text-primary transition-colors cursor-pointer">Über uns</span></Link></li>
                <li><Link href="/contact"><span className="hover:text-primary transition-colors cursor-pointer">Kontakt</span></Link></li>
                <li><Link href="/imprint"><span className="hover:text-primary transition-colors cursor-pointer">Impressum</span></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-white mb-4">Connect</h4>
              <div className="flex gap-4">
                {/* Social Placeholders */}
                <div className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"></div>
                <div className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"></div>
                <div className="h-8 w-8 rounded-full bg-white/5 hover:bg-white/10 transition-colors cursor-pointer"></div>
              </div>
            </div>
          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Gross ICT. All rights reserved.</p>
            <p>Designed with Next-Gen Tech.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
