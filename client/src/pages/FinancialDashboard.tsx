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
              <div className="flex items-center gap-1 mt-1">
                {(summary?.revenueChange || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${(summary?.revenueChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(summary?.revenueChange || 0)}
                </span>
              </div>
            </div>
            <DollarSign className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Offene Rechnungen</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.outstandingAmount || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary?.outstandingCount || 0} Rechnungen</p>
            </div>
            <AlertCircle className="h-8 w-8 text-orange-500" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Diesen Monat</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.currentMonthRevenue || 0)}</p>
              <div className="flex items-center gap-1 mt-1">
                {(summary?.monthlyChange || 0) >= 0 ? (
                  <TrendingUp className="h-4 w-4 text-green-500" />
                ) : (
                  <TrendingDown className="h-4 w-4 text-red-500" />
                )}
                <span className={`text-sm ${(summary?.monthlyChange || 0) >= 0 ? 'text-green-500' : 'text-red-500'}`}>
                  {formatPercentage(summary?.monthlyChange || 0)}
                </span>
              </div>
            </div>
            <Calendar className="h-8 w-8 text-muted-foreground" />
          </div>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-muted-foreground">Durchschn. Rechnung</p>
              <p className="text-2xl font-bold">{formatCurrency(summary?.averageInvoiceAmount || 0)}</p>
              <p className="text-sm text-muted-foreground mt-1">{summary?.totalInvoices || 0} Rechnungen</p>
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
          <BarChart data={cashflow || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar dataKey="income" name="Einnahmen" fill="#10b981" />
            <Bar dataKey="expenses" name="Ausgaben" fill="#ef4444" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Revenue Forecast */}
      <Card className="p-6 mb-8">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Umsatzprognose (3 Monate)</h2>
        </div>
        <ResponsiveContainer width="100%" height={300}>
          <LineChart data={forecast || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Line type="monotone" dataKey="actual" name="Tatsächlich" stroke="#3b82f6" strokeWidth={2} />
            <Line type="monotone" dataKey="forecast" name="Prognose" stroke="#8b5cf6" strokeWidth={2} strokeDasharray="5 5" />
          </LineChart>
        </ResponsiveContainer>
      </Card>

      {/* Monthly Comparison */}
      <Card className="p-6 mb-8">
        <h2 className="text-xl font-bold mb-4">Monatsvergleich</h2>
        <ResponsiveContainer width="100%" height={300}>
          <BarChart data={comparison || []}>
            <CartesianGrid strokeDasharray="3 3" />
            <XAxis dataKey="month" />
            <YAxis />
            <Tooltip formatter={(value) => formatCurrency(value as number)} />
            <Legend />
            <Bar dataKey="revenue" name="Umsatz" fill="#3b82f6" />
          </BarChart>
        </ResponsiveContainer>
      </Card>

      {/* Outstanding Invoices */}
      <Card className="p-6">
        <div className="flex justify-between items-center mb-4">
          <h2 className="text-xl font-bold">Offene Rechnungen</h2>
        </div>
        <div className="space-y-4">
          {outstanding && outstanding.length > 0 ? (
            outstanding.map((invoice: any) => (
              <div key={invoice.id} className="flex justify-between items-center border-b pb-2">
                <div>
                  <p className="font-medium">{invoice.invoiceNumber}</p>
                  <p className="text-sm text-muted-foreground">{invoice.customerName}</p>
                </div>
                <div className="text-right">
                  <p className="font-bold">{formatCurrency(invoice.totalAmount)}</p>
                  <p className="text-sm text-muted-foreground">{invoice.dueDate}</p>
                </div>
              </div>
            ))
          ) : (
            <p className="text-muted-foreground text-center py-4">Keine offenen Rechnungen</p>
          )}
        </div>
      </Card>
    </div>
  );
}
