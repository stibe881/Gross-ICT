import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, LogOut, TrendingUp, DollarSign, Users, FileText, ArrowLeft } from "lucide-react";
import { toast } from "sonner";
import { useState, useMemo } from "react";
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

/**
 * Reporting Dashboard - Advanced analytics and charts for revenue, customers, and invoices
 */
export default function ReportingDashboard() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedYear, setSelectedYear] = useState(new Date().getFullYear());

  // TODO: Enable after server restart
  // const { data: stats, isLoading: statsLoading } = trpc.invoices.statistics.useQuery(
  //   { year: selectedYear },
  //   {
  //     enabled: !!user && (user.role === "admin" || user.role === "accounting"),
  //   }
  // );
  const stats = { totalRevenue: 0, totalInvoices: 0, paidInvoices: 0 };
  const statsLoading = false;

  const { data: allInvoices, isLoading: invoicesLoading } = trpc.invoices.all.useQuery(
    { year: selectedYear },
    {
      enabled: !!user && (user.role === "admin" || user.role === "accounting"),
    }
  );

  const { data: customers } = trpc.customers.all.useQuery(undefined, {
    enabled: !!user && (user.role === "admin" || user.role === "accounting"),
  });

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Erfolgreich abgemeldet");
      setLocation("/login");
    },
  });

  // Calculate monthly revenue
  const monthlyRevenue = useMemo(() => {
    if (!allInvoices) return [];
    
    const months = [
      "Jan", "Feb", "Mär", "Apr", "Mai", "Jun",
      "Jul", "Aug", "Sep", "Okt", "Nov", "Dez"
    ];
    
    const revenueByMonth = new Array(12).fill(0);
    
    allInvoices.forEach((invoice: any) => {
      if (invoice.status === "paid") {
        const month = new Date(invoice.invoiceDate).getMonth();
        revenueByMonth[month] += parseFloat(invoice.totalAmount);
      }
    });
    
    return months.map((month, index) => ({
      month,
      revenue: revenueByMonth[index],
    }));
  }, [allInvoices]);

  // Calculate invoice status distribution
  const statusDistribution = useMemo(() => {
    if (!allInvoices) return [];
    
    const statusCount: Record<string, number> = {};
    
    allInvoices.forEach((invoice: any) => {
      statusCount[invoice.status] = (statusCount[invoice.status] || 0) + 1;
    });
    
    const statusLabels: Record<string, string> = {
      draft: "Entwurf",
      sent: "Versendet",
      paid: "Bezahlt",
      overdue: "Überfällig",
      cancelled: "Storniert",
    };
    
    return Object.entries(statusCount).map(([status, count]) => ({
      name: statusLabels[status] || status,
      value: count,
    }));
  }, [allInvoices]);

  // Calculate top customers by revenue
  const topCustomers = useMemo(() => {
    if (!allInvoices || !customers) return [];
    
    const customerRevenue: Record<number, { name: string; revenue: number }> = {};
    
    allInvoices.forEach((invoice: any) => {
      if (invoice.status === "paid") {
        if (!customerRevenue[invoice.customerId]) {
          const customer = customers.find((c: any) => c.id === invoice.customerId);
          customerRevenue[invoice.customerId] = {
            name: customer?.name || "Unbekannt",
            revenue: 0,
          };
        }
        customerRevenue[invoice.customerId].revenue += parseFloat(invoice.totalAmount);
      }
    });
    
    return Object.values(customerRevenue)
      .sort((a, b) => b.revenue - a.revenue)
      .slice(0, 10);
  }, [allInvoices, customers]);

  const COLORS = ["#0088FE", "#00C49F", "#FFBB28", "#FF8042", "#8884D8"];

  if (authLoading || statsLoading || invoicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || !["admin", "accounting"].includes(user.role)) {
    setLocation("/login");
    return null;
  }

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div className="flex items-center gap-4">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setLocation("/accounting")}
                className="text-gray-400 hover:text-white"
              >
                <ArrowLeft className="h-4 w-4 mr-2" />
                Zurück
              </Button>
              <div>
                <h1 className="text-xl md:text-2xl font-bold">Reporting Dashboard</h1>
                <p className="text-xs md:text-sm text-gray-400">Umsatz-Analysen und Statistiken</p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              <select
                value={selectedYear}
                onChange={(e) => setSelectedYear(parseInt(e.target.value))}
                className="bg-white/5 border border-white/10 text-white rounded px-3 py-1 text-sm"
              >
                {[2023, 2024, 2025, 2026].map((year) => (
                  <option key={year} value={year}>
                    {year}
                  </option>
                ))}
              </select>
              <Button
                variant="outline"
                onClick={() => logoutMutation.mutate()}
                disabled={logoutMutation.isPending}
                className="border-white/20 bg-white/5 hover:bg-white/10"
                size="sm"
              >
                <LogOut className="h-4 w-4 md:mr-2" />
                <span className="hidden md:inline">Abmelden</span>
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        {/* Key Metrics */}
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-8">
          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <DollarSign className="h-4 w-4" />
                Gesamtumsatz
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">
                {formatCurrency(stats?.totalRevenue || 0)}
              </div>
              <p className="text-xs text-gray-400 mt-1">{selectedYear}</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <FileText className="h-4 w-4" />
                Rechnungen
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{stats?.totalInvoices || 0}</div>
              <p className="text-xs text-gray-400 mt-1">Gesamt</p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <TrendingUp className="h-4 w-4" />
                Bezahlt
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-green-400">{stats?.paidInvoices || 0}</div>
              <p className="text-xs text-gray-400 mt-1">
                {stats?.totalInvoices ? Math.round((stats.paidInvoices / stats.totalInvoices) * 100) : 0}%
              </p>
            </CardContent>
          </Card>

          <Card className="bg-white/5 border-white/10">
            <CardHeader className="pb-3">
              <CardTitle className="text-sm font-medium text-gray-400 flex items-center gap-2">
                <Users className="h-4 w-4" />
                Kunden
              </CardTitle>
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-white">{customers?.length || 0}</div>
              <p className="text-xs text-gray-400 mt-1">Aktiv</p>
            </CardContent>
          </Card>
        </div>

        {/* Charts */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mb-8">
          {/* Monthly Revenue Chart */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Monatlicher Umsatz</CardTitle>
              <CardDescription className="text-gray-400">
                Bezahlte Rechnungen nach Monat ({selectedYear})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <BarChart data={monthlyRevenue}>
                  <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                  <XAxis dataKey="month" stroke="#888" />
                  <YAxis stroke="#888" />
                  <Tooltip
                    contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                    formatter={(value: number) => formatCurrency(value)}
                  />
                  <Bar dataKey="revenue" fill="#8b5cf6" />
                </BarChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>

          {/* Invoice Status Distribution */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <CardTitle className="text-white">Rechnungsstatus</CardTitle>
              <CardDescription className="text-gray-400">
                Verteilung nach Status ({selectedYear})
              </CardDescription>
            </CardHeader>
            <CardContent>
              <ResponsiveContainer width="100%" height={300}>
                <PieChart>
                  <Pie
                    data={statusDistribution}
                    cx="50%"
                    cy="50%"
                    labelLine={false}
                    label={(entry) => `${entry.name}: ${entry.value}`}
                    outerRadius={100}
                    fill="#8884d8"
                    dataKey="value"
                  >
                    {statusDistribution.map((entry, index) => (
                      <Cell key={`cell-${index}`} fill={COLORS[index % COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }} />
                </PieChart>
              </ResponsiveContainer>
            </CardContent>
          </Card>
        </div>

        {/* Top Customers */}
        <Card className="bg-white/5 border-white/10">
          <CardHeader>
            <CardTitle className="text-white">Top 10 Kunden nach Umsatz</CardTitle>
            <CardDescription className="text-gray-400">
              Bezahlte Rechnungen ({selectedYear})
            </CardDescription>
          </CardHeader>
          <CardContent>
            <ResponsiveContainer width="100%" height={400}>
              <BarChart data={topCustomers} layout="vertical">
                <CartesianGrid strokeDasharray="3 3" stroke="#333" />
                <XAxis type="number" stroke="#888" />
                <YAxis dataKey="name" type="category" stroke="#888" width={150} />
                <Tooltip
                  contentStyle={{ backgroundColor: "#1a1a1a", border: "1px solid #333" }}
                  formatter={(value: number) => formatCurrency(value)}
                />
                <Bar dataKey="revenue" fill="#10b981" />
              </BarChart>
            </ResponsiveContainer>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
