import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { LogOut, Receipt, Users, BookOpen, Settings, Ticket, BarChart3, TrendingUp, TrendingDown, Minus, FileText, Mail, Server, AlertTriangle, UserPlus } from "lucide-react";
import { NotificationBell } from "@/components/NotificationBell";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEffect } from "react";

function QuickStats() {
  const { data: stats, isLoading, refetch } = trpc.dashboardStats.getQuickStats.useQuery();
  const [, setLocation] = useLocation();
  const { socket, connected } = useWebSocket();

  // Listen for WebSocket events to refresh statistics
  useEffect(() => {
    if (!socket || !connected) return;

    const handleStatsUpdate = () => {
      console.log('[Dashboard] Received stats update event, refetching...');
      refetch();
    };

    // Listen for various events that should trigger stats refresh
    socket.on('ticket:created', handleStatsUpdate);
    socket.on('ticket:updated', handleStatsUpdate);
    socket.on('customer:created', handleStatsUpdate);
    socket.on('invoice:created', handleStatsUpdate);
    socket.on('invoice:updated', handleStatsUpdate);
    socket.on('kb:created', handleStatsUpdate);
    socket.on('stats:refresh', handleStatsUpdate);

    return () => {
      socket.off('ticket:created', handleStatsUpdate);
      socket.off('ticket:updated', handleStatsUpdate);
      socket.off('customer:created', handleStatsUpdate);
      socket.off('invoice:created', handleStatsUpdate);
      socket.off('invoice:updated', handleStatsUpdate);
      socket.off('kb:created', handleStatsUpdate);
      socket.off('stats:refresh', handleStatsUpdate);
    };
  }, [socket, connected, refetch]);

  if (isLoading) {
    return (
      <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
        {[1, 2, 3, 4].map((i) => (
          <Card key={i}>
            <CardHeader className="pb-2">
              <CardDescription>Laden...</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
        ))}
      </div>
    );
  }

  const statsCards = [
    {
      label: 'Offene Tickets',
      value: stats?.openTickets || 0,
      trend: stats?.openTicketsTrend || 0,
      path: '/admin/tickets',
      color: 'from-orange-500 to-red-600',
    },
    {
      label: 'Kunden',
      value: stats?.totalCustomers || 0,
      trend: stats?.customersTrend || 0,
      path: '/crm',
      color: 'from-blue-500 to-cyan-600',
    },
    {
      label: 'Offene Rechnungen',
      value: stats?.openInvoices || 0,
      trend: stats?.openInvoicesTrend || 0,
      path: '/accounting',
      color: 'from-green-500 to-emerald-600',
    },
    {
      label: 'KB-Artikel',
      value: stats?.totalKbArticles || 0,
      trend: stats?.kbArticlesTrend || 0,
      path: '/admin/knowledge-base',
      color: 'from-purple-500 to-pink-600',
    },
  ];

  const getTrendIcon = (trend: number) => {
    if (trend > 0) return <TrendingUp className="h-4 w-4 text-green-500" />;
    if (trend < 0) return <TrendingDown className="h-4 w-4 text-red-500" />;
    return <Minus className="h-4 w-4 text-gray-400" />;
  };

  const getTrendText = (trend: number) => {
    if (trend === 0) return 'Keine Änderung';
    const sign = trend > 0 ? '+' : '';
    return `${sign}${trend} seit letzter Woche`;
  };

  return (
    <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
      {statsCards.map((card) => (
        <Card
          key={card.label}
          className="cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 group"
          onClick={() => setLocation(card.path)}
        >
          <div className={`h-1 bg-gradient-to-r ${card.color} group-hover:h-2 transition-all`} />
          <CardHeader className="pb-2">
            <CardDescription className="group-hover:text-primary transition-colors">
              {card.label}
            </CardDescription>
            <div className="flex items-baseline gap-3">
              <CardTitle className="text-3xl group-hover:text-primary transition-colors">
                {card.value}
              </CardTitle>
              <div className="flex items-center gap-1 text-xs">
                {getTrendIcon(card.trend)}
              </div>
            </div>
            <p className="text-xs text-muted-foreground mt-1">
              {getTrendText(card.trend)}
            </p>
          </CardHeader>
        </Card>
      ))}
    </div>
  );
}

