import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  FileCheck,
  Repeat,
  X,
  Calendar,
  DollarSign,
  FileText,
  User,
  Clock,
  Download,
  FileSignature,
  CheckCircle2,
} from "lucide-react";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { useState } from "react";

interface ContractDetailsProps {
  contractId: number;
  onClose: () => void;
  onUpdate: () => void;
}

export function ContractDetails({ contractId, onClose, onUpdate }: ContractDetailsProps) {
  const { data, isLoading } = trpc.contracts.getById.useQuery({ id: contractId });
  const { data: signatureStatus } = trpc.contractSignature.getSignatureStatus.useQuery({ contractId });
  const { data: attachments } = trpc.contractPdf.getAttachments.useQuery({ contractId });
  const [newStatus, setNewStatus] = useState<string>("");
  const [isGeneratingPdf, setIsGeneratingPdf] = useState(false);

  const updateStatus = trpc.contracts.updateStatus.useMutation({
    onSuccess: () => {
      toast.success("Status aktualisiert");
      onUpdate();
      onClose();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const convertToInvoice = trpc.contracts.convertToInvoice.useMutation({
    onSuccess: (result) => {
      toast.success(`Rechnung ${result.invoiceNumber} erstellt`);
      onUpdate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const convertToRecurring = trpc.contracts.convertToRecurringInvoice.useMutation({
    onSuccess: () => {
      toast.success("Wiederkehrende Rechnung erstellt");
      onUpdate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const generatePdf = trpc.contractPdf.generatePdf.useMutation({
    onSuccess: (result) => {
      toast.success("PDF erfolgreich generiert");
      window.open(result.url, "_blank");
      setIsGeneratingPdf(false);
      onUpdate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
      setIsGeneratingPdf(false);
    },
  });

  const signAsCustomer = trpc.contractSignature.signAsCustomer.useMutation({
    onSuccess: () => {
      toast.success("Vertrag als Kunde signiert");
      onUpdate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const signAsCompany = trpc.contractSignature.signAsCompany.useMutation({
    onSuccess: () => {
      toast.success("Vertrag als Firma signiert");
      onUpdate();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  if (isLoading || !data) {
    return <div className="py-8 text-center">Lade Vertragsdaten...</div>;
  }

  const { contract, items } = data;

  const getStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      draft: "bg-gray-500",
      active: "bg-green-500",
      expired: "bg-orange-500",
      cancelled: "bg-red-500",
      renewed: "bg-blue-500",
    };
    return colors[status] || "bg-gray-500";
  };

  const getStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      draft: "Entwurf",
      active: "Aktiv",
      expired: "Abgelaufen",
      cancelled: "Gekündigt",
      renewed: "Erneuert",
    };
    return labels[status] || status;
  };

  const formatCurrency = (amount: string | number) => {
    const num = typeof amount === "string" ? parseFloat(amount) : amount;
    return new Intl.NumberFormat("de-CH", {
      style: "currency",
      currency: "CHF",
    }).format(num);
  };

  const formatDate = (date: Date | string | null) => {
    if (!date) return "-";
    return new Date(date).toLocaleDateString("de-CH");
  };

  const handleStatusChange = () => {
    if (!newStatus) return;

    const updateData: any = {
      id: contractId,
      status: newStatus as any,
    };

    if (newStatus === "active") {
      updateData.signedDate = new Date().toISOString();
    } else if (newStatus === "cancelled") {
      updateData.cancelledDate = new Date().toISOString();
      const reason = prompt("Kündigungsgrund (optional):");
      if (reason) {
        updateData.cancellationReason = reason;
      }
    }

    updateStatus.mutate(updateData);
  };

  const handleConvertToInvoice = () => {
    if (confirm("Möchten Sie aus diesem Vertrag eine Rechnung erstellen?")) {
      convertToInvoice.mutate({ contractId });
    }
  };

  const handleConvertToRecurring = () => {
    if (confirm("Möchten Sie aus diesem Vertrag eine wiederkehrende Rechnung erstellen?")) {
      convertToRecurring.mutate({ contractId });
    }
  };

  const handleGeneratePdf = () => {
    setIsGeneratingPdf(true);
    generatePdf.mutate({ contractId });
  };

  const handleSignAsCustomer = () => {
    const signerName = prompt("Name des Unterzeichners (Kunde):");
    if (signerName) {
      signAsCustomer.mutate({ contractId, signerName });
    }
  };

  const handleSignAsCompany = () => {
    if (confirm("Möchten Sie diesen Vertrag als Firma signieren?")) {
      signAsCompany.mutate({ contractId });
    }
  };

  const getSignatureStatusLabel = (status: string) => {
    const labels: Record<string, string> = {
      unsigned: "Nicht signiert",
      customer_signed: "Kunde signiert",
      company_signed: "Firma signiert",
      fully_signed: "Vollständig signiert",
    };
    return labels[status] || status;
  };

  const getSignatureStatusColor = (status: string) => {
    const colors: Record<string, string> = {
      unsigned: "bg-gray-500",
      customer_signed: "bg-yellow-500",
      company_signed: "bg-yellow-500",
      fully_signed: "bg-green-500",
    };
    return colors[status] || "bg-gray-500";
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-start justify-between">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <h3 className="text-2xl font-bold">{contract.title}</h3>
            <Badge className={`${getStatusColor(contract.status)} text-white`}>
              {getStatusLabel(contract.status)}
            </Badge>
          </div>
          <p className="text-sm text-muted-foreground">
            Vertragsnummer: {contract.contractNumber}
          </p>
        </div>
      </div>

      {/* Description */}
      {contract.description && (
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm">{contract.description}</p>
        </div>
      )}

      {/* Key Info Grid */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4">
        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Laufzeit</span>
          </div>
          <p className="font-medium">
            {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
          </p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Abrechnungsintervall</span>
          </div>
          <p className="font-medium capitalize">{contract.billingInterval}</p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <DollarSign className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Gesamtwert</span>
          </div>
          <p className="font-medium text-yellow-500">
            {formatCurrency(contract.totalAmount)}
          </p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <FileText className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Vertragstyp</span>
          </div>
          <p className="font-medium capitalize">{contract.contractType}</p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Clock className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Zahlungsziel</span>
          </div>
          <p className="font-medium">{contract.paymentTermsDays} Tage</p>
        </div>

        <div className="p-4 bg-white/5 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <Calendar className="h-4 w-4 text-muted-foreground" />
            <span className="text-sm text-muted-foreground">Kündigungsfrist</span>
          </div>
          <p className="font-medium">{contract.renewalNoticeDays} Tage</p>
        </div>
      </div>

      {/* Auto-Renew */}
      {contract.autoRenew === 1 && (
        <div className="p-4 bg-blue-500/10 border border-blue-500/20 rounded-lg">
          <p className="text-sm font-medium text-blue-400">
            ✓ Automatische Verlängerung aktiviert
          </p>
        </div>
      )}

      {/* Signature Status */}
      {signatureStatus && (
        <div className="p-4 bg-white/5 rounded-lg space-y-3">
          <div className="flex items-center justify-between">
            <h4 className="font-semibold">Signatur-Status</h4>
            <Badge className={`${getSignatureStatusColor(signatureStatus.signatureStatus)} text-white`}>
              {getSignatureStatusLabel(signatureStatus.signatureStatus)}
            </Badge>
          </div>
          <div className="grid grid-cols-2 gap-4">
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <User className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Kunde</span>
              </div>
              {signatureStatus.customerSignedAt ? (
                <div>
                  <p className="font-medium text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Signiert
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {signatureStatus.customerSignedBy}
                  </p>
                  <p className="text-xs text-muted-foreground">
                    {formatDate(signatureStatus.customerSignedAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ausstehend</p>
              )}
            </div>
            <div className="p-3 bg-white/5 rounded-lg">
              <div className="flex items-center gap-2 mb-2">
                <FileSignature className="h-4 w-4 text-muted-foreground" />
                <span className="text-sm text-muted-foreground">Firma</span>
              </div>
              {signatureStatus.companySignedAt ? (
                <div>
                  <p className="font-medium text-green-400 flex items-center gap-1">
                    <CheckCircle2 className="h-4 w-4" /> Signiert
                  </p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {formatDate(signatureStatus.companySignedAt)}
                  </p>
                </div>
              ) : (
                <p className="text-sm text-muted-foreground">Ausstehend</p>
              )}
            </div>
          </div>
          {signatureStatus.signatureStatus !== "fully_signed" && (
            <div className="flex gap-2">
              {!signatureStatus.customerSignedAt && (
                <Button onClick={handleSignAsCustomer} variant="outline" size="sm">
                  <User className="h-4 w-4 mr-2" />
                  Als Kunde signieren
                </Button>
              )}
              {!signatureStatus.companySignedAt && (
                <Button onClick={handleSignAsCompany} variant="outline" size="sm">
                  <FileSignature className="h-4 w-4 mr-2" />
                  Als Firma signieren
                </Button>
              )}
            </div>
          )}
        </div>
      )}

      {/* PDF Export & Attachments */}
      <div className="p-4 bg-white/5 rounded-lg space-y-3">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold">Dokumente</h4>
          <Button 
            onClick={handleGeneratePdf} 
            disabled={isGeneratingPdf}
            size="sm"
          >
            <Download className="h-4 w-4 mr-2" />
            {isGeneratingPdf ? "Generiere PDF..." : "PDF exportieren"}
          </Button>
        </div>
        {attachments && attachments.length > 0 && (
          <div className="space-y-2">
            {attachments.map((att) => (
              <div key={att.id} className="flex items-center justify-between p-3 bg-white/5 rounded-lg">
                <div className="flex items-center gap-3">
                  <FileText className="h-4 w-4 text-muted-foreground" />
                  <div>
                    <p className="text-sm font-medium">{att.fileName}</p>
                    <p className="text-xs text-muted-foreground">
                      {(att.fileSize / 1024).toFixed(2)} KB • {formatDate(att.createdAt)}
                    </p>
                  </div>
                </div>
                <Button 
                  size="sm" 
                  variant="ghost"
                  onClick={() => window.open(att.fileUrl, "_blank")}
                >
                  <Download className="h-4 w-4" />
                </Button>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Items */}
      <div className="space-y-3">
        <h4 className="font-semibold">Positionen</h4>
        <div className="space-y-2">
          {items.map((item, index) => (
            <div key={item.id} className="p-4 bg-white/5 rounded-lg">
              <div className="flex justify-between items-start mb-2">
                <div className="flex-1">
                  <p className="font-medium">{item.description}</p>
                  <p className="text-sm text-muted-foreground mt-1">
                    {item.quantity} {item.unit} × {formatCurrency(item.unitPrice)}
                    {parseFloat(item.discount) > 0 && (
                      <span className="text-red-400 ml-2">
                        (-{item.discount}% Rabatt)
                      </span>
                    )}
                  </p>
                </div>
                <div className="text-right">
                  <p className="font-medium">{formatCurrency(item.total)}</p>
                  <p className="text-xs text-muted-foreground">
                    inkl. {item.vatRate}% MwSt.
                  </p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>

      {/* Totals */}
      <div className="p-4 bg-white/5 rounded-lg space-y-2">
        <div className="flex justify-between text-sm">
          <span>Zwischensumme:</span>
          <span className="font-medium">{formatCurrency(contract.subtotal)}</span>
        </div>
        {parseFloat(contract.discountAmount) > 0 && (
          <div className="flex justify-between text-sm">
            <span>Rabatt:</span>
            <span className="font-medium text-red-500">
              - {formatCurrency(contract.discountAmount)}
            </span>
          </div>
        )}
        <div className="flex justify-between text-sm">
          <span>MwSt.:</span>
          <span className="font-medium">{formatCurrency(contract.vatAmount)}</span>
        </div>
        <div className="flex justify-between text-lg font-bold border-t pt-2">
          <span>Gesamtbetrag:</span>
          <span className="text-yellow-500">{formatCurrency(contract.totalAmount)}</span>
        </div>
      </div>

      {/* Notes */}
      {contract.notes && (
        <div className="space-y-2">
          <h4 className="font-semibold">Interne Notizen</h4>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{contract.notes}</p>
          </div>
        </div>
      )}

      {/* Terms */}
      {contract.terms && (
        <div className="space-y-2">
          <h4 className="font-semibold">Vertragsbedingungen</h4>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{contract.terms}</p>
          </div>
        </div>
      )}

      {/* Status Change */}
      {contract.status === "draft" && (
        <div className="p-4 bg-white/5 rounded-lg space-y-3">
          <h4 className="font-semibold">Status ändern</h4>
          <div className="flex gap-3">
            <Select value={newStatus} onValueChange={setNewStatus}>
              <SelectTrigger className="flex-1">
                <SelectValue placeholder="Neuen Status wählen" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="cancelled">Gekündigt</SelectItem>
              </SelectContent>
            </Select>
            <Button onClick={handleStatusChange} disabled={!newStatus}>
              Status aktualisieren
            </Button>
          </div>
        </div>
      )}

      {/* Actions */}
      {contract.status === "active" && (
        <div className="flex gap-3">
          <Button onClick={handleConvertToInvoice} className="flex-1">
            <FileCheck className="h-4 w-4 mr-2" />
            In Rechnung umwandeln
          </Button>
          {contract.billingInterval !== "one_time" && !contract.recurringInvoiceId && (
            <Button onClick={handleConvertToRecurring} variant="outline" className="flex-1">
              <Repeat className="h-4 w-4 mr-2" />
              Wiederkehrende Rechnung
            </Button>
          )}
        </div>
      )}

      {contract.recurringInvoiceId && (
        <div className="p-4 bg-green-500/10 border border-green-500/20 rounded-lg">
          <p className="text-sm font-medium text-green-400">
            ✓ Wiederkehrende Rechnung ist aktiv (ID: {contract.recurringInvoiceId})
          </p>
        </div>
      )}

      {/* Close Button */}
      <div className="flex justify-end">
        <Button onClick={onClose} variant="outline">
          Schließen
        </Button>
      </div>
    </div>
  );
}
