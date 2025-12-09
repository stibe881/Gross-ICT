import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, FileText, Edit, Trash2, Eye, ToggleLeft, ToggleRight } from "lucide-react";
import { CreateContractTemplateForm } from "./CreateContractTemplateForm";

export function ContractTemplateManagement() {
  const [searchTerm, setSearchTerm] = useState("");
  const [createDialogOpen, setCreateDialogOpen] = useState(false);
  const [editTemplateId, setEditTemplateId] = useState<number | null>(null);
  const [viewTemplateId, setViewTemplateId] = useState<number | null>(null);

  const { data: templates, isLoading, refetch } = trpc.contractTemplates.getAll.useQuery({
    search: searchTerm || undefined,
  });

  const toggleActive = trpc.contractTemplates.toggleActive.useMutation({
    onSuccess: () => {
      toast.success("Status aktualisiert");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteTemplate = trpc.contractTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Vorlage gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleToggleActive = (id: number, currentStatus: number) => {
    toggleActive.mutate({ id, isActive: currentStatus === 1 ? 0 : 1 });
  };

  const handleDelete = (id: number, name: string) => {
    if (confirm(`Möchten Sie die Vorlage "${name}" wirklich löschen?`)) {
      deleteTemplate.mutate({ id });
    }
  };

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service: "Service",
      license: "Lizenz",
      support: "Support",
      hosting: "Hosting",
      maintenance: "Wartung",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      monthly: "Monatlich",
      quarterly: "Quartalsweise",
      yearly: "Jährlich",
      one_time: "Einmalig",
    };
    return labels[interval] || interval;
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-2xl font-bold">Vertragsvorlagen</h2>
          <p className="text-muted-foreground mt-1">
            Erstellen Sie wiederverwendbare Vorlagen für häufige Vertragsarten
          </p>
        </div>
        <Button onClick={() => setCreateDialogOpen(true)} className="gap-2">
          <Plus className="w-4 h-4" />
          Neue Vorlage
        </Button>
      </div>

      {/* Search */}
      <Card className="p-4">
        <div className="relative">
          <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
          <Input
            placeholder="Suche nach Vorlagenname..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
            className="pl-10"
          />
        </div>
      </Card>

      {/* Templates List */}
      {isLoading ? (
        <div className="text-center py-12">
          <p className="text-muted-foreground">Lade Vorlagen...</p>
        </div>
      ) : !templates || templates.length === 0 ? (
        <Card className="p-12 text-center">
          <FileText className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
          <h3 className="text-lg font-semibold mb-2">Keine Vorlagen gefunden</h3>
          <p className="text-muted-foreground mb-4">
            Erstellen Sie Ihre erste Vertragsvorlage, um schneller Verträge zu erstellen.
          </p>
          <Button onClick={() => setCreateDialogOpen(true)}>
            <Plus className="w-4 h-4 mr-2" />
            Erste Vorlage erstellen
          </Button>
        </Card>
      ) : (
        <div className="grid gap-4">
          {templates.map((template) => (
            <Card key={template.id} className="p-6 hover:shadow-lg transition-shadow">
              <div className="flex items-start justify-between">
                <div className="flex-1">
                  <div className="flex items-center gap-3 mb-2">
                    <h3 className="text-lg font-semibold">{template.name}</h3>
                    <Badge variant={template.isActive === 1 ? "default" : "secondary"}>
                      {template.isActive === 1 ? "Aktiv" : "Inaktiv"}
                    </Badge>
                    <Badge variant="outline">{getTypeLabel(template.contractType)}</Badge>
                  </div>
                  {template.description && (
                    <p className="text-sm text-muted-foreground mb-3">{template.description}</p>
                  )}
                  <div className="flex flex-wrap gap-4 text-sm text-muted-foreground">
                    <span>📅 {getIntervalLabel(template.defaultBillingInterval)}</span>
                    <span>⏱️ {template.defaultDurationMonths} Monate</span>
                    <span>💰 {template.defaultPaymentTermsDays} Tage Zahlungsziel</span>
                    {template.defaultAutoRenew === 1 && <span>🔄 Auto-Verlängerung</span>}
                  </div>
                </div>

                <div className="flex gap-2">
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setViewTemplateId(template.id)}
                  >
                    <Eye className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => setEditTemplateId(template.id)}
                  >
                    <Edit className="w-4 h-4" />
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleToggleActive(template.id, template.isActive)}
                  >
                    {template.isActive === 1 ? (
                      <ToggleRight className="w-4 h-4 text-green-500" />
                    ) : (
                      <ToggleLeft className="w-4 h-4" />
                    )}
                  </Button>
                  <Button
                    variant="ghost"
                    size="sm"
                    onClick={() => handleDelete(template.id, template.name)}
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </Button>
                </div>
              </div>
            </Card>
          ))}
        </div>
      )}

      {/* Create Dialog */}
      <Dialog open={createDialogOpen} onOpenChange={setCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neue Vertragsvorlage</DialogTitle>
          </DialogHeader>
          <CreateContractTemplateForm
            onSuccess={() => {
              setCreateDialogOpen(false);
              refetch();
            }}
            onCancel={() => setCreateDialogOpen(false)}
          />
        </DialogContent>
      </Dialog>

      {/* Edit Dialog */}
      {editTemplateId && (
        <Dialog open={!!editTemplateId} onOpenChange={() => setEditTemplateId(null)}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vorlage bearbeiten</DialogTitle>
            </DialogHeader>
            <CreateContractTemplateForm
              templateId={editTemplateId}
              onSuccess={() => {
                setEditTemplateId(null);
                refetch();
              }}
              onCancel={() => setEditTemplateId(null)}
            />
          </DialogContent>
        </Dialog>
      )}

      {/* View Dialog */}
      {viewTemplateId && (
        <Dialog open={!!viewTemplateId} onOpenChange={() => setViewTemplateId(null)}>
          <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Vorlagendetails</DialogTitle>
            </DialogHeader>
            <TemplateDetails
              templateId={viewTemplateId}
              onClose={() => setViewTemplateId(null)}
            />
          </DialogContent>
        </Dialog>
      )}
    </div>
  );
}

