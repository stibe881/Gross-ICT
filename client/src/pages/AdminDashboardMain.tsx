import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { useLocation } from "wouter";
import { LogOut, Receipt, Users, BookOpen, Settings, Ticket, BarChart3, TrendingUp, TrendingDown, Minus, FileText, Mail, GripVertical, Maximize2 } from "lucide-react";
import { toast } from "sonner";
import { trpc } from "@/lib/trpc";
import { useWebSocket } from "@/contexts/WebSocketContext";
import { useEffect, useState } from "react";
import {
  DndContext,
  closestCenter,
  KeyboardSensor,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
} from '@dnd-kit/core';
import {
  arrayMove,
  SortableContext,
  sortableKeyboardCoordinates,
  useSortable,
  rectSortingStrategy,
} from '@dnd-kit/sortable';
import { CSS } from '@dnd-kit/utilities';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";

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

type TileSize = 'normal' | 'large' | 'xlarge';

interface DashboardTile {
  id: string;
  title: string;
  description: string;
  icon: any;
  path: string;
  color: string;
  permission: string;
}

interface SortableTileProps {
  tile: DashboardTile;
  size: TileSize;
  onSizeChange: (id: string, size: TileSize) => void;
}

function SortableTile({ tile, size, onSizeChange }: SortableTileProps) {
  const {
    attributes,
    listeners,
    setNodeRef,
    transform,
    transition,
    isDragging,
  } = useSortable({ id: tile.id });

  const style = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.5 : 1,
  };

  const [, setLocation] = useLocation();
  const Icon = tile.icon;

  // Map size to grid classes
  const getSizeClasses = (size: TileSize) => {
    switch (size) {
      case 'large':
        return 'md:col-span-2';
      case 'xlarge':
        return 'md:col-span-2 md:row-span-2';
      default:
        return '';
    }
  };

  const getSizeLabel = (size: TileSize) => {
    switch (size) {
      case 'normal':
        return 'Normal';
      case 'large':
        return 'Groß';
      case 'xlarge':
        return 'Extra Groß';
    }
  };

  return (
    <div ref={setNodeRef} style={style} className={getSizeClasses(size)}>
      <Card
        className="group cursor-pointer hover:shadow-lg transition-all duration-300 hover:-translate-y-1 border-border/50 overflow-hidden h-full"
      >
        <div className={`h-2 bg-gradient-to-r ${tile.color}`} />
        <CardHeader>
          <div className="flex items-start justify-between">
            <div className={`p-3 rounded-lg bg-gradient-to-br ${tile.color} text-white`}>
              <Icon className="h-6 w-6" />
            </div>
            <div className="flex gap-1">
              {/* Size selector dropdown */}
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button
                    className="p-2 hover:bg-muted rounded-md transition-colors"
                    onClick={(e) => e.stopPropagation()}
                  >
                    <Maximize2 className="h-4 w-4 text-muted-foreground" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="end">
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSizeChange(tile.id, 'normal');
                    }}
                    className={size === 'normal' ? 'bg-accent' : ''}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-4 h-4 border-2 border-current rounded" />
                      Normal (1x1)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSizeChange(tile.id, 'large');
                    }}
                    className={size === 'large' ? 'bg-accent' : ''}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-4 border-2 border-current rounded" />
                      Groß (2x1)
                    </span>
                  </DropdownMenuItem>
                  <DropdownMenuItem
                    onClick={(e) => {
                      e.stopPropagation();
                      onSizeChange(tile.id, 'xlarge');
                    }}
                    className={size === 'xlarge' ? 'bg-accent' : ''}
                  >
                    <span className="flex items-center gap-2">
                      <div className="w-6 h-6 border-2 border-current rounded" />
                      Extra Groß (2x2)
                    </span>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
              
              {/* Drag handle */}
              <div
                {...attributes}
                {...listeners}
                className="cursor-grab active:cursor-grabbing p-2 hover:bg-muted rounded-md transition-colors"
                onClick={(e) => e.stopPropagation()}
              >
                <GripVertical className="h-4 w-4 text-muted-foreground" />
              </div>
            </div>
          </div>
          <CardTitle className="mt-4 group-hover:text-primary transition-colors">
            {tile.title}
          </CardTitle>
          <CardDescription className="text-sm">
            {tile.description}
          </CardDescription>
          {size !== 'normal' && (
            <div className="mt-2">
              <span className="text-xs px-2 py-1 bg-primary/10 text-primary rounded-full">
                {getSizeLabel(size)}
              </span>
            </div>
          )}
        </CardHeader>
        <CardContent className="mt-auto">
          <Button
            variant="ghost"
            className="w-full group-hover:bg-primary/10 group-hover:text-primary transition-colors"
            onClick={() => setLocation(tile.path)}
          >
            Öffnen →
          </Button>
        </CardContent>
      </Card>
    </div>
  );
}

