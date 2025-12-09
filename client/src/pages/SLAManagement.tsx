import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Plus, Edit, Trash2, Clock, AlertTriangle, CheckCircle2 } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SLAManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [isEditOpen, setIsEditOpen] = useState(false);
  const [selectedPolicy, setSelectedPolicy] = useState<any>(null);
  const [filterPriority, setFilterPriority] = useState<string>("all");
  const [filterStatus, setFilterStatus] = useState<string>("all");

  const { data: allPolicies, refetch } = trpc.sla.list.useQuery();

  // Filter policies based on selected filters
  const policies = allPolicies?.filter((policy) => {
    const priorityMatch = filterPriority === "all" || policy.priority === filterPriority || (!policy.priority && filterPriority === "all");
    const statusMatch = filterStatus === "all" || (filterStatus === "active" && policy.isActive === 1) || (filterStatus === "inactive" && policy.isActive === 0);
    return priorityMatch && statusMatch;
  });

  const [formData, setFormData] = useState<{
    name: string;
    description: string;
    priority: "urgent" | "high" | "normal" | "low" | "all";
    responseTimeMinutes: number;
    resolutionTimeMinutes: number;
    warningThreshold: number;
    isActive: boolean;
  }>({
    name: "",
    description: "",
    priority: "all",
    responseTimeMinutes: 60,
    resolutionTimeMinutes: 480,
    warningThreshold: 80,
    isActive: true,
  });

  const createPolicy = trpc.sla.create.useMutation({
    onSuccess: () => {
      toast.success("SLA-Richtlinie erfolgreich erstellt");
      setIsCreateOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updatePolicy = trpc.sla.update.useMutation({
    onSuccess: () => {
      toast.success("SLA-Richtlinie erfolgreich aktualisiert");
      setIsEditOpen(false);
      refetch();
      resetForm();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deletePolicy = trpc.sla.delete.useMutation({
    onSuccess: () => {
      toast.success("SLA-Richtlinie erfolgreich gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      description: "",
      priority: "all",
      responseTimeMinutes: 60,
      resolutionTimeMinutes: 480,
      warningThreshold: 80,
      isActive: true,
    });
    setSelectedPolicy(null);
  };

  const handleCreate = () => {
    if (!formData.name) {
      toast.error("Bitte geben Sie einen Namen ein");
      return;
    }
    const submitData = {
      ...formData,
      priority: formData.priority === "all" ? null : formData.priority,
    };
    createPolicy.mutate(submitData as any);
  };

  const handleEdit = (policy: any) => {
    setSelectedPolicy(policy);
    setFormData({
      name: policy.name,
      description: policy.description || "",
      priority: policy.priority || "all",
      responseTimeMinutes: policy.responseTimeMinutes,
      resolutionTimeMinutes: policy.resolutionTimeMinutes,
      warningThreshold: policy.warningThreshold || 80,
      isActive: policy.isActive === 1,
    });
    setIsEditOpen(true);
  };

  const handleUpdate = () => {
    if (!selectedPolicy) return;
    const submitData = {
      id: selectedPolicy.id,
      ...formData,
      priority: formData.priority === "all" ? null : formData.priority,
    };
    updatePolicy.mutate(submitData as any);
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diese SLA-Richtlinie wirklich löschen?")) {
      deletePolicy.mutate({ id });
    }
  };

  const formatTime = (minutes: number) => {
    if (minutes < 60) return `${minutes} Min`;
    const hours = Math.floor(minutes / 60);
    const mins = minutes % 60;
    return mins > 0 ? `${hours}h ${mins}m` : `${hours}h`;
  };

  const getPriorityBadge = (priority: string | null) => {
    if (!priority || priority === "all") return <Badge variant="outline">Alle Prioritäten</Badge>;
    const colors: Record<string, string> = {
      urgent: "destructive",
      high: "default",
      normal: "secondary",
      low: "outline",
    };
    return <Badge variant={colors[priority] as any}>{priority.toUpperCase()}</Badge>;
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-3xl font-bold">SLA-Management</h1>
            <p className="text-muted-foreground">Service Level Agreements verwalten</p>
          </div>
          <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="h-4 w-4 mr-2" />
                Neue SLA-Richtlinie
              </Button>
            </DialogTrigger>
            <DialogContent className="max-w-2xl">
              <DialogHeader>
                <DialogTitle>Neue SLA-Richtlinie erstellen</DialogTitle>
                <DialogDescription>
                  Definieren Sie Reaktions- und Lösungszeiten für verschiedene Prioritätsstufen
                </DialogDescription>
              </DialogHeader>
              <div className="space-y-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Name *</label>
                  <Input
                    placeholder="z.B. Standard SLA"
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Beschreibung</label>
                  <Textarea
                    placeholder="Beschreibung der SLA-Richtlinie"
                    value={formData.description}
                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                    rows={3}
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Priorität</label>
                  <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
                    <SelectTrigger>
                      <SelectValue />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="all">Alle Prioritäten</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="normal">Normal</SelectItem>
                      <SelectItem value="low">Low</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">Reaktionszeit (Minuten) *</label>
                    <Input
                      type="number"
                      placeholder="60"
                      value={formData.responseTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, responseTimeMinutes: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Zeit bis zur ersten Antwort</p>
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">Lösungszeit (Minuten) *</label>
                    <Input
                      type="number"
                      placeholder="480"
                      value={formData.resolutionTimeMinutes}
                      onChange={(e) => setFormData({ ...formData, resolutionTimeMinutes: parseInt(e.target.value) || 0 })}
                    />
                    <p className="text-xs text-muted-foreground mt-1">Zeit bis zur Lösung</p>
                  </div>
                </div>
                <div className="flex justify-end gap-2 pt-4">
                  <Button variant="outline" onClick={() => { setIsCreateOpen(false); resetForm(); }}>
                    Abbrechen
                  </Button>
                  <Button onClick={handleCreate} disabled={createPolicy.isPending}>
                    {createPolicy.isPending ? "Wird erstellt..." : "Erstellen"}
                  </Button>
                </div>
              </div>
            </DialogContent>
          </Dialog>
        </div>

        {/* Filters */}
        <Card>
          <CardHeader>
            <CardTitle>Filter</CardTitle>
            <CardDescription>SLA-Richtlinien nach Priorität und Status filtern</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Priorität</label>
                <Select value={filterPriority} onValueChange={setFilterPriority}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Prioritäten</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Status</label>
                <Select value={filterStatus} onValueChange={setFilterStatus}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="inactive">Inaktiv</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Statistics Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Aktive Richtlinien</CardTitle>
              <CheckCircle2 className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{allPolicies?.filter(p => p.isActive).length || 0}</div>
              <p className="text-xs text-muted-foreground">von {allPolicies?.length || 0} gesamt</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchschn. Reaktionszeit</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allPolicies && allPolicies.length > 0
                  ? formatTime(Math.round(allPolicies.reduce((acc: any, p: any) => acc + p.responseTimeMinutes, 0) / allPolicies.length))
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">über alle Richtlinien</p>
            </CardContent>
          </Card>
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Durchschn. Lösungszeit</CardTitle>
              <AlertTriangle className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">
                {allPolicies && allPolicies.length > 0
                  ? formatTime(Math.round(allPolicies.reduce((acc: any, p: any) => acc + p.resolutionTimeMinutes, 0) / allPolicies.length))
                  : "N/A"}
              </div>
              <p className="text-xs text-muted-foreground">über alle Richtlinien</p>
            </CardContent>
          </Card>
        </div>

        {/* Policies Table */}
        <Card>
          <CardHeader>
            <CardTitle>SLA-Richtlinien</CardTitle>
            <CardDescription>Verwalten Sie Ihre Service Level Agreements</CardDescription>
          </CardHeader>
          <CardContent>
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Priorität</TableHead>
                  <TableHead>Reaktionszeit</TableHead>
                  <TableHead>Lösungszeit</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {policies && policies.length > 0 ? (
                  policies.map((policy) => (
                    <TableRow key={policy.id}>
                      <TableCell>
                        <div>
                          <div className="font-medium">{policy.name}</div>
                          {policy.description && (
                            <div className="text-sm text-muted-foreground">{policy.description}</div>
                          )}
                        </div>
                      </TableCell>
                      <TableCell>{getPriorityBadge(policy.priority)}</TableCell>
                      <TableCell>{formatTime(policy.responseTimeMinutes)}</TableCell>
                      <TableCell>{formatTime(policy.resolutionTimeMinutes)}</TableCell>
                      <TableCell>
                        <Badge variant={policy.isActive ? "default" : "secondary"}>
                          {policy.isActive ? "Aktiv" : "Inaktiv"}
                        </Badge>
                      </TableCell>
                      <TableCell className="text-right">
                        <div className="flex justify-end gap-2">
                          <Button variant="ghost" size="sm" onClick={() => handleEdit(policy)}>
                            <Edit className="h-4 w-4" />
                          </Button>
                          <Button variant="ghost" size="sm" onClick={() => handleDelete(policy.id)}>
                            <Trash2 className="h-4 w-4 text-destructive" />
                          </Button>
                        </div>
                      </TableCell>
                    </TableRow>
                  ))
                ) : (
                  <TableRow>
                    <TableCell colSpan={6} className="text-center text-muted-foreground">
                      Keine SLA-Richtlinien vorhanden. Erstellen Sie Ihre erste Richtlinie.
                    </TableCell>
                  </TableRow>
                )}
              </TableBody>
            </Table>
          </CardContent>
        </Card>

        {/* Edit Dialog */}
        <Dialog open={isEditOpen} onOpenChange={setIsEditOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>SLA-Richtlinie bearbeiten</DialogTitle>
              <DialogDescription>
                Aktualisieren Sie die Reaktions- und Lösungszeiten
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">Name *</label>
                <Input
                  placeholder="z.B. Standard SLA"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Beschreibung</label>
                <Textarea
                  placeholder="Beschreibung der SLA-Richtlinie"
                  value={formData.description}
                  onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                  rows={3}
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Priorität</label>
                <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v as any })}>
                  <SelectTrigger>
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Prioritäten</SelectItem>
                    <SelectItem value="urgent">Urgent</SelectItem>
                    <SelectItem value="high">High</SelectItem>
                    <SelectItem value="normal">Normal</SelectItem>
                    <SelectItem value="low">Low</SelectItem>
                  </SelectContent>
                </Select>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">Reaktionszeit (Minuten) *</label>
                  <Input
                    type="number"
                    placeholder="60"
                    value={formData.responseTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, responseTimeMinutes: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Zeit bis zur ersten Antwort</p>
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">Lösungszeit (Minuten) *</label>
                  <Input
                    type="number"
                    placeholder="480"
                    value={formData.resolutionTimeMinutes}
                    onChange={(e) => setFormData({ ...formData, resolutionTimeMinutes: parseInt(e.target.value) || 0 })}
                  />
                  <p className="text-xs text-muted-foreground mt-1">Zeit bis zur Lösung</p>
                </div>
              </div>
              <div className="flex justify-end gap-2 pt-4">
                <Button variant="outline" onClick={() => { setIsEditOpen(false); resetForm(); }}>
                  Abbrechen
                </Button>
                <Button onClick={handleUpdate} disabled={updatePolicy.isPending}>
                  {updatePolicy.isPending ? "Wird aktualisiert..." : "Aktualisieren"}
                </Button>
              </div>
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </DashboardLayout>
  );
}
