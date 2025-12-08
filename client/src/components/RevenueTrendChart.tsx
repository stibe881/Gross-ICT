import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { FileImage, FileText, Table } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef } from "react";
import { toast } from "sonner";
import { Line } from "react-chartjs-2";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  PointElement,
  LineElement,
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
  Title,
  Tooltip,
  Legend,
  Filler
);

interface RevenueTrendChartProps {
  revenueData?: { month: string; amount: number }[];
}

export function RevenueTrendChart({ revenueData }: RevenueTrendChartProps) {
  const chartRef = useRef<HTMLDivElement>(null);

  const exportToPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#000",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "umsatz-trend.png";
      link.href = canvas.toDataURL();
      link.click();
      toast.success("Chart als PNG exportiert");
    } catch (error) {
      toast.error("Fehler beim Exportieren");
    }
  };

  const exportToPDF = async () => {
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
      pdf.save("umsatz-trend.pdf");
      toast.success("Chart als PDF exportiert");
    } catch (error) {
      toast.error("Fehler beim Exportieren");
    }
  };

  const exportToCSV = () => {
    const data = revenueData || [{month: "Jan", amount: 12000}, {month: "Feb", amount: 19000}];
    const csv = data.map(row => Object.values(row).join(",")).join("\n");
    const header = Object.keys(data[0]).join(",") + "\n";
    const blob = new Blob([header + csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = "umsatz-trend.csv";
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("Daten als CSV exportiert");
  };

  const chartData = {
    labels: revenueData?.map(d => d.month) || ["Jan", "Feb", "Mär", "Apr", "Mai", "Jun"],
    datasets: [
      {
        label: "Umsatz (CHF)",
        data: revenueData?.map(d => d.amount) || [12000, 19000, 15000, 25000, 22000, 30000],
        borderColor: "rgb(234, 179, 8)",
        backgroundColor: "rgba(234, 179, 8, 0.1)",
        fill: true,
        tension: 0.4,
      },
    ],
  };

  const chartOptions = {
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

  return (
    <Card className="bg-white/5 border-white/10">
      <CardHeader>
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Umsatz-Trend</CardTitle>
          <div className="flex gap-2">
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToPNG}
              className="h-8 px-2"
            >
              <FileImage className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToPDF}
              className="h-8 px-2"
            >
              <FileText className="h-4 w-4" />
            </Button>
            <Button
              variant="ghost"
              size="sm"
              onClick={exportToCSV}
              className="h-8 px-2"
            >
              <Table className="h-4 w-4" />
            </Button>
          </div>
        </div>
      </CardHeader>
      <CardContent>
        <div ref={chartRef} className="h-64">
          <Line data={chartData} options={chartOptions} />
        </div>
      </CardContent>
    </Card>
  );
}
