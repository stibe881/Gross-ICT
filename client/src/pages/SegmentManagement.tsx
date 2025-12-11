import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import {
  Users,
  Plus,
  Edit,
  Trash2,
  Filter,
  ArrowLeft,
  Eye,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

interface SegmentCriteria {
  status?: ("active" | "unsubscribed" | "bounced")[];
  tags?: string[];
  subscribedAfter?: string;
  subscribedBefore?: string;
}

export default function SegmentManagement() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [selectedSegment, setSelectedSegment] = useState<any>(null);
  const [newSegment, setNewSegment] = useState({
    name: "",
    description: "",
    criteria: {
      status: [] as ("active" | "unsubscribed" | "bounced")[],
      subscribedAfter: "",
      subscribedBefore: "",
    } as SegmentCriteria,
  });

  // Fetch segments
  const {
    data: segmentsData,
    isLoading,
    refetch,
  } = trpc.newsletter.segments.list.useQuery({
    page: 1,
    pageSize: 50,
  });

  // Create segment mutation
  const createMutation = trpc.newsletter.segments.create.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Segment erstellt mit ${data.subscriberCount} Abonnenten`
      );
      setIsCreateDialogOpen(false);
      setNewSegment({
        name: "",
        description: "",
        criteria: { status: [], subscribedAfter: "", subscribedBefore: "" },
      });
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Delete segment mutation
  const deleteMutation = trpc.newsletter.segments.delete.useMutation({
    onSuccess: () => {
      toast.success("Segment gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newSegment.name) {
      toast.error("Name ist erforderlich");
      return;
    }

    createMutation.mutate({
      name: newSegment.name,
      description: newSegment.description || undefined,
      criteria: newSegment.criteria,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie dieses Segment wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const toggleStatus = (status: "active" | "unsubscribed" | "bounced") => {
    const currentStatuses = newSegment.criteria.status || [];
    if (currentStatuses.includes(status)) {
      setNewSegment({
        ...newSegment,
        criteria: {
          ...newSegment.criteria,
          status: currentStatuses.filter((s) => s !== status),
        },
      });
    } else {
      setNewSegment({
        ...newSegment,
        criteria: {
          ...newSegment.criteria,
          status: [...currentStatuses, status],
        },
      });
    }
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "active":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            Aktiv
          </Badge>
        );
      case "unsubscribed":
        return (
          <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20">
            Abgemeldet
          </Badge>
        );
      case "bounced":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            Bounced
          </Badge>
        );
      default:
        return null;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            onClick={() => setLocation("/newsletter")}
            variant="ghost"
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Newsletter
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-purple-500/10 rounded-lg">
                  <Filter className="w-6 h-6 text-purple-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Segment-Verwaltung
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Erstellen Sie Zielgruppen für gezielte Newsletter-Kampagnen
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-purple-600 hover:bg-purple-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neues Segment
            </Button>
          </div>
        </div>

        {/* Segments List */}
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Alle Segmente
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-purple-600"></div>
              </div>
            ) : !segmentsData || segmentsData.segments.length === 0 ? (
              <div className="text-center py-12">
                <Filter className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Noch keine Segmente erstellt</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Segment erstellen
                </Button>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <Table>
                  <TableHeader>
                    <TableRow>
                      <TableHead>Name</TableHead>
                      <TableHead>Beschreibung</TableHead>
                      <TableHead>Abonnenten</TableHead>
                      <TableHead>Kriterien</TableHead>
                      <TableHead>Erstellt am</TableHead>
                      <TableHead className="text-right">Aktionen</TableHead>
                    </TableRow>
                  </TableHeader>
                  <TableBody>
                    {segmentsData.segments.map((segment) => {
                      const criteria = JSON.parse(segment.criteria);
                      return (
                        <TableRow key={segment.id}>
                          <TableCell className="font-medium">
                            {segment.name}
                          </TableCell>
                          <TableCell className="text-gray-600 dark:text-gray-400">
                            {segment.description || "—"}
                          </TableCell>
                          <TableCell>
                            <Badge variant="outline">
                              <Users className="w-3 h-3 mr-1" />
                              {segment.subscriberCount}
                            </Badge>
                          </TableCell>
                          <TableCell>
                            <div className="flex flex-wrap gap-1">
                              {criteria.status &&
                                criteria.status.map((status: string) => (
                                  <span key={status}>
                                    {getStatusBadge(status)}
                                  </span>
                                ))}
                              {criteria.subscribedAfter && (
                                <Badge variant="outline" className="text-xs">
                                  Nach:{" "}
                                  {new Date(
                                    criteria.subscribedAfter
                                  ).toLocaleDateString("de-CH")}
                                </Badge>
                              )}
                              {criteria.subscribedBefore && (
                                <Badge variant="outline" className="text-xs">
                                  Vor:{" "}
                                  {new Date(
                                    criteria.subscribedBefore
                                  ).toLocaleDateString("de-CH")}
                                </Badge>
                              )}
                            </div>
                          </TableCell>
                          <TableCell>
                            {new Date(segment.createdAt).toLocaleDateString(
                              "de-CH"
                            )}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() =>
                                  setLocation(
                                    `/newsletter/segments/${segment.id}/subscribers`
                                  )
                                }
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleDelete(segment.id)}
                              >
                                <Trash2 className="w-4 h-4" />
                              </Button>
                            </div>
                          </TableCell>
                        </TableRow>
                      );
                    })}
                  </TableBody>
                </Table>
              </div>
            )}
          </div>
        </Card>

        {/* Create Segment Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-2xl">
            <DialogHeader>
              <DialogTitle>Neues Segment erstellen</DialogTitle>
              <DialogDescription>
                Definieren Sie Kriterien, um eine Zielgruppe zu erstellen
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Segment-Name *
                </label>
                <Input
                  placeholder="z.B. Aktive Abonnenten 2024"
                  value={newSegment.name}
                  onChange={(e) =>
                    setNewSegment({ ...newSegment, name: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Beschreibung
                </label>
                <Input
                  placeholder="Optionale Beschreibung"
                  value={newSegment.description}
                  onChange={(e) =>
                    setNewSegment({
                      ...newSegment,
                      description: e.target.value,
                    })
                  }
                />
              </div>

              <div className="border-t pt-4">
                <h3 className="text-sm font-medium mb-3 flex items-center gap-2">
                  <Filter className="w-4 h-4" />
                  Filter-Kriterien
                </h3>

                {/* Status Filter */}
                <div className="mb-4">
                  <label className="text-sm font-medium mb-2 block">
                    Status
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant={
                        newSegment.criteria.status?.includes("active")
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleStatus("active")}
                    >
                      Aktiv
                    </Button>
                    <Button
                      type="button"
                      variant={
                        newSegment.criteria.status?.includes("unsubscribed")
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleStatus("unsubscribed")}
                    >
                      Abgemeldet
                    </Button>
                    <Button
                      type="button"
                      variant={
                        newSegment.criteria.status?.includes("bounced")
                          ? "default"
                          : "outline"
                      }
                      size="sm"
                      onClick={() => toggleStatus("bounced")}
                    >
                      Bounced
                    </Button>
                  </div>
                </div>

                {/* Date Filters */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Abonniert nach
                    </label>
                    <Input
                      type="date"
                      value={newSegment.criteria.subscribedAfter || ""}
                      onChange={(e) =>
                        setNewSegment({
                          ...newSegment,
                          criteria: {
                            ...newSegment.criteria,
                            subscribedAfter: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                  <div>
                    <label className="text-sm font-medium mb-2 block">
                      Abonniert vor
                    </label>
                    <Input
                      type="date"
                      value={newSegment.criteria.subscribedBefore || ""}
                      onChange={(e) =>
                        setNewSegment({
                          ...newSegment,
                          criteria: {
                            ...newSegment.criteria,
                            subscribedBefore: e.target.value,
                          },
                        })
                      }
                    />
                  </div>
                </div>
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsCreateDialogOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleCreate}
                disabled={createMutation.isPending}
                className="bg-purple-600 hover:bg-purple-700"
              >
                {createMutation.isPending ? "Erstelle..." : "Segment erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
