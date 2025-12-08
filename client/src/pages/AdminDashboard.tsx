import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Ticket, LogOut, BarChart3, Search, Filter, X, Users, FileText, AlertTriangle, ChevronDown, ChevronUp, Plus, Receipt, BookOpen, UserCircle, Package, Settings, TrendingUp, Menu, FileStack, Bell, Star, GripVertical, Layout } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";
import { DndContext, closestCenter, KeyboardSensor, PointerSensor, useSensor, useSensors, DragEndEvent } from "@dnd-kit/core";
import { arrayMove, SortableContext, sortableKeyboardCoordinates, useSortable, rectSortingStrategy } from "@dnd-kit/sortable";
import { CSS } from "@dnd-kit/utilities";
import { TicketDetail } from "@/components/TicketDetail";
import { DashboardStatistics } from "@/components/DashboardStatistics";
import { CreateTicketDialog } from "@/components/CreateTicketDialog";
import { DashboardCharts } from "@/components/DashboardCharts";
import { SortableCard } from "@/components/SortableCard";
import { useWebSocket } from "@/contexts/WebSocketContext";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const { socket, connected } = useWebSocket();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
  const [selectedTickets, setSelectedTickets] = useState<number[]>([]);
  const [showMobileMenu, setShowMobileMenu] = useState(false);
  const [showManagementDropdown, setShowManagementDropdown] = useState(false);
  const [showTemplateDropdown, setShowTemplateDropdown] = useState(false);
  const [showNotifications, setShowNotifications] = useState(false);
  const utils = trpc.useUtils();

  const { data: tickets, isLoading: ticketsLoading } = trpc.tickets.filtered.useQuery(
    {
      search: searchQuery || undefined,
      status: statusFilter as any,
      priority: priorityFilter as any,
      category: categoryFilter as any,
    },
    {
      enabled: !!user && (user.role === "admin" || user.role === "support"),
    }
  );

  const { data: stats } = trpc.tickets.stats.useQuery(undefined, {
    enabled: !!user && (user.role === "admin" || user.role === "support"),
  });

  // Live data for dashboard cards
  const { data: invoicesData } = trpc.invoices.all.useQuery(
    { status: 'pending' as any },
    { enabled: !!user && user.role === "admin" }
  );
  const { data: reminderLogsData } = trpc.reminderLog.list.useQuery(
    { page: 1, pageSize: 100 },
    { enabled: !!user && user.role === "admin" }
  );
  const { data: customersData } = trpc.customers.all.useQuery(
    undefined,
    { enabled: !!user && user.role === "admin" }
  );

  const openInvoicesCount = invoicesData?.filter((inv: any) => inv.status === 'pending').length || 0;
  const overdueRemindersCount = reminderLogsData?.logs?.filter((r: any) => r.status === 'sent' && r.daysOverdue > 0).length || 0;
  const totalCustomersCount = customersData?.length || 0;
  const todayTicketsCount = tickets?.filter((t: any) => {
    const today = new Date();
    const ticketDate = new Date(t.createdAt);
    return ticketDate.toDateString() === today.toDateString();
  }).length || 0;

  // Notifications data
  const urgentTickets = tickets?.filter((t: any) => t.priority === 'urgent' && t.status === 'open').slice(0, 3) || [];
  const overdueInvoices = invoicesData?.filter((inv: any) => {
    if (inv.status !== 'pending' || !inv.dueDate) return false;
    return new Date(inv.dueDate) < new Date();
  }).slice(0, 3) || [];
  const totalNotifications = urgentTickets.length + overdueInvoices.length + (overdueRemindersCount > 0 ? 1 : 0);

  // WebSocket real-time updates
  useEffect(() => {
    if (!socket || !connected) return;

    // Listen for ticket updates
    socket.on("ticket:created", () => {
      utils.tickets.filtered.invalidate();
      utils.tickets.stats.invalidate();
      toast.success("Neues Ticket erstellt", {
        description: "Dashboard wurde aktualisiert",
      });
    });

    socket.on("ticket:updated", () => {
      utils.tickets.filtered.invalidate();
      utils.tickets.stats.invalidate();
    });

    // Listen for invoice updates
    socket.on("invoice:created", () => {
      utils.invoices.all.invalidate();
      toast.success("Neue Rechnung erstellt", {
        description: "Dashboard wurde aktualisiert",
      });
    });

    socket.on("invoice:updated", () => {
      utils.invoices.all.invalidate();
    });

    // Listen for reminder updates
    socket.on("reminder:created", () => {
      utils.reminderLog.list.invalidate();
      toast.info("Neue Mahnung gesendet", {
        description: "Dashboard wurde aktualisiert",
      });
    });

    // Listen for customer updates
    socket.on("customer:created", () => {
      utils.customers.all.invalidate();
      toast.success("Neuer Kunde erstellt", {
        description: "Dashboard wurde aktualisiert",
      });
    });

    return () => {
      socket.off("ticket:created");
      socket.off("ticket:updated");
      socket.off("invoice:created");
      socket.off("invoice:updated");
      socket.off("reminder:created");
      socket.off("customer:created");
    };
  }, [socket, connected, utils]);

  // Favorites
  const { data: userFavorites } = trpc.favorites.list.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });
  
  const toggleFavoriteMutation = trpc.favorites.toggle.useMutation({
    onSuccess: (data) => {
      utils.favorites.list.invalidate();
      toast.success(data.action === "added" ? "Zu Favoriten hinzugefügt" : "Aus Favoriten entfernt");
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Aktualisieren der Favoriten");
    },
  });
  
  const isFavorite = (itemType: string) => {
    return userFavorites?.some((fav: any) => fav.itemType === itemType) || false;
  };

  // Dashboard card order state
  const defaultCardOrder = ["accounting", "crm", "reminders", "statistics"];
  const [cardOrder, setCardOrder] = useState<string[]>(() => {
    const saved = localStorage.getItem("dashboardCardOrder");
    return saved ? JSON.parse(saved) : defaultCardOrder;
  });

  // Dashboard template state
  const [dashboardTemplate, setDashboardTemplate] = useState<string>(() => {
    return localStorage.getItem("dashboardTemplate") || "default";
  });

  // Template configurations
  const templates = {
    default: {
      name: "Standard",
      description: "Ausgewogene Ansicht aller Funktionen",
      cardOrder: ["accounting", "crm", "reminders", "statistics"],
      showCharts: true,
      showTickets: true,
    },
    finance: {
      name: "Finanzen",
      description: "Fokus auf Buchhaltung und Rechnungen",
      cardOrder: ["accounting", "reminders", "crm", "statistics"],
      showCharts: true,
      showTickets: false,
    },
    support: {
      name: "Support",
      description: "Fokus auf Tickets und Kundenservice",
      cardOrder: ["statistics", "crm", "accounting", "reminders"],
      showCharts: false,
      showTickets: true,
    },
    management: {
      name: "Management",
      description: "Übersicht mit Statistiken und Charts",
      cardOrder: ["statistics", "accounting", "crm", "reminders"],
      showCharts: true,
      showTickets: false,
    },
  };

  const applyTemplate = (templateKey: string) => {
    const template = templates[templateKey as keyof typeof templates];
    if (template) {
      setCardOrder(template.cardOrder);
      setDashboardTemplate(templateKey);
      localStorage.setItem("dashboardCardOrder", JSON.stringify(template.cardOrder));
      localStorage.setItem("dashboardTemplate", templateKey);
      toast.success(`Vorlage "${template.name}" aktiviert`);
    }
  };

  // Save card order to localStorage
  useEffect(() => {
    localStorage.setItem("dashboardCardOrder", JSON.stringify(cardOrder));
  }, [cardOrder]);

  // Drag and drop sensors
  const sensors = useSensors(
    useSensor(PointerSensor),
    useSensor(KeyboardSensor, {
      coordinateGetter: sortableKeyboardCoordinates,
    })
  );

  const handleDragEnd = (event: DragEndEvent) => {
    const { active, over } = event;

    if (over && active.id !== over.id) {
      setCardOrder((items) => {
        const oldIndex = items.indexOf(active.id as string);
        const newIndex = items.indexOf(over.id as string);
        return arrayMove(items, oldIndex, newIndex);
      });
      toast.success("Karten-Reihenfolge gespeichert");
    }
  };

  const { data: supportStaff } = trpc.tickets.supportStaff.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: overdueTickets } = trpc.tickets.overdue.useQuery(undefined, {
    enabled: !!user && (user.role === "admin" || user.role === "support"),
    refetchInterval: 60000, // Refetch every minute
  });

  const assignMutation = trpc.tickets.assign.useMutation({
    onSuccess: () => {
      toast.success("Ticket zugewiesen");
      utils.tickets.filtered.invalidate();
    },
    onError: () => {
      toast.error("Fehler beim Zuweisen");
    },
  });

  const updateMutation = trpc.tickets.update.useMutation({
    onSuccess: () => {
      toast.success("Ticket aktualisiert");
      utils.tickets.all.invalidate();
      utils.tickets.stats.invalidate();
    },
    onError: (error) => {
      toast.error(error.message || "Fehler beim Aktualisieren");
    },
  });

  const bulkDeleteMutation = trpc.tickets.bulkDelete.useMutation({
    onSuccess: (data) => {
      toast.success(`${data.count} Ticket(s) erfolgreich gelöscht`);
      setSelectedTickets([]);
      utils.tickets.filtered.invalidate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Erfolgreich abgemeldet");
      setLocation("/login");
    },
  });

  if (authLoading || ticketsLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !['admin', 'support', 'accounting'].includes(user.role)) {
    setLocation("/login");
    return null;
  }

  // Redirect accounting users to accounting dashboard
  if (user.role === 'accounting') {
    setLocation('/accounting-dashboard');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case "open":
        return "bg-blue-500/20 text-blue-400 border-blue-500/30";
      case "in_progress":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "resolved":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      case "closed":
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case "urgent":
        return "bg-red-500/20 text-red-400 border-red-500/30";
      case "high":
        return "bg-orange-500/20 text-orange-400 border-orange-500/30";
      case "medium":
        return "bg-yellow-500/20 text-yellow-400 border-yellow-500/30";
      case "low":
        return "bg-green-500/20 text-green-400 border-green-500/30";
      default:
        return "bg-gray-500/20 text-gray-400 border-gray-500/30";
    }
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Admin Dashboard</h1>
              <p className="text-xs md:text-sm text-gray-400">Ticket-Verwaltung</p>
            </div>
            {/* Desktop Navigation */}
            <div className="hidden lg:flex items-center gap-2">
              <Button
                variant="default"
                onClick={() => setShowCreateTicket(true)}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Plus className="h-4 w-4 mr-2" />
                Ticket erstellen
              </Button>
              {user?.role === "admin" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/accounting")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <Receipt className="h-4 w-4 mr-2" />
                    Buchhaltung
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/crm")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <UserCircle className="h-4 w-4 mr-2" />
                    CRM
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/admin/knowledge-base")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <BookOpen className="h-4 w-4 mr-2" />
                    Wissensdatenbank
                  </Button>
                  
                  {/* Template Switcher */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowTemplateDropdown(!showTemplateDropdown)}
                      className="border-white/20 bg-white/5 hover:bg-white/10"
                      size="sm"
                    >
                      <Layout className="h-4 w-4 mr-2" />
                      Vorlage
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                    {showTemplateDropdown && (
                      <div className="absolute right-0 mt-2 w-64 bg-black/95 border border-white/10 rounded-lg shadow-xl z-50 backdrop-blur-xl">
                        <div className="py-2">
                          {Object.entries(templates).map(([key, template]) => (
                            <button
                              key={key}
                              onClick={() => {
                                applyTemplate(key);
                                setShowTemplateDropdown(false);
                              }}
                              className={`w-full px-4 py-3 text-left hover:bg-white/10 transition-colors ${
                                dashboardTemplate === key ? "bg-white/5" : ""
                              }`}
                            >
                              <div className="flex items-center justify-between">
                                <div>
                                  <div className="text-sm font-semibold">{template.name}</div>
                                  <div className="text-xs text-gray-400 mt-0.5">{template.description}</div>
                                </div>
                                {dashboardTemplate === key && (
                                  <div className="h-2 w-2 rounded-full bg-primary" />
                                )}
                              </div>
                            </button>
                          ))}
                        </div>
                      </div>
                    )}
                  </div>

                  {/* Management Dropdown */}
                  <div className="relative">
                    <Button
                      variant="outline"
                      onClick={() => setShowManagementDropdown(!showManagementDropdown)}
                      className="border-white/20 bg-white/5 hover:bg-white/10"
                      size="sm"
                    >
                      <Settings className="h-4 w-4 mr-2" />
                      Verwaltung
                      <ChevronDown className="h-3 w-3 ml-1" />
                    </Button>
                    {showManagementDropdown && (
                      <div className="absolute right-0 mt-2 w-56 bg-black/95 border border-white/10 rounded-lg shadow-xl z-50 backdrop-blur-xl">
                        <div className="py-2">
                          <button
                            onClick={() => {
                              setLocation("/user-management");
                              setShowManagementDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                          >
                            <Users className="h-4 w-4" />
                            Benutzerverwaltung
                          </button>
                          <button
                            onClick={() => {
                              setLocation("/products");
                              setShowManagementDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                          >
                            <Package className="h-4 w-4" />
                            Produkte
                          </button>
                          <button
                            onClick={() => {
                              setLocation("/templates");
                              setShowManagementDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                          >
                            <FileStack className="h-4 w-4" />
                            Vorlagen
                          </button>
                          <div className="border-t border-white/10 my-2"></div>
                          <button
                            onClick={() => {
                              setLocation("/notification-settings");
                              setShowManagementDropdown(false);
                            }}
                            className="w-full px-4 py-2 text-left text-sm hover:bg-white/10 flex items-center gap-2"
                          >
                            <Settings className="h-4 w-4" />
                            Benachrichtigungen
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                </>
              )}
              
              {/* Notification Center */}
              {user?.role === "admin" && (
                <div className="relative">
                  <Button
                    variant="outline"
                    onClick={() => setShowNotifications(!showNotifications)}
                    className="border-white/20 bg-white/5 hover:bg-white/10 relative"
                    size="sm"
                  >
                    <Bell className="h-4 w-4" />
                    {totalNotifications > 0 && (
                      <span className="absolute -top-1 -right-1 h-5 w-5 bg-red-500 rounded-full text-xs flex items-center justify-center font-bold">
                        {totalNotifications}
                      </span>
                    )}
                  </Button>
                  {showNotifications && (
                    <div className="absolute right-0 mt-2 w-80 bg-black/95 border border-white/10 rounded-lg shadow-xl z-50 backdrop-blur-xl max-h-96 overflow-y-auto">
                      <div className="p-4">
                        <div className="flex justify-between items-center mb-4">
                          <h3 className="font-semibold">Benachrichtigungen</h3>
                          <Badge variant="secondary" className="bg-red-500/20 text-red-400">
                            {totalNotifications}
                          </Badge>
                        </div>
                        
                        {totalNotifications === 0 ? (
                          <p className="text-sm text-gray-400 text-center py-4">Keine neuen Benachrichtigungen</p>
                        ) : (
                          <div className="space-y-2">
                            {/* Urgent Tickets */}
                            {urgentTickets.map((ticket: any) => (
                              <button
                                key={`ticket-${ticket.id}`}
                                onClick={() => {
                                  setSelectedTicketId(ticket.id);
                                  setShowNotifications(false);
                                }}
                                className="w-full p-3 bg-red-500/10 hover:bg-red-500/20 rounded-lg text-left border border-red-500/30 transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <AlertTriangle className="h-4 w-4 text-red-400 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Dringendes Ticket #{ticket.id}</p>
                                    <p className="text-xs text-gray-400 line-clamp-1">{ticket.subject}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                            
                            {/* Overdue Invoices */}
                            {overdueInvoices.map((invoice: any) => (
                              <button
                                key={`invoice-${invoice.id}`}
                                onClick={() => {
                                  setLocation(`/accounting/invoices/${invoice.id}`);
                                  setShowNotifications(false);
                                }}
                                className="w-full p-3 bg-orange-500/10 hover:bg-orange-500/20 rounded-lg text-left border border-orange-500/30 transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <Receipt className="h-4 w-4 text-orange-400 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">Überfällige Rechnung {invoice.invoiceNumber}</p>
                                    <p className="text-xs text-gray-400">Fällig seit {new Date(invoice.dueDate).toLocaleDateString('de-DE')}</p>
                                  </div>
                                </div>
                              </button>
                            ))}
                            
                            {/* Overdue Reminders Summary */}
                            {overdueRemindersCount > 0 && (
                              <button
                                onClick={() => {
                                  setLocation("/accounting/reminders");
                                  setShowNotifications(false);
                                }}
                                className="w-full p-3 bg-purple-500/10 hover:bg-purple-500/20 rounded-lg text-left border border-purple-500/30 transition-colors"
                              >
                                <div className="flex items-start gap-2">
                                  <Bell className="h-4 w-4 text-purple-400 mt-0.5" />
                                  <div className="flex-1">
                                    <p className="text-sm font-medium">{overdueRemindersCount} überfällige Mahnungen</p>
                                    <p className="text-xs text-gray-400">Jetzt überprüfen</p>
                                  </div>
                                </div>
                              </button>
                            )}
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              )}
              
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="border-white/20 bg-white/5 hover:bg-white/10"
                size="sm"
              >
                <LogOut className="h-4 w-4 mr-2" />
                Abmelden
              </Button>
            </div>
            
            {/* Mobile Menu Button */}
            <Button
              variant="outline"
              onClick={() => setShowMobileMenu(!showMobileMenu)}
              className="lg:hidden border-white/20 bg-white/5 hover:bg-white/10"
              size="sm"
            >
              <Menu className="h-5 w-5" />
            </Button>
          </div>
        </div>
      </div>

      {/* Mobile Slide-In Menu */}
      {showMobileMenu && (
        <div className="lg:hidden fixed inset-0 z-50 bg-black/80 backdrop-blur-sm" onClick={() => setShowMobileMenu(false)}>
          <div 
            className="absolute right-0 top-0 h-full w-80 max-w-[85vw] bg-black border-l border-white/10 shadow-2xl overflow-y-auto"
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6">
              <div className="flex justify-between items-center mb-6">
                <h2 className="text-xl font-bold">Menü</h2>
                <button onClick={() => setShowMobileMenu(false)} className="p-2 hover:bg-white/10 rounded-full">
                  <X className="h-5 w-5" />
                </button>
              </div>
              
              <div className="space-y-2">
                <button
                  onClick={() => {
                    setShowCreateTicket(true);
                    setShowMobileMenu(false);
                  }}
                  className="w-full px-4 py-3 bg-primary hover:bg-primary/90 rounded-lg text-left font-medium flex items-center gap-3"
                >
                  <Plus className="h-5 w-5" />
                  Ticket erstellen
                </button>
                
                {user?.role === "admin" && (
                  <>
                    <div className="border-t border-white/10 my-4"></div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Hauptmenü</p>
                    
                    <button
                      onClick={() => {
                        setLocation("/accounting");
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3"
                    >
                      <Receipt className="h-5 w-5" />
                      Buchhaltung
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation("/crm");
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3"
                    >
                      <UserCircle className="h-5 w-5" />
                      CRM
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation("/admin/knowledge-base");
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3"
                    >
                      <BookOpen className="h-5 w-5" />
                      Wissensdatenbank
                    </button>
                    
                    <div className="border-t border-white/10 my-4"></div>
                    <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider px-2 mb-2">Verwaltung</p>
                    
                    <button
                      onClick={() => {
                        setLocation("/user-management");
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3"
                    >
                      <Users className="h-5 w-5" />
                      Benutzerverwaltung
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation("/products");
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3"
                    >
                      <Package className="h-5 w-5" />
                      Produkte
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation("/templates");
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3"
                    >
                      <FileStack className="h-5 w-5" />
                      Vorlagen
                    </button>
                    
                    <button
                      onClick={() => {
                        setLocation("/notification-settings");
                        setShowMobileMenu(false);
                      }}
                      className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3"
                    >
                      <Settings className="h-5 w-5" />
                      Benachrichtigungen
                    </button>
                  </>
                )}
                
                <div className="border-t border-white/10 my-4"></div>
                
                <button
                  onClick={() => {
                    logoutMutation.mutate();
                    setShowMobileMenu(false);
                  }}
                  disabled={logoutMutation.isPending}
                  className="w-full px-4 py-3 hover:bg-white/10 rounded-lg text-left flex items-center gap-3 text-red-400"
                >
                  <LogOut className="h-5 w-5" />
                  Abmelden
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Favorites Section */}
        {user?.role === "admin" && userFavorites && userFavorites.length > 0 && (
          <div className="mb-8">
            <div className="flex items-center gap-2 mb-4">
              <Star className="h-5 w-5 fill-yellow-400 text-yellow-400" />
              <h2 className="text-xl font-bold">Meine Favoriten</h2>
            </div>
            <div className="flex flex-wrap gap-3">
              {userFavorites.map((fav: any) => (
                <Button
                  key={fav.id}
                  variant="outline"
                  onClick={() => setLocation(fav.itemPath)}
                  className="border-yellow-400/30 bg-yellow-400/10 hover:bg-yellow-400/20 text-yellow-400"
                >
                  <Star className="h-4 w-4 mr-2 fill-yellow-400" />
                  {fav.itemLabel}
                </Button>
              ))}
            </div>
          </div>
        )}

        {/* Dashboard Charts */}
        {user?.role === "admin" && templates[dashboardTemplate as keyof typeof templates]?.showCharts && (
          <DashboardCharts />
        )}

        {/* Quick Access Cards */}
        {user?.role === "admin" && (
          <div className="mb-8">
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold">Schnellzugriff</h2>
              <p className="text-sm text-gray-400">Ziehen Sie die Karten, um die Reihenfolge anzupassen</p>
            </div>
            <DndContext sensors={sensors} collisionDetection={closestCenter} onDragEnd={handleDragEnd}>
              <SortableContext items={cardOrder} strategy={rectSortingStrategy}>
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                  {cardOrder.map((cardId) => {
                    const cardConfig: Record<string, any> = {
                      accounting: {
                        icon: Receipt,
                        title: "Finanzen",
                        path: "/accounting",
                        gradient: "from-primary/20 to-primary/5 border-primary/30",
                        iconBg: "bg-primary/20",
                        iconColor: "text-primary",
                        badgeBg: "bg-primary/20 text-primary border-primary/30",
                        description: "Offene Rechnungen",
                        count: openInvoicesCount,
                      },
                      crm: {
                        icon: UserCircle,
                        title: "CRM",
                        path: "/crm",
                        gradient: "from-blue-500/20 to-blue-500/5 border-blue-500/30",
                        iconBg: "bg-blue-500/20",
                        iconColor: "text-blue-400",
                        badgeBg: "bg-blue-500/20 text-blue-400 border-blue-500/30",
                        description: "Gesamt Kunden",
                        count: totalCustomersCount,
                      },
                      reminders: {
                        icon: Bell,
                        title: "Mahnungs-Log",
                        path: "/accounting/reminders",
                        gradient: "from-purple-500/20 to-purple-500/5 border-purple-500/30",
                        iconBg: "bg-purple-500/20",
                        iconColor: "text-purple-400",
                        badgeBg: "bg-purple-500/20 text-purple-400 border-purple-500/30",
                        description: "Überfällige Mahnungen",
                        count: overdueRemindersCount,
                      },
                      statistics: {
                        icon: TrendingUp,
                        title: "Statistiken",
                        path: null,
                        gradient: "from-green-500/20 to-green-500/5 border-green-500/30",
                        iconBg: "bg-green-500/20",
                        iconColor: "text-green-400",
                        badgeBg: null,
                        description: "Detaillierte Ticket-Analysen",
                        count: null,
                      },
                    };

                    const config = cardConfig[cardId];
                    if (!config) return null;

                    const Icon = config.icon;

                    return (
                      <SortableCard key={cardId} id={cardId}>
                        <Card 
                          className={`bg-gradient-to-br ${config.gradient} cursor-pointer hover:scale-105 transition-transform relative group`}
                          onClick={() => {
                            if (cardId === "statistics") {
                              setShowStatistics(!showStatistics);
                            } else if (config.path) {
                              setLocation(config.path);
                            }
                          }}
                        >
                          {cardId !== "statistics" && (
                            <button
                              onClick={(e) => {
                                e.stopPropagation();
                                toggleFavoriteMutation.mutate({
                                  itemType: cardId,
                                  itemLabel: config.title,
                                  itemPath: config.path,
                                });
                              }}
                              className={`absolute top-2 right-2 p-1.5 hover:${config.iconBg} rounded-full transition-colors z-10`}
                            >
                              <Star className={`h-4 w-4 ${isFavorite(cardId) ? "fill-yellow-400 text-yellow-400" : "text-gray-400"}`} />
                            </button>
                          )}
                          <CardHeader className="pb-3">
                            <div className="flex items-center gap-3">
                              <div className={`p-2 ${config.iconBg} rounded-lg`}>
                                <Icon className={`h-6 w-6 ${config.iconColor}`} />
                              </div>
                              <CardTitle className="text-base font-semibold">{config.title}</CardTitle>
                            </div>
                          </CardHeader>
                          <CardContent>
                            {config.count !== null ? (
                              <div className="flex items-center justify-between">
                                <p className="text-sm text-gray-400">{config.description}</p>
                                <Badge variant="secondary" className={config.badgeBg}>
                                  {config.count}
                                </Badge>
                              </div>
                            ) : (
                              <p className="text-sm text-gray-400">{config.description}</p>
                            )}
                          </CardContent>
                        </Card>
                      </SortableCard>
                    );
                  })}
                </div>
              </SortableContext>
            </DndContext>
          </div>
        )}

        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card 
              className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => {
                setStatusFilter(undefined);
                setPriorityFilter(undefined);
                setCategoryFilter(undefined);
              }}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </CardContent>
            </Card>

            <Card 
              className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setStatusFilter('open')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Offen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">{stats.open}</div>
              </CardContent>
            </Card>

            <Card 
              className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setStatusFilter('in_progress')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">In Bearbeitung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-400">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card 
              className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
              onClick={() => setStatusFilter('resolved')}
            >
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Gelöst</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-green-400">{stats.resolved}</div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Tickets List */}
        {(user?.role === "admin" || user?.role === "support") && templates[dashboardTemplate as keyof typeof templates]?.showTickets && (
        <div className="mb-8">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-bold flex items-center gap-2">
              <Ticket className="h-5 w-5 text-primary" />
              Alle Tickets
            </h2>
          </div>

          {/* Search and Filters */}
          <Card className="bg-gradient-to-br from-white/10 to-white/5 border-white/20 mb-6 backdrop-blur-sm">
            <CardContent className="p-6 space-y-6">
              {/* Search Bar */}
              <div className="relative group">
                <Search className="absolute left-4 top-1/2 -translate-y-1/2 h-5 w-5 text-primary transition-colors" />
                <input
                  type="text"
                  placeholder="Suche nach Ticket-Nr, Betreff, Kunde, E-Mail..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="w-full pl-12 pr-12 py-4 bg-black/30 border-2 border-white/10 rounded-xl text-white placeholder:text-gray-400 focus:outline-none focus:border-primary focus:bg-black/40 transition-all duration-200 text-base"
                />
                {searchQuery && (
                  <button
                    onClick={() => setSearchQuery("")}
                    className="absolute right-4 top-1/2 -translate-y-1/2 text-gray-400 hover:text-white transition-colors p-1 hover:bg-white/10 rounded-lg"
                  >
                    <X className="h-5 w-5" />
                  </button>
                )}
              </div>

              {/* Filter Grid */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {/* Priority Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="p-1.5 bg-yellow-500/20 rounded-lg">
                      <Filter className="h-4 w-4 text-yellow-400" />
                    </div>
                    Priorität
                  </label>
                  <Select value={priorityFilter || "all"} onValueChange={(v) => setPriorityFilter(v === "all" ? undefined : v)}>
                    <SelectTrigger className="bg-black/30 border-2 border-white/10 hover:border-white/20 transition-colors h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="low">Niedrig</SelectItem>
                      <SelectItem value="medium">Mittel</SelectItem>
                      <SelectItem value="high">Hoch</SelectItem>
                      <SelectItem value="urgent">Dringend</SelectItem>
                    </SelectContent>
                  </Select>
                </div>

                {/* Category Filter */}
                <div className="space-y-2">
                  <label className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <div className="p-1.5 bg-purple-500/20 rounded-lg">
                      <Filter className="h-4 w-4 text-purple-400" />
                    </div>
                    Kategorie
                  </label>
                  <Select value={categoryFilter || "all"} onValueChange={(v) => setCategoryFilter(v === "all" ? undefined : v)}>
                    <SelectTrigger className="bg-black/30 border-2 border-white/10 hover:border-white/20 transition-colors h-12 text-base">
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle</SelectItem>
                      <SelectItem value="network">Netzwerk</SelectItem>
                      <SelectItem value="security">Sicherheit</SelectItem>
                      <SelectItem value="hardware">Hardware</SelectItem>
                      <SelectItem value="software">Software</SelectItem>
                      <SelectItem value="email">E-Mail</SelectItem>
                      <SelectItem value="other">Sonstiges</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
              </div>

              {/* Active Filters */}
              {(searchQuery || priorityFilter || categoryFilter) && (
                <div className="flex items-center gap-3 flex-wrap p-4 bg-black/20 rounded-lg border border-white/10">
                  <span className="text-sm font-medium text-gray-300 flex items-center gap-2">
                    <Filter className="h-4 w-4" />
                    Aktive Filter:
                  </span>
                  <div className="flex gap-2 flex-wrap">
                    {searchQuery && (
                      <Badge variant="outline" className="bg-primary/20 text-primary border-primary/30 px-3 py-1">
                        {searchQuery}
                      </Badge>
                    )}
                    {priorityFilter && (
                      <Badge variant="outline" className="bg-yellow-500/20 text-yellow-400 border-yellow-500/30 px-3 py-1">
                        {priorityFilter}
                      </Badge>
                    )}
                    {categoryFilter && (
                      <Badge variant="outline" className="bg-purple-500/20 text-purple-400 border-purple-500/30 px-3 py-1">
                        {categoryFilter}
                      </Badge>
                    )}
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSearchQuery("");
                        setPriorityFilter(undefined);
                        setCategoryFilter(undefined);
                      }}
                      className="h-7 text-xs hover:bg-white/10"
                    >
                      <X className="h-3 w-3 mr-1" />
                      Zurücksetzen
                    </Button>
                  </div>
                </div>
              )}
            </CardContent>
          </Card>

          {/* Detailed Statistics */}
          <div className="mb-8">
            <Button
              variant="outline"
              onClick={() => setShowStatistics(!showStatistics)}
              className="mb-4 border-white/20 bg-white/5 hover:bg-white/10 w-full justify-between"
            >
              <span className="flex items-center gap-2">
                <BarChart3 className="h-4 w-4" />
                Detaillierte Statistiken
              </span>
              {showStatistics ? <ChevronUp className="h-4 w-4" /> : <ChevronDown className="h-4 w-4" />}
            </Button>
            {showStatistics && <DashboardStatistics />}
          </div>

          {/* Bulk Actions Bar */}
          {selectedTickets.length > 0 && (
            <Card className="bg-blue-500/10 border-blue-500/30 mb-4">
              <CardContent className="py-4">
                <div className="flex flex-wrap items-center gap-4">
                  <span className="text-white font-medium">
                    {selectedTickets.length} Ticket(s) ausgewählt
                  </span>
                  <div className="flex gap-2">
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => setSelectedTickets([])}
                      className="border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      Auswahl aufheben
                    </Button>
                    <Button
                      size="sm"
                      variant="outline"
                      onClick={() => {
                        if (tickets) {
                          setSelectedTickets(tickets.map(t => t.id));
                        }
                      }}
                      className="border-white/20 bg-white/5 hover:bg-white/10"
                    >
                      Alle auswählen
                    </Button>
                  </div>
                  <div className="h-6 w-px bg-white/20" />
                  {/* Bulk Actions */}
                  <Button
                    size="sm"
                    variant="destructive"
                    onClick={() => {
                      if (confirm(`Möchten Sie ${selectedTickets.length} Ticket(s) wirklich löschen?`)) {
                        bulkDeleteMutation.mutate({ ticketIds: selectedTickets });
                      }
                    }}
                  >
                    Löschen
                  </Button>
                </div>
              </CardContent>
            </Card>
          )}

          {!tickets || tickets.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">Keine Tickets vorhanden.</p>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card 
                  key={ticket.id} 
                  className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors"
                >
                  <div className="flex items-start gap-3 p-6">
                    <input
                      type="checkbox"
                      checked={selectedTickets.includes(ticket.id)}
                      onChange={(e) => {
                        e.stopPropagation();
                        if (e.target.checked) {
                          setSelectedTickets([...selectedTickets, ticket.id]);
                        } else {
                          setSelectedTickets(selectedTickets.filter(id => id !== ticket.id));
                        }
                      }}
                      className="mt-1 h-4 w-4 rounded border-gray-300"
                    />
                    <div className="flex-1 cursor-pointer" onClick={() => setSelectedTicketId(ticket.id)}>
                  <CardHeader>
                    <div className="flex flex-col md:flex-row md:justify-between md:items-start gap-3">
                      <div className="flex-1">
                        <CardTitle className="text-white">#{ticket.id} - {ticket.subject}</CardTitle>
                        <CardDescription className="text-gray-400">
                          Von: {ticket.customerName} ({ticket.customerEmail})
                          {ticket.company && ` - ${ticket.company}`}
                        </CardDescription>
                        <CardDescription className="text-gray-400">
                          Erstellt: {new Date(ticket.createdAt).toLocaleDateString("de-DE", {
                            year: "numeric",
                            month: "long",
                            day: "numeric",
                            hour: "2-digit",
                            minute: "2-digit",
                          })}
                        </CardDescription>
                      </div>
                      <div className="flex gap-2 flex-wrap">
                        <Badge className={getCategoryColor(ticket.category)}>
                          {getCategoryLabel(ticket.category)}
                        </Badge>
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status === "in_progress" ? "In Bearbeitung" : ticket.status === "open" ? "Offen" : ticket.status === "resolved" ? "Gelöst" : "Geschlossen"}
                        </Badge>
                        {ticket.slaDueDate && ticket.status !== 'resolved' && ticket.status !== 'closed' && (
                          <Badge className={new Date(ticket.slaDueDate) < new Date() ? "bg-red-500/20 text-red-400 border-red-500/30" : "bg-green-500/20 text-green-400 border-green-500/30"}>
                            <AlertTriangle className="h-3 w-3 mr-1" />
                            {new Date(ticket.slaDueDate) < new Date() ? 'Überfällig' : `Fällig: ${new Date(ticket.slaDueDate).toLocaleDateString('de-DE', { month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })}`}
                          </Badge>
                        )}
                        {ticket.escalationLevel && ticket.escalationLevel > 0 && (
                          <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">
                            Eskalation Level {ticket.escalationLevel}
                          </Badge>
                        )}
                      </div>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div>
                      <p className="text-sm font-medium text-gray-400 mb-1">Nachricht:</p>
                      <p className="text-gray-300">{ticket.message}</p>
                    </div>

                    {ticket.adminNotes && (
                      <div>
                        <p className="text-sm font-medium text-gray-400 mb-1">Admin-Notizen:</p>
                        <p className="text-gray-300">{ticket.adminNotes}</p>
                      </div>
                    )}

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-white/10">
                      <Button
                        variant="outline"
                        onClick={() => setSelectedTicketId(ticket.id)}
                        className="border-white/20 bg-white/5 hover:bg-white/10"
                      >
                        Details & Kommentare
                      </Button>
                    </div>

                    <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 pt-4 border-t border-white/10">
                      <div className="flex-1">
                        <label className="text-sm text-gray-400 mb-2 block">Status ändern:</label>
                        <Select
                          value={ticket.status}
                          onValueChange={(value) => {
                            updateMutation.mutate({
                              id: ticket.id,
                              status: value as any,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="open">Offen</SelectItem>
                            <SelectItem value="in_progress">In Bearbeitung</SelectItem>
                            <SelectItem value="resolved">Gelöst</SelectItem>
                            <SelectItem value="closed">Geschlossen</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      <div className="flex-1">
                        <label className="text-sm text-gray-400 mb-2 block">Priorität ändern:</label>
                        <Select
                          value={ticket.priority}
                          onValueChange={(value) => {
                            updateMutation.mutate({
                              id: ticket.id,
                              priority: value as any,
                            });
                          }}
                        >
                          <SelectTrigger className="bg-white/10 border-white/20">
                            <SelectValue />
                          </SelectTrigger>
                          <SelectContent>
                            <SelectItem value="low">Niedrig</SelectItem>
                            <SelectItem value="medium">Mittel</SelectItem>
                            <SelectItem value="high">Hoch</SelectItem>
                            <SelectItem value="urgent">Dringend</SelectItem>
                          </SelectContent>
                        </Select>
                      </div>

                      {user?.role === "admin" && (
                        <div className="flex-1">
                          <label className="text-sm text-gray-400 mb-2 block">Zugewiesen an:</label>
                          <Select
                            value={ticket.assignedTo?.toString() || "unassigned"}
                            onValueChange={(value) => {
                              assignMutation.mutate({
                                ticketId: ticket.id,
                                assignedTo: value === "unassigned" ? null : parseInt(value),
                              });
                            }}
                          >
                            <SelectTrigger className="bg-white/10 border-white/20">
                              <SelectValue />
                            </SelectTrigger>
                            <SelectContent>
                              <SelectItem value="unassigned">Nicht zugewiesen</SelectItem>
                              {supportStaff?.map((staff) => (
                                <SelectItem key={staff.id} value={staff.id.toString()}>
                                  {staff.name || staff.email}
                                </SelectItem>
                              ))}
                            </SelectContent>
                          </Select>
                        </div>
                      )}
                    </div>
                  </CardContent>
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          )}
        </div>
        )}
      </div>

      {/* Ticket Detail Modal */}
        {selectedTicketId && (
        <TicketDetail ticketId={selectedTicketId} onClose={() => setSelectedTicketId(null)} />
      )}

      <CreateTicketDialog open={showCreateTicket} onOpenChange={setShowCreateTicket} />
    </div>
  );
}

function getCategoryColor(category: string) {
  switch (category) {
    case "network":
      return "bg-blue-500/20 text-blue-400 border-blue-500/30";
    case "security":
      return "bg-red-500/20 text-red-400 border-red-500/30";
    case "hardware":
      return "bg-purple-500/20 text-purple-400 border-purple-500/30";
    case "software":
      return "bg-green-500/20 text-green-400 border-green-500/30";
    case "email":
      return "bg-cyan-500/20 text-cyan-400 border-cyan-500/30";
    case "other":
    default:
      return "bg-gray-500/20 text-gray-400 border-gray-500/30";
  }
}

function getCategoryLabel(category: string) {
  switch (category) {
    case "network":
      return "Netzwerk";
    case "security":
      return "Sicherheit";
    case "hardware":
      return "Hardware";
    case "software":
      return "Software";
    case "email":
      return "E-Mail";
    case "other":
    default:
      return "Sonstiges";
  }
}
