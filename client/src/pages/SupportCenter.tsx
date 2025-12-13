import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Search, LifeBuoy, Download, MessageSquare, FileText, ChevronRight, Monitor, Shield, Smartphone, Server, Mail, Phone, Loader2, CheckCircle, Clock, AlertCircle } from "lucide-react";
import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Checkbox } from "@/components/ui/checkbox";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Link, useLocation, useSearch } from "wouter";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import RemoteSupportModal from "@/components/RemoteSupportModal";

export default function SupportCenter() {
  const { language } = useLanguage();

  // Parse URL parameters from window location (more reliable)
  const getTicketIdFromUrl = () => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search);
      return params.get('ticket');
    }
    return null;
  };

  const ticketIdParam = getTicketIdFromUrl();

  // Ticket lookup state
  const [showTicketLookup, setShowTicketLookup] = useState(false);
  const [lookupTicketId, setLookupTicketId] = useState("");
  const [lookupEmail, setLookupEmail] = useState("");
  const [lookupSubmitted, setLookupSubmitted] = useState(false);

  // Check for ticket param on mount
  useEffect(() => {
    const ticketId = getTicketIdFromUrl();
    if (ticketId) {
      setShowTicketLookup(true);
      setLookupTicketId(ticketId);
    }
  }, []);

  // Form state
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [company, setCompany] = useState("");
  const [subject, setSubject] = useState("");
  const [message, setMessage] = useState("");
  const [priority, setPriority] = useState<"low" | "medium" | "high" | "urgent">("medium");
  const [category, setCategory] = useState<"network" | "security" | "hardware" | "software" | "email" | "other">("other");
  const [createAccount, setCreateAccount] = useState(false);
  const [password, setPassword] = useState("");

  // Ticket lookup query
  const ticketLookupQuery = trpc.tickets.publicLookup.useQuery(
    { ticketId: parseInt(lookupTicketId) || 0, email: lookupEmail },
    {
      enabled: lookupSubmitted && !!lookupTicketId && !!lookupEmail,
      retry: false,
    }
  );

  const createTicketMutation = trpc.tickets.create.useMutation({
    onSuccess: (data) => {
      if (data.accountCreated) {
        toast.success(
          language === 'de'
            ? "Ticket erstellt und Account angelegt! Sie können sich jetzt anmelden."
            : "Ticket created and account created! You can now log in."
        );
      } else {
        toast.success(
          language === 'de'
            ? "Ticket erfolgreich erstellt! Wir melden uns in Kürze."
            : "Ticket created successfully! We will get back to you soon."
        );
      }
      // Reset form
      setName("");
      setEmail("");
      setCompany("");
      setSubject("");
      setMessage("");
      setPriority("medium");
      setCreateAccount(false);
      setPassword("");
    },
    onError: (error) => {
      toast.error(error.message || (language === 'de' ? "Fehler beim Erstellen des Tickets" : "Error creating ticket"));
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name || !email || !subject || !message) {
      toast.error(language === 'de' ? "Bitte füllen Sie alle Pflichtfelder aus" : "Please fill in all required fields");
      return;
    }

    if (createAccount && !password) {
      toast.error(language === 'de' ? "Bitte geben Sie ein Passwort ein" : "Please enter a password");
      return;
    }

    createTicketMutation.mutate({
      customerName: name,
      customerEmail: email,
      company: company || undefined,
      subject,
      message,
      priority,
      category,
      createAccount,
      password: createAccount ? password : undefined,
    });
  };

  const quickActions = [
    {
      icon: Monitor,
      title: language === 'de' ? "Fernwartung starten" : "Start Remote Support",
      desc: language === 'de' ? "Sofortige Hilfe per AnyDesk" : "Immediate help via AnyDesk",
      action: "remote"
    },
    {
      icon: MessageSquare,
      title: language === 'de' ? "Ticket erstellen" : "Create Ticket",
      desc: language === 'de' ? "Problem melden & Status verfolgen" : "Report issue & track status",
      link: "#ticket-form"
    },
    {
      icon: Download,
      title: language === 'de' ? "Downloads" : "Downloads",
      desc: language === 'de' ? "Treiber, Tools & Anleitungen" : "Drivers, tools & guides",
      link: "#downloads"
    },
    {
      icon: FileText,
      title: language === 'de' ? "Knowledge Base" : "Knowledge Base",
      desc: language === 'de' ? "Häufige Fragen & Lösungen" : "FAQ & Solutions",
      link: "#kb"
    }
  ];

  const kbCategories = [
    {
      icon: Shield,
      title: language === 'de' ? "Sicherheit & Datenschutz" : "Security & Privacy",
      articles: [
        language === 'de' ? "Wie aktiviere ich 2FA?" : "How to enable 2FA?",
        language === 'de' ? "Phishing-Mails erkennen" : "Recognizing phishing emails",
        language === 'de' ? "Passwort-Richtlinien" : "Password policies"
      ]
    },
    {
      icon: Mail,
      title: language === 'de' ? "E-Mail & Kommunikation" : "Email & Communication",
      articles: [
        language === 'de' ? "Outlook Einrichtung (IMAP/Exchange)" : "Outlook setup (IMAP/Exchange)",
        language === 'de' ? "Signaturen erstellen" : "Creating signatures",
        language === 'de' ? "Spam-Filter konfigurieren" : "Configuring spam filters"
      ]
    },
    {
      icon: Server,
      title: language === 'de' ? "Netzwerk & VPN" : "Network & VPN",
      articles: [
        language === 'de' ? "VPN-Verbindung herstellen" : "Establishing VPN connection",
        language === 'de' ? "WLAN-Probleme beheben" : "Troubleshooting Wi-Fi",
        language === 'de' ? "Netzlaufwerke verbinden" : "Mapping network drives"
      ]
    }
  ];

  return (
    <Layout>
      <SEO
        title={language === 'de' ? "Support Center" : "Support Center"}
        description={language === 'de' ? "Ihr zentraler Anlaufpunkt für Hilfe, Downloads und Support-Tickets." : "Your central hub for help, downloads, and support tickets."}
      />

      {/* Ticket Lookup Modal */}
      {showTicketLookup && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/80 backdrop-blur-sm p-4">
          <motion.div
            initial={{ opacity: 0, scale: 0.95 }}
            animate={{ opacity: 1, scale: 1 }}
            className="bg-background border border-white/10 rounded-2xl p-8 max-w-2xl w-full max-h-[90vh] overflow-y-auto"
          >
            {!ticketLookupQuery.data && !ticketLookupQuery.isLoading ? (
              <>
                <h2 className="text-2xl font-bold mb-4">
                  {language === 'de' ? 'Ticket-Status abrufen' : 'Check Ticket Status'}
                </h2>
                <p className="text-muted-foreground mb-6">
                  {language === 'de'
                    ? 'Geben Sie Ihre E-Mail-Adresse ein, um den Status Ihres Tickets einzusehen.'
                    : 'Enter your email address to view your ticket status.'}
                </p>

                <form onSubmit={(e) => { e.preventDefault(); setLookupSubmitted(true); }} className="space-y-4">
                  <div className="space-y-2">
                    <Label>{language === 'de' ? 'Ticket-Nummer' : 'Ticket Number'}</Label>
                    <Input
                      value={lookupTicketId}
                      onChange={(e) => setLookupTicketId(e.target.value)}
                      placeholder="42"
                      className="bg-black/20 border-white/10"
                    />
                  </div>

                  <div className="space-y-2">
                    <Label>{language === 'de' ? 'E-Mail-Adresse' : 'Email Address'}</Label>
                    <Input
                      type="email"
                      value={lookupEmail}
                      onChange={(e) => setLookupEmail(e.target.value)}
                      placeholder="ihre@email.ch"
                      className="bg-black/20 border-white/10"
                      required
                    />
                  </div>

                  {ticketLookupQuery.error && (
                    <div className="p-4 rounded-lg bg-red-500/10 border border-red-500/30 text-red-400">
                      {ticketLookupQuery.error.message}
                    </div>
                  )}

                  <div className="flex gap-3">
                    <Button type="submit" className="flex-1" disabled={ticketLookupQuery.isLoading}>
                      {ticketLookupQuery.isLoading ? (
                        <><Loader2 className="w-4 h-4 animate-spin mr-2" /> {language === 'de' ? 'Laden...' : 'Loading...'}</>
                      ) : (
                        language === 'de' ? 'Status abrufen' : 'Check Status'
                      )}
                    </Button>
                    <Button type="button" variant="outline" onClick={() => setShowTicketLookup(false)}>
                      {language === 'de' ? 'Schliessen' : 'Close'}
                    </Button>
                  </div>
                </form>
              </>
            ) : ticketLookupQuery.data ? (
              <>
                <div className="flex items-center justify-between mb-6">
                  <h2 className="text-2xl font-bold">
                    Ticket #{ticketLookupQuery.data.ticketNumber || ticketLookupQuery.data.id}
                  </h2>
                  <Button variant="outline" size="sm" onClick={() => { setShowTicketLookup(false); setLookupSubmitted(false); }}>
                    {language === 'de' ? 'Schliessen' : 'Close'}
                  </Button>
                </div>

                <div className="space-y-6">
                  {/* Status Badge */}
                  <div className="flex items-center gap-3">
                    {ticketLookupQuery.data.status === 'resolved' || ticketLookupQuery.data.status === 'closed' ? (
                      <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-green-500/10 text-green-400 border border-green-500/30">
                        <CheckCircle className="w-4 h-4" />
                        {ticketLookupQuery.data.status === 'resolved' ? (language === 'de' ? 'Gelöst' : 'Resolved') : (language === 'de' ? 'Geschlossen' : 'Closed')}
                      </span>
                    ) : ticketLookupQuery.data.status === 'in_progress' ? (
                      <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-blue-500/10 text-blue-400 border border-blue-500/30">
                        <Clock className="w-4 h-4" />
                        {language === 'de' ? 'In Bearbeitung' : 'In Progress'}
                      </span>
                    ) : (
                      <span className="flex items-center gap-2 px-3 py-1 rounded-full bg-yellow-500/10 text-yellow-400 border border-yellow-500/30">
                        <AlertCircle className="w-4 h-4" />
                        {language === 'de' ? 'Offen' : 'Open'}
                      </span>
                    )}

                    <span className={`px-3 py-1 rounded-full text-sm ${ticketLookupQuery.data.priority === 'urgent' ? 'bg-red-500/10 text-red-400 border border-red-500/30' :
                      ticketLookupQuery.data.priority === 'high' ? 'bg-orange-500/10 text-orange-400 border border-orange-500/30' :
                        ticketLookupQuery.data.priority === 'medium' ? 'bg-yellow-500/10 text-yellow-400 border border-yellow-500/30' :
                          'bg-gray-500/10 text-gray-400 border border-gray-500/30'
                      }`}>
                      {ticketLookupQuery.data.priority === 'urgent' ? (language === 'de' ? 'Dringend' : 'Urgent') :
                        ticketLookupQuery.data.priority === 'high' ? (language === 'de' ? 'Hoch' : 'High') :
                          ticketLookupQuery.data.priority === 'medium' ? (language === 'de' ? 'Mittel' : 'Medium') :
                            (language === 'de' ? 'Niedrig' : 'Low')}
                    </span>
                  </div>

                  {/* Ticket Details */}
                  <div className="p-4 rounded-xl bg-white/5 border border-white/10">
                    <h3 className="font-bold text-lg mb-2">{ticketLookupQuery.data.subject}</h3>
                    <p className="text-muted-foreground whitespace-pre-wrap">{ticketLookupQuery.data.description}</p>
                    <p className="text-sm text-muted-foreground mt-4">
                      {language === 'de' ? 'Erstellt am' : 'Created on'}: {new Date(ticketLookupQuery.data.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                    </p>
                  </div>

                  {/* Comments */}
                  {ticketLookupQuery.data.comments && ticketLookupQuery.data.comments.length > 0 && (
                    <div>
                      <h4 className="font-bold mb-3">{language === 'de' ? 'Antworten' : 'Responses'}</h4>
                      <div className="space-y-3">
                        {ticketLookupQuery.data.comments.map((comment: any) => (
                          <div key={comment.id} className="p-4 rounded-xl bg-primary/5 border border-primary/20">
                            <div className="flex items-center justify-between mb-2">
                              <span className="font-medium text-primary">{comment.author}</span>
                              <span className="text-sm text-muted-foreground">
                                {new Date(comment.createdAt).toLocaleDateString('de-CH', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })}
                              </span>
                            </div>
                            <p className="text-sm whitespace-pre-wrap">{comment.content}</p>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}
                </div>
              </>
            ) : (
              <div className="flex items-center justify-center py-12">
                <Loader2 className="w-8 h-8 animate-spin text-primary" />
              </div>
            )}
          </motion.div>
        </div>
      )}

      {/* Hero Section */}
      <div className="relative pt-32 pb-20 overflow-hidden">
        <div className="absolute inset-0 bg-primary/5 blur-[150px] pointer-events-none"></div>
        <div className="container relative z-10">
          <div className="max-w-3xl mx-auto text-center mb-16">
            <motion.div
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ duration: 0.5 }}
            >
              <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-white/5 border border-white/10 text-sm font-medium mb-6 text-primary">
                <LifeBuoy className="h-4 w-4" /> Support Center
              </div>
              <h1 className="text-4xl md:text-6xl font-bold mb-6">
                {language === 'de' ? "Wie können wir helfen?" : "How can we help?"}
              </h1>

              {/* Search Bar */}
              <div className="relative max-w-xl mx-auto">
                <div className="absolute inset-y-0 left-4 flex items-center pointer-events-none">
                  <Search className="h-5 w-5 text-muted-foreground" />
                </div>
                <Input
                  type="text"
                  placeholder={language === 'de' ? "Suchen Sie nach Lösungen, Fehlern oder Anleitungen..." : "Search for solutions, errors, or guides..."}
                  className="pl-12 h-14 rounded-full bg-white/5 border-white/10 focus:border-primary/50 text-lg shadow-xl backdrop-blur-sm"
                />
              </div>
            </motion.div>
          </div>

          {/* Quick Actions Grid */}
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-20">
            {quickActions.map((action, idx) => (
              <motion.div
                key={idx}
                initial={{ opacity: 0, y: 20 }}
                animate={{ opacity: 1, y: 0 }}
                transition={{ delay: idx * 0.1 }}
              >
                {action.action === 'remote' ? (
                  <RemoteSupportModal>
                    <div className="h-full p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <action.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.desc}</p>
                    </div>
                  </RemoteSupportModal>
                ) : (
                  <a href={action.link} className="block h-full">
                    <div className="h-full p-6 rounded-2xl bg-white/5 border border-white/10 hover:bg-white/10 hover:border-primary/30 transition-all cursor-pointer group">
                      <div className="w-12 h-12 rounded-xl bg-primary/10 flex items-center justify-center mb-4 group-hover:scale-110 transition-transform">
                        <action.icon className="w-6 h-6 text-primary" />
                      </div>
                      <h3 className="font-bold text-lg mb-1">{action.title}</h3>
                      <p className="text-sm text-muted-foreground">{action.desc}</p>
                    </div>
                  </a>
                )}
              </motion.div>
            ))}
          </div>

          {/* Downloads Section */}
          <div id="downloads" className="mb-20">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <Download className="w-6 h-6 text-primary" />
              {language === 'de' ? "Downloads" : "Downloads"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-red-500/10 text-red-500">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10">Windows</span>
                </div>
                <h3 className="font-bold text-lg mb-2">AnyDesk QuickSupport</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {language === 'de' ? "Für schnelle Fernwartung ohne Installation." : "For quick remote support without installation."}
                </p>
                <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-blue-500/10 text-blue-500">
                    <Monitor className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10">macOS</span>
                </div>
                <h3 className="font-bold text-lg mb-2">AnyDesk for Mac</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {language === 'de' ? "Optimiert für macOS 10.13 und neuer." : "Optimized for macOS 10.13 and newer."}
                </p>
                <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>

              <div className="p-6 rounded-2xl bg-white/5 border border-white/10 hover:border-primary/30 transition-all group">
                <div className="flex items-center justify-between mb-4">
                  <div className="p-3 rounded-xl bg-green-500/10 text-green-500">
                    <Smartphone className="w-6 h-6" />
                  </div>
                  <span className="text-xs font-medium px-2 py-1 rounded-full bg-white/10">Mobile</span>
                </div>
                <h3 className="font-bold text-lg mb-2">AnyDesk Mobile</h3>
                <p className="text-sm text-muted-foreground mb-6">
                  {language === 'de' ? "Für iOS und Android Geräte." : "For iOS and Android devices."}
                </p>
                <Button variant="outline" className="w-full gap-2 group-hover:bg-primary group-hover:text-primary-foreground group-hover:border-primary transition-all">
                  <Download className="w-4 h-4" /> Download
                </Button>
              </div>
            </div>
          </div>

          {/* Knowledge Base Section */}
          <div id="kb" className="mb-20">
            <h2 className="text-2xl font-bold mb-8 flex items-center gap-2">
              <FileText className="w-6 h-6 text-primary" />
              {language === 'de' ? "Häufige Themen" : "Common Topics"}
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              {kbCategories.map((category, idx) => (
                <div key={idx} className="p-6 rounded-2xl bg-white/5 border border-white/10">
                  <div className="flex items-center gap-3 mb-6">
                    <category.icon className="w-5 h-5 text-primary" />
                    <h3 className="font-bold">{category.title}</h3>
                  </div>
                  <ul className="space-y-3">
                    {category.articles.map((article, aIdx) => (
                      <li key={aIdx}>
                        <a href="#" className="flex items-center justify-between text-sm text-muted-foreground hover:text-primary transition-colors group">
                          <span>{article}</span>
                          <ChevronRight className="w-4 h-4 opacity-0 -translate-x-2 group-hover:opacity-100 group-hover:translate-x-0 transition-all" />
                        </a>
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>

          {/* Ticket System & Contact */}
          <div id="ticket-form" className="grid grid-cols-1 lg:grid-cols-2 gap-12 items-start">

            {/* Contact Info */}
            <div>
              <h2 className="text-2xl font-bold mb-6">
                {language === 'de' ? "Noch Fragen?" : "Still have questions?"}
              </h2>
              <p className="text-muted-foreground mb-8">
                {language === 'de'
                  ? "Unser Support-Team ist für Sie da. Erstellen Sie ein Ticket oder rufen Sie uns direkt an."
                  : "Our support team is here for you. Create a ticket or call us directly."}
              </p>

              <div className="space-y-6">
                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-green-500/10 flex items-center justify-center">
                    <Phone className="w-5 h-5 text-green-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'de' ? "Hotline (Mo-Fr 08:00-17:00)" : "Hotline (Mon-Fri 08:00-17:00)"}</p>
                    <a href="tel:+41794140616" className="text-lg font-bold hover:text-primary transition-colors">+41 79 414 06 16</a>
                  </div>
                </div>

                <div className="flex items-center gap-4 p-4 rounded-xl bg-white/5 border border-white/10">
                  <div className="w-10 h-10 rounded-full bg-blue-500/10 flex items-center justify-center">
                    <Mail className="w-5 h-5 text-blue-500" />
                  </div>
                  <div>
                    <p className="text-sm text-muted-foreground">{language === 'de' ? "E-Mail Support" : "Email Support"}</p>
                    <a href="mailto:support@gross-ict.ch" className="text-lg font-bold hover:text-primary transition-colors">support@gross-ict.ch</a>
                  </div>
                </div>
              </div>
            </div>

            {/* Ticket Form */}
            <div className="p-8 rounded-3xl bg-white/5 border border-white/10">
              <h3 className="text-xl font-bold mb-6">
                {language === 'de' ? "Neues Ticket erstellen" : "Create New Ticket"}
              </h3>
              <form className="space-y-4" onSubmit={handleSubmit}>
                <div className="grid grid-cols-2 gap-4">
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{language === 'de' ? "Name" : "Name"} *</label>
                    <Input
                      placeholder="Max Mustermann"
                      className="bg-black/20 border-white/10"
                      value={name}
                      onChange={(e) => setName(e.target.value)}
                      required
                    />
                  </div>
                  <div className="space-y-2">
                    <label className="text-sm font-medium">{language === 'de' ? "Firma" : "Company"}</label>
                    <Input
                      placeholder="Muster AG"
                      className="bg-black/20 border-white/10"
                      value={company}
                      onChange={(e) => setCompany(e.target.value)}
                    />
                  </div>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'de' ? "E-Mail" : "Email"} *</label>
                  <Input
                    type="email"
                    placeholder="max@muster.ch"
                    className="bg-black/20 border-white/10"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'de' ? "Betreff" : "Subject"} *</label>
                  <Input
                    placeholder={language === 'de' ? "Kurze Beschreibung des Problems" : "Short description of the issue"}
                    className="bg-black/20 border-white/10"
                    value={subject}
                    onChange={(e) => setSubject(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'de' ? "Priorität" : "Priority"}</label>
                  <Select value={priority} onValueChange={(val: any) => setPriority(val)}>
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">{language === 'de' ? "Niedrig" : "Low"}</SelectItem>
                      <SelectItem value="medium">{language === 'de' ? "Mittel" : "Medium"}</SelectItem>
                      <SelectItem value="high">{language === 'de' ? "Hoch" : "High"}</SelectItem>
                      <SelectItem value="urgent">{language === 'de' ? "Dringend" : "Urgent"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'de' ? "Kategorie" : "Category"}</label>
                  <Select value={category} onValueChange={(val: any) => setCategory(val)}>
                    <SelectTrigger className="bg-black/20 border-white/10">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="network">{language === 'de' ? "Netzwerk" : "Network"}</SelectItem>
                      <SelectItem value="security">{language === 'de' ? "Sicherheit" : "Security"}</SelectItem>
                      <SelectItem value="hardware">{language === 'de' ? "Hardware" : "Hardware"}</SelectItem>
                      <SelectItem value="software">{language === 'de' ? "Software" : "Software"}</SelectItem>
                      <SelectItem value="email">{language === 'de' ? "E-Mail" : "Email"}</SelectItem>
                      <SelectItem value="other">{language === 'de' ? "Sonstiges" : "Other"}</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                <div className="space-y-2">
                  <label className="text-sm font-medium">{language === 'de' ? "Nachricht" : "Message"} *</label>
                  <Textarea
                    className="min-h-[120px] bg-black/20 border-white/10"
                    placeholder={language === 'de' ? "Bitte beschreiben Sie das Problem so genau wie möglich..." : "Please describe the issue as detailed as possible..."}
                    value={message}
                    onChange={(e) => setMessage(e.target.value)}
                    required
                  />
                </div>

                <div className="space-y-4 pt-4 border-t border-white/10">
                  <div className="flex items-center space-x-2">
                    <Checkbox
                      id="createAccount"
                      checked={createAccount}
                      onCheckedChange={(checked) => setCreateAccount(checked as boolean)}
                    />
                    <Label htmlFor="createAccount" className="text-sm cursor-pointer">
                      {language === 'de'
                        ? "Benutzerkonto erstellen (um Tickets zu verfolgen)"
                        : "Create user account (to track tickets)"}
                    </Label>
                  </div>

                  {createAccount && (
                    <div className="space-y-2 pl-6">
                      <label className="text-sm font-medium">{language === 'de' ? "Passwort" : "Password"} *</label>
                      <Input
                        type="password"
                        placeholder="••••••••"
                        className="bg-black/20 border-white/10"
                        value={password}
                        onChange={(e) => setPassword(e.target.value)}
                        required={createAccount}
                      />
                      <p className="text-xs text-muted-foreground">
                        {language === 'de'
                          ? "Mindestens 6 Zeichen"
                          : "At least 6 characters"}
                      </p>
                    </div>
                  )}
                </div>

                <Button
                  type="submit"
                  className="w-full gap-2"
                  size="lg"
                  disabled={createTicketMutation.isPending}
                >
                  {createTicketMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 animate-spin" />
                      {language === 'de' ? "Wird gesendet..." : "Submitting..."}
                    </>
                  ) : (
                    <>
                      <MessageSquare className="w-4 h-4" />
                      {language === 'de' ? "Ticket absenden" : "Submit Ticket"}
                    </>
                  )}
                </Button>
              </form>
            </div>

          </div>
        </div>
      </div>
    </Layout>
  );
}
