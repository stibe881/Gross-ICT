import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogDescription,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { toast } from "sonner";
import {
  Plus,
  Search,
  FileText,
  Eye,
  Edit,
  Trash2,
  FileCheck,
  Repeat,
  X,
  Calendar,
} from "lucide-react";
import { CreateContractForm } from "./CreateContractForm";
import { ContractDetails } from "./ContractDetails";

interface ContractManagementProps {
  customerId?: number;
}

export function ContractManagement({ customerId }: ContractManagementProps) {
  const [searchTerm, setSearchTerm] = useState("");
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [selectedContractId, setSelectedContractId] = useState<number | null>(null);
  const [detailsOpen, setDetailsOpen] = useState(false);

  const { data: contractsData, isLoading, refetch } = trpc.contracts.getAll.useQuery({
    customerId,
    status: statusFilter === "all" ? undefined : statusFilter as any,
    search: searchTerm || undefined,
  });

  const deleteContract = trpc.contracts.delete.useMutation({
    onSuccess: () => {
      toast.success("Vertrag gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const convertToInvoice = trpc.contracts.convertToInvoice.useMutation({
    onSuccess: (data) => {
      toast.success(`Rechnung ${data.invoiceNumber} erstellt`);
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const convertToRecurring = trpc.contracts.convertToRecurringInvoice.useMutation({
    onSuccess: () => {
      toast.success("Wiederkehrende Rechnung erstellt");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diesen Vertrag wirklich löschen?")) {
      deleteContract.mutate({ id });
    }
  };

  const handleConvertToInvoice = (contractId: number) => {
    if (confirm("Möchten Sie aus diesem Vertrag eine Rechnung erstellen?")) {
      convertToInvoice.mutate({ contractId });
    }
  };

  const handleConvertToRecurring = (contractId: number) => {
    if (confirm("Möchten Sie aus diesem Vertrag eine wiederkehrende Rechnung erstellen?")) {
      convertToRecurring.mutate({ contractId });
    }
  };

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
    const num = typeof amount === 'string' ? parseFloat(amount) : amount;
    return new Intl.NumberFormat('de-CH', {
      style: 'currency',
      currency: 'CHF',
    }).format(num);
  };

  const formatDate = (date: Date | string) => {
    return new Date(date).toLocaleDateString('de-CH');
  };

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Verträge</h2>
          <p className="text-muted-foreground">Verwalten Sie Kundenverträge und erstellen Sie Rechnungen</p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)}>
          <Plus className="h-4 w-4 mr-2" />
          Neuer Vertrag
        </Button>
      </div>

      {/* Filters */}
      <Card className="bg-white/5 border-white/10">
        <CardContent className="pt-6">
          <div className="flex gap-4">
            <div className="flex-1 relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-muted-foreground" />
              <Input
                placeholder="Verträge durchsuchen..."
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
                className="pl-10"
              />
            </div>
            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-[200px]">
                <SelectValue />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="draft">Entwurf</SelectItem>
                <SelectItem value="active">Aktiv</SelectItem>
                <SelectItem value="expired">Abgelaufen</SelectItem>
                <SelectItem value="cancelled">Gekündigt</SelectItem>
                <SelectItem value="renewed">Erneuert</SelectItem>
              </SelectContent>
            </Select>
          </div>
        </CardContent>
      </Card>

      {/* Contracts List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Verträge...</p>
        </div>
      ) : contractsData && contractsData.length > 0 ? (
        <div className="grid gap-4">
          {contractsData.map(({ contract, customer }) => (
            <Card key={contract.id} className="bg-white/5 border-white/10 hover:bg-white/10 transition-colors">
              <CardContent className="p-6">
                <div className="flex items-start justify-between">
                  <div className="flex-1">
                    <div className="flex items-center gap-3 mb-2">
                      <FileText className="h-5 w-5 text-yellow-500" />
                      <h3 className="text-lg font-semibold">{contract.title}</h3>
                      <Badge className={`${getStatusColor(contract.status)} text-white`}>
                        {getStatusLabel(contract.status)}
                      </Badge>
                    </div>
                    <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-4 text-sm">
                      <div>
                        <p className="text-muted-foreground">Vertragsnummer</p>
                        <p className="font-medium">{contract.contractNumber}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Kunde</p>
                        <p className="font-medium">{customer?.name || "Unbekannt"}</p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Laufzeit</p>
                        <p className="font-medium">
                          {formatDate(contract.startDate)} - {formatDate(contract.endDate)}
                        </p>
                      </div>
                      <div>
                        <p className="text-muted-foreground">Wert</p>
                        <p className="font-medium text-yellow-500">{formatCurrency(contract.totalAmount)}</p>
                      </div>
                    </div>
                    {contract.description && (
                      <p className="text-sm text-muted-foreground mt-3 line-clamp-2">
                        {contract.description}
                      </p>
                    )}
                  </div>
                  <div className="flex gap-2 ml-4">
                    <Button
                      variant="ghost"
                      size="sm"
                      onClick={() => {
                        setSelectedContractId(contract.id);
                        setDetailsOpen(true);
                      }}
                      title="Details anzeigen"
                    >
                      <Eye className="h-4 w-4" />
                    </Button>
                    {contract.status === "active" && (
                      <>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleConvertToInvoice(contract.id)}
                          title="In Rechnung umwandeln"
                        >
                          <FileCheck className="h-4 w-4" />
                        </Button>
                        {contract.billingInterval !== "one_time" && !contract.recurringInvoiceId && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleConvertToRecurring(contract.id)}
                            title="Wiederkehrende Rechnung erstellen"
                          >
                            <Repeat className="h-4 w-4" />
                          </Button>
                        )}
                      </>
                    )}
                    {contract.status === "draft" && (
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(contract.id)}
                        title="Löschen"
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    )}
                  </div>
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      ) : (
        <Card className="bg-white/5 border-white/10">
          <CardContent className="py-12 text-center">
            <FileText className="h-12 w-12 mx-auto mb-4 text-muted-foreground" />
            <p className="text-muted-foreground">Keine Verträge gefunden</p>
            <Button onClick={() => setCreateDialogOpen(true)} className="mt-4">
              <Plus className="h-4 w-4 mr-2" />
              Ersten Vertrag erstellen
            </Button>
          </CardContent>
        </Card>
      )}

      {/* Create Contract Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neuer Vertrag</DialogTitle>
            <DialogDescription>
              Erstellen Sie einen neuen Kundenvertrag
            </DialogDescription>
          </DialogHeader>
          <CreateContractForm
            customerId={customerId}
            onSuccess={() => {
              setCreateDialogOpen(false);
              refetch();
            }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Contract Details Dialog */}
      {selectedContractId && (
        <Dialog open={detailsOpen} onOpenChange={setDetailsOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vertragsdetails</DialogTitle>
            </DialogHeader>
            <ContractDetails
              contractId={selectedContractId}
              onClose={() => {
                setDetailsOpen(false);
                setSelectedContractId(null);
              }}
              onUpdate={() => refetch()}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}
