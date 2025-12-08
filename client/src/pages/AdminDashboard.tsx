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
import { Loader2, Ticket, LogOut, BarChart3, Search, Filter, X, Users, FileText, AlertTriangle, ChevronDown, ChevronUp, Plus, Receipt, BookOpen, UserCircle } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { TicketDetail } from "@/components/TicketDetail";
import { DashboardStatistics } from "@/components/DashboardStatistics";
import { CreateTicketDialog } from "@/components/CreateTicketDialog";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedTicketId, setSelectedTicketId] = useState<number | null>(null);
  const [searchQuery, setSearchQuery] = useState("");
  const [statusFilter, setStatusFilter] = useState<string | undefined>(undefined);
  const [priorityFilter, setPriorityFilter] = useState<string | undefined>(undefined);
  const [categoryFilter, setCategoryFilter] = useState<string | undefined>(undefined);
  const [showStatistics, setShowStatistics] = useState(false);
  const [showCreateTicket, setShowCreateTicket] = useState(false);
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

  if (!user || user.role !== "admin") {
    setLocation("/login");
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
            <div className="flex items-center gap-2">              <Button
                variant="default"
                onClick={() => setShowCreateTicket(true)}
                className="bg-primary hover:bg-primary/90"
                size="sm"
              >
                <Plus className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Ticket erstellen</span>
              </Button>
              {user?.role === "admin" && (
                <>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/admin/templates")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <FileText className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Vorlagen</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/admin/users")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <Users className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Benutzerverwaltung</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/admin/knowledge-base")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <BookOpen className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Wissensdatenbank</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/accounting")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <Receipt className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">Buchhaltung</span>
                  </Button>
                  <Button
                    variant="outline"
                    onClick={() => setLocation("/crm")}
                    className="border-white/20 bg-white/5 hover:bg-white/10"
                    size="sm"
                  >
                    <UserCircle className="h-4 w-4 md:mr-2" />
                    <span className="hidden md:inline">CRM</span>
                  </Button>
                </>
              )}
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="border-white/20 bg-white/5 hover:bg-white/10"
                size="sm"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
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
                  className="bg-white/5 border-white/10 cursor-pointer hover:bg-white/10 transition-colors"
                  onClick={() => setSelectedTicketId(ticket.id)}
                >
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
                </Card>
              ))}
            </div>
          )}
        </div>
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
