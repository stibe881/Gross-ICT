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

interface TemplateItem {
  description: string;
  defaultQuantity: string;
  defaultUnit: string;
  defaultUnitPrice: string;
  defaultVatRate: string;
  defaultDiscount: string;
}

interface CreateContractTemplateFormProps {
  templateId?: number;
  onSuccess: () => void;
  onCancel: () => void;
}

export function CreateContractTemplateForm({
  templateId,
  onSuccess,
  onCancel,
}: CreateContractTemplateFormProps) {
  const [name, setName] = useState("");
  const [description, setDescription] = useState("");
  const [contractType, setContractType] = useState("service");
  const [billingInterval, setBillingInterval] = useState("monthly");
  const [durationMonths, setDurationMonths] = useState("12");
  const [paymentTermsDays, setPaymentTermsDays] = useState("30");
  const [autoRenew, setAutoRenew] = useState("0");
  const [renewalNoticeDays, setRenewalNoticeDays] = useState("30");
  const [terms, setTerms] = useState("");
  const [items, setItems] = useState<TemplateItem[]>([
    {
      description: "",
      defaultQuantity: "1",
      defaultUnit: "Stück",
      defaultUnitPrice: "0",
      defaultVatRate: "8.10",
      defaultDiscount: "0",
    },
  ]);

  // Load template data if editing
  const { data: templateData } = trpc.contractTemplates.getById.useQuery(
    { id: templateId! },
    { enabled: !!templateId }
  );

  useEffect(() => {
    if (templateData) {
      const { template, items: templateItems } = templateData;
      setName(template.name);
      setDescription(template.description || "");
      setContractType(template.contractType);
      setBillingInterval(template.defaultBillingInterval);
      setDurationMonths(template.defaultDurationMonths.toString());
      setPaymentTermsDays(template.defaultPaymentTermsDays.toString());
      setAutoRenew(template.defaultAutoRenew.toString());
      setRenewalNoticeDays(template.defaultRenewalNoticeDays.toString());
      setTerms(template.defaultTerms || "");
      setItems(
        templateItems.map((item) => ({
          description: item.description,
          defaultQuantity: item.defaultQuantity,
          defaultUnit: item.defaultUnit,
          defaultUnitPrice: item.defaultUnitPrice,
          defaultVatRate: item.defaultVatRate,
          defaultDiscount: item.defaultDiscount,
        }))
      );
    }
  }, [templateData]);

  const createMutation = trpc.contractTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Vorlage erstellt");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.contractTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Vorlage aktualisiert");
      onSuccess();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();

    if (!name.trim()) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }

    if (items.length === 0) {
      toast.error("Bitte fügen Sie mindestens eine Position hinzu");
      return;
    }

    const data = {
      name: name.trim(),
      description: description.trim() || undefined,
      contractType: contractType as any,
      defaultBillingInterval: billingInterval as any,
      defaultDurationMonths: parseInt(durationMonths),
      defaultPaymentTermsDays: parseInt(paymentTermsDays),
      defaultAutoRenew: parseInt(autoRenew),
      defaultRenewalNoticeDays: parseInt(renewalNoticeDays),
      defaultTerms: terms.trim() || undefined,
      items,
    };

    if (templateId) {
      updateMutation.mutate({ id: templateId, ...data });
    } else {
      createMutation.mutate(data);
    }
  };

  const addItem = () => {
    setItems([
      ...items,
      {
        description: "",
        defaultQuantity: "1",
        defaultUnit: "Stück",
        defaultUnitPrice: "0",
        defaultVatRate: "8.10",
        defaultDiscount: "0",
      },
    ]);
  };

  const removeItem = (index: number) => {
    setItems(items.filter((_, i) => i !== index));
  };

  const updateItem = (index: number, field: keyof TemplateItem, value: string) => {
    const newItems = [...items];
    newItems[index] = { ...newItems[index], [field]: value };
    setItems(newItems);
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6">
      {/* Basic Info */}
      <div className="space-y-4">
        <div>
          <Label htmlFor="name">Vorlagenname *</Label>
          <Input
            id="name"
            value={name}
            onChange={(e) => setName(e.target.value)}
            placeholder="z.B. Standard IT-Support"
            required
          />
        </div>

        <div>
          <Label htmlFor="description">Beschreibung</Label>
          <Textarea
            id="description"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Optionale Beschreibung der Vorlage"
            rows={2}
          />
        </div>

        <div className="grid grid-cols-2 gap-4">
          <div>
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

          <div>
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
        </div>

        <div className="grid grid-cols-3 gap-4">
          <div>
            <Label htmlFor="durationMonths">Laufzeit (Monate)</Label>
            <Input
              id="durationMonths"
              type="number"
              value={durationMonths}
              onChange={(e) => setDurationMonths(e.target.value)}
              min="1"
            />
          </div>

          <div>
            <Label htmlFor="paymentTermsDays">Zahlungsziel (Tage)</Label>
            <Input
              id="paymentTermsDays"
              type="number"
              value={paymentTermsDays}
              onChange={(e) => setPaymentTermsDays(e.target.value)}
              min="0"
            />
          </div>

          <div>
            <Label htmlFor="renewalNoticeDays">Kündigungsfrist (Tage)</Label>
            <Input
              id="renewalNoticeDays"
              type="number"
              value={renewalNoticeDays}
              onChange={(e) => setRenewalNoticeDays(e.target.value)}
              min="0"
            />
          </div>
        </div>

        <div>
          <Label htmlFor="autoRenew">Automatische Verlängerung</Label>
          <Select value={autoRenew} onValueChange={setAutoRenew}>
            <SelectTrigger>
              <SelectValue />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="0">Nein</SelectItem>
              <SelectItem value="1">Ja</SelectItem>
            </SelectContent>
          </Select>
        </div>
      </div>

      {/* Items */}
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <Label>Standard-Positionen *</Label>
          <Button type="button" onClick={addItem} size="sm" variant="outline">
            <Plus className="w-4 h-4 mr-2" />
            Position hinzufügen
          </Button>
        </div>

        {items.map((item, index) => (
          <div key={index} className="p-4 border rounded-lg space-y-3">
            <div className="flex items-start justify-between">
              <Label>Position {index + 1}</Label>
              {items.length > 1 && (
                <Button
                  type="button"
                  onClick={() => removeItem(index)}
                  size="sm"
                  variant="ghost"
                >
                  <Trash2 className="w-4 h-4 text-red-500" />
                </Button>
              )}
            </div>

            <div>
              <Input
                value={item.description}
                onChange={(e) => updateItem(index, "description", e.target.value)}
                placeholder="Beschreibung"
                required
              />
            </div>

            <div className="grid grid-cols-3 gap-2">
              <Input
                type="number"
                step="0.01"
                value={item.defaultQuantity}
                onChange={(e) => updateItem(index, "defaultQuantity", e.target.value)}
                placeholder="Menge"
                required
              />
              <Input
                value={item.defaultUnit}
                onChange={(e) => updateItem(index, "defaultUnit", e.target.value)}
                placeholder="Einheit"
                required
              />
              <Input
                type="number"
                step="0.01"
                value={item.defaultUnitPrice}
                onChange={(e) => updateItem(index, "defaultUnitPrice", e.target.value)}
                placeholder="Preis"
                required
              />
            </div>

            <div className="grid grid-cols-2 gap-2">
              <Input
                type="number"
                step="0.01"
                value={item.defaultVatRate}
                onChange={(e) => updateItem(index, "defaultVatRate", e.target.value)}
                placeholder="MwSt. %"
                required
              />
              <Input
                type="number"
                step="0.01"
                value={item.defaultDiscount}
                onChange={(e) => updateItem(index, "defaultDiscount", e.target.value)}
                placeholder="Rabatt %"
                required
              />
            </div>
          </div>
        ))}
      </div>

      {/* Terms */}
      <div>
        <Label htmlFor="terms">Standard-Vertragsbedingungen</Label>
        <Textarea
          id="terms"
          value={terms}
          onChange={(e) => setTerms(e.target.value)}
          placeholder="Optionale Standard-Bedingungen für Verträge aus dieser Vorlage"
          rows={4}
        />
      </div>

      {/* Actions */}
      <div className="flex justify-end gap-3">
        <Button type="button" onClick={onCancel} variant="outline">
          Abbrechen
        </Button>
        <Button
          type="submit"
          disabled={createMutation.isPending || updateMutation.isPending}
        >
          {templateId ? "Aktualisieren" : "Erstellen"}
        </Button>
      </div>
    </form>
  );
}
