import { useParams, useLocation } from 'wouter';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Tabs, TabsContent, TabsList, TabsTrigger } from '@/components/ui/tabs';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import {
    ArrowLeft,
    Mail,
    Phone,
    MessageSquare,
    Calendar,
    FileText,
    RefreshCw,
    UserPlus,
    Edit,
    Plus,
    Trash
} from 'lucide-react';
import { useState, useEffect } from 'react';
import { formatDistanceToNow } from 'date-fns';
import { de } from 'date-fns/locale';

export default function LeadDetail() {
    const { id } = useParams<{ id: string }>();
    const [, setLocation] = useLocation();
    const [showAddActivity, setShowAddActivity] = useState(false);
    const [showEditLead, setShowEditLead] = useState(false);
    const [activityForm, setActivityForm] = useState({
        activityType: 'note' as const,
        description: '',
    });

    const [editForm, setEditForm] = useState({
        firstName: '',
        lastName: '',
        email: '',
        phone: '',
        website: '',
        company: '',
        city: '',
        position: '',
        status: 'new',
        priority: 'B',
        source: 'other',
        estimatedValue: '',
        notes: '',
    });

    // Load lead data with activities
    const { data: lead, isLoading, refetch } = trpc.leads.byId.useQuery(
        { id: parseInt(id!) },
        { enabled: !!id }
    );

    // Populate edit form when dialog opens
    useEffect(() => {
        if (lead && showEditLead) {
            setEditForm({
                firstName: lead.firstName || '',
                lastName: lead.lastName || '',
                email: lead.email || '',
                phone: lead.phone || '',
                website: lead.website || '',
                company: lead.company || '',
                city: lead.city || '',
                position: lead.position || '',
                status: lead.status,
                priority: lead.priority,
                source: lead.source,
                estimatedValue: lead.estimatedValue?.toString() || '',
                notes: lead.notes || '',
            });
        }
    }, [lead, showEditLead]);

    // Update lead mutation
    const updateLead = trpc.leads.update.useMutation({
        onSuccess: () => {
            toast.success('Lead erfolgreich aktualisiert');
            setShowEditLead(false);
            refetch();
        },
        onError: (error) => toast.error(`Fehler: ${error.message}`),
    });

    // Add activity mutation
    const addActivity = trpc.leads.addActivity.useMutation({
        onSuccess: () => {
            toast.success('Aktivität hinzugefügt');
            setShowAddActivity(false);
            setActivityForm({ activityType: 'note', description: '' });
            refetch();
        },
        onError: (error) => toast.error(`Fehler: ${error.message}`),
    });

    // Convert to customer mutation
    const convertToCustomer = trpc.leads.convertToCustomer.useMutation({
        onSuccess: () => {
            toast.success('Lead erfolgreich in Kunde konvertiert');
            setLocation('/crm');
        },
        onError: (error) => toast.error(`Fehler: ${error.message}`),
    });

    // Delete lead mutation
    const deleteLead = trpc.leads.delete.useMutation({
        onSuccess: () => {
            toast.success('Lead erfolgreich gelöscht');
            setLocation('/leads');
        },
        onError: (error) => toast.error(`Fehler: ${error.message}`),
    });

    if (isLoading) {
        return (
            <div className="container mx-auto p-6">
                <div className="animate-pulse space-y-4">
                    <div className="h-8 bg-gray-200 rounded w-1/4"></div>
                    <div className="h-64 bg-gray-200 rounded"></div>
                </div>
            </div>
        );
    }

    if (!lead) {
        return (
            <div className="container mx-auto p-6">
                <p>Lead nicht gefunden</p>
                <Button onClick={() => setLocation('/leads')} className="mt-4">
                    Zurück zur Liste
                </Button>
            </div>
        );
    }

    const getStatusColor = (status: string) => {
        const colors: Record<string, string> = {
            new: 'bg-blue-500',
            contacted: 'bg-yellow-500',
            qualified: 'bg-green-500',
            proposal: 'bg-purple-500',
            won: 'bg-emerald-500',
            lost: 'bg-red-500',
        };
        return colors[status] || 'bg-gray-500';
    };

    const getStatusLabel = (status: string) => {
        const labels: Record<string, string> = {
            new: 'Neu',
            contacted: 'Kontaktiert',
            qualified: 'Qualifiziert',
            proposal: 'Angebot erstellt',
            won: 'Gewonnen',
            lost: 'Verloren',
        };
        return labels[status] || status;
    };

    const getActivityIcon = (type: string) => {
        const icons: Record<string, any> = {
            email: Mail,
            email_sent: Mail,
            call: Phone,
            called: Phone,
            contacted: MessageSquare,
            meeting: Calendar,
            note: FileText,
            status_change: RefreshCw,
        };
        return icons[type] || FileText;
    };

    const handleAddActivity = () => {
        if (!activityForm.description.trim()) {
            toast.error('Bitte geben Sie eine Beschreibung ein');
            return;
        }
        addActivity.mutate({
            leadId: lead.id,
            activityType: activityForm.activityType,
            description: activityForm.description,
        });
    };

    const handleConvert = () => {
        if (window.confirm('Möchten Sie diesen Lead wirklich in einen Kunden konvertieren?')) {
            convertToCustomer.mutate({ leadId: lead.id });
        }
    };

    const handleDelete = () => {
        if (window.confirm('Möchten Sie diesen Lead wirklich löschen? Diese Aktion kann nicht rückgängig gemacht werden.')) {
            deleteLead.mutate({ id: lead.id });
        }
    };

    return (
        <div className="container mx-auto p-6">
            {/* Header */}
            <div className="mb-6 flex items-center justify-between">
                <div className="flex items-center gap-4">
                    <Button variant="ghost" onClick={() => setLocation('/leads')}>
                        <ArrowLeft className="h-4 w-4 mr-2" />
                        Zurück
                    </Button>
                    <div>
                        <h1 className="text-3xl font-bold">
                            {lead.firstName} {lead.lastName}
                            {lead.company && ` - ${lead.company}`}
                        </h1>
                        <div className="flex items-center gap-2 mt-2">
                            <Badge className={getStatusColor(lead.status)}>
                                {getStatusLabel(lead.status)}
                            </Badge>
                            <Badge variant="outline">Priorität {lead.priority}</Badge>
                        </div>
                    </div>
                </div>
                <div className="flex gap-2">
                    <Button variant="outline" onClick={() => setShowEditLead(true)}>
                        <Edit className="h-4 w-4 mr-2" />
                        Bearbeiten
                    </Button>
                    <Button variant="outline" onClick={handleDelete} className="text-red-600 hover:text-red-700">
                        <Trash className="h-4 w-4 mr-2" />
                        Löschen
                    </Button>
                    {lead.status === 'qualified' && !lead.convertedToCustomerId && (
                        <Button onClick={handleConvert}>
                            <UserPlus className="h-4 w-4 mr-2" />
                            In Kunde umwandeln
                        </Button>
                    )}
                </div>
            </div>

            {/* Tabs */}
            <Tabs defaultValue="timeline" className="space-y-4">
                <TabsList>
                    <TabsTrigger value="overview">Überblick</TabsTrigger>
                    <TabsTrigger value="timeline">Timeline</TabsTrigger>
                    <TabsTrigger value="details">Details</TabsTrigger>
                </TabsList>

                {/* Overview Tab */}
                <TabsContent value="overview">
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                        <Card>
                            <CardHeader>
                                <CardTitle>Kontaktinformationen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">E-Mail</p>
                                    <p>{lead.email || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Telefon</p>
                                    <p>{lead.phone || '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Position</p>
                                    <p>{lead.position || '-'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        <Card>
                            <CardHeader>
                                <CardTitle>Lead-Informationen</CardTitle>
                            </CardHeader>
                            <CardContent className="space-y-2">
                                <div>
                                    <p className="text-sm text-muted-foreground">Quelle</p>
                                    <p>{lead.source}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Geschätzter Wert</p>
                                    <p>{lead.estimatedValue ? `CHF ${lead.estimatedValue}` : '-'}</p>
                                </div>
                                <div>
                                    <p className="text-sm text-muted-foreground">Zugewiesen an</p>
                                    <p>{lead.assignedUser?.name || 'Nicht zugewiesen'}</p>
                                </div>
                            </CardContent>
                        </Card>

                        {lead.notes && (
                            <Card className="md:col-span-2">
                                <CardHeader>
                                    <CardTitle>Notizen</CardTitle>
                                </CardHeader>
                                <CardContent>
                                    <p className="whitespace-pre-wrap">{lead.notes}</p>
                                </CardContent>
                            </Card>
                        )}
                    </div>
                </TabsContent>

                {/* Timeline Tab */}
                <TabsContent value="timeline">
                    <Card>
                        <CardHeader>
                            <div className="flex items-center justify-between">
                                <CardTitle>Aktivitätsverlauf</CardTitle>
                                <Button onClick={() => setShowAddActivity(true)}>
                                    <Plus className="h-4 w-4 mr-2" />
                                    Neue Aktivität
                                </Button>
                            </div>
                            <CardDescription>
                                Chronologischer Verlauf aller Interaktionen
                            </CardDescription>
                        </CardHeader>
                        <CardContent>
                            {lead.activities && lead.activities.length > 0 ? (
                                <div className="space-y-4">
                                    {lead.activities.map((activity: any) => {
                                        const Icon = getActivityIcon(activity.activityType);
                                        return (
                                            <div key={activity.id} className="flex gap-4 border-l-2 border-gray-200 pl-4 pb-4">
                                                <div className="flex-shrink-0">
                                                    <div className="h-10 w-10 rounded-full bg-primary/10 flex items-center justify-center">
                                                        <Icon className="h-5 w-5 text-primary" />
                                                    </div>
                                                </div>
                                                <div className="flex-1">
                                                    <div className="flex items-center justify-between">
                                                        <p className="font-medium">{activity.description}</p>
                                                        <p className="text-sm text-muted-foreground">
                                                            {formatDistanceToNow(new Date(activity.createdAt), {
                                                                addSuffix: true,
                                                                locale: de,
                                                            })}
                                                        </p>
                                                    </div>
                                                    <p className="text-sm text-muted-foreground mt-1">
                                                        {activity.user?.name || 'System'}
                                                    </p>
                                                </div>
                                            </div>
                                        );
                                    })}
                                </div>
                            ) : (
                                <p className="text-center text-muted-foreground py-8">
                                    Noch keine Aktivitäten vorhanden
                                </p>
                            )}
                        </CardContent>
                    </Card>
                </TabsContent>

                {/* Details Tab */}
                <TabsContent value="details">
                    <Card>
                        <CardHeader>
                            <CardTitle>Alle Details</CardTitle>
                        </CardHeader>
                        <CardContent className="space-y-4">
                            <div className="grid grid-cols-2 gap-4">
                                <div>
                                    <p className="text-sm font-medium mb-1">ID</p>
                                    <p>{lead.id}</p>
                                </div>
                                <div>
                                    <p className="text-sm font-medium mb-1">Erstellt am</p>
                                    <p>{new Date(lead.createdAt).toLocaleDateString('de-DE')}</p>
                                </div>
                                {lead.convertedAt && (
                                    <div>
                                        <p className="text-sm font-medium mb-1">Konvertiert am</p>
                                        <p>{new Date(lead.convertedAt).toLocaleDateString('de-DE')}</p>
                                    </div>
                                )}
                            </div>
                        </CardContent>
                    </Card>
                </TabsContent>
            </Tabs>

            {/* Add Activity Dialog */}
            <Dialog open={showAddActivity} onOpenChange={setShowAddActivity}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Neue Aktivität hinzufügen</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div>
                            <label className="text-sm font-medium mb-2 block">Aktivitätstyp</label>
                            <Select
                                value={activityForm.activityType}
                                onValueChange={(v: any) => setActivityForm({ ...activityForm, activityType: v })}
                            >
                                <SelectTrigger>
                                    <SelectValue />
                                </SelectTrigger>
                                <SelectContent>
                                    <SelectItem value="email_sent">E-Mail gesendet</SelectItem>
                                    <SelectItem value="called">Anruf getätigt</SelectItem>
                                    <SelectItem value="contacted">Antwort erhalten</SelectItem>
                                    <SelectItem value="meeting">Meeting durchgeführt</SelectItem>
                                    <SelectItem value="note">Notiz</SelectItem>
                                </SelectContent>
                            </Select>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Beschreibung</label>
                            <Textarea
                                value={activityForm.description}
                                onChange={(e) => setActivityForm({ ...activityForm, description: e.target.value })}
                                rows={6}
                                placeholder="Details zur Aktivität..."
                                className="resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-4">
                            <Button variant="outline" onClick={() => setShowAddActivity(false)}>
                                Abbrechen
                            </Button>
                            <Button onClick={handleAddActivity}>Hinzufügen</Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>

            {/* Edit Lead Dialog */}
            <Dialog open={showEditLead} onOpenChange={setShowEditLead}>
                <DialogContent className="max-w-2xl max-h-[80vh] overflow-y-auto">
                    <DialogHeader>
                        <DialogTitle>Lead bearbeiten</DialogTitle>
                    </DialogHeader>
                    <div className="space-y-4 mt-4">
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Vorname</label>
                                <Input value={editForm.firstName} onChange={(e) => setEditForm({ ...editForm, firstName: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Nachname</label>
                                <Input value={editForm.lastName} onChange={(e) => setEditForm({ ...editForm, lastName: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Email</label>
                                <Input type="email" value={editForm.email} onChange={(e) => setEditForm({ ...editForm, email: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Telefon</label>
                                <Input value={editForm.phone} onChange={(e) => setEditForm({ ...editForm, phone: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-2 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Firma</label>
                                <Input value={editForm.company} onChange={(e) => setEditForm({ ...editForm, company: e.target.value })} />
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Position</label>
                                <Input value={editForm.position} onChange={(e) => setEditForm({ ...editForm, position: e.target.value })} />
                            </div>
                        </div>
                        <div className="grid grid-cols-3 gap-4">
                            <div>
                                <label className="text-sm font-medium mb-2 block">Status</label>
                                <Select value={editForm.status} onValueChange={(v) => setEditForm({ ...editForm, status: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="new">Neu</SelectItem>
                                        <SelectItem value="contacted">Kontaktiert</SelectItem>
                                        <SelectItem value="qualified">Qualifiziert</SelectItem>
                                        <SelectItem value="proposal">Angebot erstellt</SelectItem>
                                        <SelectItem value="won">Gewonnen</SelectItem>
                                        <SelectItem value="lost">Verloren</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Priorität</label>
                                <Select value={editForm.priority} onValueChange={(v) => setEditForm({ ...editForm, priority: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="A">A (Hoch)</SelectItem>
                                        <SelectItem value="B">B (Mittel)</SelectItem>
                                        <SelectItem value="C">C (Niedrig)</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                            <div>
                                <label className="text-sm font-medium mb-2 block">Quelle</label>
                                <Select value={editForm.source} onValueChange={(v) => setEditForm({ ...editForm, source: v })}>
                                    <SelectTrigger><SelectValue /></SelectTrigger>
                                    <SelectContent>
                                        <SelectItem value="website">Website</SelectItem>
                                        <SelectItem value="referral">Empfehlung</SelectItem>
                                        <SelectItem value="cold_call">Kaltakquise</SelectItem>
                                        <SelectItem value="email">E-Mail</SelectItem>
                                        <SelectItem value="social_media">Social Media</SelectItem>
                                        <SelectItem value="trade_show">Messe</SelectItem>
                                        <SelectItem value="other">Sonstiges</SelectItem>
                                    </SelectContent>
                                </Select>
                            </div>
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Geschätzter Wert (CHF)</label>
                            <Input
                                type="number"
                                value={editForm.estimatedValue}
                                onChange={(e) => setEditForm({ ...editForm, estimatedValue: e.target.value })}
                            />
                        </div>
                        <div>
                            <label className="text-sm font-medium mb-2 block">Notizen</label>
                            <Textarea
                                value={editForm.notes}
                                onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                                rows={4}
                                className="resize-none"
                            />
                        </div>
                        <div className="flex justify-end gap-2 sticky bottom-0 bg-background pt-4">
                            <Button variant="outline" onClick={() => setShowEditLead(false)}>
                                Abbrechen
                            </Button>
                            <Button onClick={() => {
                                updateLead.mutate({
                                    id: lead!.id,
                                    ...editForm,
                                    estimatedValue: editForm.estimatedValue ? parseFloat(editForm.estimatedValue) : undefined,
                                });
                            }}>
                                Speichern
                            </Button>
                        </div>
                    </div>
                </DialogContent>
            </Dialog>
        </div>
    );
}
