import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, BarChart3, Download } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancialDashboard() {
  const { data: summary, isLoading: summaryLoading } = trpc.financialDashboard.getDashboardSummary.useQuery();
  const { data: cashflow, isLoading: cashflowLoading } = trpc.financialDashboard.getCashflow.useQuery({ months: 6 });
  const { data: outstanding, isLoading: outstandingLoading } = trpc.financialDashboard.getOutstandingInvoices.useQuery();
  const { data: forecast, isLoading: forecastLoading } = trpc.financialDashboard.getRevenueForecast.useQuery({ months: 3 });
  const { data: comparison, isLoading: comparisonLoading } = trpc.financialDashboard.getMonthlyComparison.useQuery();

  if (summaryLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Finanz-Dashboard</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(amount);
  };

  const formatPercentage = (value: number) => {
    return `${value >= 0 ? '+' : ''}${value.toFixed(1)}%`;
  };

  const exportCashflowMutation = trpc.export.exportCashflowExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
      toast.success('Cashflow-Report exportiert');
    },
    onError: () => toast.error('Export fehlgeschlagen'),
  });

  const exportForecastMutation = trpc.export.exportRevenueForecastExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
      toast.success('Umsatzprognose exportiert');
    },
    onError: () => toast.error('Export fehlgeschlagen'),
  });

  const exportOutstandingMutation = trpc.export.exportOutstandingInvoicesExcel.useMutation({
    onSuccess: (data) => {
      const link = document.createElement('a');
      link.href = `data:${data.mimeType};base64,${data.data}`;
      link.download = data.filename;
      link.click();
      toast.success('Offene Rechnungen exportiert');
    },
    onError: () => toast.error('Export fehlgeschlagen'),
  });

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Finanz-Dashboard</h1>
        <div className="flex gap-2">
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportCashflowMutation.mutate({ months: 6 })}
            disabled={exportCashflowMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Cashflow
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportForecastMutation.mutate({ months: 3 })}
            disabled={exportForecastMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Prognose
          </Button>
          <Button
            variant="outline"
            size="sm"
            onClick={() => exportOutstandingMutation.mutate()}
            disabled={exportOutstandingMutation.isPending}
          >
            <Download className="h-4 w-4 mr-2" />
            Offene Rechnungen
          </Button>
        </div>
      </div>

      {/* Key Metrics Summary */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Gesamtumsatz</span>
            <DollarSign className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {summary?.totalInvoices || 0} Rechnungen
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Dieser Monat</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{formatCurrency(summary?.thisMonthRevenue || 0)}</div>
          {comparison && (
            <div className="flex items-center gap-1 mt-1">
              {comparison.changes.revenue >= 0 ? (
                <TrendingUp className="h-3 w-3 text-green-600" />
              ) : (
                <TrendingDown className="h-3 w-3 text-red-600" />
              )}
              <span className={`text-xs font-medium ${comparison.changes.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                {formatPercentage(comparison.changes.revenue)}
              </span>
              <span className="text-xs text-muted-foreground">vs. letzter Monat</span>
            </div>
          )}
        </Card>

        <Card className="p-6 border-orange-200 bg-orange-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-orange-900">Überfällig</span>
            <AlertCircle className="h-4 w-4 text-orange-600" />
          </div>
          <div className="text-2xl font-bold text-orange-900">{formatCurrency(summary?.overdueAmount || 0)}</div>
          <p className="text-xs text-orange-700 mt-1">
            {summary?.overdueCount || 0} Rechnungen
          </p>
        </Card>

        <Card className="p-6 border-blue-200 bg-blue-50">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-blue-900">Wiederkehrend</span>
            <BarChart3 className="h-4 w-4 text-blue-600" />
          </div>
          <div className="text-2xl font-bold text-blue-900">
            {formatCurrency(forecast?.monthlyRecurringRevenue || 0)}
          </div>
          <p className="text-xs text-blue-700 mt-1">
            {summary?.activeRecurringInvoices || 0} aktive Abos
          </p>
        </Card>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
        {/* Cashflow Chart */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Cashflow (letzte 6 Monate)</h2>
          {cashflowLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <BarChart data={cashflow?.months || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Bar dataKey="income" fill="#10b981" name="Einnahmen" />
              </BarChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Durchschnitt/Monat:</span>
            <span className="font-semibold">{formatCurrency(cashflow?.averageMonthlyIncome || 0)}</span>
          </div>
        </Card>

        {/* Revenue Forecast */}
        <Card className="p-6">
          <h2 className="text-lg font-semibold mb-4">Umsatzprognose (nächste 3 Monate)</h2>
          {forecastLoading ? (
            <Skeleton className="h-64 w-full" />
          ) : (
            <ResponsiveContainer width="100%" height={300}>
              <LineChart data={forecast?.forecast || []}>
                <CartesianGrid strokeDasharray="3 3" />
                <XAxis dataKey="month" />
                <YAxis />
                <Tooltip 
                  formatter={(value: number) => formatCurrency(value)}
                  labelStyle={{ color: '#000' }}
                />
                <Legend />
                <Line 
                  type="monotone" 
                  dataKey="projectedRevenue" 
                  stroke="#3b82f6" 
                  strokeWidth={2}
                  name="Prognostizierter Umsatz"
                />
              </LineChart>
            </ResponsiveContainer>
          )}
          <div className="mt-4 flex items-center justify-between text-sm">
            <span className="text-muted-foreground">Monatlich wiederkehrend:</span>
            <span className="font-semibold">{formatCurrency(forecast?.monthlyRecurringRevenue || 0)}</span>
          </div>
        </Card>
      </div>

      {/* Outstanding Invoices Breakdown */}
      <Card className="p-6">
        <h2 className="text-lg font-semibold mb-4">Offene Forderungen</h2>
        {outstandingLoading ? (
          <Skeleton className="h-32 w-full" />
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <div className="text-center p-4 bg-red-50 rounded-lg border border-red-200">
              <div className="text-sm font-medium text-red-900 mb-1">Überfällig</div>
              <div className="text-2xl font-bold text-red-600">{formatCurrency(outstanding?.overdue.amount || 0)}</div>
              <div className="text-xs text-red-700 mt-1">{outstanding?.overdue.count || 0} Rechnungen</div>
            </div>

            <div className="text-center p-4 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="text-sm font-medium text-yellow-900 mb-1">Fällig diesen Monat</div>
              <div className="text-2xl font-bold text-yellow-600">{formatCurrency(outstanding?.dueThisMonth.amount || 0)}</div>
              <div className="text-xs text-yellow-700 mt-1">{outstanding?.dueThisMonth.count || 0} Rechnungen</div>
            </div>

            <div className="text-center p-4 bg-gray-50 rounded-lg border border-gray-200">
              <div className="text-sm font-medium text-gray-900 mb-1">Gesamt offen</div>
              <div className="text-2xl font-bold text-gray-600">{formatCurrency(outstanding?.totalOutstanding || 0)}</div>
              <div className="text-xs text-gray-700 mt-1">{outstanding?.totalCount || 0} Rechnungen</div>
            </div>
          </div>
        )}
      </Card>

      {/* Monthly Comparison */}
      {comparison && (
        <Card className="p-6 mt-6">
          <h2 className="text-lg font-semibold mb-4">Monatsvergleich</h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Aktueller Monat</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Umsatz:</span>
                  <span className="font-semibold">{formatCurrency(comparison.currentMonth.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rechnungen:</span>
                  <span className="font-semibold">{comparison.currentMonth.invoices}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bezahlt:</span>
                  <span className="font-semibold">{comparison.currentMonth.paidInvoices}</span>
                </div>
              </div>
            </div>

            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-3">Letzter Monat</h3>
              <div className="space-y-2">
                <div className="flex justify-between">
                  <span className="text-sm">Umsatz:</span>
                  <span className="font-semibold">{formatCurrency(comparison.lastMonth.revenue)}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Rechnungen:</span>
                  <span className="font-semibold">{comparison.lastMonth.invoices}</span>
                </div>
                <div className="flex justify-between">
                  <span className="text-sm">Bezahlt:</span>
                  <span className="font-semibold">{comparison.lastMonth.paidInvoices}</span>
                </div>
              </div>
            </div>
          </div>

          <div className="mt-6 pt-6 border-t">
            <h3 className="text-sm font-medium text-muted-foreground mb-3">Veränderungen</h3>
            <div className="flex gap-6">
              <div className="flex items-center gap-2">
                {comparison.changes.revenue >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">Umsatz:</span>
                <span className={`font-semibold ${comparison.changes.revenue >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(comparison.changes.revenue)}
                </span>
              </div>

              <div className="flex items-center gap-2">
                {comparison.changes.invoiceCount >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-600" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-600" />
                )}
                <span className="text-sm">Rechnungen:</span>
                <span className={`font-semibold ${comparison.changes.invoiceCount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {formatPercentage(comparison.changes.invoiceCount)}
                </span>
              </div>
            </div>
          </div>
        </Card>
      )}
    </div>
  );
}
