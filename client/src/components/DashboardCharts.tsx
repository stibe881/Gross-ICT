import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Download, FileImage, FileText, Table } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";
import { toast } from "sonner";
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
  const revenueChartRef = useRef<HTMLDivElement>(null);
  const ticketChartRef = useRef<HTMLDivElement>(null);
  const customerChartRef = useRef<HTMLDivElement>(null);

  const exportToPNG = async (chartRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#000",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = `${filename}.png`;
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Chart als PNG exportiert");
    } catch (error) {
      toast.error("Fehler beim Exportieren");
    }
  };

  const exportToPDF = async (chartRef: React.RefObject<HTMLDivElement | null>, filename: string) => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#000",
        scale: 2,
      });
      const imgData = canvas.toDataURL("image/png");
      const pdf = new jsPDF({
        orientation: "landscape",
        unit: "px",
        format: [canvas.width, canvas.height],
      });
      pdf.addImage(imgData, "PNG", 0, 0, canvas.width, canvas.height);
      pdf.save(`${filename}.pdf`);
      toast.success("Chart als PDF exportiert");
    } catch (error) {
      toast.error("Fehler beim Exportieren");
    }
  };

  const exportToCSV = (data: any[], filename: string) => {
    const csv = data.map(row => Object.values(row).join(",")).join("\n");
    const header = Object.keys(data[0]).join(",") + "\n";
    const blob = new Blob([header + csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = `${filename}.csv`;
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("Daten als CSV exportiert");
  };
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
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Umsatz-Trend</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPNG(revenueChartRef, "umsatz-trend")}
                className="h-8 px-2"
              >
                <FileImage className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPDF(revenueChartRef, "umsatz-trend")}
                className="h-8 px-2"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToCSV(
                  revenueData || [{month: "Jan", amount: 12000}, {month: "Feb", amount: 19000}],
                  "umsatz-trend"
                )}
                className="h-8 px-2"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={revenueChartRef} className="h-64">
            <Line data={revenueChartData} options={revenueChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Ticket Status Distribution */}
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Ticket-Status</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPNG(ticketChartRef, "ticket-status")}
                className="h-8 px-2"
              >
                <FileImage className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPDF(ticketChartRef, "ticket-status")}
                className="h-8 px-2"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToCSV(
                  ticketStats || [{status: "Offen", count: 12}, {status: "Gelöst", count: 25}],
                  "ticket-status"
                )}
                className="h-8 px-2"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={ticketChartRef} className="h-64">
            <Doughnut data={ticketChartData} options={ticketChartOptions} />
          </div>
        </CardContent>
      </Card>

      {/* Customer Growth */}
      <Card className="bg-white/5 border-white/10 lg:col-span-3">
        <CardHeader>
          <div className="flex items-center justify-between">
            <CardTitle className="text-lg">Kunden-Wachstum (Letzte 6 Monate)</CardTitle>
            <div className="flex gap-2">
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPNG(customerChartRef, "kunden-wachstum")}
                className="h-8 px-2"
              >
                <FileImage className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToPDF(customerChartRef, "kunden-wachstum")}
                className="h-8 px-2"
              >
                <FileText className="h-4 w-4" />
              </Button>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => exportToCSV(
                  customerGrowth || [{month: "Jan", count: 5}, {month: "Feb", count: 8}],
                  "kunden-wachstum"
                )}
                className="h-8 px-2"
              >
                <Table className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </CardHeader>
        <CardContent>
          <div ref={customerChartRef} className="h-64">
            <Bar data={customerChartData} options={customerChartOptions} />
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
