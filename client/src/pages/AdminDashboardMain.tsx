import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { LogOut, Receipt, Users, BookOpen, Settings, Ticket, BarChart3 } from "lucide-react";
import { toast } from "sonner";

export default function AdminDashboardMain() {
  const { user, loading: authLoading, logout } = useAuth();
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
      path: '/admin/buchhaltung',
      color: 'from-green-500 to-emerald-600',
      permission: 'admin', // Only admins can access
    },
    {
      id: 'crm',
      title: 'CRM',
      description: 'Kundenverwaltung, Kontakte und Beziehungen',
      icon: Users,
      path: '/admin/crm',
      color: 'from-blue-500 to-cyan-600',
      permission: 'admin',
    },
    {
      id: 'wissensdatenbank',
      title: 'Wissensdatenbank',
      description: 'Artikel, Dokumentation und FAQ verwalten',
      icon: BookOpen,
      path: '/admin/kb',
      color: 'from-purple-500 to-pink-600',
      permission: 'admin',
    },
    {
      id: 'verwaltung',
      title: 'Verwaltung',
      description: 'Benutzer, Einstellungen und Systemkonfiguration',
      icon: Settings,
      path: '/admin/verwaltung',
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
      path: '/admin/statistiken',
      color: 'from-indigo-500 to-blue-600',
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
          <Button variant="outline" onClick={handleLogout}>
            <LogOut className="h-4 w-4 mr-2" />
            Abmelden
          </Button>
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
        <div className="mt-12 grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Offene Tickets</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Kunden</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>Offene Rechnungen</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
          <Card>
            <CardHeader className="pb-2">
              <CardDescription>KB-Artikel</CardDescription>
              <CardTitle className="text-3xl">--</CardTitle>
            </CardHeader>
          </Card>
        </div>
      </main>
    </div>
  );
}
