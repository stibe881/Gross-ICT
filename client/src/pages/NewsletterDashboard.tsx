import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
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
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogFooter,
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import {
  Mail,
  Users,
  Send,
  TrendingUp,
  Search,
  Plus,
  Edit,
  Trash2,
  FileText,
  BarChart3,
  Upload,
  Download,
  Filter,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

export default function NewsletterDashboard() {
  const [, setLocation] = useLocation();
  const [activeTab, setActiveTab] = useState("overview");
  const [subscriberPage, setSubscriberPage] = useState(1);
  const [subscriberStatus, setSubscriberStatus] = useState<string>("all");
  const [subscriberSearch, setSubscriberSearch] = useState("");
  const [isAddSubscriberOpen, setIsAddSubscriberOpen] = useState(false);
  const [newSubscriber, setNewSubscriber] = useState({
    email: "",
    firstName: "",
    lastName: "",
  });

  // Fetch dashboard stats
  const { data: stats, isLoading: statsLoading } =
    trpc.newsletter.dashboardStats.useQuery();

  // Fetch subscriber stats
  const { data: subscriberStats } = trpc.newsletter.subscribers.stats.useQuery();

  // Fetch subscribers
  const {
    data: subscribersData,
    isLoading: subscribersLoading,
    refetch: refetchSubscribers,
  } = trpc.newsletter.subscribers.list.useQuery({
    page: subscriberPage,
    pageSize: 20,
    status:
      subscriberStatus === "all"
        ? undefined
        : (subscriberStatus as "active" | "unsubscribed" | "bounced"),
    search: subscriberSearch || undefined,
  });

  // Fetch campaigns
  const { data: campaignsData, refetch: refetchCampaigns } =
    trpc.newsletter.campaigns.list.useQuery({
      page: 1,
      pageSize: 10,
    });

  // Create subscriber mutation
  const createSubscriberMutation = trpc.newsletter.subscribers.create.useMutation({
    onSuccess: () => {
      toast.success("Abonnent erfolgreich hinzugefügt");
      setIsAddSubscriberOpen(false);
      setNewSubscriber({ email: "", firstName: "", lastName: "" });
      refetchSubscribers();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Delete subscriber mutation
  const deleteSubscriberMutation = trpc.newsletter.subscribers.delete.useMutation({
    onSuccess: () => {
      toast.success("Abonnent gelöscht");
      refetchSubscribers();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleAddSubscriber = () => {
    if (!newSubscriber.email) {
      toast.error("E-Mail ist erforderlich");
      return;
    }
    createSubscriberMutation.mutate(newSubscriber);
  };

  const handleDeleteSubscriber = (id: number) => {
    if (confirm("Möchten Sie diesen Abonnenten wirklich löschen?")) {
      deleteSubscriberMutation.mutate({ id });
    }
  };

  // Bulk import mutation
  const bulkImportMutation = trpc.newsletter.subscribers.bulkImport.useMutation({
    onSuccess: (data) => {
      toast.success(
        `Import abgeschlossen: ${data.imported} importiert, ${data.skipped} übersprungen${data.errors.length > 0 ? `, ${data.errors.length} Fehler` : ''}`
      );
      if (data.errors.length > 0) {
        console.error('Import errors:', data.errors);
      }
      refetchSubscribers();
    },
    onError: (error) => {
      toast.error(`Import fehlgeschlagen: ${error.message}`);
    },
  });

  const handleCSVImport = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = (e) => {
      try {
        const text = e.target?.result as string;
        const lines = text.split('\n');
        const headers = lines[0].split(',').map(h => h.trim().toLowerCase());
        
        const subscribers: { email: string; firstName?: string; lastName?: string }[] = [];
        
        for (let i = 1; i < lines.length; i++) {
          const line = lines[i].trim();
          if (!line) continue;
          
          const values = line.split(',').map(v => v.trim());
          const emailIndex = headers.indexOf('email');
          const firstNameIndex = headers.indexOf('firstname') >= 0 ? headers.indexOf('firstname') : headers.indexOf('first_name');
          const lastNameIndex = headers.indexOf('lastname') >= 0 ? headers.indexOf('lastname') : headers.indexOf('last_name');

          if (emailIndex >= 0 && values[emailIndex]) {
            subscribers.push({
              email: values[emailIndex],
              firstName: firstNameIndex >= 0 ? values[firstNameIndex] : undefined,
              lastName: lastNameIndex >= 0 ? values[lastNameIndex] : undefined,
            });
          }
        }

        if (subscribers.length === 0) {
          toast.error('Keine gültigen Abonnenten in der CSV-Datei gefunden');
          return;
        }

        // Call bulk import API
        bulkImportMutation.mutate({ subscribers });
      } catch (error) {
        toast.error('Fehler beim Lesen der CSV-Datei');
        console.error(error);
      }
    };
    reader.readAsText(file);
  };

  const handleCSVExport = () => {
    if (!subscribersData?.subscribers) {
      toast.error('Keine Daten zum Exportieren vorhanden');
      return;
    }

    const headers = ['email', 'firstName', 'lastName', 'status', 'createdAt'];
    const csvContent = [
      headers.join(','),
      ...subscribersData.subscribers.map(sub => 
        `${sub.email},${sub.firstName || ''},${sub.lastName || ''},${sub.status},${sub.createdAt}`
      )
    ].join('\n');

    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const link = document.createElement('a');
    const url = URL.createObjectURL(blob);
    link.setAttribute('href', url);
    link.setAttribute('download', `newsletter-subscribers-${new Date().toISOString().split('T')[0]}.csv`);
    link.style.visibility = 'hidden';
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    
    toast.success('CSV-Datei erfolgreich exportiert');
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
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  const getCampaignStatusBadge = (status: string) => {
    switch (status) {
      case "draft":
        return <Badge variant="outline">Entwurf</Badge>;
      case "scheduled":
        return (
          <Badge className="bg-blue-500/10 text-blue-600 hover:bg-blue-500/20">
            Geplant
          </Badge>
        );
      case "sending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
            Wird gesendet
          </Badge>
        );
      case "sent":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            Gesendet
          </Badge>
        );
      case "paused":
        return (
          <Badge className="bg-gray-500/10 text-gray-600 hover:bg-gray-500/20">
            Pausiert
          </Badge>
        );
      default:
        return <Badge variant="outline">{status}</Badge>;
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="container mx-auto max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            <div>
              <div className="flex items-center gap-3 mb-2">
                <div className="p-2 bg-blue-500/10 rounded-lg">
                  <Mail className="w-6 h-6 text-blue-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Newsletter Management
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Verwalten Sie Abonnenten, Kampagnen und Newsletter-Templates
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                onClick={() => setLocation("/newsletter/segments")}
                variant="outline"
              >
                <Filter className="w-4 h-4 mr-2" />
                Segmente
              </Button>
              <Button
                onClick={() => setLocation("/newsletter/campaigns/new")}
                className="bg-blue-600 hover:bg-blue-700"
              >
                <Plus className="w-4 h-4 mr-2" />
                Neue Kampagne
              </Button>
            </div>
          </div>
        </div>

        {/* Tabs */}
        <Tabs value={activeTab} onValueChange={setActiveTab} className="space-y-6">
          <TabsList className="bg-white dark:bg-gray-800 p-1">
            <TabsTrigger value="overview">
              <BarChart3 className="w-4 h-4 mr-2" />
              Übersicht
            </TabsTrigger>
            <TabsTrigger value="subscribers">
              <Users className="w-4 h-4 mr-2" />
              Abonnenten
            </TabsTrigger>
            <TabsTrigger value="campaigns">
              <Send className="w-4 h-4 mr-2" />
              Kampagnen
            </TabsTrigger>
            <TabsTrigger value="templates">
              <FileText className="w-4 h-4 mr-2" />
              Templates
            </TabsTrigger>
          </TabsList>

          {/* Overview Tab */}
          <TabsContent value="overview" className="space-y-6">
            {/* Statistics Cards */}
            {!statsLoading && stats && (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Aktive Abonnenten
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalSubscribers}
                      </p>
                    </div>
                    <Users className="w-10 h-10 text-blue-500 opacity-20" />
                  </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Gesendete Kampagnen
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.sentCampaigns}
                      </p>
                    </div>
                    <Send className="w-10 h-10 text-green-500 opacity-20" />
                  </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Gesamt Kampagnen
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.totalCampaigns}
                      </p>
                    </div>
                    <Mail className="w-10 h-10 text-purple-500 opacity-20" />
                  </div>
                </Card>

                <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
                  <div className="flex items-center justify-between">
                    <div>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                        Ø Öffnungsrate
                      </p>
                      <p className="text-2xl font-bold text-gray-900 dark:text-white">
                        {stats.avgOpenRate.toFixed(1)}%
                      </p>
                    </div>
                    <TrendingUp className="w-10 h-10 text-orange-500 opacity-20" />
                  </div>
                </Card>
              </div>
            )}

            {/* Recent Campaigns */}
            <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Letzte Kampagnen
                </h2>
                {stats && stats.recentCampaigns.length > 0 ? (
                  <div className="space-y-3">
                    {stats.recentCampaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-3 bg-gray-50 dark:bg-gray-700/50 rounded-lg"
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.subject}
                          </div>
                        </div>
                        <div className="flex items-center gap-3">
                          {getCampaignStatusBadge(campaign.status)}
                          <span className="text-sm text-gray-500">
                            {campaign.recipientCount} Empfänger
                          </span>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-gray-500 text-center py-8">
                    Noch keine Kampagnen erstellt
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Subscribers Tab */}
          <TabsContent value="subscribers" className="space-y-6">
            {/* Subscriber Stats */}
            {subscriberStats && (
              <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
                <Card className="p-4 bg-white dark:bg-gray-800">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Gesamt
                  </div>
                  <div className="text-2xl font-bold text-gray-900 dark:text-white">
                    {subscriberStats.total}
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-800">
                  <div className="text-sm text-green-600">Aktiv</div>
                  <div className="text-2xl font-bold text-green-600">
                    {subscriberStats.active}
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-800">
                  <div className="text-sm text-gray-600 dark:text-gray-400">
                    Abgemeldet
                  </div>
                  <div className="text-2xl font-bold text-gray-600">
                    {subscriberStats.unsubscribed}
                  </div>
                </Card>
                <Card className="p-4 bg-white dark:bg-gray-800">
                  <div className="text-sm text-red-600">Bounced</div>
                  <div className="text-2xl font-bold text-red-600">
                    {subscriberStats.bounced}
                  </div>
                </Card>
              </div>
            )}

            {/* Filters */}
            <Card className="p-6 bg-white dark:bg-gray-800">
              <div className="flex flex-col md:flex-row gap-4">
                <div className="flex-1 relative">
                  <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <Input
                    placeholder="Suche nach Email oder Name..."
                    value={subscriberSearch}
                    onChange={(e) => setSubscriberSearch(e.target.value)}
                    className="pl-10"
                  />
                </div>
                <Select value={subscriberStatus} onValueChange={setSubscriberStatus}>
                  <SelectTrigger className="w-full md:w-48">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Status</SelectItem>
                    <SelectItem value="active">Aktiv</SelectItem>
                    <SelectItem value="unsubscribed">Abgemeldet</SelectItem>
                    <SelectItem value="bounced">Bounced</SelectItem>
                  </SelectContent>
                </Select>
                <Button onClick={() => setIsAddSubscriberOpen(true)}>
                  <Plus className="w-4 h-4 mr-2" />
                  Abonnent hinzufügen
                </Button>
                <Button
                  variant="outline"
                  onClick={() => document.getElementById('csv-upload')?.click()}
                >
                  <Upload className="w-4 h-4 mr-2" />
                  CSV Import
                </Button>
                <input
                  id="csv-upload"
                  type="file"
                  accept=".csv"
                  className="hidden"
                  onChange={handleCSVImport}
                />
                <Button
                  variant="outline"
                  onClick={handleCSVExport}
                >
                  <Download className="w-4 h-4 mr-2" />
                  CSV Export
                </Button>
              </div>
            </Card>

            {/* Subscribers Table */}
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
                  Abonnenten
                </h2>
                {subscribersLoading ? (
                  <div className="flex justify-center py-12">
                    <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
                  </div>
                ) : !subscribersData || subscribersData.subscribers.length === 0 ? (
                  <p className="text-center py-12 text-gray-500">
                    Keine Abonnenten gefunden
                  </p>
                ) : (
                  <>
                    <div className="overflow-x-auto">
                      <Table>
                        <TableHeader>
                          <TableRow>
                            <TableHead>Email</TableHead>
                            <TableHead>Name</TableHead>
                            <TableHead>Status</TableHead>
                            <TableHead>Abonniert am</TableHead>
                            <TableHead className="text-right">Aktionen</TableHead>
                          </TableRow>
                        </TableHeader>
                        <TableBody>
                          {subscribersData.subscribers.map((subscriber) => (
                            <TableRow key={subscriber.id}>
                              <TableCell className="font-medium">
                                {subscriber.email}
                              </TableCell>
                              <TableCell>
                                {subscriber.firstName || subscriber.lastName
                                  ? `${subscriber.firstName || ""} ${subscriber.lastName || ""}`.trim()
                                  : "—"}
                              </TableCell>
                              <TableCell>{getStatusBadge(subscriber.status)}</TableCell>
                              <TableCell>
                                {new Date(subscriber.subscribedAt).toLocaleDateString(
                                  "de-CH"
                                )}
                              </TableCell>
                              <TableCell className="text-right">
                                <div className="flex justify-end gap-2">
                                  <Button variant="ghost" size="sm">
                                    <Edit className="w-4 h-4" />
                                  </Button>
                                  <Button
                                    variant="ghost"
                                    size="sm"
                                    onClick={() =>
                                      handleDeleteSubscriber(subscriber.id)
                                    }
                                  >
                                    <Trash2 className="w-4 h-4" />
                                  </Button>
                                </div>
                              </TableCell>
                            </TableRow>
                          ))}
                        </TableBody>
                      </Table>
                    </div>

                    {/* Pagination */}
                    {subscribersData.pagination.totalPages > 1 && (
                      <div className="flex items-center justify-between mt-6 pt-6 border-t">
                        <div className="text-sm text-gray-600">
                          Seite {subscribersData.pagination.page} von{" "}
                          {subscribersData.pagination.totalPages}
                        </div>
                        <div className="flex gap-2">
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubscriberPage(subscriberPage - 1)}
                            disabled={subscriberPage === 1}
                          >
                            Zurück
                          </Button>
                          <Button
                            variant="outline"
                            size="sm"
                            onClick={() => setSubscriberPage(subscriberPage + 1)}
                            disabled={
                              subscriberPage >=
                              subscribersData.pagination.totalPages
                            }
                          >
                            Weiter
                          </Button>
                        </div>
                      </div>
                    )}
                  </>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Campaigns Tab */}
          <TabsContent value="campaigns" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Alle Kampagnen
                  </h2>
                  <Button
                    onClick={() => setLocation("/newsletter/campaigns/new")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <Plus className="w-4 h-4 mr-2" />
                    Neue Kampagne
                  </Button>
                </div>
                {campaignsData && campaignsData.campaigns.length > 0 ? (
                  <div className="space-y-3">
                    {campaignsData.campaigns.map((campaign) => (
                      <div
                        key={campaign.id}
                        className="flex items-center justify-between p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-700 transition-colors cursor-pointer"
                        onClick={() =>
                          setLocation(`/newsletter/campaigns/${campaign.id}`)
                        }
                      >
                        <div className="flex-1">
                          <div className="font-medium text-gray-900 dark:text-white">
                            {campaign.name}
                          </div>
                          <div className="text-sm text-gray-500">
                            {campaign.subject}
                          </div>
                          <div className="text-xs text-gray-400 mt-1">
                            Erstellt am{" "}
                            {new Date(campaign.createdAt).toLocaleDateString("de-CH")}
                          </div>
                        </div>
                        <div className="flex items-center gap-4">
                          {getCampaignStatusBadge(campaign.status)}
                          <div className="text-sm text-gray-500">
                            {campaign.recipientCount} Empfänger
                          </div>
                          {campaign.status === 'sent' && (
                            <Button
                              variant="outline"
                              size="sm"
                              onClick={(e) => {
                                e.stopPropagation();
                                setLocation(`/newsletter/campaigns/${campaign.id}/stats`);
                              }}
                            >
                              <BarChart3 className="w-4 h-4 mr-2" />
                              Statistiken
                            </Button>
                          )}
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-center py-12 text-gray-500">
                    Noch keine Kampagnen erstellt
                  </p>
                )}
              </div>
            </Card>
          </TabsContent>

          {/* Templates Tab */}
          <TabsContent value="templates" className="space-y-6">
            <Card className="bg-white dark:bg-gray-800">
              <div className="p-6">
                <div className="flex items-center justify-between mb-4">
                  <h2 className="text-xl font-semibold text-gray-900 dark:text-white">
                    Newsletter Templates
                  </h2>
                  <Button
                    onClick={() => setLocation("/newsletter/templates")}
                    className="bg-blue-600 hover:bg-blue-700"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Template-Bibliothek öffnen
                  </Button>
                </div>
                <div className="text-center py-12">
                  <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                  <p className="text-gray-500 mb-4">
                    Verwalten Sie wiederverwendbare E-Mail-Templates
                  </p>
                  <Button
                    onClick={() => setLocation("/newsletter/templates")}
                    variant="outline"
                  >
                    <FileText className="w-4 h-4 mr-2" />
                    Zur Template-Bibliothek
                  </Button>
                </div>
              </div>
            </Card>
          </TabsContent>
        </Tabs>

        {/* Add Subscriber Dialog */}
        <Dialog open={isAddSubscriberOpen} onOpenChange={setIsAddSubscriberOpen}>
          <DialogContent>
            <DialogHeader>
              <DialogTitle>Neuen Abonnenten hinzufügen</DialogTitle>
              <DialogDescription>
                Fügen Sie einen neuen Newsletter-Abonnenten hinzu
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div>
                <label className="text-sm font-medium mb-2 block">
                  E-Mail *
                </label>
                <Input
                  type="email"
                  placeholder="abonnent@example.com"
                  value={newSubscriber.email}
                  onChange={(e) =>
                    setNewSubscriber({ ...newSubscriber, email: e.target.value })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Vorname</label>
                <Input
                  placeholder="Max"
                  value={newSubscriber.firstName}
                  onChange={(e) =>
                    setNewSubscriber({
                      ...newSubscriber,
                      firstName: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">Nachname</label>
                <Input
                  placeholder="Mustermann"
                  value={newSubscriber.lastName}
                  onChange={(e) =>
                    setNewSubscriber({ ...newSubscriber, lastName: e.target.value })
                  }
                />
              </div>
            </div>
            <DialogFooter>
              <Button
                variant="outline"
                onClick={() => setIsAddSubscriberOpen(false)}
              >
                Abbrechen
              </Button>
              <Button
                onClick={handleAddSubscriber}
                disabled={createSubscriberMutation.isPending}
              >
                Hinzufügen
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
