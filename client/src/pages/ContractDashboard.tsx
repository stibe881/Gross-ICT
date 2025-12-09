import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { ArrowLeft, TrendingUp, FileText, AlertCircle, RefreshCw } from "lucide-react";
import { useLocation } from "wouter";
import { Bar, BarChart, Line, LineChart, Pie, PieChart, Cell, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from "recharts";

export default function ContractDashboard() {
  const [, setLocation] = useLocation();

  const { data: stats, isLoading: statsLoading } = trpc.contractDashboard.getStatistics.useQuery();
  const { data: expiringContracts, isLoading: expiringLoading } = trpc.contractDashboard.getExpiringContracts.useQuery({ days: 90 });
  const { data: forecast, isLoading: forecastLoading } = trpc.contractDashboard.getRevenueForecast.useQuery();
  const { data: renewalData, isLoading: renewalLoading } = trpc.contractDashboard.getRenewalRate.useQuery();

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString("de-CH");
  };

  const COLORS = ["#10b981", "#3b82f6", "#f59e0b", "#ef4444", "#8b5cf6"];

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center gap-4 mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/contracts")}
            size="sm"
          >
            <ArrowLeft className="h-4 w-4 mr-2" />
            Zurück
          </Button>
          <div>
            <h1 className="text-3xl font-bold">Vertrags-Dashboard</h1>
            <p className="text-muted-foreground mt-1">
              Übersicht über Ihre Verträge, Umsatzprognosen und Verlängerungsraten
            </p>
          </div>
        </div>

        {/* Key Statistics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-6 mb-8">
          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <FileText className="h-8 w-8 text-blue-500" />
            </div>
            <p className="text-2xl font-bold">{stats?.activeContracts || 0}</p>
            <p className="text-sm text-muted-foreground">Aktive Verträge</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <TrendingUp className="h-8 w-8 text-green-500" />
            </div>
            <p className="text-2xl font-bold">{formatCurrency(stats?.totalValue || 0)}</p>
            <p className="text-sm text-muted-foreground">Gesamtwert</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <AlertCircle className="h-8 w-8 text-orange-500" />
            </div>
            <p className="text-2xl font-bold">{stats?.expiringSoon || 0}</p>
            <p className="text-sm text-muted-foreground">Laufen in 30 Tagen aus</p>
          </Card>

          <Card className="p-6">
            <div className="flex items-center justify-between mb-2">
              <RefreshCw className="h-8 w-8 text-purple-500" />
            </div>
            <p className="text-2xl font-bold">{renewalData?.renewalRate || 0}%</p>
            <p className="text-sm text-muted-foreground">Verlängerungsrate</p>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Revenue Forecast */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Umsatzprognose (12 Monate)</h3>
            {forecastLoading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Lade Prognose...</p>
              </div>
            ) : forecast && forecast.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <LineChart data={forecast}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis
                    dataKey="month"
                    stroke="#888"
                    tick={{ fill: "#888" }}
                  />
                  <YAxis stroke="#888" tick={{ fill: "#888" }} />
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f1f1f",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Legend wrapperStyle={{ color: "#888" }} />
                  <Line
                    type="monotone"
                    dataKey="revenue"
                    stroke="#10b981"
                    strokeWidth={2}
                    name="Umsatz"
                  />
                </LineChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Keine Daten verfügbar</p>
              </div>
            )}
          </Card>

          {/* Status Distribution */}
          <Card className="p-6">
            <h3 className="text-lg font-semibold mb-4">Verträge nach Status</h3>
            {statsLoading ? (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Lade Statistiken...</p>
              </div>
            ) : stats?.statusDistribution && stats.statusDistribution.length > 0 ? (
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={stats.statusDistribution}
                    dataKey="count"
                    nameKey="status"
                    cx="50%"
                    cy="50%"
                    outerRadius={100}
                    label={(entry) => `${entry.status}: ${entry.count}`}
                  >
                    {stats.statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    contentStyle={{
                      backgroundColor: "#1f1f1f",
                      border: "1px solid #333",
                      borderRadius: "8px",
                    }}
                  />
                </PieChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-64 flex items-center justify-center">
                <p className="text-muted-foreground">Keine Daten verfügbar</p>
              </div>
            )}
          </Card>
        </div>

        {/* Expiring Contracts */}
        <Card className="p-6">
          <h3 className="text-lg font-semibold mb-4">
            Ablaufende Verträge (nächste 90 Tage)
          </h3>
          {expiringLoading ? (
            <div className="py-8 text-center">
              <p className="text-muted-foreground">Lade Verträge...</p>
            </div>
          ) : !expiringContracts || expiringContracts.length === 0 ? (
            <div className="py-8 text-center">
              <AlertCircle className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
              <p className="text-muted-foreground">
                Keine Verträge laufen in den nächsten 90 Tagen aus
              </p>
            </div>
          ) : (
            <div className="space-y-3">
              {expiringContracts.map((contract) => {
                const daysUntilExpiry = Math.ceil(
                  (new Date(contract.endDate).getTime() - new Date().getTime()) /
                    (1000 * 60 * 60 * 24)
                );
                const urgency =
                  daysUntilExpiry <= 30
                    ? "high"
                    : daysUntilExpiry <= 60
                    ? "medium"
                    : "low";

                return (
                  <Card
                    key={contract.id}
                    className={`p-4 border-l-4 ${
                      urgency === "high"
                        ? "border-l-red-500"
                        : urgency === "medium"
                        ? "border-l-orange-500"
                        : "border-l-yellow-500"
                    }`}
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex-1">
                        <h4 className="font-semibold mb-1">{contract.title}</h4>
                        <p className="text-sm text-muted-foreground mb-2">
                          Vertragsnummer: {contract.contractNumber}
                        </p>
                        <div className="flex flex-wrap gap-3 text-sm">
                          <span>📅 Endet: {formatDate(contract.endDate)}</span>
                          <span>⏱️ In {daysUntilExpiry} Tagen</span>
                          <span>💰 {formatCurrency(contract.totalAmount)}</span>
                          {contract.autoRenew === 1 && (
                            <Badge variant="outline" className="text-green-500">
                              Auto-Verlängerung
                            </Badge>
                          )}
                        </div>
                      </div>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setLocation(`/contracts`)}
                      >
                        Details
                      </Button>
                    </div>
                  </Card>
                );
              })}
            </div>
          )}
        </Card>

        {/* Renewal Rate Details */}
        {renewalData && (
          <Card className="p-6 mt-6">
            <h3 className="text-lg font-semibold mb-4">Verlängerungsrate (letzte 12 Monate)</h3>
            <div className="grid grid-cols-3 gap-6">
              <div className="text-center">
                <p className="text-3xl font-bold text-red-500">{renewalData.totalExpired}</p>
                <p className="text-sm text-muted-foreground mt-1">Abgelaufen</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-green-500">{renewalData.totalRenewed}</p>
                <p className="text-sm text-muted-foreground mt-1">Verlängert</p>
              </div>
              <div className="text-center">
                <p className="text-3xl font-bold text-blue-500">{renewalData.renewalRate}%</p>
                <p className="text-sm text-muted-foreground mt-1">Erfolgsrate</p>
              </div>
            </div>
          </Card>
        )}
      </div>
    </div>
  );
}