export default function AdminDashboardMain() {
  const { user, logout, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Redirect if not admin
  if (!authLoading && user?.role !== 'admin') {
    setLocation('/');
    return null;
  }

  if (authLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-background">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Laden...</p>
        </div>
      </div>
    );
  }

  const handleLogout = async () => {
    try {
      await logout();
      toast.success('Erfolgreich abgemeldet');
      setLocation('/');
    } catch (error) {
      toast.error('Fehler beim Abmelden');
    }
  };

  // Define dashboard tiles with permissions
  const dashboardTiles = [
    {
      id: 'buchhaltung',
      title: 'Buchhaltung',
      description: 'Rechnungen, Angebote, Zahlungen und Finanzen verwalten',
      icon: Receipt,
      path: '/accounting',
      color: 'from-green-500 to-emerald-600',
      permission: 'admin', // Only admins can access
    },
    {
      id: 'crm',
      title: 'CRM',
      description: 'Kundenverwaltung, Kontakte und Beziehungen',
      icon: Users,
      path: '/crm',
      color: 'from-blue-500 to-cyan-600',
      permission: 'admin',
    },
    {
      id: 'vertraege',
      title: 'Verträge',
      description: 'Kundenverträge, Vorlagen und SLA-Management',
      icon: FileText,
      path: '/contracts',
      color: 'from-teal-500 to-cyan-600',
      permission: 'admin',
    },
    {
      id: 'wissensdatenbank',
      title: 'Wissensdatenbank',
      description: 'Artikel, Dokumentation und FAQ verwalten',
      icon: BookOpen,
      path: '/admin/knowledge-base',
      color: 'from-purple-500 to-pink-600',
      permission: 'admin',
    },
    {
      id: 'verwaltung',
      title: 'Verwaltung',
      description: 'Benutzer, Einstellungen und Systemkonfiguration',
      icon: Settings,
      path: '/admin/users',
      color: 'from-gray-500 to-slate-600',
      permission: 'admin',
    },
    {
      id: 'tickets',
      title: 'Tickets',
      description: 'Support-Tickets, Anfragen und Probleme verwalten',
      icon: Ticket,
      path: '/admin/tickets',
      color: 'from-orange-500 to-red-600',
      permission: 'user', // All users can access tickets
    },
    {
      id: 'statistiken',
      title: 'Statistiken',
      description: 'Dashboard, Charts und Performance-Metriken',
      icon: BarChart3,
      path: '/financial-dashboard',
      color: 'from-indigo-500 to-blue-600',
      permission: 'admin',
    },
    {
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Newsletter-Kampagnen, Abonnenten und E-Mail-Marketing',
      icon: Mail,
      path: '/newsletter',
      color: 'from-pink-500 to-rose-600',
      permission: 'admin',
    },
    {
      id: 'products',
      title: 'Produkte',
      description: 'Produktkatalog, Preise und Leistungen verwalten',
      icon: Receipt,
      path: '/products',
      color: 'from-emerald-500 to-green-600',
      permission: 'admin',
    },
    {
      id: 'kundenakquise',
      title: 'Kundenakquise',
      description: 'Leads verwalten, Pipeline und Konvertierung',
      icon: UserPlus,
      path: '/leads',
      color: 'from-violet-500 to-purple-600',
      permission: 'admin',
    },
    {
      id: 'email-templates',
      title: 'Email Templates',
      description: 'E-Mail-Vorlagen erstellen und verwalten',
      icon: Server,
      path: '/smtp-settings',
      color: 'from-yellow-500 to-amber-600',
      permission: 'admin',
    },
    {
      id: 'sla-reports',
      title: 'SLA Reports',
      description: 'Service Level Agreement Berichte und Analysen',
      icon: AlertTriangle,
      path: '/sla-reports',
      color: 'from-red-500 to-orange-600',
      permission: 'admin',
    },
  ];

  // Filter tiles based on user permissions
  const visibleTiles = dashboardTiles.filter(tile => {
    if (tile.permission === 'admin') {
      return user?.role === 'admin';
    }
    return true; // 'user' permission tiles are visible to all
  });



  return (
    <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20">
      {/* Header */}
      <header className="border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60 sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4 flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-muted-foreground">Willkommen, {user?.name}</p>
          </div>
          <div className="flex items-center gap-2">
            <NotificationBell />
            <Button variant="outline" onClick={handleLogout}>
              <LogOut className="h-4 w-4 mr-2" />
              Abmelden
            </Button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        <div className="mb-8">
          <h2 className="text-3xl font-bold mb-2">Wählen Sie einen Bereich</h2>
          <p className="text-muted-foreground">
            Navigieren Sie zu den verschiedenen Verwaltungsbereichen
          </p>
        </div>

        {/* Dashboard Tiles Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {visibleTiles.map((tile) => {
            const Icon = tile.icon;
            return (
              <Card
                key={tile.id}
                className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden"
                onClick={() => setLocation(tile.path)}
              >
                <div className={`h-2 bg-gradient-to-r ${tile.color}`} />
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div className={`p-3 rounded-lg bg-gradient-to-br ${tile.color} text-white`}>
                      <Icon className="h-6 w-6" />
                    </div>
                  </div>
                  <CardTitle className="mt-4 group-hover:text-primary transition-colors">
                    {tile.title}
                  </CardTitle>
                  <CardDescription className="text-sm">
                    {tile.description}
                  </CardDescription>
                </CardHeader>
                <CardContent>
                  <Button
                    variant="ghost"
                    className="w-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"
                  >
                    Öffnen →
                  </Button>
                </CardContent>
              </Card>
            );
          })}
        </div>

        {/* Quick Stats */}
        <QuickStats />
      </main>
    </div>
  );
}