export default function AdminDashboardMain() {
  const { user, loading: authLoading, logout } = useAuth();
  const [, setLocation] = useLocation();

  // Default tile order
  const defaultTiles: DashboardTile[] = [
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
      id: 'wissensdatenbank',
      title: 'Wissensdatenbank',
      description: 'Artikel, Dokumentation und FAQ verwalten',
      icon: BookOpen,
      path: '/admin/knowledge-base',
      color: 'from-purple-500 to-pink-600',
      permission: 'admin',
    },
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
      id: 'newsletter',
      title: 'Newsletter',
      description: 'Newsletter-Kampagnen, Abonnenten und E-Mail-Marketing',
      icon: Mail,
      path: '/newsletter',
      color: 'from-pink-500 to-rose-600',
      permission: 'marketing', // Admin and marketing roles can access
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
      id: 'verwaltung',
      title: 'Verwaltung',
      description: 'Benutzer, Einstellungen und Systemkonfiguration',
      icon: Settings,
      path: '/admin/users',
      color: 'from-gray-500 to-slate-600',
      permission: 'admin',
    },
  ];

  // Load saved tile order from localStorage
  const [tiles, setTiles] = useState<DashboardTile[]>(() => {
    const savedOrder = localStorage.getItem('dashboardTileOrder');
    if (savedOrder) {
      try {
        const orderIds = JSON.parse(savedOrder) as string[];
        // Reorder tiles based on saved order
        const orderedTiles = orderIds
          .map(id => defaultTiles.find(t => t.id === id))
          .filter((t): t is DashboardTile => t !== undefined);
        
        // Add any new tiles that weren't in the saved order
        const newTiles = defaultTiles.filter(
          t => !orderIds.includes(t.id)
        );
        
        return [...orderedTiles, ...newTiles];
      } catch (e) {
        console.error('Failed to parse saved tile order:', e);
        return defaultTiles;
      }
    }
    return defaultTiles;
  });

  // Load saved tile sizes from localStorage
  const [tileSizes, setTileSizes] = useState<Record<string, TileSize>>(() => {
    const savedSizes = localStorage.getItem('dashboardTileSizes');
    if (savedSizes) {
      try {
        return JSON.parse(savedSizes);
      } catch (e) {
        console.error('Failed to parse saved tile sizes:', e);
        return {};
      }
    }
    return {};
  });

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  // Handle drag end
  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setTiles((items) => {
        const oldIndex = items.findIndex((item) => item.id === active.id);
        const newIndex = items.findIndex((item) => item.id === over.id);

        const newOrder = arrayMove(items, oldIndex, newIndex);
        
        // Save new order to localStorage
        const orderIds = newOrder.map(t => t.id);
        localStorage.setItem('dashboardTileOrder', JSON.stringify(orderIds));
        
        toast.success('Kachel-Reihenfolge gespeichert');
        
        return newOrder;
      });
    }
  };

  // Handle size change
  const handleSizeChange = (id: string, size: TileSize) => {
    setTileSizes(prev => {
      const newSizes = { ...prev, [id]: size };
      localStorage.setItem('dashboardTileSizes', JSON.stringify(newSizes));
      toast.success('Kachelgröße geändert');
      return newSizes;
    });
  };

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

  // Filter tiles based on user permissions
  const visibleTiles = tiles.filter(tile => {
    if (tile.permission === 'admin') {
      return user?.role === 'admin';
    }
    if (tile.permission === 'marketing') {
      return user?.role === 'admin' || user?.role === 'marketing';
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
            Navigieren Sie zu den verschiedenen Verwaltungsbereichen. Ziehen Sie die Kacheln, um sie neu anzuordnen, oder ändern Sie die Größe mit dem Größen-Symbol.
          </p>
        </div>

        {/* Dashboard Tiles Grid with Drag and Drop */}
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragEnd={handleDragEnd}
        >
          <SortableContext
            items={visibleTiles.map(t => t.id)}
            strategy={rectSortingStrategy}
          >
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6 auto-rows-fr">
              {visibleTiles.map((tile) => (
                <SortableTile
                  key={tile.id}
                  tile={tile}
                  size={tileSizes[tile.id] || 'normal'}
                  onSizeChange={handleSizeChange}
                />
              ))}
            </div>
          </SortableContext>
        </DndContext>

        {/* Quick Stats */}
        <QuickStats />
      </main>
    </div>
  );
}
