import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { LineChart, Line, BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';
import { TrendingUp, Clock, Calendar } from "lucide-react";

export function DashboardStatistics() {
  const { data: detailedStats, isLoading } = trpc.tickets.detailedStats.useQuery();

  if (isLoading) {
    return (
      <div className="grid gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-primary mx-auto"></div>
            <p className="text-gray-400 mt-4">Lade Statistiken...</p>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (!detailedStats) return null;

  const avgHours = Math.round(detailedStats.avgResolutionTimeHours * 10) / 10;
  const last7Days = detailedStats.ticketsLast7Days;
  const last30Days = detailedStats.ticketsLast30Days;

  // Prepare data for charts - show last 14 days for better readability
  const chartData = detailedStats.ticketsByDay.slice(-14);

  return (
    <div className="space-y-6">
      {/* Key Metrics */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400 flex items-center gap-2">
              <Clock className="h-4 w-4" />
              Durchschn. Bearbeitungszeit
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-white">
              {avgHours}h
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400 flex items-center gap-2">
              <Calendar className="h-4 w-4" />
              Letzte 7 Tage
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-white">
              {last7Days}
            </CardTitle>
          </CardHeader>
        </Card>

        <Card className="bg-white/5 border-white/10">
          <CardHeader className="pb-3">
            <CardDescription className="text-gray-400 flex items-center gap-2">
              <TrendingUp className="h-4 w-4" />
              Letzte 30 Tage
            </CardDescription>
            <CardTitle className="text-3xl font-bold text-white">
              {last30Days}
            </CardTitle>
          </CardHeader>
        </Card>
      </div>

      {/* Tickets by Category Over Time */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Tickets nach Kategorie (Letzte 14 Tage)</CardTitle>
          <CardDescription className="text-gray-400">
            Entwicklung der Ticket-Kategorien über die Zeit
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <LineChart data={chartData}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis 
                dataKey="date" 
                stroke="#888"
                tickFormatter={(value) => {
                  const date = new Date(value);
                  return `${date.getDate()}.${date.getMonth() + 1}`;
                }}
              />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Legend />
              <Line type="monotone" dataKey="network" stroke="#3b82f6" name="Netzwerk" strokeWidth={2} />
              <Line type="monotone" dataKey="security" stroke="#ef4444" name="Sicherheit" strokeWidth={2} />
              <Line type="monotone" dataKey="hardware" stroke="#f59e0b" name="Hardware" strokeWidth={2} />
              <Line type="monotone" dataKey="software" stroke="#10b981" name="Software" strokeWidth={2} />
              <Line type="monotone" dataKey="email" stroke="#8b5cf6" name="E-Mail" strokeWidth={2} />
              <Line type="monotone" dataKey="other" stroke="#6b7280" name="Sonstiges" strokeWidth={2} />
            </LineChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>

      {/* Total Tickets by Category */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-white">Tickets nach Kategorie (Gesamt)</CardTitle>
          <CardDescription className="text-gray-400">
            Verteilung aller Tickets nach Kategorien
          </CardDescription>
        </CardHeader>
        <CardContent>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={[
              { name: 'Netzwerk', count: chartData.reduce((sum, d: any) => sum + (d.network || 0), 0) },
              { name: 'Sicherheit', count: chartData.reduce((sum, d: any) => sum + (d.security || 0), 0) },
              { name: 'Hardware', count: chartData.reduce((sum, d: any) => sum + (d.hardware || 0), 0) },
              { name: 'Software', count: chartData.reduce((sum, d: any) => sum + (d.software || 0), 0) },
              { name: 'E-Mail', count: chartData.reduce((sum, d: any) => sum + (d.email || 0), 0) },
              { name: 'Sonstiges', count: chartData.reduce((sum, d: any) => sum + (d.other || 0), 0) },
            ]}>
              <CartesianGrid strokeDasharray="3 3" stroke="#333" />
              <XAxis dataKey="name" stroke="#888" />
              <YAxis stroke="#888" />
              <Tooltip 
                contentStyle={{ backgroundColor: '#1a1a1a', border: '1px solid #333', borderRadius: '8px' }}
                labelStyle={{ color: '#fff' }}
              />
              <Bar dataKey="count" fill="#f59e0b" name="Anzahl" />
            </BarChart>
          </ResponsiveContainer>
        </CardContent>
      </Card>
    </div>
  );
}
