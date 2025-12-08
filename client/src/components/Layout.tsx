import { Link, useLocation } from "wouter";
import { cn } from "@/lib/utils";
import { Menu, X, ArrowRight, Sun, Moon, MessageCircle, Monitor, Calendar } from "lucide-react";
import { useState, useEffect } from "react";
import Lenis from "lenis";
import CookieConsent from "./CookieConsent";
import RemoteSupportModal from "./RemoteSupportModal";
import { useLanguage } from "@/contexts/LanguageContext";
import { useTheme } from "@/contexts/ThemeContext";
import { useAuth } from "@/_core/hooks/useAuth";
import { User } from "lucide-react";

export default function Layout({ children }: { children: React.ReactNode }) {
  const [isScrolled, setIsScrolled] = useState(false);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [location] = useLocation();
  const { t, language, setLanguage } = useLanguage();
  const { theme, toggleTheme } = useTheme();
  const { user } = useAuth();

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [location]);

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
    { name: t.nav.home, path: "/" },
    { name: t.nav.web, path: "/services/web" },
    { name: t.nav.support, path: "/support-center" },
    { name: t.nav.network, path: "/services/network" },
  ];

  return (
    <div className="min-h-screen flex flex-col font-sans text-foreground bg-background selection:bg-primary/20">
      
      {/* Floating Island Navigation */}
      <header className="fixed top-6 left-0 right-0 z-50 flex justify-center px-4 pointer-events-none pt-4">
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
                  "px-4 py-1.5 rounded-full text-sm font-medium transition-all duration-300 cursor-pointer hover:text-foreground",
                  location === item.path 
                    ? "bg-foreground/10 text-foreground shadow-inner" 
                    : "text-muted-foreground hover:bg-foreground/5"
                )}>
                  {item.name}
                </span>
              </Link>
            ))}
          </nav>

          {/* User Auth & CTA */}
          <div className="flex items-center gap-1 lg:gap-2">
            {/* User/Login Button */}
            {user ? (
              <Link href={user.role === 'admin' ? '/admin' : '/dashboard'}>
                <button className="p-2 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 group">
                  <User className="h-4 w-4 text-primary" />
                </button>
              </Link>
            ) : (
              <Link href="/login">
                <button className="px-3 py-1.5 rounded-full bg-white/5 hover:bg-white/10 transition-colors border border-white/10 text-sm font-medium">
                  {language === 'de' ? 'Anmelden' : 'Login'}
                </button>
              </Link>
            )}
            {/* Language Switcher */}
            <button 
              onClick={() => setLanguage(language === 'de' ? 'en' : 'de')}
              className="px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              {language === 'de' ? 'EN' : 'DE'}
            </button>

            {/* Theme Toggle */}
            <button
              onClick={toggleTheme}
              className="p-2 rounded-full text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
              aria-label="Toggle theme"
            >
              {theme === 'dark' ? <Sun className="h-4 w-4" /> : <Moon className="h-4 w-4" />}
            </button>

            <RemoteSupportModal />

            <a 
              href="https://cal.com/gross-ict" 
              target="_blank" 
              rel="noopener noreferrer"
              className="hidden xl:flex items-center gap-2 px-3 py-2 rounded-full text-sm font-medium text-muted-foreground hover:text-foreground hover:bg-foreground/5 transition-all"
            >
              <Calendar className="w-4 h-4" />
              <span>{language === 'de' ? 'Termin' : 'Book'}</span>
            </a>

            <Link href="/contact">
              <button className="bg-white text-black px-3 lg:px-5 py-2 rounded-full text-sm font-semibold hover:bg-gray-200 transition-all active:scale-95 flex items-center gap-1 lg:gap-2 whitespace-nowrap">
                <span className="hidden sm:inline">{t.nav.contact}</span>
                <span className="sm:hidden">Kontakt</span>
                <ArrowRight className="h-3 w-3" />
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
            
            <RemoteSupportModal>
              <span 
                className="block p-4 rounded-2xl bg-primary/10 border border-primary/20 text-xl font-medium text-primary hover:bg-primary/20 transition-colors cursor-pointer flex items-center gap-3"
                onClick={() => setIsMobileMenuOpen(false)}
              >
                <Monitor className="w-5 h-5" />
                {language === 'de' ? 'Fernwartung' : 'Remote Support'}
              </span>
            </RemoteSupportModal>
          </nav>
        </div>
      )}

      <div className="cinematic-grain"></div>
      <div className="cinematic-vignette"></div>
      <main className="flex-1 relative z-10">
        {children}
      </main>

      <CookieConsent />
      <footer className="border-t border-border bg-background py-20 relative z-10">
        <div className="container">
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-12 mb-16">
            <div className="space-y-4">
              <h3 className="text-lg font-bold text-foreground">Gross ICT</h3>
              <p className="text-muted-foreground text-sm leading-relaxed">
                Next-Generation IT Solutions.<br/>
                {t.hero.subtitle}
              </p>
              <div className="text-muted-foreground text-sm leading-relaxed pt-2">
                <p>Neuhushof 3</p>
                <p>6144 Zell LU</p>
                <div className="pt-2 flex flex-col gap-2">
                  <a href="tel:+41794140616" className="hover:text-primary transition-colors">
                    +41 79 414 06 16
                  </a>
                  <a 
                    href="https://wa.me/41794140616" 
                    target="_blank" 
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-2 text-green-500 hover:text-green-400 transition-colors font-medium"
                  >
                    <MessageCircle className="w-4 h-4" />
                    <span>Start Chat</span>
                  </a>
                </div>
              </div>
            </div>
            
            <div>
              <h4 className="font-medium text-foreground mb-4">Services</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/services/web"><span className="hover:text-primary transition-colors cursor-pointer">{t.nav.web}</span></Link></li>
                <li><Link href="/support-center"><span className="hover:text-primary transition-colors cursor-pointer">{t.nav.support}</span></Link></li>
                <li><Link href="/services/network"><span className="hover:text-primary transition-colors cursor-pointer">{t.nav.network}</span></Link></li>
                <li><Link href="/calculator"><span className="hover:text-primary transition-colors cursor-pointer">Website Calculator</span></Link></li>
              </ul>
            </div>

            <div>
              <h4 className="font-medium text-foreground mb-4">Company</h4>
              <ul className="space-y-2 text-sm text-muted-foreground">
                <li><Link href="/contact"><span className="hover:text-primary transition-colors cursor-pointer">{t.nav.contact}</span></Link></li>
                <li><Link href="/imprint"><span className="hover:text-primary transition-colors cursor-pointer">{t.footer.imprint}</span></Link></li>
                <li><Link href="/privacy"><span className="hover:text-primary transition-colors cursor-pointer">{t.footer.privacy}</span></Link></li>
              </ul>
            </div>


          </div>
          
          <div className="flex flex-col md:flex-row justify-between items-center pt-8 border-t border-white/5 text-xs text-muted-foreground">
            <p>© {new Date().getFullYear()} Gross ICT. {t.footer.rights}</p>
            <p>Designed with Next-Gen Tech.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
