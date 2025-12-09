import { trpc } from "@/lib/trpc";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { AlertTriangle, CheckCircle2, Clock, TrendingUp } from "lucide-react";
import { Progress } from "@/components/ui/progress";

export default function SLAMonitoring() {
  const { data: compliance, isLoading: complianceLoading } = trpc.slaMonitoring.getCompliance.useQuery();
  const { data: performance, isLoading: performanceLoading } = trpc.slaMonitoring.getPerformanceByContract.useQuery();
  const { data: alerts, isLoading: alertsLoading } = trpc.slaMonitoring.getBreachAlerts.useQuery();

  if (complianceLoading || performanceLoading || alertsLoading) {
    return (
      <div className="flex items-center justify-center h-96">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-muted-foreground">Lade SLA-Daten...</p>
        </div>
      </div>
    );
  }

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case "critical":
        return "text-red-600 bg-red-50 border-red-200";
      case "high":
        return "text-orange-600 bg-orange-50 border-orange-200";
      case "medium":
        return "text-yellow-600 bg-yellow-50 border-yellow-200";
      default:
        return "text-gray-600 bg-gray-50 border-gray-200";
    }
  };

  const getComplianceColor = (rate: number) => {
    if (rate >= 90) return "text-green-600";
    if (rate >= 80) return "text-yellow-600";
    if (rate >= 70) return "text-orange-600";
    return "text-red-600";
  };

  return (
    <div className="container mx-auto py-8 space-y-8">
      <div>
        <h1 className="text-3xl font-bold">SLA-Monitoring</h1>
        <p className="text-muted-foreground mt-2">
          Übersicht über SLA-Compliance und Performance-Metriken
        </p>
      </div>

      {/* Overview Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Aktive Verträge mit SLA</CardTitle>
            <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliance?.totalContracts || 0}</div>
            <p className="text-xs text-muted-foreground mt-1">
              Verträge mit SLA-Richtlinien
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Compliance-Rate</CardTitle>
            <TrendingUp className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className={`text-2xl font-bold ${getComplianceColor(compliance?.complianceRate || 0)}`}>
              {compliance?.complianceRate || 0}%
            </div>
            <Progress value={compliance?.complianceRate || 0} className="mt-2" />
            <p className="text-xs text-muted-foreground mt-1">
              Letzte 30 Tage
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Reaktionszeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliance?.avgResponseTime || 0}min</div>
            <p className="text-xs text-muted-foreground mt-1">
              Durchschnittliche Erstreaktion
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
            <CardTitle className="text-sm font-medium">Ø Lösungszeit</CardTitle>
            <Clock className="h-4 w-4 text-muted-foreground" />
          </CardHeader>
          <CardContent>
            <div className="text-2xl font-bold">{compliance?.avgResolutionTime || 0}h</div>
            <p className="text-xs text-muted-foreground mt-1">
              Durchschnittliche Lösungszeit
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Breach Alerts */}
      {alerts && alerts.length > 0 && (
        <Card className="border-orange-200 bg-orange-50/50">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <AlertTriangle className="h-5 w-5 text-orange-600" />
              SLA-Warnungen
            </CardTitle>
            <CardDescription>
              Verträge mit niedriger Compliance-Rate (unter 80%)
            </CardDescription>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {alerts.map((alert) => (
                <div
                  key={alert.contractId}
                  className={`p-4 rounded-lg border ${getSeverityColor(alert.severity)}`}
                >
                  <div className="flex items-start justify-between">
                    <div className="flex-1">
                      <div className="font-medium">{alert.customerName}</div>
                      <div className="text-sm opacity-80 mt-1">
                        Vertrag: {alert.contractNumber} | SLA: {alert.slaName}
                      </div>
                      <div className="text-sm mt-2">
                        {alert.breachedTickets} von {alert.totalTickets} Tickets verletzt
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-2xl font-bold ${getComplianceColor(alert.complianceRate)}`}>
                        {alert.complianceRate}%
                      </div>
                      <div className="text-xs uppercase font-medium mt-1">
                        {alert.severity === "critical" && "Kritisch"}
                        {alert.severity === "high" && "Hoch"}
                        {alert.severity === "medium" && "Mittel"}
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      )}

      {/* Performance by Contract */}
      <Card>
        <CardHeader>
          <CardTitle>Performance nach Vertrag</CardTitle>
          <CardDescription>
            SLA-Compliance für jeden aktiven Vertrag (letzte 30 Tage)
          </CardDescription>
        </CardHeader>
        <CardContent>
          {performance && performance.length > 0 ? (
            <div className="space-y-4">
              {performance.map((perf) => (
                <div key={perf.contractId} className="border rounded-lg p-4">
                  <div className="flex items-start justify-between mb-3">
                    <div className="flex-1">
                      <div className="font-medium">{perf.customerName}</div>
                      <div className="text-sm text-muted-foreground mt-1">
                        {perf.contractNumber} | {perf.slaName}
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        SLA: Reaktion {perf.slaResponseTime}min, Lösung {perf.slaResolutionTime}h
                      </div>
                    </div>
                    <div className="text-right">
                      <div className={`text-xl font-bold ${getComplianceColor(perf.complianceRate)}`}>
                        {perf.complianceRate}%
                      </div>
                      <div className="text-xs text-muted-foreground mt-1">
                        Compliance
                      </div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4 text-sm">
                    <div>
                      <span className="text-muted-foreground">Tickets:</span>{" "}
                      <span className="font-medium">{perf.totalTickets}</span>
                    </div>
                    <div>
                      <span className="text-muted-foreground">Verletzt:</span>{" "}
                      <span className="font-medium text-red-600">{perf.breachedTickets}</span>
                    </div>
                  </div>
                  <Progress value={perf.complianceRate} className="mt-3" />
                </div>
              ))}
            </div>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <CheckCircle2 className="h-12 w-12 mx-auto mb-4 opacity-50" />
              <p>Keine aktiven Verträge mit SLA-Richtlinien gefunden.</p>
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
