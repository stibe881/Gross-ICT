import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Line, Doughnut, Bar } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler,
} from "chart.js";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
  BarElement,
  ArcElement,
  Title,
  Tooltip,
  Legend,
  Filler
);

interface DashboardChartsProps {
  revenueData?: { month: string; amount: number }[];
  ticketStats?: { status: string; count: number }[];
  customerGrowth?: { month: string; count: number }[];
}

export function DashboardCharts({ revenueData, ticketStats, customerGrowth }: DashboardChartsProps) {
  // Revenue Trend Chart Data
  const revenueChartData = {
    labels: revenueData?.map(d => d.month) || ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"],
    datasets: [
      {
        label: "Umsatz (€)",
        data: revenueData?.map(d => d.amount) || [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: "rgb(234, 179, 8)",
        backgroundColor: "rgba(234, 179, 8, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const revenueChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
        },
      },
    },
  };

  // Ticket Status Distribution Chart Data
  const ticketChartData = {
    labels: ticketStats?.map(t => t.status) || ["Offen", "In Bearbeitung", "Gelöst", "Geschlossen"],
    datasets: [
      {
        data: ticketStats?.map(t => t.count) || [12, 8, 25, 15],
        backgroundColor: [
          "rgba(59, 130, 246, 0.8)", // blue
          "rgba(234, 179, 8, 0.8)",  // yellow
          "rgba(34, 197, 94, 0.8)",  // green
          "rgba(156, 163, 175, 0.8)", // gray
        ],
        borderColor: [
          "rgb(59, 130, 246)",
          "rgb(234, 179, 8)",
          "rgb(34, 197, 94)",
          "rgb(156, 163, 175)",
        ],
        borderWidth: 2,
      },
    ],
  };

  const ticketChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        position: "bottom" as const,
        labels: {
          color: "rgba(255, 255, 255, 0.8)",
          padding: 15,
          font: {
            size: 12,
          },
        },
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
  };

  // Customer Growth Chart Data
  const customerChartData = {
    labels: customerGrowth?.map(c => c.month) || ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"],
    datasets: [
      {
        label: "Neue Kunden",
        data: customerGrowth?.map(c => c.count) || [5, 8, 12, 7, 15, 10],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
      },
    ],
  };

  const customerChartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: {
      legend: {
        display: false,
      },
      tooltip: {
        backgroundColor: "rgba(0, 0, 0, 0.9)",
        padding: 12,
        titleColor: "#fff",
        bodyColor: "#fff",
        borderColor: "rgba(255, 255, 255, 0.1)",
        borderWidth: 1,
      },
    },
    scales: {
      y: {
        beginAtZero: true,
        grid: {
          color: "rgba(255, 255, 255, 0.05)",
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
          stepSize: 5,
        },
      },
      x: {
        grid: {
          display: false,
        },
        ticks: {
          color: "rgba(255, 255, 255, 0.6)",
        },
      },
    },
  };

  return (
    <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
      {/* Revenue Trend */}
      <Card className="bg-white/5 border-white/10 lg:col-span-2">
        <CardHeader>
          <CardTitle className="text-lg">Umsatz-Trend</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Line data={revenueChartData} options={revenueChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Ticket Status Distribution */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <CardTitle className="text-lg">Ticket-Status</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Doughnut data={ticketChartData} options={ticketChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Customer Growth */}
      <Card className="bg-white/5 border-white/10 lg:col-span-3">
        <CardHeader>
          <CardTitle className="text-lg">Kunden-Wachstum (Letzte 6 Monate)</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="h-64">
            <Bar data={customerChartData} options={customerChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
