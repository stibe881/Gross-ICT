import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, FileText, Download, Eye } from "lucide-react";

export default function Invoices() {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [yearFilter, setYearFilter] = useState<number>(new Date().getFullYear());
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedInvoiceId, setSelectedInvoiceId] = useState<number | null>(null);

  const { data: invoices, isLoading, refetch } = trpc.invoices.all.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
    year: yearFilter,
  });

  const { data: customers } = trpc.customers.all.useQuery();

  const handleViewInvoice = (invoiceId: number) => {
    setSelectedInvoiceId(invoiceId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "sent": return "bg-blue-500";
      case "paid": return "bg-green-500";
      case "overdue": return "bg-red-500";
      case "cancelled": return "bg-gray-400";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Entwurf";
      case "sent": return "Versendet";
      case "paid": return "Bezahlt";
      case "overdue": return "Überfällig";
      case "cancelled": return "Storniert";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Rechnungen</h1>
            <p className="text-muted-foreground mt-1">Verwalten Sie Ihre Rechnungen und Zahlungen</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neue Rechnung
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Rechnungsnummer..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger>
                <SelectValue placeholder="Status" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="sent">Versendet</SelectItem>
                <SelectItem value="paid">Bezahlt</SelectItem>
                <SelectItem value="overdue">Überfällig</SelectItem>
                <SelectItem value="cancelled">Storniert</SelectItem>
              </SelectContent>
            </Select>

            <Select value={yearFilter.toString()} onValueChange={(v) => setYearFilter(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Jahr" />
              </SelectTrigger>
              <SelectContent>
                {[2025, 2024, 2023, 2022].map(year => (
                  <SelectItem key={year} value={year.toString()}>{year}</SelectItem>
                ))}
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
              setYearFilter(new Date().getFullYear());
            }}>
              Zurücksetzen
            </Button>
          </div>
        </Card>

        {/* Invoice List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Lade Rechnungen...</p>
          </div>
        ) : !invoices || invoices.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine Rechnungen gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihre erste Rechnung, um loszulegen.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Rechnung erstellen
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {invoices.map((invoice) => (
              <Card key={invoice.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{invoice.invoiceNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(invoice.status)}`}>
                        {getStatusLabel(invoice.status)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Kunde:</strong> {invoice.customer?.name || "Unbekannt"}</p>
                      <p><strong>Datum:</strong> {new Date(invoice.invoiceDate).toLocaleDateString("de-CH")}</p>
                      <p><strong>Fällig:</strong> {new Date(invoice.dueDate).toLocaleDateString("de-CH")}</p>
                      {invoice.paidDate && (
                        <p><strong>Bezahlt am:</strong> {new Date(invoice.paidDate).toLocaleDateString("de-CH")}</p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary mb-4">
                      {parseFloat(invoice.totalAmount).toFixed(2)} {invoice.currency}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewInvoice(invoice.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ansehen
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => toast.info("PDF-Download wird implementiert")}
                      >
                        <Download className="w-4 h-4 mr-1" />
                        PDF
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Invoice Dialog */}
        <CreateInvoiceDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          customers={customers || []}
          onSuccess={() => {
            refetch();
            setCreateDialogOpen(false);
          }}
        />

        {/* View Invoice Dialog */}
        {selectedInvoiceId && (
          <ViewInvoiceDialog
            invoiceId={selectedInvoiceId}
            onClose={() => setSelectedInvoiceId(null)}
            onSuccess={refetch}
          />
        )}
      </div>
    </div>
  );
}

