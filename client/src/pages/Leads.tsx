import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Card } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from "@/components/ui/select";
import { Dialog, DialogContent, DialogHeader, DialogTitle } from "@/components/ui/dialog";
import { toast } from "sonner";
import { Plus, Search, UserPlus, Check, X, ArrowLeft } from "lucide-react";
import { useLocation } from "wouter";

export default function Leads() {
    const [, setLocation] = useLocation();
    const [searchTerm, setSearchTerm] = useState("");
    const [statusFilter, setStatusFilter] = useState<string>("all");
    const [priorityFilter, setPriorityFilter] = useState<string>("all");
    const [dialogOpen, setDialogOpen] = useState(false);
    const [selectedLeadId, setSelectedLeadId] = useState<number | null>(null);

    const { data: leads, isLoading, refetch } = trpc.leads.all.useQuery({
        search: searchTerm || undefined,
        status: statusFilter !== "all" ? (statusFilter as any) : undefined,
        priority: priorityFilter !== "all" ? (priorityFilter as any) : undefined,
    });

    const createLead = trpc.leads.create.useMutation({
        onSuccess: () => {
            toast.success("Lead erfolgreich erstellt");
            refetch();
            setDialogOpen(false);
        },
        onError: (error) => toast.error(`Fehler: ${error.message}`),
    });

    const convertToCustomer = trpc.leads.convertToCustomer.useMutation({
        onSuccess: () => {
            toast.success("Lead zu Kunde konvertiert");
            refetch();
        },
        onError: (error) => toast.error(`Fehler: ${error.message}`),
    });

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            new: "bg-blue-500",
            contacted: "bg-yellow-500",
            qualified: "bg-purple-500",
            proposal: "bg-orange-500",
            won: "bg-green-500",
            lost: "bg-gray-500",
        };
        return colors[status] || "bg-gray-500";
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            new: "Neu",
            contacted: "Kontaktiert",
            qualified: "Qualifiziert",
            proposal: "Angebot",
            won: "Gewonnen",
            lost: "Verloren",
        };
        return labels[status] || status;
    };

    return (
        <div className="min-h-screen bg-gradient-to-br from-background via-background to-muted/20 p-4">
            <div className="container mx-auto max-w-7xl">
                {/* Header */}
                <div className="flex items-center justify-between mb-6">
                    <div className="flex items-center gap-4">
                        <Button variant="ghost" onClick={() => setLocation("/admin")}>
                            <ArrowLeft className="h-4 w-4 mr-2" />
                            Zurück
                        </Button>
                        <div>
                            <h1 className="text-3xl font-bold">Kundenakquise</h1>
                            <p className="text-muted-foreground">Lead-Management und Pipeline</p>
                        </div>
                    </div>
                    <Button onClick={() => setDialogOpen(true)}>
                        <Plus className="h-4 w-4 mr-2" />
                        Neuer Lead
                    </Button>
                </div>

                {/* Filters */}
                <Card className="p-4 mb-6">
                    <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                        <div className="relative">
                            <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
                            <Input
                                placeholder="Suche nach Name, Email, Firma..."
                                value={searchTerm}
                                onChange={(e) => setSearchTerm(e.target.value)}
                                className="pl-10"
                            />
                        </div>
                        <Select value={statusFilter} onValueChange={setStatusFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Status" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Status</SelectItem>
                                <SelectItem value="new">Neu</SelectItem>
                                <SelectItem value="contacted">Kontaktiert</SelectItem>
                                <SelectItem value="qualified">Qualifiziert</SelectItem>
                                <SelectItem value="proposal">Angebot</SelectItem>
                                <SelectItem value="won">Gewonnen</SelectItem>
                                <SelectItem value="lost">Verloren</SelectItem>
                            </SelectContent>
                        </Select>
                        <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                            <SelectTrigger>
                                <SelectValue placeholder="Priorität" />
                            </SelectTrigger>
                            <SelectContent>
                                <SelectItem value="all">Alle Prioritäten</SelectItem>
                                <SelectItem value="A">A - Hoch</SelectItem>
                                <SelectItem value="B">B - Mittel</SelectItem>
                                <SelectItem value="C">C - Niedrig</SelectItem>
                            </SelectContent>
                        </Select>
                        <Button variant="outline" onClick={() => { setSearchTerm(""); setStatusFilter("all"); setPriorityFilter("all"); }}>
                            Zurücksetzen
                        </Button>
                    </div>
                </Card>

                {/* Leads List */}
                {isLoading ? (
                    <div className="text-center py-12">
                        <p className="text-muted-foreground">Laden...</p>
                    </div>
                ) : !leads || leads.length === 0 ? (
                    <Card className="p-12 text-center">
                        <UserPlus className="w-12 h-12 mx-auto mb-4 text-muted-foreground" />
                        <h3 className="text-lg font-semibold mb-2">Keine Leads gefunden</h3>
                        <p className="text-muted-foreground mb-4">Erstellen Sie Ihren ersten Lead</p>
                        <Button onClick={() => setDialogOpen(true)}>
                            <Plus className="w-4 h-4 mr-2" />
                            Ersten Lead erstellen
                        </Button>
                    </Card>
                ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                        {leads.map((lead: any) => (
                            <Card key={lead.id} className="p-6 hover:shadow-lg transition-shadow cursor-pointer" onClick={() => setLocation(`/leads/${lead.id}`)}>
                                <div className="flex justify-between items-start mb-4">
                                    <div>
                                        <h3 className="font-semibold text-lg">{lead.firstName} {lead.lastName}</h3>
                                        {lead.company && <p className="text-sm text-muted-foreground">{lead.company}</p>}
                                    </div>
                                    <span className={`px-2 py-1 rounded-full text-xs text-white ${getStatusColor(lead.status)}`}>
                                        {getStatusLabel(lead.status)}
                                    </span>
                                </div>
                                <div className="space-y-1 text-sm">
                                    <p><strong>Email:</strong> {lead.email}</p>
                                    {lead.phone && <p><strong>Tel:</strong> {lead.phone}</p>}
                                    <p><strong>Priorität:</strong> {lead.priority}</p>
                                    {lead.estimatedValue && <p><strong>Wert:</strong> CHF {parseFloat(lead.estimatedValue).toFixed(2)}</p>}
                                </div>
                                {lead.status === "proposal" && !lead.convertedToCustomerId && (
                                    <Button
                                        size="sm"
                                        className="w-full mt-4"


                                        onClick={(e) => {
                                            e.stopPropagation();
                                            if (confirm("Lead zu Kunde konvertieren?")) {
                                                convertToCustomer.mutate({ leadId: lead.id });
                                            }
                                        }}
                                    >
                                        <Check className="w-4 h-4 mr-2" />
                                        Zu Kunde konvertieren
                                    </Button>
                                )}
                            </Card>
                        ))}
                    </div>
                )}

                {/* Create Lead Dialog */}
                <CreateLeadDialog open={dialogOpen} onOpenChange={setDialogOpen} onSuccess={refetch} />
            </div>
        </div >
    );
}

