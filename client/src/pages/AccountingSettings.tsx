import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import { toast } from "sonner";
import { Save, Building2, FileText, Palette } from "lucide-react";

export default function AccountingSettings() {
  const { data: settings, isLoading, refetch } = trpc.accountingSettings.get.useQuery();
  
  const [formData, setFormData] = useState({
    companyName: "",
    companyAddress: "",
    companyCity: "",
    companyPostalCode: "",
    companyCountry: "Schweiz",
    companyPhone: "",
    companyEmail: "",
    companyWebsite: "",
    taxId: "",
    bankName: "",
    iban: "",
    invoicePrefix: "RE-",
    quotePrefix: "AN-",
    invoiceFooter: "",

  });

  // Update form data when settings are loaded
  useState(() => {
    if (settings) {
      setFormData({
        companyName: settings.companyName || "",
        companyAddress: settings.companyAddress || "",
        companyCity: settings.companyCity || "",
        companyPostalCode: settings.companyPostalCode || "",
        companyCountry: settings.companyCountry || "Schweiz",
        companyPhone: settings.companyPhone || "",
        companyEmail: settings.companyEmail || "",
        companyWebsite: settings.companyWebsite || "",
        taxId: settings.taxId || "",
        bankName: settings.bankName || "",
        iban: settings.iban || "",
        invoicePrefix: settings.invoicePrefix || "RE-",
        quotePrefix: settings.quotePrefix || "AN-",
        invoiceFooter: settings.invoiceFooter || "",
      });
    }
  });

  const saveMutation = trpc.accountingSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Einstellungen gespeichert");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!formData.companyName || !formData.companyEmail) {
      toast.error("Bitte füllen Sie mindestens Firmenname und E-Mail aus");
      return;
    }

    saveMutation.mutate(formData);
  };

  if (isLoading) {
    return <div className="p-6">Lade...</div>;
  }

  return (
    <div className="space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h2 className="text-2xl font-bold">Buchhaltungseinstellungen</h2>
          <p className="text-muted-foreground">Firmeninformationen und Rechnungsdesign verwalten</p>
        </div>
        <div className="flex gap-2">
          <Button variant="outline" onClick={() => window.location.href = '/invoice-template-editor'}>
            <Palette className="w-4 h-4 mr-2" />
            Vorlagen-Editor
          </Button>
          <Button onClick={handleSave} disabled={saveMutation.isPending}>
            <Save className="w-4 h-4 mr-2" />
            {saveMutation.isPending ? "Speichere..." : "Speichern"}
          </Button>
        </div>
      </div>

      {/* Company Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Building2 className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Firmeninformationen</h3>
            <p className="text-sm text-muted-foreground">Erscheint auf Rechnungen und Angeboten</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Firmenname *</Label>
            <Input
              value={formData.companyName}
              onChange={(e) => setFormData({ ...formData, companyName: e.target.value })}
              placeholder="Gross ICT"
            />
          </div>

          <div className="md:col-span-2">
            <Label>Adresse</Label>
            <Input
              value={formData.companyAddress}
              onChange={(e) => setFormData({ ...formData, companyAddress: e.target.value })}
              placeholder="Musterstrasse 123"
            />
          </div>

          <div>
            <Label>PLZ</Label>
            <Input
              value={formData.companyPostalCode}
              onChange={(e) => setFormData({ ...formData, companyPostalCode: e.target.value })}
              placeholder="8000"
            />
          </div>

          <div>
            <Label>Stadt</Label>
            <Input
              value={formData.companyCity}
              onChange={(e) => setFormData({ ...formData, companyCity: e.target.value })}
              placeholder="Zürich"
            />
          </div>

          <div>
            <Label>Land</Label>
            <Input
              value={formData.companyCountry}
              onChange={(e) => setFormData({ ...formData, companyCountry: e.target.value })}
              placeholder="Schweiz"
            />
          </div>

          <div>
            <Label>Telefon</Label>
            <Input
              value={formData.companyPhone}
              onChange={(e) => setFormData({ ...formData, companyPhone: e.target.value })}
              placeholder="+41 44 123 45 67"
            />
          </div>

          <div>
            <Label>E-Mail *</Label>
            <Input
              type="email"
              value={formData.companyEmail}
              onChange={(e) => setFormData({ ...formData, companyEmail: e.target.value })}
              placeholder="info@gross-ict.ch"
            />
          </div>

          <div>
            <Label>Website</Label>
            <Input
              value={formData.companyWebsite}
              onChange={(e) => setFormData({ ...formData, companyWebsite: e.target.value })}
              placeholder="www.gross-ict.ch"
            />
          </div>

          <div>
            <Label>UID/MwSt-Nummer</Label>
            <Input
              value={formData.taxId}
              onChange={(e) => setFormData({ ...formData, taxId: e.target.value })}
              placeholder="CHE-123.456.789"
            />
          </div>
        </div>
      </Card>

      {/* Bank Information */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <FileText className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Bankverbindung</h3>
            <p className="text-sm text-muted-foreground">Für Zahlungsinformationen auf Rechnungen</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Label>Bankname</Label>
            <Input
              value={formData.bankName}
              onChange={(e) => setFormData({ ...formData, bankName: e.target.value })}
              placeholder="UBS Switzerland AG"
            />
          </div>

          <div>
            <Label>IBAN</Label>
            <Input
              value={formData.iban}
              onChange={(e) => setFormData({ ...formData, iban: e.target.value })}
              placeholder="CH93 0076 2011 6238 5295 7"
            />
          </div>


        </div>
      </Card>

      {/* Invoice Design */}
      <Card className="p-6">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2 bg-primary/10 rounded-lg">
            <Palette className="w-5 h-5 text-primary" />
          </div>
          <div>
            <h3 className="text-lg font-semibold">Rechnungsdesign</h3>
            <p className="text-sm text-muted-foreground">Anpassen von Nummernkreisen und Texten</p>
          </div>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <Label>Rechnungsnummer-Präfix</Label>
            <Input
              value={formData.invoicePrefix}
              onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
              placeholder="RE-"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Beispiel: {formData.invoicePrefix}2025-0001
            </p>
          </div>

          <div>
            <Label>Angebotsnummer-Präfix</Label>
            <Input
              value={formData.quotePrefix}
              onChange={(e) => setFormData({ ...formData, quotePrefix: e.target.value })}
              placeholder="AN-"
            />
            <p className="text-xs text-muted-foreground mt-1">
              Beispiel: {formData.quotePrefix}2025-0001
            </p>
          </div>

          <div className="md:col-span-2">
            <Label>Rechnungsfusszeile</Label>
            <Textarea
              value={formData.invoiceFooter}
              onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
              placeholder="Zahlbar innerhalb von 30 Tagen ohne Abzug."
              rows={3}
            />
          </div>


        </div>
      </Card>

      <div className="flex justify-end">
        <Button onClick={handleSave} disabled={saveMutation.isPending} size="lg">
          <Save className="w-4 h-4 mr-2" />
          {saveMutation.isPending ? "Speichere..." : "Alle Einstellungen speichern"}
        </Button>
      </div>
    </div>
  );
}
