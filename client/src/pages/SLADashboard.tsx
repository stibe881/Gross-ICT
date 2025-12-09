import { useState, useEffect } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  AlertTriangle,
  Clock,
  CheckCircle2,
  TrendingUp,
  TrendingDown,
  RefreshCw,
  Activity,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Link } from "wouter";

export default function SLADashboard() {
  const [autoRefresh, setAutoRefresh] = useState(true);

  // Fetch SLA data
  const { data: breaches, refetch: refetchBreaches } = trpc.sla.getBreaches.useQuery();

  const { data: policies } = trpc.sla.list.useQuery();

  // Auto-refresh every 30 seconds
  useEffect(() => {
    if (!autoRefresh) return;

    const interval = setInterval(() => {
      refetchBreaches();
    }, 30000);

    return () => clearInterval(interval);
  }, [autoRefresh, refetchBreaches]);

  const handleManualRefresh = () => {
    refetchBreaches();
    toast.success("Dashboard aktualisiert");
  };

  // Calculate metrics
  const totalBreaches = breaches?.filter((b) => b.resolutionStatus === 'breached').length || 0;
  const warningCount = breaches?.filter((b) => b.resolutionStatus === 'warning').length || 0;
  const activeTickets = breaches?.filter((b) => b.resolutionStatus === 'pending').length || 0;
  const breachRate = breaches && breaches.length > 0 
    ? ((totalBreaches / breaches.length) * 100).toFixed(1) 
    : "0.0";

  // Get tickets near deadline (within 1 hour)
  const nearDeadline = breaches?.filter((b) => {
    if (b.resolutionStatus === 'breached' || !b.ticket.slaDueDate) return false;
    const timeLeft = new Date(b.ticket.slaDueDate).getTime() - Date.now();
    return timeLeft > 0 && timeLeft < 60 * 60 * 1000; // 1 hour
  }) || [];

  // Calculate average response time from policies
  const avgResponseTime = policies && policies.length > 0
    ? Math.round(policies.reduce((acc, p) => acc + p.responseTimeMinutes, 0) / policies.length)
    : 0;

  const avgResolutionTime = policies && policies.length > 0
    ? Math.round(policies.reduce((acc, p) => acc + p.resolutionTimeMinutes, 0) / policies.length)
    : 0;

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const formatTimeLeft = (dueDate: string) => {
    const timeLeft = new Date(dueDate).getTime() - Date.now();
    if (timeLeft < 0) return "Überfällig";
    
    const minutes = Math.floor(timeLeft / (1000 * 60));
    if (minutes < 60) return `${minutes}min`;
    
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return `${hours}h ${mins}min`;
  };

  const getPriorityBadge = (priority: string) => {
    const variants: Record<string, { variant: "default" | "destructive" | "secondary" | "outline"; label: string }> = {
      urgent: { variant: "destructive", label: "Dringend" },
      high: { variant: "default", label: "Hoch" },
      normal: { variant: "secondary", label: "Normal" },
      low: { variant: "outline", label: "Niedrig" },
    };
    const config = variants[priority] || variants.normal;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">SLA-Dashboard</h1>
          <p className="text-muted-foreground">Echtzeit-Überwachung Ihrer Service Level Agreements</p>
        </div>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => setAutoRefresh(!autoRefresh)}
            aria-label={autoRefresh ? "Auto-Refresh deaktivieren" : "Auto-Refresh aktivieren"}
          >
            <Activity className={`h-4 w-4 mr-2 ${autoRefresh ? "text-green-500" : ""}`} aria-hidden="true" />
            {autoRefresh ? "Auto-Refresh An" : "Auto-Refresh Aus"}
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={handleManualRefresh}
            aria-label="Dashboard manuell aktualisieren"
          >
            <RefreshCw className="h-4 w-4 mr-2" aria-hidden="true" />
            Aktualisieren
          </Button>
        </div>
      </div>

      {/* Key Metrics */}
      <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Tickets</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{activeTickets}</div>
            <p className="text-xs text-muted-foreground">mit aktivem SLA</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">SLA-Verletzungen</CardTitle>
            <AlertTriangle className="h-4 w-4 text-destructive" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-destructive">{totalBreaches}</div>
            <p className="text-xs text-muted-foreground">in den letzten 30 Tagen</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Warnungen</CardTitle>
            <TrendingUp className="h-4 w-4 text-yellow-500" aria-hidden="true" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold text-yellow-600">{warningCount}</div>
            <p className="text-xs text-muted-foreground">nahe am Fristablauf</p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Breach-Rate</CardTitle>
            {parseFloat(breachRate) < 10 ? (
              <CheckCircle2 className="h-4 w-4 text-green-500" aria-hidden="true" />
            ) : (
              <TrendingDown className="h-4 w-4 text-destructive" aria-hidden="true" />
            )}
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${parseFloat(breachRate) < 10 ? "text-green-600" : "text-destructive"}`}>
              {breachRate}%
            </div>
            <p className="text-xs text-muted-foreground">der Tickets verletzt</p>
          </CardContent>
        </Card>
      </div>

      {/* Performance Metrics */}
      <div className="grid gap-4 md:grid-cols-2 mb-8">
        <Card>
          <CardHeader>
            <CardTitle>Durchschnittliche Zeiten</CardTitle>
            <CardDescription>Basierend auf aktiven SLA-Richtlinien</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Reaktionszeit:</span>
                <span className="text-lg font-bold">{formatTime(avgResponseTime)}</span>
              </div>
              <div className="flex items-center justify-between">
                <span className="text-sm font-medium">Lösungszeit:</span>
                <span className="text-lg font-bold">{formatTime(avgResolutionTime)}</span>
              </div>
              <div className="flex items-center justify-between pt-4 border-t">
                <span className="text-sm font-medium">Aktive Richtlinien:</span>
                <span className="text-lg font-bold">{policies?.filter(p => p.isActive).length || 0}</span>
              </div>
            </div>
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Tickets nahe am Fristablauf</CardTitle>
            <CardDescription>Innerhalb der nächsten Stunde</CardDescription>
          </CardHeader>
          <CardContent>
            {nearDeadline.length > 0 ? (
              <div className="space-y-2">
                {nearDeadline.slice(0, 3).map((breach) => (
                  <div key={breach.ticketId} className="flex items-center justify-between p-2 rounded-lg bg-yellow-50 dark:bg-yellow-900/20">
                    <div>
                      <p className="text-sm font-medium">Ticket #{breach.ticketId}</p>
                      <p className="text-xs text-muted-foreground">
                        {breach.ticket.slaDueDate && formatTimeLeft(new Date(breach.ticket.slaDueDate).toISOString())} verbleibend
                      </p>
                    </div>
                    <Link href={`/fernwartung/tickets`}>
                      <Button variant="ghost" size="sm" aria-label={`Ticket ${breach.ticketId} anzeigen`}>
                        Anzeigen
                      </Button>
                    </Link>
                  </div>
                ))}
                {nearDeadline.length > 3 && (
                  <p className="text-xs text-muted-foreground text-center pt-2">
                    +{nearDeadline.length - 3} weitere Tickets
                  </p>
                )}
              </div>
            ) : (
              <div className="text-center py-8 text-muted-foreground">
                <CheckCircle2 className="h-12 w-12 mx-auto mb-2 text-green-500" aria-hidden="true" />
                <p>Keine Tickets nahe am Fristablauf</p>
              </div>
            )}
          </CardContent>
        </Card>
      </div>

      {/* Recent Breaches */}
      <Card>
        <CardHeader>
          <CardTitle>Aktuelle SLA-Verletzungen</CardTitle>
          <CardDescription>Tickets, die ihre SLA-Fristen überschritten haben</CardDescription>
        </CardHeader>
        <CardContent>
          {breaches && breaches.filter(b => b.resolutionStatus === 'breached').length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Ticket</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Fällig</TableHead>
                  <TableHead>Überfällig seit</TableHead>
                  <TableHead>Eskalation</TableHead>
                  <TableHead className="text-right">Aktion</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {breaches
                  .filter((b) => b.resolutionStatus === 'breached')
                  .slice(0, 10)
                  .map((breach) => (
                    <TableRow key={breach.ticketId}>
                      <TableCell className="font-medium">#{breach.ticketId}</TableCell>
                      <TableCell>{getPriorityBadge(breach.ticket.priority)}</TableCell>
                      <TableCell>
                        {breach.ticket.slaDueDate && new Date(breach.ticket.slaDueDate).toLocaleString("de-DE")}
                      </TableCell>
                      <TableCell className="text-destructive font-medium">
                        {breach.ticket.slaDueDate && formatTimeLeft(new Date(breach.ticket.slaDueDate).toISOString())}
                      </TableCell>
                      <TableCell>
                        <Badge variant="outline">Level {breach.ticket.escalationLevel}</Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <Link href={`/fernwartung/tickets`}>
                          <Button variant="ghost" size="sm" aria-label={`Ticket ${breach.ticketId} anzeigen`}>
                            Anzeigen
                          </Button>
                        </Link>
                      </TableCell>
                    </TableRow>
                  ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-16 w-16 mx-auto mb-4 text-green-500" aria-hidden="true" />
              <p className="text-lg font-medium">Keine SLA-Verletzungen!</p>
              <p className="text-sm">Alle Tickets werden innerhalb ihrer SLA-Fristen bearbeitet.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
