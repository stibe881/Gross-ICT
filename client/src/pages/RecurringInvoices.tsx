import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { toast } from "sonner";
import { Plus, Pause, Play, Trash2, Calendar } from "lucide-react";

export default function RecurringInvoices() {
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  
  const { data: recurringInvoices, isLoading, refetch } = trpc.recurringInvoices.all.useQuery();
  const { data: customers } = trpc.customers.all.useQuery();

  const toggleActive = trpc.recurringInvoices.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status aktualisiert");
      refetch();
    },
  });

  const deleteRecurring = trpc.recurringInvoices.delete.useMutation({
    onSuccess: () => {
      toast.success("Wiederkehrende Rechnung gelöscht");
      refetch();
    },
  });

  const getIntervalLabel = (interval: string) => {
    switch (interval) {
      case 'monthly': return 'Monatlich';
      case 'quarterly': return 'Vierteljährlich';
      case 'yearly': return 'Jährlich';
      default: return interval;
    }
  };

  if (isLoading) {
    return <div className="p-6">Lade...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Wiederkehrende Rechnungen</h2>
          <p className="text-muted-foreground">Automatische Rechnungserstellung verwalten</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="w-4 h-4 mr-2" />
          Neue erstellen
        </Button>
      </div>

      <div className="grid gap-4">
        {recurringInvoices && recurringInvoices.length > 0 ? (
          recurringInvoices.map((recurring: any) => (
            <Card key={recurring.id} className="p-6">
              <div className="flex justify-between items-start">
                <div className="space-y-2 flex-1">
                  <div className="flex items-center gap-3">
                    <h3 className="text-lg font-semibold">{recurring.templateName}</h3>
                    <span className={`px-2 py-1 text-xs rounded-full ${
                      recurring.isActive 
                        ? 'bg-green-100 text-green-800' 
                        : 'bg-gray-100 text-gray-800'
                    }`}>
                      {recurring.isActive ? 'Aktiv' : 'Pausiert'}
                    </span>
                  </div>
                  
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
                    <div>
                      <p className="text-muted-foreground">Kunde</p>
                      <p className="font-medium">{recurring.customer?.name || 'Unbekannt'}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Intervall</p>
                      <p className="font-medium">{getIntervalLabel(recurring.interval)}</p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Nächste Ausführung</p>
                      <p className="font-medium">
                        {new Date(recurring.nextRunDate).toLocaleDateString('de-CH')}
                      </p>
                    </div>
                    <div>
                      <p className="text-muted-foreground">Letzte Ausführung</p>
                      <p className="font-medium">
                        {recurring.lastRunDate 
                          ? new Date(recurring.lastRunDate).toLocaleDateString('de-CH')
                          : 'Noch nie'
                        }
                      </p>
                    </div>
                  </div>

                  {recurring.notes && (
                    <p className="text-sm text-muted-foreground mt-2">{recurring.notes}</p>
                  )}
                </div>

                <div className="flex gap-2 ml-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => toggleActive.mutate({
                      id: recurring.id,
                      isActive: !recurring.isActive,
                    })}
                  >
                    {recurring.isActive ? (
                      <><Pause className="w-4 h-4 mr-1" /> Pausieren</>
                    ) : (
                      <><Play className="w-4 h-4 mr-1" /> Aktivieren</>
                    )}
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      if (confirm('Möchten Sie diese wiederkehrende Rechnung wirklich löschen?')) {
                        deleteRecurring.mutate({ id: recurring.id });
                      }
                    }}
                  >
                    <Trash2 className="w-4 h-4" />
                  </Button>
                </div>
              </div>
            </Card>
          ))
        ) : (
          <Card className="p-12 text-center">
            <Calendar className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
            <h3 className="text-lg font-semibold mb-2">Keine wiederkehrenden Rechnungen</h3>
            <p className="text-muted-foreground mb-4">
              Erstellen Sie automatische Rechnungen für wiederkehrende Services
            </p>
            <Button onClick={() => setCreateDialogOpen(true)}>
              <Plus className="w-4 h-4 mr-2" />
              Erste Rechnung erstellen
            </Button>
          </Card>
        )}
      </div>

      {createDialogOpen && (
        <CreateRecurringInvoiceDialog
          customers={customers || []}
          onClose={() => setCreateDialogOpen(false)}
          onSuccess={() => {
            setCreateDialogOpen(false);
            refetch();
          }}
        />
      )}
    </div>
  );
}

