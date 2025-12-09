import { useState, useEffect } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
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
import { Plus, Trash2 } from "lucide-react";

interface CreateContractFormProps {
  customerId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

interface ContractItem {
  description: string;
  quantity: string;
  unit: string;
  unitPrice: string;
  vatRate: string;
  discount: string;
}

export function CreateContractForm({ customerId, onSuccess, onCancel }: CreateContractFormProps) {
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | undefined>(customerId);
  const [selectedTemplateId, setSelectedTemplateId] = useState<string>("none");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [contractType, setContractType] = useState("service");
  const [startDate, setStartDate] = useState("");
  const [endDate, setEndDate] = useState("");
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");
  const [autoRenew, setAutoRenew] = useState(false);
  const [renewalNoticeDays, setRenewalNoticeDays] = useState("30");
  const [notes, setNotes] = useState("");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<ContractItem[]>([
    {
      description: "",
      quantity: "1",
      unit: "Stück",
      unitPrice: "0",
      vatRate: "8.1",
      discount: "0",
    },
  ]);

  const { data: customers } = trpc.customers.all.useQuery({});
  const { data: templates } = trpc.contractTemplates.getAll.useQuery({ activeOnly: true });
  const { data: templateData } = trpc.contractTemplates.getById.useQuery(
    { id: parseInt(selectedTemplateId) },
    { enabled: selectedTemplateId !== "none" }
  );

  // Load template data when selected
  useEffect(() => {
    if (templateData) {
      const { template, items: templateItems } = templateData;
      setTitle(template.name);
      setDescription(template.description || "");
      setContractType(template.contractType);
      setBillingInterval(template.defaultBillingInterval);
      setPaymentTermsDays(template.defaultPaymentTermsDays.toString());
      setAutoRenew(template.defaultAutoRenew === 1);
      setRenewalNoticeDays(template.defaultRenewalNoticeDays.toString());
      setTerms(template.defaultTerms || "");
      
      // Calculate dates based on duration
      const start = new Date();
      const end = new Date();
      end.setMonth(end.getMonth() + template.defaultDurationMonths);
      setStartDate(start.toISOString().split('T')[0]);
      setEndDate(end.toISOString().split('T')[0]);
      
      // Load items
      setItems(templateItems.map(item => ({
        description: item.description,
        quantity: item.defaultQuantity,
        unit: item.defaultUnit,
        unitPrice: item.defaultUnitPrice,
        vatRate: item.defaultVatRate,
        discount: item.defaultDiscount,
      })));
    }
  }, [templateData]);

  const createContract = trpc.contracts.create.useMutation({
    onSuccess: () => {
      toast.success("Vertrag erstellt");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        quantity: "1",
        unit: "Stück",
        unitPrice: "0",
        vatRate: "8.1",
        discount: "0",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof ContractItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  const calculateTotal = () => {
    let subtotal = 0;
    let discountAmount = 0;
    let vatAmount = 0;

    items.forEach((item) => {
      const qty = parseFloat(item.quantity) || 0;
      const price = parseFloat(item.unitPrice) || 0;
      const disc = parseFloat(item.discount) || 0;
      const vat = parseFloat(item.vatRate) || 0;

      const itemSubtotal = qty * price;
      const itemDiscount = itemSubtotal * (disc / 100);
      const itemTotal = itemSubtotal - itemDiscount;
      const itemVat = itemTotal * (vat / 100);

      subtotal += itemSubtotal;
      discountAmount += itemDiscount;
      vatAmount += itemVat;
    });

    const total = subtotal - discountAmount + vatAmount;

    return {
      subtotal: subtotal.toFixed(2),
      discountAmount: discountAmount.toFixed(2),
      vatAmount: vatAmount.toFixed(2),
      total: total.toFixed(2),
    };
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!selectedCustomerId) {
      toast.error("Bitte wählen Sie einen Kunden aus");
      return;
    }

    if (!title || !startDate || !endDate) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    if (items.length === 0 || items.some((item) => !item.description)) {
      toast.error("Bitte fügen Sie mindestens eine Position hinzu");
      return;
    }

    createContract.mutate({
      customerId: selectedCustomerId,
      title,
      description: description || undefined,
      contractType: contractType as any,
      startDate,
      endDate,
      billingInterval: billingInterval as any,
      paymentTermsDays: parseInt(paymentTermsDays),
      autoRenew: autoRenew ? 1 : 0,
      renewalNoticeDays: parseInt(renewalNoticeDays),
      notes: notes || undefined,
      terms: terms || undefined,
      items,
    });
  };

  const totals = calculateTotal();

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Customer Selection */}
      {!customerId && (
        <div className="space-y-2">
          <Label htmlFor="customer">Kunde *</Label>
          <Select
            value={selectedCustomerId?.toString()}
            onValueChange={(value) => setSelectedCustomerId(parseInt(value))}
          >
            <SelectTrigger>
              <SelectValue placeholder="Kunde auswählen" />
            </SelectTrigger>
            <SelectContent>
              {customers?.map((customer) => (
                <SelectItem key={customer.id} value={customer.id.toString()}>
                  {customer.name}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
        </div>
      )}

      {/* Template Selection */}
      <div>
        <Label htmlFor="template">Aus Vorlage erstellen (optional)</Label>
        <Select value={selectedTemplateId} onValueChange={setSelectedTemplateId}>
          <SelectTrigger>
            <SelectValue placeholder="Keine Vorlage" />
          </SelectTrigger>
          <SelectContent>
            <SelectItem value="none">Keine Vorlage</SelectItem>
            {templates?.map((template) => (
              <SelectItem key={template.id} value={template.id.toString()}>
                {template.name}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>

      {/* Basic Info */}
      <div className="grid grid-cols-2 gap-4">
        <div className="col-span-2 space-y-2">
          <Label htmlFor="title">Vertragsbezeichnung *</Label>
          <Input
            id="title"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="z.B. IT-Support-Vertrag 2025"
            required
          />
        </div>

        <div className="col-span-2 space-y-2">
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionale Beschreibung des Vertrags"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="contractType">Vertragstyp</Label>
          <Select value={contractType} onValueChange={setContractType}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="service">Service</SelectItem>
              <SelectItem value="license">Lizenz</SelectItem>
              <SelectItem value="support">Support</SelectItem>
              <SelectItem value="hosting">Hosting</SelectItem>
              <SelectItem value="maintenance">Wartung</SelectItem>
              <SelectItem value="other">Sonstiges</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="billingInterval">Abrechnungsintervall</Label>
          <Select value={billingInterval} onValueChange={setBillingInterval}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="monthly">Monatlich</SelectItem>
              <SelectItem value="quarterly">Quartalsweise</SelectItem>
              <SelectItem value="yearly">Jährlich</SelectItem>
              <SelectItem value="one_time">Einmalig</SelectItem>
            </SelectContent>
          </Select>
        </div>

        <div className="space-y-2">
          <Label htmlFor="startDate">Startdatum *</Label>
          <Input
            id="startDate"
            type="date"
            value={startDate}
            onChange={(e) => setStartDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="endDate">Enddatum *</Label>
          <Input
            id="endDate"
            type="date"
            value={endDate}
            onChange={(e) => setEndDate(e.target.value)}
            required
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="paymentTermsDays">Zahlungsziel (Tage)</Label>
          <Input
            id="paymentTermsDays"
            type="number"
            value={paymentTermsDays}
            onChange={(e) => setPaymentTermsDays(e.target.value)}
            min="1"
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="renewalNoticeDays">Kündigungsfrist (Tage)</Label>
          <Input
            id="renewalNoticeDays"
            type="number"
            value={renewalNoticeDays}
            onChange={(e) => setRenewalNoticeDays(e.target.value)}
            min="1"
          />
        </div>
      </div>

      {/* Auto-Renew */}
      <div className="flex items-center gap-2">
        <input
          type="checkbox"
          id="autoRenew"
          checked={autoRenew}
          onChange={(e) => setAutoRenew(e.target.checked)}
          className="rounded"
        />
        <Label htmlFor="autoRenew" className="cursor-pointer">
          Automatische Verlängerung
        </Label>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Positionen *</Label>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="h-4 w-4 mr-2" />
            Position hinzufügen
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3 bg-white/5">
            <div className="flex items-start justify-between">
              <span className="text-sm font-medium">Position {index + 1}</span>
              {items.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeItem(index)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="h-4 w-4" />
                </Button>
              )}
            </div>

            <div className="grid grid-cols-6 gap-3">
              <div className="col-span-6 space-y-1">
                <Label className="text-xs">Beschreibung</Label>
                <Input
                  value={item.description}
                  onChange={(e) => updateItem(index, "description", e.target.value)}
                  placeholder="Leistungsbeschreibung"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Menge</Label>
                <Input
                  type="number"
                  value={item.quantity}
                  onChange={(e) => updateItem(index, "quantity", e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Einheit</Label>
                <Input
                  value={item.unit}
                  onChange={(e) => updateItem(index, "unit", e.target.value)}
                  placeholder="Stück"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Einzelpreis</Label>
                <Input
                  type="number"
                  value={item.unitPrice}
                  onChange={(e) => updateItem(index, "unitPrice", e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">MwSt. %</Label>
                <Input
                  type="number"
                  value={item.vatRate}
                  onChange={(e) => updateItem(index, "vatRate", e.target.value)}
                  step="0.01"
                  min="0"
                  required
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Rabatt %</Label>
                <Input
                  type="number"
                  value={item.discount}
                  onChange={(e) => updateItem(index, "discount", e.target.value)}
                  step="0.01"
                  min="0"
                  max="100"
                />
              </div>

              <div className="space-y-1">
                <Label className="text-xs">Gesamt</Label>
                <Input
                  value={(() => {
                    const qty = parseFloat(item.quantity) || 0;
                    const price = parseFloat(item.unitPrice) || 0;
                    const disc = parseFloat(item.discount) || 0;
                    return (qty * price * (1 - disc / 100)).toFixed(2);
                  })()}
                  disabled
                  className="bg-muted"
                />
              </div>
            </div>
          </div>
        ))}
      </div>

      {/* Totals */}
      <div className="p-4 border rounded-lg bg-white/5 space-y-2">
        <div className="flex justify-between text-sm">
          <span>Zwischensumme:</span>
          <span className="font-medium">CHF {totals.subtotal}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>Rabatt:</span>
          <span className="font-medium text-red-500">- CHF {totals.discountAmount}</span>
        </div>
        <div className="flex justify-between text-sm">
          <span>MwSt.:</span>
          <span className="font-medium">CHF {totals.vatAmount}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Gesamtbetrag:</span>
          <span className="text-yellow-500">CHF {totals.total}</span>
        </div>
      </div>

      {/* Notes and Terms */}
      <div className="space-y-4">
        <div className="space-y-2">
          <Label htmlFor="notes">Interne Notizen</Label>
          <Textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            placeholder="Interne Notizen (nicht für Kunden sichtbar)"
            rows={3}
          />
        </div>

        <div className="space-y-2">
          <Label htmlFor="terms">Vertragsbedingungen</Label>
          <Textarea
            id="terms"
            value={terms}
            onChange={(e) => setTerms(e.target.value)}
            placeholder="Allgemeine Geschäftsbedingungen und Vertragsbedingungen"
            rows={4}
          />
        </div>
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" variant="outline" onClick={onCancel}>
          Abbrechen
        </Button>
        <Button type="submit" disabled={createContract.isPending}>
          {createContract.isPending ? "Erstelle..." : "Vertrag erstellen"}
        </Button>
      </div>
    </form>
  );
}
