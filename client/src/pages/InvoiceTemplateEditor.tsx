import { useState, useEffect } from "react";
import { LoadingSkeleton } from "@/components/LoadingSkeleton";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Label } from "@/components/ui/label";
import { toast } from "sonner";
import { Save, Upload, Eye, Palette, FileText } from "lucide-react";

export default function InvoiceTemplateEditor() {
  const { data: settings, isLoading, refetch } = trpc.accountingSettings.get.useQuery();
  
  const [formData, setFormData] = useState({
    primaryColor: "#D4AF37",
    logoUrl: "",
    invoicePrefix: "",
    quotePrefix: "OFF-",
    invoiceFooter: "",
    quoteFooter: "",
  });

  const [previewMode, setPreviewMode] = useState<"invoice" | "quote">("invoice");

  const updateSettings = trpc.accountingSettings.update.useMutation({
    onSuccess: () => {
      toast.success("Vorlageneinstellungen erfolgreich gespeichert");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  useEffect(() => {
    if (settings) {
      setFormData({
        primaryColor: settings.primaryColor || "#D4AF37",
        logoUrl: settings.logoUrl || "",
        invoicePrefix: settings.invoicePrefix || "",
        quotePrefix: settings.quotePrefix || "OFF-",
        invoiceFooter: settings.invoiceFooter || "",
        quoteFooter: settings.quoteFooter || "",
      });
    }
  }, [settings]);

  const handleSave = () => {
    if (!settings) return;
    updateSettings.mutate({
      companyName: settings.companyName,
      companyEmail: settings.companyEmail || '',
      ...formData,
    });
  };

  const handleLogoUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    // In production, upload to S3 using storagePut
    // For now, use a placeholder
    toast.info("Logo-Upload wird in Produktion über S3 implementiert");
    
    // Simulate upload
    const reader = new FileReader();
    reader.onload = (event) => {
      const dataUrl = event.target?.result as string;
      setFormData({ ...formData, logoUrl: dataUrl });
    };
    reader.readAsDataURL(file);
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-background p-8">
        <div className="container mx-auto">
          <LoadingSkeleton variant="form" rows={8} />
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-background">
      <div className="container mx-auto py-8">
        <div className="flex items-center justify-between mb-8">
          <div>
            <h1 className="text-3xl font-bold">Rechnungsvorlagen-Editor</h1>
            <p className="text-muted-foreground mt-1">
              Passen Sie das Design Ihrer Rechnungen und Offerten an
            </p>
          </div>
          <Button onClick={handleSave} disabled={updateSettings.isPending} className="gap-2">
            <Save className="w-4 h-4" />
            Speichern
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Editor Panel */}
          <div className="space-y-6">
            {/* Color Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Palette className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Farben</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="primaryColor">Primärfarbe</Label>
                  <div className="flex gap-3 mt-2">
                    <Input
                      id="primaryColor"
                      type="color"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      className="w-20 h-10 cursor-pointer"
                    />
                    <Input
                      type="text"
                      value={formData.primaryColor}
                      onChange={(e) => setFormData({ ...formData, primaryColor: e.target.value })}
                      placeholder="#D4AF37"
                      className="flex-1"
                    />
                  </div>
                  <p className="text-xs text-muted-foreground mt-1">
                    Wird für Akzente, Rahmen und Hervorhebungen verwendet
                  </p>
                </div>

                <div className="grid grid-cols-3 gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, primaryColor: "#D4AF37" })}
                    className="gap-2"
                  >
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "#D4AF37" }} />
                    Gold
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, primaryColor: "#2563eb" })}
                    className="gap-2"
                  >
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "#2563eb" }} />
                    Blau
                  </Button>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setFormData({ ...formData, primaryColor: "#16a34a" })}
                    className="gap-2"
                  >
                    <div className="w-4 h-4 rounded" style={{ backgroundColor: "#16a34a" }} />
                    Grün
                  </Button>
                </div>
              </div>
            </Card>

            {/* Logo Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <Upload className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Logo</h2>
              </div>
              
              <div className="space-y-4">
                <div>
                  <Label htmlFor="logoUpload">Logo hochladen</Label>
                  <Input
                    id="logoUpload"
                    type="file"
                    accept="image/*"
                    onChange={handleLogoUpload}
                    className="mt-2"
                  />
                  <p className="text-xs text-muted-foreground mt-1">
                    Empfohlen: PNG oder SVG, max. 500x200 Pixel
                  </p>
                </div>

                {formData.logoUrl && (
                  <div className="border rounded-lg p-4 bg-muted/50">
                    <p className="text-sm font-medium mb-2">Aktuelle Logo-Vorschau:</p>
                    <img
                      src={formData.logoUrl}
                      alt="Logo Preview"
                      className="max-h-24 object-contain"
                    />
                  </div>
                )}

                <div>
                  <Label htmlFor="logoUrl">Logo-URL (alternativ)</Label>
                  <Input
                    id="logoUrl"
                    type="url"
                    value={formData.logoUrl}
                    onChange={(e) => setFormData({ ...formData, logoUrl: e.target.value })}
                    placeholder="https://example.com/logo.png"
                    className="mt-2"
                  />
                </div>
              </div>
            </Card>

            {/* Document Settings */}
            <Card className="p-6">
              <div className="flex items-center gap-2 mb-4">
                <FileText className="w-5 h-5 text-primary" />
                <h2 className="text-xl font-semibold">Dokument-Einstellungen</h2>
              </div>
              
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="invoicePrefix">Rechnungs-Präfix</Label>
                    <Input
                      id="invoicePrefix"
                      value={formData.invoicePrefix}
                      onChange={(e) => setFormData({ ...formData, invoicePrefix: e.target.value })}
                      placeholder="RE-"
                      className="mt-2"
                    />
                  </div>
                  <div>
                    <Label htmlFor="quotePrefix">Offerten-Präfix</Label>
                    <Input
                      id="quotePrefix"
                      value={formData.quotePrefix}
                      onChange={(e) => setFormData({ ...formData, quotePrefix: e.target.value })}
                      placeholder="OFF-"
                      className="mt-2"
                    />
                  </div>
                </div>

                <div>
                  <Label htmlFor="invoiceFooter">Rechnungs-Fußzeile</Label>
                  <textarea
                    id="invoiceFooter"
                    value={formData.invoiceFooter}
                    onChange={(e) => setFormData({ ...formData, invoiceFooter: e.target.value })}
                    placeholder="Vielen Dank für Ihr Vertrauen..."
                    className="w-full mt-2 min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                  />
                </div>

                <div>
                  <Label htmlFor="quoteFooter">Offerten-Fußzeile</Label>
                  <textarea
                    id="quoteFooter"
                    value={formData.quoteFooter}
                    onChange={(e) => setFormData({ ...formData, quoteFooter: e.target.value })}
                    placeholder="Gerne stehen wir für Fragen zur Verfügung..."
                    className="w-full mt-2 min-h-[80px] px-3 py-2 rounded-md border border-input bg-background text-sm"
                  />
                </div>
              </div>
            </Card>
          </div>

          {/* Preview Panel */}
          <div className="space-y-6">
            <Card className="p-6">
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <Eye className="w-5 h-5 text-primary" />
                  <h2 className="text-xl font-semibold">Vorschau</h2>
                </div>
                <div className="flex gap-2">
                  <Button
                    variant={previewMode === "invoice" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("invoice")}
                  >
                    Rechnung
                  </Button>
                  <Button
                    variant={previewMode === "quote" ? "default" : "outline"}
                    size="sm"
                    onClick={() => setPreviewMode("quote")}
                  >
                    Offerte
                  </Button>
                </div>
              </div>

              {/* PDF Preview Mockup */}
              <div className="border rounded-lg p-8 bg-white text-black min-h-[600px]">
                {/* Header */}
                <div className="flex justify-between items-start mb-8">
                  <div>
                    {formData.logoUrl && (
                      <img
                        src={formData.logoUrl}
                        alt="Company Logo"
                        className="max-h-16 mb-4"
                      />
                    )}
                    <h3 className="text-lg font-bold">Gross ICT</h3>
                    <p className="text-sm text-gray-600">Musterstrasse 123</p>
                    <p className="text-sm text-gray-600">8000 Zürich</p>
                  </div>
                  <div className="text-right">
                    <h1 className="text-3xl font-bold" style={{ color: formData.primaryColor }}>
                      {previewMode === "invoice" ? "RECHNUNG" : "OFFERTE"}
                    </h1>
                    <p className="text-sm text-gray-600 mt-2">
                      Nr: {previewMode === "invoice" ? formData.invoicePrefix : formData.quotePrefix}2024-001
                    </p>
                    <p className="text-sm text-gray-600">Datum: {new Date().toLocaleDateString("de-CH")}</p>
                  </div>
                </div>

                {/* Customer Address */}
                <div className="mb-8">
                  <p className="font-semibold">Kunde:</p>
                  <p>Musterfirma AG</p>
                  <p className="text-sm text-gray-600">Beispielweg 456</p>
                  <p className="text-sm text-gray-600">8001 Zürich</p>
                </div>

                {/* Items Table */}
                <table className="w-full mb-8">
                  <thead>
                    <tr style={{ backgroundColor: `${formData.primaryColor}20`, borderLeft: `4px solid ${formData.primaryColor}` }}>
                      <th className="text-left p-2 text-sm">Beschreibung</th>
                      <th className="text-right p-2 text-sm">Menge</th>
                      <th className="text-right p-2 text-sm">Preis</th>
                      <th className="text-right p-2 text-sm">Total</th>
                    </tr>
                  </thead>
                  <tbody>
                    <tr className="border-b">
                      <td className="p-2 text-sm">IT-Support Paket</td>
                      <td className="text-right p-2 text-sm">1 Monat</td>
                      <td className="text-right p-2 text-sm">1'500.00</td>
                      <td className="text-right p-2 text-sm">1'500.00</td>
                    </tr>
                    <tr className="border-b">
                      <td className="p-2 text-sm">Server-Wartung</td>
                      <td className="text-right p-2 text-sm">2 Std.</td>
                      <td className="text-right p-2 text-sm">150.00</td>
                      <td className="text-right p-2 text-sm">300.00</td>
                    </tr>
                  </tbody>
                </table>

                {/* Totals */}
                <div className="flex justify-end mb-8">
                  <div className="w-64">
                    <div className="flex justify-between py-1 text-sm">
                      <span>Zwischensumme:</span>
                      <span>1'800.00 CHF</span>
                    </div>
                    <div className="flex justify-between py-1 text-sm">
                      <span>MwSt (8.1%):</span>
                      <span>145.80 CHF</span>
                    </div>
                    <div className="flex justify-between py-2 font-bold border-t-2" style={{ borderColor: formData.primaryColor }}>
                      <span>Gesamtbetrag:</span>
                      <span>1'945.80 CHF</span>
                    </div>
                  </div>
                </div>

                {/* Footer */}
                {(previewMode === "invoice" ? formData.invoiceFooter : formData.quoteFooter) && (
                  <div className="border-t pt-4 mt-8">
                    <p className="text-xs text-gray-600 whitespace-pre-wrap">
                      {previewMode === "invoice" ? formData.invoiceFooter : formData.quoteFooter}
                    </p>
                  </div>
                )}
              </div>
            </Card>
          </div>
        </div>
      </div>
    </div>
  );
}