function CreateRecurringInvoiceDialog({ customers, onClose, onSuccess }: any) {
  const [formData, setFormData] = useState({
    customerId: "",
    templateName: "",
    interval: "monthly",
    nextRunDate: new Date().toISOString().split('T')[0],
    notes: "",
    items: [
      {
        description: "",
        quantity: "1",
        unit: "Monat",
        unitPrice: "0",
        vatRate: "8.1",
        discount: "0",
      },
    ],
  });

  const createMutation = trpc.recurringInvoices.create.useMutation({
    onSuccess: () => {
      toast.success("Wiederkehrende Rechnung erstellt");
      onSuccess();
    },
  });

  const handleSubmit = () => {
    if (!formData.customerId || !formData.templateName || formData.items.length === 0) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    createMutation.mutate({
      customerId: parseInt(formData.customerId),
      templateName: formData.templateName,
      interval: formData.interval as any,
      nextRunDate: formData.nextRunDate,
      notes: formData.notes,
      items: formData.items,
    });
  };

  const addItem = () => {
    setFormData({
      ...formData,
      items: [
        ...formData.items,
        {
          description: "",
          quantity: "1",
          unit: "Monat",
          unitPrice: "0",
          vatRate: "8.1",
          discount: "0",
        },
      ],
    });
  };

  const removeItem = (index: number) => {
    setFormData({
      ...formData,
      items: formData.items.filter((_, i) => i !== index),
    });
  };

  return (
    <Dialog open={true} onOpenChange={onClose}>
      <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle>Wiederkehrende Rechnung erstellen</DialogTitle>
        </DialogHeader>

        <div className="space-y-4 mt-4">
          <div className="grid grid-cols-2 gap-4">
            <div>
              <Label>Vorlagenname *</Label>
              <Input
                value={formData.templateName}
                onChange={(e) => setFormData({ ...formData, templateName: e.target.value })}
                placeholder="z.B. Monatliches Hosting"
              />
            </div>
            <div>
              <Label>Kunde *</Label>
              <Select
                value={formData.customerId}
                onValueChange={(value) => setFormData({ ...formData, customerId: value })}
              >
                <SelectTrigger>
                  <SelectValue placeholder="Kunde auswählen" />
                </SelectTrigger>
                <SelectContent>
                  {customers.map((customer: any) => (
                    <SelectItem key={customer.id} value={String(customer.id)}>
                      {customer.name}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Intervall</Label>
              <Select
                value={formData.interval}
                onValueChange={(value) => setFormData({ ...formData, interval: value })}
              >
                <SelectTrigger>
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="monthly">Monatlich</SelectItem>
                  <SelectItem value="quarterly">Vierteljährlich</SelectItem>
                  <SelectItem value="yearly">Jährlich</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div>
              <Label>Nächste Ausführung</Label>
              <Input
                type="date"
                value={formData.nextRunDate}
                onChange={(e) => setFormData({ ...formData, nextRunDate: e.target.value })}
              />
            </div>
          </div>

          <div>
            <Label>Notizen</Label>
            <Textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Interne Notizen..."
            />
          </div>

          <div>
            <div className="flex justify-between items-center mb-2">
              <Label>Positionen *</Label>
              <Button type="button" variant="outline" size="sm" onClick={addItem}>
                <Plus className="w-4 h-4 mr-1" />
                Position hinzufügen
              </Button>
            </div>

            <div className="space-y-3">
              {formData.items.map((item, index) => (
                <Card key={index} className="p-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="col-span-2">
                      <Input
                        placeholder="Beschreibung"
                        value={item.description}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].description = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                    </div>
                    <Input
                      placeholder="Menge"
                      type="number"
                      value={item.quantity}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].quantity = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                    />
                    <Input
                      placeholder="Einheit"
                      value={item.unit}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].unit = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                    />
                    <Input
                      placeholder="Preis"
                      type="number"
                      step="0.01"
                      value={item.unitPrice}
                      onChange={(e) => {
                        const newItems = [...formData.items];
                        newItems[index].unitPrice = e.target.value;
                        setFormData({ ...formData, items: newItems });
                      }}
                    />
                    <div className="flex gap-2">
                      <Input
                        placeholder="MwSt %"
                        type="number"
                        step="0.1"
                        value={item.vatRate}
                        onChange={(e) => {
                          const newItems = [...formData.items];
                          newItems[index].vatRate = e.target.value;
                          setFormData({ ...formData, items: newItems });
                        }}
                      />
                      {formData.items.length > 1 && (
                        <Button
                          type="button"
                          variant="outline"
                          size="sm"
                          onClick={() => removeItem(index)}
                        >
                          <Trash2 className="w-4 h-4" />
                        </Button>
                      )}
                    </div>
                  </div>
                </Card>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-2 pt-4">
            <Button variant="outline" onClick={onClose}>
              Abbrechen
            </Button>
            <Button onClick={handleSubmit} disabled={createMutation.isPending}>
              {createMutation.isPending ? "Erstelle..." : "Erstellen"}
            </Button>
          </div>
        </div>
      </DialogContent>
    </Dialog>
  );
}
