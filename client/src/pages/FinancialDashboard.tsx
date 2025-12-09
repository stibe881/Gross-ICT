import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';
import { TrendingUp, TrendingDown, DollarSign, AlertCircle, Calendar, BarChart3 } from 'lucide-react';
import { toast } from 'sonner';
import { BarChart, Bar, LineChart, Line, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function FinancialDashboard() {
  const { data: summary, isLoading: summaryLoading } = trpc.financialDashboard.getDashboardSummary.useQuery();
  const { data: cashflow, isLoading: cashflowLoading } = trpc.financialDashboard.getCashflow.useQuery({ months: 6 });
  const { data: outstanding, isLoading: outstandingLoading } = trpc.financialDashboard.getOutstandingInvoices.useQuery();
  const { data: forecast, isLoading: forecastLoading } = trpc.financialDashboard.getRevenueForecast.useQuery({ months: 3 });
  const { data: comparison, isLoading: comparisonLoading } = trpc.financialDashboard.getMonthlyComparison.useQuery();

  if (summaryLoading || cashflowLoading || outstandingLoading || forecastLoading || comparisonLoading) {
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

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Finanz-Dashboard</h1>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Gesamtumsatz</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.totalRevenue || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary?.totalInvoices || 0} Rechnungen</p>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Überfällige Rechnungen</p>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(summary?.overdueAmount || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary?.overdueCount || 0} Rechnungen</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Diesen Monat</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.thisMonthRevenue || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary?.thisMonthInvoices || 0} Rechnungen</p>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Wiederkehrende Rechnungen</p>
              <p className="text-2xl font-bold">{summary?.activeRecurringInvoices || 0}</p>
              <p className="text-sm text-muted-foreground mt-1">Aktive Abos</p>
            </div>
            <BarChart3 className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>
      </div>

      {/* Cashflow Chart */}
      <Card className="p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Cashflow (6 Monate)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={cashflow?.months || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar dataKey="income" name="Einnahmen" fill="#10b981" />
          </BarChart>
        </ResponsiveContainer>
        {cashflow && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Gesamteinnahmen</p>
              <p className="text-lg font-bold">{formatCurrency(cashflow.totalIncome)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Durchschn. pro Monat</p>
              <p className="text-lg font-bold">{formatCurrency(cashflow.averageMonthlyIncome)}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Revenue Forecast */}
      <Card className="p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Umsatzprognose (3 Monate)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecast?.forecast || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Line type="monotone" dataKey="projectedRevenue" name="Prognostizierter Umsatz" stroke="#8b5cf6" strokeWidth={2} />
          </LineChart>
        </ResponsiveContainer>
        {forecast && (
          <div className="mt-4 grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Monatlich wiederkehrend</p>
              <p className="text-lg font-bold">{formatCurrency(forecast.monthlyRecurringRevenue)}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Aktive Abos</p>
              <p className="text-lg font-bold">{forecast.activeRecurringInvoices}</p>
            </div>
          </div>
        )}
      </Card>

      {/* Monthly Comparison */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Monatsvergleich</h2>
        {comparison && (
          <div className="grid grid-cols-2 gap-6">
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Aktueller Monat</h3>
              <p className="text-2xl font-bold">{formatCurrency(comparison.currentMonth.revenue)}</p>
              <p className="text-sm text-muted-foreground">{comparison.currentMonth.invoices} Rechnungen ({comparison.currentMonth.paidInvoices} bezahlt)</p>
            </div>
            <div>
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Letzter Monat</h3>
              <p className="text-2xl font-bold">{formatCurrency(comparison.lastMonth.revenue)}</p>
              <p className="text-sm text-muted-foreground">{comparison.lastMonth.invoices} Rechnungen ({comparison.lastMonth.paidInvoices} bezahlt)</p>
            </div>
            <div className="col-span-2 pt-4 border-t">
              <h3 className="text-sm font-medium text-muted-foreground mb-2">Veränderungen</h3>
              <div className="flex gap-6">
                <div className="flex items-center gap-2">
                  {comparison.changes.revenue >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span className={comparison.changes.revenue >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatPercentage(comparison.changes.revenue)} Umsatz
                  </span>
                </div>
                <div className="flex items-center gap-2">
                  {comparison.changes.invoiceCount >= 0 ? <TrendingUp className="h-4 w-4 text-green-500" /> : <TrendingDown className="h-4 w-4 text-red-500" />}
                  <span className={comparison.changes.invoiceCount >= 0 ? 'text-green-500' : 'text-red-500'}>
                    {formatPercentage(comparison.changes.invoiceCount)} Rechnungen
                  </span>
                </div>
              </div>
            </div>
          </div>
        )}
      </Card>

      {/* Outstanding Invoices */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Offene Rechnungen</h2>
        </div>
        {outstanding && (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <Card className="p-4 bg-muted/50">
              <div className="flex items-center gap-2 mb-2">
                <DollarSign className="h-5 w-5 text-primary" />
                <h3 className="font-medium">Total Ausstehend</h3>
              </div>
              <p className="text-2xl font-bold">{formatCurrency(outstanding.totalOutstanding)}</p>
              <p className="text-sm text-muted-foreground">{outstanding.totalCount} Rechnungen</p>
            </Card>
            <Card className="p-4 bg-red-500/10">
              <div className="flex items-center gap-2 mb-2">
                <AlertCircle className="h-5 w-5 text-red-500" />
                <h3 className="font-medium">Überfällig</h3>
              </div>
              <p className="text-2xl font-bold text-red-500">{formatCurrency(outstanding.overdue.amount)}</p>
              <p className="text-sm text-muted-foreground">{outstanding.overdue.count} Rechnungen</p>
            </Card>
            <Card className="p-4 bg-yellow-500/10">
              <div className="flex items-center gap-2 mb-2">
                <Calendar className="h-5 w-5 text-yellow-600" />
                <h3 className="font-medium">Fällig diesen Monat</h3>
              </div>
              <p className="text-2xl font-bold text-yellow-600">{formatCurrency(outstanding.dueThisMonth.amount)}</p>
              <p className="text-sm text-muted-foreground">{outstanding.dueThisMonth.count} Rechnungen</p>
            </Card>
          </div>
        )}
      </Card>
    </div>
  );
}