function CreateLeadDialog({ open, onOpenChange, onSuccess }: any) {
    const [formData, setFormData] = useState({
        firstName: "",
        lastName: "",
        email: "",
        phone: "",
        mobile: "",
        website: "",
        company: "",
        street: "",
        zipCode: "",
        city: "",
        position: "",
        status: "new",
        priority: "B",
        source: "other",
        estimatedValue: "",
        notes: "",
    });

    const createLead = trpc.leads.create.useMutation({
        onSuccess: () => {
            toast.success("Lead erfolgreich erstellt");
            onSuccess();
            onOpenChange(false);
            setFormData({
                firstName: "",
                lastName: "",
                email: "",
                phone: "",
                mobile: "",
                website: "",
                company: "",
                street: "",
                zipCode: "",
                city: "",
                position: "",
                status: "new",
                priority: "B",
                source: "other",
                estimatedValue: "",
                notes: "",
            });
        },
        onError: (error) => toast.error(`Fehler: ${error.message}`),
    });

    const handleSubmit = () => {
        // No required fields - all are optional
        createLead.mutate(formData as any);
    };

    return (
        <Dialog open={open} onOpenChange={onOpenChange}>
            <DialogContent className="max-w-2xl max-h-[90vh] overflow-y-auto">
                <DialogHeader>
                    <DialogTitle>Neuen Lead erstellen</DialogTitle>
                </DialogHeader>
                <div className="space-y-4 mt-4">
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Vorname</label>
                            <Input value={formData.firstName} onChange={(e) => setFormData({ ...formData, firstName: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Nachname</label>
                            <Input value={formData.lastName} onChange={(e) => setFormData({ ...formData, lastName: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Email</label>
                            <Input type="email" value={formData.email} onChange={(e) => setFormData({ ...formData, email: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Telefon</label>
                            <Input value={formData.phone} onChange={(e) => setFormData({ ...formData, phone: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Handy</label>
                            <Input value={formData.mobile} onChange={(e) => setFormData({ ...formData, mobile: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Webseite</label>
                        <Input type="url" placeholder="https://..." value={formData.website} onChange={(e) => setFormData({ ...formData, website: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Firma</label>
                            <Input value={formData.company} onChange={(e) => setFormData({ ...formData, company: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Strasse</label>
                            <Input value={formData.street} onChange={(e) => setFormData({ ...formData, street: e.target.value })} />
                        </div>
                    </div>
                    <div className="grid grid-cols-2 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">PLZ</label>
                            <Input value={formData.zipCode} onChange={(e) => setFormData({ ...formData, zipCode: e.target.value })} />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Ort</label>
                            <Input value={formData.city} onChange={(e) => setFormData({ ...formData, city: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Position</label>
                        <Input value={formData.position} onChange={(e) => setFormData({ ...formData, position: e.target.value })} />
                    </div>
                    <div className="grid grid-cols-3 gap-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Status</label>
                            <Select value={formData.status} onValueChange={(v) => setFormData({ ...formData, status: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="new">Neu</SelectItem>
                                    <SelectItem value="contacted">Kontaktiert</SelectItem>
                                    <SelectItem value="qualified">Qualifiziert</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Priorität</label>
                            <Select value={formData.priority} onValueChange={(v) => setFormData({ ...formData, priority: v })}>
                                <SelectTrigger><SelectValue /></SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="A">A - Hoch</SelectItem>
                                    <SelectItem value="B">B - Mittel</SelectItem>
                                    <SelectItem value="C">C - Niedrig</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Wert (CHF)</label>
                            <Input type="number" value={formData.estimatedValue} onChange={(e) => setFormData({ ...formData, estimatedValue: e.target.value })} />
                        </div>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Quelle</label>
                        <Select value={formData.source} onValueChange={(v) => setFormData({ ...formData, source: v })}>
                            <SelectTrigger><SelectValue /></SelectTrigger>
                            <SelectContent>
                                <SelectItem value="website">Website</SelectItem>
                                <SelectItem value="referal">Empfehlung</SelectItem>
                                <SelectItem value="cold_call">Kaltakquise</SelectItem>
                                <SelectItem value="email">E-Mail</SelectItem>
                                <SelectItem value="social_media">Social Media</SelectItem>
                                <SelectItem value="trade_show">Messe</SelectItem>
                                <SelectItem value="other">Sonstiges</SelectItem>
                            </SelectContent>
                        </Select>
                    </div>
                    <div>
                        <label className="text-sm font-medium mb-2 block">Notizen</label>
                        <textarea
                            className="w-full min-h-[80px] px-3 py-2 rounded-md border border-input bg-background"
                            value={formData.notes}
                            onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                        />
                    </div>
                    <div className="flex justify-end gap-2">
                        <Button variant="outline" onClick={() => onOpenChange(false)}>Abbrechen</Button>
                        <Button onClick={handleSubmit} disabled={createLead.isPending}>
                            {createLead.isPending ? "Erstelle..." : "Lead erstellen"}
                        </Button>
                    </div>
                </div>
            </DialogContent>
        </Dialog >
    );
}
