import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, Ticket, LogOut } from "lucide-react";
import { toast } from "sonner";

export default function Dashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  const { data: tickets, isLoading: ticketsLoading } = trpc.tickets.myTickets.useQuery(undefined, {
    enabled: !!user,
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

  if (!user) {
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
            <h1 className="text-2xl font-bold">Mein Dashboard</h1>
            <p className="text-sm text-gray-400">Willkommen, {user.name || user.email}</p>
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
        <div className="mb-8">
          <h2 className="text-xl font-bold mb-4 flex items-center gap-2">
            <Ticket className="h-5 w-5 text-primary" />
            Meine Tickets
          </h2>

          {!tickets || tickets.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <Ticket className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">Sie haben noch keine Tickets erstellt.</p>
                <Button
                  className="mt-4"
                  onClick={() => setLocation("/support-center")}
                >
                  Neues Ticket erstellen
                </Button>
              </CardContent>
            </Card>
          ) : (
            <div className="grid gap-4">
              {tickets.map((ticket) => (
                <Card key={ticket.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                  <CardHeader>
                    <div className="flex justify-between items-start">
                      <div>
                        <CardTitle className="text-white">#{ticket.id} - {ticket.subject}</CardTitle>
                        <CardDescription className="text-gray-400">
                          Erstellt am {new Date(ticket.createdAt).toLocaleDateString("de-DE")}
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
                  <CardContent>
                    <p className="text-gray-300 line-clamp-2">{ticket.message}</p>
                    {ticket.company && (
                      <p className="text-sm text-gray-500 mt-2">Firma: {ticket.company}</p>
                    )}
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