// Create Invoice Dialog Component
function CreateInvoiceDialog({ open, onOpenChange, customers, onSuccess }: any) {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [dueDate, setDueDate] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { description: "", quantity: "1", unit: "Stunden", unitPrice: "0", vatRate: "8.10", discount: "0" }
  ]);

  const createInvoice = trpc.invoices.create.useMutation({
    onSuccess: () => {
      toast.success("Rechnung erfolgreich erstellt");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setCustomerId(null);
    setDueDate("");
    setNotes("");
    setItems([{ description: "", quantity: "1", unit: "Stunden", unitPrice: "0", vatRate: "8.10", discount: "0" }]);
  };

  const addItem = () => {
    setItems([...items, { description: "", quantity: "1", unit: "Stunden", unitPrice: "0", vatRate: "8.10", discount: "0" }]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: string, value: string) => {
    const newItems = [...items];
    (newItems[index] as any)[field] = value;
    setItems(newItems);
  };

  const handleSubmit = () => {
    if (!customerId || !dueDate || items.length === 0) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createInvoice.mutate({
      customerId,
      dueDate: new Date(dueDate),
      notes,
      items,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neue Rechnung erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Kunde *</label>
            <Select value={customerId?.toString() || ""} onValueChange={(v) => setCustomerId(parseInt(v))}>
              <SelectTrigger>
                <SelectValue placeholder="Kunde auswählen" />
              </SelectTrigger>
              <SelectContent>
                {customers.map((customer: any) => (
                  <SelectItem key={customer.id} value={customer.id.toString()}>
                    {customer.name} ({customer.email})
                  </SelectItem>
                ))}
              </SelectContent>
            </Select>
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Fälligkeitsdatum *</label>
            <Input
              type="date"
              value={dueDate}
              onChange={(e) => setDueDate(e.target.value)}
            />
          </div>

          <div>
            <label className="text-sm font-medium mb-2 block">Notizen</label>
            <textarea
              className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
              value={notes}
              onChange={(e) => setNotes(e.target.value)}
              placeholder="Interne Notizen..."
            />
          </div>

          <div>
            <div className="flex items-center justify-between mb-2">
              <label className="text-sm font-medium">Positionen *</label>
              <Button size="sm" variant="outline" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Position hinzufügen
              </Button>
            </div>

            <div className="space-y-3">
              {items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-12 gap-2">
                    <div className="col-span-12">
                      <Input
                        placeholder="Beschreibung"
                        value={item.description}
                        onChange={(e) => updateItem(index, "description", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        placeholder="Menge"
                        value={item.quantity}
                        onChange={(e) => updateItem(index, "quantity", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        placeholder="Einheit"
                        value={item.unit}
                        onChange={(e) => updateItem(index, "unit", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Preis"
                        value={item.unitPrice}
                        onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="MwSt %"
                        value={item.vatRate}
                        onChange={(e) => updateItem(index, "vatRate", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2">
                      <Input
                        type="number"
                        step="0.01"
                        placeholder="Rabatt %"
                        value={item.discount}
                        onChange={(e) => updateItem(index, "discount", e.target.value)}
                      />
                    </div>
                    <div className="col-span-2 flex items-center justify-end">
                      {items.length > 1 && (
                        <Button
                          size="sm"
                          variant="ghost"
                          onClick={() => removeItem(index)}
                        >
                          Entfernen
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={() => onOpenChange(false)}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={createInvoice.isPending}>
              {createInvoice.isPending ? "Erstelle..." : "Rechnung erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// View Invoice Dialog Component
function ViewInvoiceDialog({ invoiceId, onClose, onSuccess }: any) {
  const { data: invoice, isLoading } = trpc.invoices.byId.useQuery({ id: invoiceId });
  const markPaid = trpc.invoices.markPaid.useMutation({
    onSuccess: () => {
      toast.success("Rechnung als bezahlt markiert");
      onSuccess();
      onClose();
    },
  });

  if (isLoading || !invoice) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <p>Lade Rechnung...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Rechnung {invoice.invoiceNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Kunde</p>
              <p className="font-medium">{invoice.customer?.name}</p>
              <p className="text-sm">{invoice.customer?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{invoice.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Rechnungsdatum</p>
              <p className="font-medium">{new Date(invoice.invoiceDate).toLocaleDateString("de-CH")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Fälligkeitsdatum</p>
              <p className="font-medium">{new Date(invoice.dueDate).toLocaleDateString("de-CH")}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Positionen</h3>
            <div className="space-y-2">
              {invoice.items.map((item: any, index: number) => (
                <Card key={index} className="p-3">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-muted-foreground">
                    {item.quantity} {item.unit} × {parseFloat(item.unitPrice).toFixed(2)} CHF
                    {parseFloat(item.discount) > 0 && ` (${item.discount}% Rabatt)`}
                    = {parseFloat(item.total).toFixed(2)} CHF
                  </p>
                </Card>
              ))}
            </div>
          </div>

          <div className="border-t pt-4">
            <div className="space-y-1 text-right">
              <p>Zwischensumme: {parseFloat(invoice.subtotal).toFixed(2)} CHF</p>
              {parseFloat(invoice.discountAmount) > 0 && (
                <p>Rabatt: -{parseFloat(invoice.discountAmount).toFixed(2)} CHF</p>
              )}
              <p>MwSt: {parseFloat(invoice.vatAmount).toFixed(2)} CHF</p>
              <p className="text-xl font-bold">
                Total: {parseFloat(invoice.totalAmount).toFixed(2)} CHF
              </p>
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            {invoice.status !== "paid" && (
              <Button onClick={() => markPaid.mutate({ id: invoiceId })}>
                Als bezahlt markieren
              </Button>
            )}
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
