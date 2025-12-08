import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { FileImage, FileText, Table } from "lucide-react";
import html2canvas from "html2canvas";
import jsPDF from "jspdf";
import { useRef, useState } from "react";
import { toast } from "sonner";
import { Bar } from "react-chartjs-2";
import { trpc } from "@/lib/trpc";
import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend,
} from "chart.js";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

// Register Chart.js components
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  Title,
  Tooltip,
  Legend
);

export function CustomerGrowthChart() {
  const chartRef = useRef<HTMLDivElement>(null);
  const [timeRange, setTimeRange] = useState<number>(6);
  const [selectedMonth, setSelectedMonth] = useState<string | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: customerData, isLoading } = trpc.analytics.getCustomerGrowthByMonth.useQuery({ months: timeRange });
  const { data: customerDetails } = trpc.analytics.getCustomersByMonth.useQuery(
    { month: selectedMonth || "" },
    { enabled: !!selectedMonth }
  );

  const exportToPNG = async () => {
    if (!chartRef.current) return;
    try {
      const canvas = await html2canvas(chartRef.current, {
        backgroundColor: "#000",
        scale: 2,
      });
      const link = document.createElement("a");
      link.download = "kunden-wachstum.png";
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
      pdf.save("kunden-wachstum.pdf");
      toast.success("Chart als PDF exportiert");
    } catch (error) {
      toast.error("Fehler beim Exportieren");
    }
  };

  const exportToCSV = () => {
    const data = customerData || [];
    if (data.length === 0) {
      toast.error("Keine Daten zum Exportieren");
      return;
    }
    const csv = data.map(row => `${row.month},${row.count}`).join("\n");
    const header = "Monat,Anzahl\n";
    const blob = new Blob([header + csv], { type: "text/csv" });
    const link = document.createElement("a");
    link.download = "kunden-wachstum.csv";
    link.href = URL.createObjectURL(blob);
    link.click();
    toast.success("Daten als CSV exportiert");
  };

  const handleChartClick = (event: any, elements: any[]) => {
    if (elements.length > 0 && customerData) {
      const index = elements[0].index;
      const monthData = customerData[index];
      setSelectedMonth(monthData.fullDate);
      setDetailsOpen(true);
    }
  };

  const chartData = {
    labels: customerData?.map(c => c.month) || [],
    datasets: [
      {
        label: "Neue Kunden",
        data: customerData?.map(c => c.count) || [],
        backgroundColor: "rgba(59, 130, 246, 0.8)",
        borderColor: "rgb(59, 130, 246)",
        borderWidth: 2,
      },
    ],
  };

  const chartOptions = {
    responsive: true,
    maintainAspectRatio: false,
    onClick: handleChartClick,
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
    <>
      <Card className="bg-white/5 border-white/10">
        <CardHeader>
          <div className="flex items-center justify-between flex-wrap gap-4">
            <CardTitle className="text-lg">Kunden-Wachstum</CardTitle>
            <div className="flex items-center gap-2">
              <Select value={timeRange.toString()} onValueChange={(v) => setTimeRange(parseInt(v))}>
                <SelectTrigger className="w-[140px] h-8">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="3">Letzte 3 Monate</SelectItem>
                  <SelectItem value="6">Letzte 6 Monate</SelectItem>
                  <SelectItem value="12">Letztes Jahr</SelectItem>
                  <SelectItem value="24">Letzte 2 Jahre</SelectItem>
                </SelectContent>
              </Select>
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
          {isLoading ? (
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Lade Daten...</p>
            </div>
          ) : customerData && customerData.length > 0 ? (
            <div ref={chartRef} className="h-64">
              <Bar data={chartData} options={chartOptions} />
            </div>
          ) : (
            <div className="h-64 flex items-center justify-center">
              <p className="text-muted-foreground">Keine Kundendaten verfügbar</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Details Dialog */}
      <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
        <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>
              Neue Kunden - {selectedMonth && customerData?.find(d => d.fullDate === selectedMonth)?.month}
            </DialogTitle>
          </DialogHeader>
          <div className="space-y-4">
            {customerDetails && customerDetails.length > 0 ? (
              <div className="space-y-2">
                {customerDetails.map((customer: any) => (
                  <Card key={customer.id} className="p-4 bg-white/5 border-white/10">
                    <div className="flex justify-between items-start">
                      <div>
                        <p className="font-semibold">{customer.name}</p>
                        <p className="text-sm text-muted-foreground">{customer.email}</p>
                        {customer.customerNumber && (
                          <p className="text-xs text-muted-foreground">Kundennr: {customer.customerNumber}</p>
                        )}
                      </div>
                      <div className="text-right">
                        <p className="text-sm capitalize">{customer.type}</p>
                        <p className="text-xs text-muted-foreground">
                          {new Date(customer.createdAt).toLocaleDateString('de-CH')}
                        </p>
                      </div>
                    </div>
                  </Card>
                ))}
                <div className="pt-4 border-t border-white/10">
                  <div className="flex justify-between items-center font-bold">
                    <span>Gesamt:</span>
                    <span>{customerDetails.length} neue Kunden</span>
                  </div>
                </div>
              </div>
            ) : (
              <p className="text-muted-foreground text-center py-8">Keine neuen Kunden in diesem Monat</p>
            )}
          </div>
        </DialogContent>
      </Dialog>
    </>
  );
}
