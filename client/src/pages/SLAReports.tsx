import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import {
  BarChart,
  Bar,
  LineChart,
  Line,
  PieChart,
  Pie,
  Cell,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  Legend,
  ResponsiveContainer,
} from "recharts";
import { Download, TrendingUp, TrendingDown, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";

export default function SLAReports() {
  const [timeRange, setTimeRange] = useState<"7d" | "30d" | "90d" | "1y">("30d");

  // Fetch SLA data
  const { data: breaches } = trpc.sla.getBreaches.useQuery();
  const { data: policies } = trpc.sla.list.useQuery();

  // Calculate analytics
  const calculateAnalytics = () => {
    if (!breaches || breaches.length === 0) {
      return {
        totalTickets: 0,
        breached: 0,
        warning: 0,
        onTime: 0,
        breachRate: 0,
        avgResponseTime: 0,
        avgResolutionTime: 0,
        byPriority: [],
        byStatus: [],
        trendData: [],
      };
    }

    const totalTickets = breaches.length;
    const breached = breaches.filter((b) => b.resolutionStatus === "breached").length;
    const warning = breaches.filter((b) => b.resolutionStatus === "warning").length;
    const onTime = breaches.filter((b) => b.resolutionStatus === "met").length;
    const breachRate = ((breached / totalTickets) * 100).toFixed(1);

    // Calculate average times (in minutes)
    const avgResponseTime = breaches.reduce((acc, b) => {
      if (b.ticket.updatedAt && b.ticket.status !== 'open') {
        const minutes = Math.floor(
          (new Date(b.ticket.updatedAt).getTime() - new Date(b.ticket.createdAt).getTime()) / (1000 * 60)
        );
        return acc + minutes;
      }
      return acc;
    }, 0) / breaches.filter(b => b.ticket.status !== 'open').length || 1;

    const avgResolutionTime = breaches.reduce((acc, b) => {
      if (b.ticket.resolvedAt) {
        const minutes = Math.floor(
          (new Date(b.ticket.resolvedAt).getTime() - new Date(b.ticket.createdAt).getTime()) / (1000 * 60)
        );
        return acc + minutes;
      }
      return acc;
    }, 0) / breaches.filter((b) => b.ticket.resolvedAt).length;

    // Group by priority
    const priorityGroups = breaches.reduce((acc: any, b) => {
      const priority = b.ticket.priority;
      if (!acc[priority]) {
        acc[priority] = { priority, breached: 0, onTime: 0, total: 0 };
      }
      acc[priority].total++;
      if (b.resolutionStatus === "breached") {
        acc[priority].breached++;
      } else if (b.resolutionStatus === "met") {
        acc[priority].onTime++;
      }
      return acc;
    }, {});

    const byPriority = Object.values(priorityGroups);

    // Group by status
    const statusGroups = breaches.reduce((acc: any, b) => {
      const status = b.resolutionStatus;
      if (!acc[status]) {
        acc[status] = 0;
      }
      acc[status]++;
      return acc;
    }, {});

    const byStatus = [
      { name: "Eingehalten", value: statusGroups.met || 0, color: "#22c55e" },
      { name: "Warnung", value: statusGroups.warning || 0, color: "#f59e0b" },
      { name: "Verletzt", value: statusGroups.breached || 0, color: "#ef4444" },
      { name: "Ausstehend", value: statusGroups.pending || 0, color: "#6b7280" },
    ];

    // Trend data (last 7 days)
    const trendData = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dayStart = new Date(date.setHours(0, 0, 0, 0));
      const dayEnd = new Date(date.setHours(23, 59, 59, 999));

      const dayBreaches = breaches.filter((b) => {
        const createdAt = new Date(b.ticket.createdAt);
        return createdAt >= dayStart && createdAt <= dayEnd;
      });

      trendData.push({
        date: dayStart.toLocaleDateString("de-DE", { month: "short", day: "numeric" }),
        breached: dayBreaches.filter((b) => b.resolutionStatus === "breached").length,
        onTime: dayBreaches.filter((b) => b.resolutionStatus === "met").length,
        total: dayBreaches.length,
      });
    }

    return {
      totalTickets,
      breached,
      warning,
      onTime,
      breachRate: parseFloat(breachRate),
      avgResponseTime: Math.round(avgResponseTime),
      avgResolutionTime: Math.round(avgResolutionTime),
      byPriority,
      byStatus,
      trendData,
    };
  };

  const analytics = calculateAnalytics();

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes}min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}min` : `${hours}h`;
  };

  const handleExport = () => {
    // Create CSV content
    const csvContent = [
      ["SLA Report", new Date().toLocaleDateString()],
      [],
      ["Gesamtübersicht"],
      ["Metrik", "Wert"],
      ["Gesamt Tickets", analytics.totalTickets],
      ["Eingehalten", analytics.onTime],
      ["Warnungen", analytics.warning],
      ["Verletzt", analytics.breached],
      ["Verletzungsrate", `${analytics.breachRate}%`],
      ["Ø Antwortzeit", formatTime(analytics.avgResponseTime)],
      ["Ø Lösungszeit", formatTime(analytics.avgResolutionTime)],
      [],
      ["Nach Priorität"],
      ["Priorität", "Gesamt", "Eingehalten", "Verletzt"],
      ...analytics.byPriority.map((p: any) => [
        p.priority,
        p.total,
        p.onTime,
        p.breached,
      ]),
    ]
      .map((row) => row.join(","))
      .join("\n");

    // Download CSV
    const blob = new Blob([csvContent], { type: "text/csv;charset=utf-8;" });
    const link = document.createElement("a");
    link.href = URL.createObjectURL(blob);
    link.download = `sla-report-${new Date().toISOString().split("T")[0]}.csv`;
    link.click();

    toast.success("Report erfolgreich exportiert");
  };

  return (
    <DashboardLayout>
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">SLA Reports & Analytics</h1>
            <p className="text-muted-foreground">Detaillierte Auswertungen und Trends</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={(value: any) => setTimeRange(value)}>
              <SelectTrigger className="w-[180px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Letzte 7 Tage</SelectItem>
                <SelectItem value="30d">Letzte 30 Tage</SelectItem>
                <SelectItem value="90d">Letzte 90 Tage</SelectItem>
                <SelectItem value="1y">Letztes Jahr</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleExport}>
              <Download className="w-4 h-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid gap-4 md:grid-cols-2 lg:grid-cols-4 mb-8">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Gesamt Tickets</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.totalTickets}</div>
              <p className="text-xs text-muted-foreground">mit SLA-Tracking</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Verletzungsrate</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{analytics.breachRate}%</div>
              <p className="text-xs text-muted-foreground">
                {analytics.breached} von {analytics.totalTickets} Tickets
              </p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ø Antwortzeit</CardTitle>
              <TrendingUp className="h-4 w-4 text-blue-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analytics.avgResponseTime)}</div>
              <p className="text-xs text-muted-foreground">durchschnittlich</p>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Ø Lösungszeit</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-green-500" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{formatTime(analytics.avgResolutionTime)}</div>
              <p className="text-xs text-muted-foreground">durchschnittlich</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid gap-6 md:grid-cols-2 mb-8">
          {/* Trend Chart */}
          <Card>
            <CardHeader>
              <CardTitle>SLA-Trend (Letzte 7 Tage)</CardTitle>
              <CardDescription>Entwicklung der SLA-Einhaltung</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={analytics.trendData}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="date" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Line type="monotone" dataKey="onTime" stroke="#22c55e" name="Eingehalten" />
                  <Line type="monotone" dataKey="breached" stroke="#ef4444" name="Verletzt" />
                </LineChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Status Distribution */}
          <Card>
            <CardHeader>
              <CardTitle>Status-Verteilung</CardTitle>
              <CardDescription>Aktuelle SLA-Status-Übersicht</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={analytics.byStatus}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={80}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {analytics.byStatus.map((entry: any, index: number) => (
                      <Cell key={`cell-${index}`} fill={entry.color} />
                    ))}
                  </Pie>
                  <Tooltip />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Priority Analysis */}
          <Card className="md:col-span-2">
            <CardHeader>
              <CardTitle>Analyse nach Priorität</CardTitle>
              <CardDescription>SLA-Performance pro Ticket-Priorität</CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={analytics.byPriority}>
                  <CartesianGrid strokeDasharray="3 3" />
                  <XAxis dataKey="priority" />
                  <YAxis />
                  <Tooltip />
                  <Legend />
                  <Bar dataKey="onTime" fill="#22c55e" name="Eingehalten" />
                  <Bar dataKey="breached" fill="#ef4444" name="Verletzt" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Recommendations */}
        <Card>
          <CardHeader>
            <CardTitle>Empfehlungen</CardTitle>
            <CardDescription>Basierend auf den aktuellen Daten</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {analytics.breachRate > 20 && (
                <div className="flex items-start gap-3 p-4 bg-red-500/10 rounded-lg">
                  <AlertTriangle className="w-5 h-5 text-red-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-red-600">Hohe Verletzungsrate</h4>
                    <p className="text-sm text-muted-foreground">
                      Die SLA-Verletzungsrate liegt bei {analytics.breachRate}%. Überprüfen Sie die
                      Ressourcenzuteilung und SLA-Richtlinien.
                    </p>
                  </div>
                </div>
              )}

              {analytics.avgResponseTime > 60 && (
                <div className="flex items-start gap-3 p-4 bg-yellow-500/10 rounded-lg">
                  <Clock className="w-5 h-5 text-yellow-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-yellow-600">Lange Antwortzeiten</h4>
                    <p className="text-sm text-muted-foreground">
                      Die durchschnittliche Antwortzeit beträgt {formatTime(analytics.avgResponseTime)}.
                      Erwägen Sie eine Erhöhung der Support-Kapazität.
                    </p>
                  </div>
                </div>
              )}

              {analytics.breachRate < 10 && (
                <div className="flex items-start gap-3 p-4 bg-green-500/10 rounded-lg">
                  <CheckCircle2 className="w-5 h-5 text-green-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-green-600">Ausgezeichnete Performance</h4>
                    <p className="text-sm text-muted-foreground">
                      Die SLA-Einhaltung liegt bei {100 - analytics.breachRate}%. Halten Sie die gute Arbeit
                      aufrecht!
                    </p>
                  </div>
                </div>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