function TemplateDetails({ templateId, onClose }: { templateId: number; onClose: () => void }) {
  const { data, isLoading } = trpc.contractTemplates.getById.useQuery({ id: templateId });

  if (isLoading || !data) {
    return <div className="py-8 text-center">Lade Vorlagendetails...</div>;
  }

  const { template, items } = data;

  const getTypeLabel = (type: string) => {
    const labels: Record<string, string> = {
      service: "Service",
      license: "Lizenz",
      support: "Support",
      hosting: "Hosting",
      maintenance: "Wartung",
      other: "Sonstiges",
    };
    return labels[type] || type;
  };

  const getIntervalLabel = (interval: string) => {
    const labels: Record<string, string> = {
      monthly: "Monatlich",
      quarterly: "Quartalsweise",
      yearly: "Jährlich",
      one_time: "Einmalig",
    };
    return labels[interval] || interval;
  };

  return (
    <div className="space-y-6">
      <div>
        <h3 className="text-xl font-bold mb-2">{template.name}</h3>
        {template.description && (
          <p className="text-muted-foreground">{template.description}</p>
        )}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Vertragstyp</p>
          <p className="font-medium">{getTypeLabel(template.contractType)}</p>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Abrechnungsintervall</p>
          <p className="font-medium">{getIntervalLabel(template.defaultBillingInterval)}</p>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Laufzeit</p>
          <p className="font-medium">{template.defaultDurationMonths} Monate</p>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Zahlungsziel</p>
          <p className="font-medium">{template.defaultPaymentTermsDays} Tage</p>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Auto-Verlängerung</p>
          <p className="font-medium">{template.defaultAutoRenew === 1 ? "Ja" : "Nein"}</p>
        </div>
        <div className="p-4 bg-white/5 rounded-lg">
          <p className="text-sm text-muted-foreground mb-1">Kündigungsfrist</p>
          <p className="font-medium">{template.defaultRenewalNoticeDays} Tage</p>
        </div>
      </div>

      <div>
        <h4 className="font-semibold mb-3">Standard-Positionen</h4>
        <div className="space-y-2">
          {items.map((item) => (
            <div key={item.id} className="p-4 bg-white/5 rounded-lg">
              <p className="font-medium mb-1">{item.description}</p>
              <p className="text-sm text-muted-foreground">
                {item.defaultQuantity} {item.defaultUnit} × CHF {item.defaultUnitPrice}
                {parseFloat(item.defaultDiscount) > 0 && (
                  <span className="text-red-400 ml-2">(-{item.defaultDiscount}%)</span>
                )}
              </p>
            </div>
          ))}
        </div>
      </div>

      {template.defaultTerms && (
        <div>
          <h4 className="font-semibold mb-3">Standard-Bedingungen</h4>
          <div className="p-4 bg-white/5 rounded-lg">
            <p className="text-sm whitespace-pre-wrap">{template.defaultTerms}</p>
          </div>
        </div>
      )}

      <div className="flex justify-end">
        <Button onClick={onClose} variant="outline">
          Schließen
        </Button>
      </div>
    </div>
  );
}
