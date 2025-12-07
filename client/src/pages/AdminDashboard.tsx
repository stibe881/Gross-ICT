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
import { Loader2, Ticket, LogOut, BarChart3 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";

export default function AdminDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const utils = trpc.useUtils();

  const { data: tickets, isLoading: ticketsLoading } = trpc.tickets.all.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
  });

  const { data: stats } = trpc.tickets.stats.useQuery(undefined, {
    enabled: !!user && user.role === "admin",
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
        <div className="container mx-auto px-4 py-4 flex justify-between items-center">
          <div>
            <h1 className="text-2xl font-bold">Admin Dashboard</h1>
            <p className="text-sm text-gray-400">Ticket-Verwaltung</p>
          </div>
          <Button
            variant="outline"
            onClick={() => logoutMutation.mutate()}
            disabled={logoutMutation.isPending}
            className="border-white/20 bg-white/5 hover:bg-white/10"
          >
            <LogOut className="mr-2 h-4 w-4" />
            Abmelden
          </Button>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Statistics */}
        {stats && (
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Total</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-white">{stats.total}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">Offen</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-blue-400">{stats.open}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
              <CardHeader className="pb-3">
                <CardTitle className="text-sm font-medium text-gray-400">In Bearbeitung</CardTitle>
              </CardHeader>
              <CardContent>
                <div className="text-3xl font-bold text-yellow-400">{stats.inProgress}</div>
              </CardContent>
            </Card>

            <Card className="bg-white/5 border-white/10">
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
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Alle Tickets
          </h2>

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
                <Card key={ticket.id} className="bg-white/5 border-white/10">
                  <CardHeader>
                    <div className="flex justify-between items-start">
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
                      <div className="flex gap-2">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status === "in_progress" ? "In Bearbeitung" : ticket.status === "open" ? "Offen" : ticket.status === "resolved" ? "Gelöst" : "Geschlossen"}
                        </Badge>
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

                    <div className="flex gap-4 pt-4 border-t border-white/10">
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
                    </div>
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
