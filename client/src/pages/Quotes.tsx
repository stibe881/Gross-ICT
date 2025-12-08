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
import { Plus, Search, FileText, Eye, ArrowRight } from "lucide-react";
import { useLocation } from "wouter";

export default function Quotes() {
  const [, setLocation] = useLocation();
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedQuoteId, setSelectedQuoteId] = useState<number | null>(null);

  const { data: quotes, isLoading, refetch } = trpc.quotes.all.useQuery({
    search: searchTerm || undefined,
    status: statusFilter !== "all" ? (statusFilter as any) : undefined,
  });

  const { data: customers } = trpc.customers.all.useQuery();

  const handleViewQuote = (quoteId: number) => {
    setSelectedQuoteId(quoteId);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case "draft": return "bg-gray-500";
      case "sent": return "bg-blue-500";
      case "accepted": return "bg-green-500";
      case "rejected": return "bg-red-500";
      case "expired": return "bg-gray-400";
      default: return "bg-gray-500";
    }
  };

  const getStatusLabel = (status: string) => {
    switch (status) {
      case "draft": return "Entwurf";
      case "sent": return "Versendet";
      case "accepted": return "Akzeptiert";
      case "rejected": return "Abgelehnt";
      case "expired": return "Abgelaufen";
      default: return status;
    }
  };

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Angebote / Offerten</h1>
            <p className="text-muted-foreground mt-1">Erstellen und verwalten Sie Ihre Angebote</p>
          </div>
          <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
            <Plus className="w-4 h-4" />
            Neues Angebot
          </Button>
        </div>

        {/* Filters */}
        <Card className="p-4 mb-6">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div className="relative">
              <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
              <Input
                placeholder="Suche nach Angebotsnummer..."
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
                <SelectItem value="accepted">Akzeptiert</SelectItem>
                <SelectItem value="rejected">Abgelehnt</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
              </SelectContent>
            </Select>

            <Button variant="outline" onClick={() => {
              setSearchTerm("");
              setStatusFilter("all");
            }}>
              Zurücksetzen
            </Button>
          </div>
        </Card>

        {/* Quote List */}
        {isLoading ? (
          <div className="text-center py-12">
            <p className="text-muted-foreground">Lade Angebote...</p>
          </div>
        ) : !quotes || quotes.length === 0 ? (
          <Card className="p-12 text-center">
            <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine Angebote gefunden</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie Ihr erstes Angebot, um loszulegen.
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erstes Angebot erstellen
            </Button>
          </Card>
        ) : (
          <div className="space-y-4">
            {quotes.map((quote) => (
              <Card key={quote.id} className="p-6 hover:shadow-lg transition-shadow">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <h3 className="text-lg font-semibold">{quote.quoteNumber}</h3>
                      <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(quote.status)}`}>
                        {getStatusLabel(quote.status)}
                      </span>
                    </div>
                    <div className="text-sm text-muted-foreground space-y-1">
                      <p><strong>Kunde:</strong> {quote.customer?.name || "Unbekannt"}</p>
                      <p><strong>Datum:</strong> {new Date(quote.quoteDate).toLocaleDateString("de-CH")}</p>
                      <p><strong>Gültig bis:</strong> {new Date(quote.validUntil).toLocaleDateString("de-CH")}</p>
                    </div>
                  </div>
                  <div className="text-right">
                    <p className="text-2xl font-bold text-primary mb-4">
                      {parseFloat(quote.totalAmount).toFixed(2)} {quote.currency}
                    </p>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => handleViewQuote(quote.id)}
                      >
                        <Eye className="w-4 h-4 mr-1" />
                        Ansehen
                      </Button>
                    </div>
                  </div>
                </div>
              </Card>
            ))}
          </div>
        )}

        {/* Create Quote Dialog */}
        <CreateQuoteDialog
          open={createDialogOpen}
          onOpenChange={setCreateDialogOpen}
          customers={customers || []}
          onSuccess={() => {
            refetch();
            setCreateDialogOpen(false);
          }}
        />

        {/* View Quote Dialog */}
        {selectedQuoteId && (
          <ViewQuoteDialog
            quoteId={selectedQuoteId}
            onClose={() => setSelectedQuoteId(null)}
            onSuccess={refetch}
            onConvertToInvoice={() => {
              refetch();
              setSelectedQuoteId(null);
              setLocation("/invoices");
            }}
          />
        )}
      </div>
    </div>
  );
}

// Create Quote Dialog Component
function CreateQuoteDialog({ open, onOpenChange, customers, onSuccess }: any) {
  const [customerId, setCustomerId] = useState<number | null>(null);
  const [validUntil, setValidUntil] = useState("");
  const [notes, setNotes] = useState("");
  const [items, setItems] = useState([
    { description: "", quantity: "1", unit: "Stunden", unitPrice: "0", vatRate: "8.10", discount: "0" }
  ]);

  const createQuote = trpc.quotes.create.useMutation({
    onSuccess: () => {
      toast.success("Angebot erfolgreich erstellt");
      onSuccess();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setCustomerId(null);
    setValidUntil("");
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
    if (!customerId || !validUntil || items.length === 0) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createQuote.mutate({
      customerId,
      validUntil: new Date(validUntil),
      notes,
      items,
    });
  };

  return (
    <Dialog open={open} onOpenChange={onOpenChange}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Neues Angebot erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div>
            <label className="text-sm font-medium mb-2 block">Kunde *</label>
            <Select
              value={customerId?.toString() || ""}
              onValueChange={(v) => setCustomerId(parseInt(v))}
            >
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
            <label className="text-sm font-medium mb-2 block">Gültig bis *</label>
            <Input
              type="date"
              value={validUntil}
              onChange={(e) => setValidUntil(e.target.value)}
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
            <Button onClick={handleSubmit} disabled={createQuote.isPending}>
              {createQuote.isPending ? "Erstelle..." : "Angebot erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}

// View Quote Dialog Component
function ViewQuoteDialog({ quoteId, onClose, onSuccess, onConvertToInvoice }: any) {
  const [dueDate, setDueDate] = useState("");
  const { data: quote, isLoading } = trpc.quotes.byId.useQuery({ id: quoteId });
  
  const convertToInvoice = trpc.quotes.convertToInvoice.useMutation({
    onSuccess: (data) => {
      toast.success(`Rechnung ${data.invoiceNumber} erfolgreich erstellt`);
      onConvertToInvoice();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleConvert = () => {
    if (!dueDate) {
      toast.error("Bitte wählen Sie ein Fälligkeitsdatum");
      return;
    }

    convertToInvoice.mutate({
      quoteId,
      dueDate: new Date(dueDate),
    });
  };

  if (isLoading || !quote) {
    return (
      <Dialog open={true} onOpenChange={onClose}>
        <DialogContent>
          <p>Lade Angebot...</p>
        </DialogContent>
      </Dialog>
    );
  }

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Angebot {quote.quoteNumber}</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <p className="text-sm text-muted-foreground">Kunde</p>
              <p className="font-medium">{quote.customer?.name}</p>
              <p className="text-sm">{quote.customer?.email}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Status</p>
              <p className="font-medium">{quote.status}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Angebotsdatum</p>
              <p className="font-medium">{new Date(quote.quoteDate).toLocaleDateString("de-CH")}</p>
            </div>
            <div>
              <p className="text-sm text-muted-foreground">Gültig bis</p>
              <p className="font-medium">{new Date(quote.validUntil).toLocaleDateString("de-CH")}</p>
            </div>
          </div>

          <div>
            <h3 className="font-semibold mb-2">Positionen</h3>
            <div className="space-y-2">
              {quote.items.map((item: any, index: number) => (
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
              <p>Zwischensumme: {parseFloat(quote.subtotal).toFixed(2)} CHF</p>
              {parseFloat(quote.discountAmount) > 0 && (
                <p>Rabatt: -{parseFloat(quote.discountAmount).toFixed(2)} CHF</p>
              )}
              <p>MwSt: {parseFloat(quote.vatAmount).toFixed(2)} CHF</p>
              <p className="text-xl font-bold">
                Total: {parseFloat(quote.totalAmount).toFixed(2)} CHF
              </p>
            </div>
          </div>

          {quote.status !== "accepted" && !quote.invoiceId && (
            <div className="border-t pt-4">
              <h3 className="font-semibold mb-2">In Rechnung umwandeln</h3>
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="text-sm font-medium mb-2 block">Fälligkeitsdatum</label>
                  <Input
                    type="date"
                    value={dueDate}
                    onChange={(e) => setDueDate(e.target.value)}
                  />
                </div>
                <Button onClick={handleConvert} disabled={convertToInvoice.isPending}>
                  <ArrowRight className="w-4 h-4 mr-2" />
                  {convertToInvoice.isPending ? "Erstelle..." : "In Rechnung umwandeln"}
                </Button>
              </div>
            </div>
          )}

          {quote.invoiceId && (
            <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
              <p className="text-sm text-green-600 dark:text-green-400">
                ✓ Dieses Angebot wurde bereits in eine Rechnung umgewandelt
              </p>
            </div>
          )}

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Schließen
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
