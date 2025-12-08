import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { trpc } from "@/lib/trpc";
import { useLocation } from "wouter";
import { Loader2, LogOut, FileText, Download, Eye, Calendar, DollarSign, Building2 } from "lucide-react";
import { toast } from "sonner";
import { useState } from "react";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";

/**
 * Customer Portal - Customers can view their invoices and download PDFs
 */
export default function CustomerPortal() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  // TODO: Enable after server restart
  // const { data: invoices, isLoading: invoicesLoading } = trpc.invoices.myInvoices.useQuery(undefined, {
  //   enabled: !!user && user.role === "user",
  // });
  const invoices: any[] = [];
  const invoicesLoading = false;

  const logoutMutation = trpc.auth.logout.useMutation({
    onSuccess: () => {
      toast.success("Erfolgreich abgemeldet");
      setLocation("/login");
    },
  });

  const downloadPdfMutation = trpc.pdf.generateInvoicePDF.useMutation({
    onSuccess: (data: { filename: string; data: string }) => {
      // Convert base64 to blob and download
      const byteCharacters = atob(data.data);
      const byteNumbers = new Array(byteCharacters.length);
      for (let i = 0; i < byteCharacters.length; i++) {
        byteNumbers[i] = byteCharacters.charCodeAt(i);
      }
      const byteArray = new Uint8Array(byteNumbers);
      const blob = new Blob([byteArray], { type: "application/pdf" });
      const url = window.URL.createObjectURL(blob);
      window.open(url, "_blank");
      toast.success("PDF wird geöffnet");
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  if (authLoading || invoicesLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-black">
        <Loader2 className="h-8 w-8 animate-spin text-primary" />
      </div>
    );
  }

  if (!user || user.role !== "user") {
    setLocation("/login");
    return null;
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">Entwurf</Badge>;
      case "sent":
        return <Badge className="bg-blue-500/20 text-blue-400 border-blue-500/30">Versendet</Badge>;
      case "paid":
        return <Badge className="bg-green-500/20 text-green-400 border-green-500/30">Bezahlt</Badge>;
      case "overdue":
        return <Badge className="bg-red-500/20 text-red-400 border-red-500/30">Überfällig</Badge>;
      case "cancelled":
        return <Badge className="bg-orange-500/20 text-orange-400 border-orange-500/30">Storniert</Badge>;
      default:
        return <Badge className="bg-gray-500/20 text-gray-400 border-gray-500/30">{status}</Badge>;
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
    }).format(amount);
  };

  const selectedInvoice = invoices?.find((inv: any) => inv.id === selectedInvoiceId);

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex justify-between items-center">
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Kundenportal</h1>
              <p className="text-xs md:text-sm text-gray-400">Ihre Rechnungen und Dokumente</p>
            </div>
            <div className="flex items-center gap-2">
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
        {/* Welcome Message */}
        <Card className="bg-white/5 border-white/10 mb-8">
          <CardHeader>
            <CardTitle className="text-white flex items-center gap-2">
              <Building2 className="h-5 w-5 text-primary" />
              Willkommen, {user.name || "Kunde"}
            </CardTitle>
            <CardDescription className="text-gray-400">
              Hier finden Sie alle Ihre Rechnungen und können diese als PDF herunterladen.
            </CardDescription>
          </CardHeader>
        </Card>

        {/* Invoices List */}
        <div className="space-y-4">
          <h2 className="text-xl font-bold mb-4">Ihre Rechnungen</h2>
          
          {!invoices || invoices.length === 0 ? (
            <Card className="bg-white/5 border-white/10">
              <CardContent className="py-12 text-center">
                <FileText className="h-12 w-12 mx-auto mb-4 text-gray-500" />
                <p className="text-gray-400">Noch keine Rechnungen vorhanden</p>
              </CardContent>
            </Card>
          ) : (
            invoices.map((invoice: any) => (
              <Card key={invoice.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
                <CardHeader>
                  <div className="flex items-start justify-between">
                    <div>
                      <CardTitle className="text-white flex items-center gap-2">
                        <FileText className="h-5 w-5 text-primary" />
                        Rechnung {invoice.invoiceNumber}
                      </CardTitle>
                      <CardDescription className="text-gray-400 mt-1">
                        {invoice.description || "Keine Beschreibung"}
                      </CardDescription>
                    </div>
                    <div className="flex flex-col items-end gap-2">
                      {getStatusBadge(invoice.status)}
                      <span className="text-lg font-bold text-white">
                        {formatCurrency(invoice.totalAmount)}
                      </span>
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between">
                    <div className="space-y-1 text-sm text-gray-400">
                      <div className="flex items-center gap-2">
                        <Calendar className="h-4 w-4" />
                        <span>Datum: {new Date(invoice.invoiceDate).toLocaleDateString("de-DE")}</span>
                      </div>
                      {invoice.dueDate && (
                        <div className="flex items-center gap-2">
                          <DollarSign className="h-4 w-4" />
                          <span>Fällig: {new Date(invoice.dueDate).toLocaleDateString("de-DE")}</span>
                        </div>
                      )}
                    </div>
                    <div className="flex items-center gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setSelectedInvoiceId(invoice.id)}
                        className="border-white/20 bg-white/5 hover:bg-white/10"
                      >
                        <Eye className="h-4 w-4 mr-2" />
                        Details
                      </Button>
                      <Button
                        variant="default"
                        size="sm"
                        onClick={() => downloadPdfMutation.mutate({ invoiceId: invoice.id })}
                        disabled={downloadPdfMutation.isPending}
                        className="bg-primary hover:bg-primary/90"
                      >
                        <Download className="h-4 w-4 mr-2" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))
          )}
        </div>
      </div>

      {/* Invoice Detail Dialog */}
      {selectedInvoice && (
        <Dialog open={!!selectedInvoiceId} onOpenChange={() => setSelectedInvoiceId(null)}>
          <DialogContent className="bg-black/95 border-white/20 text-white max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle className="flex items-center gap-2">
                <FileText className="h-5 w-5 text-primary" />
                Rechnung {selectedInvoice.invoiceNumber}
              </DialogTitle>
            </DialogHeader>
            <div className="space-y-6 mt-4">
              {/* Invoice Info */}
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <p className="text-sm text-gray-400">Status</p>
                  <div className="mt-1">{getStatusBadge(selectedInvoice.status)}</div>
                </div>
                <div>
                  <p className="text-sm text-gray-400">Rechnungsdatum</p>
                  <p className="text-white mt-1">
                    {new Date(selectedInvoice.invoiceDate).toLocaleDateString("de-DE")}
                  </p>
                </div>
                {selectedInvoice.dueDate && (
                  <div>
                    <p className="text-sm text-gray-400">Fälligkeitsdatum</p>
                    <p className="text-white mt-1">
                      {new Date(selectedInvoice.dueDate).toLocaleDateString("de-DE")}
                    </p>
                  </div>
                )}
                <div>
                  <p className="text-sm text-gray-400">Gesamtbetrag</p>
                  <p className="text-white text-lg font-bold mt-1">
                    {formatCurrency(selectedInvoice.totalAmount)}
                  </p>
                </div>
              </div>

              {/* Description */}
              {selectedInvoice.description && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Beschreibung</p>
                  <p className="text-white">{selectedInvoice.description}</p>
                </div>
              )}

              {/* Notes */}
              {selectedInvoice.notes && (
                <div>
                  <p className="text-sm text-gray-400 mb-2">Notizen</p>
                  <p className="text-white">{selectedInvoice.notes}</p>
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-2 pt-4 border-t border-white/10">
                <Button
                  variant="default"
                  onClick={() => downloadPdfMutation.mutate({ invoiceId: selectedInvoice.id })}
                  disabled={downloadPdfMutation.isPending}
                  className="bg-primary hover:bg-primary/90"
                >
                  <Download className="h-4 w-4 mr-2" />
                  PDF herunterladen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => setSelectedInvoiceId(null)}
                  className="border-white/20 bg-white/5 hover:bg-white/10"
                >
                  Schließen
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
