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
} from "@/components/ui/dialog";
import { Badge } from "@/components/ui/badge";
import {
  Mail,
  CheckCircle2,
  XCircle,
  Clock,
  Search,
  RefreshCw,
  Eye,
  TrendingUp,
  AlertCircle,
} from "lucide-react";
import { toast } from "sonner";

export default function EmailLogDashboard() {
  const [page, setPage] = useState(1);
  const [statusFilter, setStatusFilter] = useState<string>("all");
  const [searchEmail, setSearchEmail] = useState("");
  const [searchTemplate, setSearchTemplate] = useState("");
  const [selectedLog, setSelectedLog] = useState<any>(null);
  const [isDetailsOpen, setIsDetailsOpen] = useState(false);

  // Fetch stats
  const { data: stats, isLoading: statsLoading } = trpc.emailLogs.stats.useQuery();

  // Fetch logs with filters
  const { data: logsData, isLoading: logsLoading, refetch } = trpc.emailLogs.list.useQuery({
    page,
    pageSize: 20,
    status: statusFilter === "all" ? undefined : (statusFilter as any),
    recipientEmail: searchEmail || undefined,
    templateName: searchTemplate || undefined,
  });

  // Retry mutation
  const retryMutation = trpc.emailLogs.retry.useMutation({
    onSuccess: () => {
      toast.success("Email resent successfully");
      refetch();
    },
    onError: (error) => {
      toast.error(`Failed to resend email: ${error.message}`);
    },
  });

  const handleRetry = (logId: number) => {
    if (confirm("Are you sure you want to retry sending this email?")) {
      retryMutation.mutate({ id: logId });
    }
  };

  const handleViewDetails = (log: any) => {
    setSelectedLog(log);
    setIsDetailsOpen(true);
  };

  const getStatusBadge = (status: string) => {
    switch (status) {
      case "sent":
        return (
          <Badge className="bg-green-500/10 text-green-600 hover:bg-green-500/20">
            <CheckCircle2 className="w-3 h-3 mr-1" />
            Sent
          </Badge>
        );
      case "failed":
        return (
          <Badge className="bg-red-500/10 text-red-600 hover:bg-red-500/20">
            <XCircle className="w-3 h-3 mr-1" />
            Failed
          </Badge>
        );
      case "pending":
        return (
          <Badge className="bg-yellow-500/10 text-yellow-600 hover:bg-yellow-500/20">
            <Clock className="w-3 h-3 mr-1" />
            Pending
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
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2 bg-blue-500/10 rounded-lg">
              <Mail className="w-6 h-6 text-blue-600" />
            </div>
            <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
              Email Versandprotokoll
            </h1>
          </div>
          <p className="text-gray-600 dark:text-gray-400">
            Überwachen Sie alle versendeten E-Mails mit Status und Details
          </p>
        </div>

        {/* Statistics Cards */}
        {!statsLoading && stats && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Total Emails
                  </p>
                  <p className="text-2xl font-bold text-gray-900 dark:text-white">
                    {stats.overall.total}
                  </p>
                </div>
                <Mail className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Erfolgreich
                  </p>
                  <p className="text-2xl font-bold text-green-600">
                    {stats.overall.sent}
                  </p>
                </div>
                <CheckCircle2 className="w-10 h-10 text-green-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Fehlgeschlagen
                  </p>
                  <p className="text-2xl font-bold text-red-600">
                    {stats.overall.failed}
                  </p>
                </div>
                <XCircle className="w-10 h-10 text-red-500 opacity-20" />
              </div>
            </Card>

            <Card className="p-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm text-gray-600 dark:text-gray-400 mb-1">
                    Erfolgsrate
                  </p>
                  <p className="text-2xl font-bold text-blue-600">
                    {stats.overall.successRate}%
                  </p>
                </div>
                <TrendingUp className="w-10 h-10 text-blue-500 opacity-20" />
              </div>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="flex flex-col md:flex-row gap-4">
            <div className="flex-1">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-gray-400" />
                <Input
                  placeholder="Empfänger-Email suchen..."
                  value={searchEmail}
                  onChange={(e) => setSearchEmail(e.target.value)}
                  className="pl-10"
                />
              </div>
            </div>

            <div className="flex-1">
              <Input
                placeholder="Template-Name suchen..."
                value={searchTemplate}
                onChange={(e) => setSearchTemplate(e.target.value)}
              />
            </div>

            <Select value={statusFilter} onValueChange={setStatusFilter}>
              <SelectTrigger className="w-full md:w-48">
                <SelectValue placeholder="Status filtern" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="all">Alle Status</SelectItem>
                <SelectItem value="sent">Erfolgreich</SelectItem>
                <SelectItem value="failed">Fehlgeschlagen</SelectItem>
                <SelectItem value="pending">Ausstehend</SelectItem>
              </SelectContent>
            </Select>

            <Button
              variant="outline"
              onClick={() => refetch()}
              className="w-full md:w-auto"
            >
              <RefreshCw className="w-4 h-4 mr-2" />
              Aktualisieren
            </Button>
          </div>
        </Card>

        {/* Email Logs Table */}
        <Card className="bg-white dark:bg-gray-800 border-gray-200 dark:border-gray-700">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Email-Protokolle
            </h2>

            {logsLoading ? (
              <div className="flex justify-center items-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-blue-600"></div>
              </div>
            ) : !logsData || logsData.logs.length === 0 ? (
              <div className="text-center py-12">
                <AlertCircle className="w-12 h-12 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-600 dark:text-gray-400">
                  Keine E-Mail-Protokolle gefunden
                </p>
              </div>
            ) : (
              <>
                <div className="overflow-x-auto">
                  <Table>
                    <TableHeader>
                      <TableRow>
                        <TableHead>Status</TableHead>
                        <TableHead>Empfänger</TableHead>
                        <TableHead>Betreff</TableHead>
                        <TableHead>Template</TableHead>
                        <TableHead>Gesendet am</TableHead>
                        <TableHead className="text-right">Aktionen</TableHead>
                      </TableRow>
                    </TableHeader>
                    <TableBody>
                      {logsData.logs.map((log) => (
                        <TableRow key={log.id}>
                          <TableCell>{getStatusBadge(log.status)}</TableCell>
                          <TableCell>
                            <div>
                              <div className="font-medium text-gray-900 dark:text-white">
                                {log.recipientName || "—"}
                              </div>
                              <div className="text-sm text-gray-500">
                                {log.recipientEmail}
                              </div>
                            </div>
                          </TableCell>
                          <TableCell className="max-w-xs truncate">
                            {log.subject}
                          </TableCell>
                          <TableCell>
                            {log.templateName ? (
                              <Badge variant="outline">{log.templateName}</Badge>
                            ) : (
                              <span className="text-gray-400">—</span>
                            )}
                          </TableCell>
                          <TableCell>
                            {log.sentAt
                              ? new Date(log.sentAt).toLocaleString("de-CH")
                              : log.createdAt
                              ? new Date(log.createdAt).toLocaleString("de-CH")
                              : "—"}
                          </TableCell>
                          <TableCell className="text-right">
                            <div className="flex justify-end gap-2">
                              <Button
                                variant="ghost"
                                size="sm"
                                onClick={() => handleViewDetails(log)}
                              >
                                <Eye className="w-4 h-4" />
                              </Button>
                              {log.status === "failed" && (
                                <Button
                                  variant="ghost"
                                  size="sm"
                                  onClick={() => handleRetry(log.id)}
                                  disabled={retryMutation.isPending}
                                >
                                  <RefreshCw className="w-4 h-4" />
                                </Button>
                              )}
                            </div>
                          </TableCell>
                        </TableRow>
                      ))}
                    </TableBody>
                  </Table>
                </div>

                {/* Pagination */}
                {logsData.pagination.totalPages > 1 && (
                  <div className="flex items-center justify-between mt-6 pt-6 border-t border-gray-200 dark:border-gray-700">
                    <div className="text-sm text-gray-600 dark:text-gray-400">
                      Seite {logsData.pagination.page} von{" "}
                      {logsData.pagination.totalPages} ({logsData.pagination.totalCount}{" "}
                      Einträge)
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page - 1)}
                        disabled={page === 1}
                      >
                        Zurück
                      </Button>
                      <Button
                        variant="outline"
                        size="sm"
                        onClick={() => setPage(page + 1)}
                        disabled={page >= logsData.pagination.totalPages}
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

        {/* Details Dialog */}
        <Dialog open={isDetailsOpen} onOpenChange={setIsDetailsOpen}>
          <DialogContent className="max-w-3xl max-h-[80vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Email Details</DialogTitle>
              <DialogDescription>
                Vollständige Informationen zu dieser E-Mail
              </DialogDescription>
            </DialogHeader>

            {selectedLog && (
              <div className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Status
                    </label>
                    <div className="mt-1">{getStatusBadge(selectedLog.status)}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Template
                    </label>
                    <div className="mt-1">
                      {selectedLog.templateName || "—"}
                    </div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Empfänger
                    </label>
                    <div className="mt-1">{selectedLog.recipientEmail}</div>
                  </div>
                  <div>
                    <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                      Erstellt am
                    </label>
                    <div className="mt-1">
                      {new Date(selectedLog.createdAt).toLocaleString("de-CH")}
                    </div>
                  </div>
                </div>

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400">
                    Betreff
                  </label>
                  <div className="mt-1 p-3 bg-gray-50 dark:bg-gray-800 rounded">
                    {selectedLog.subject}
                  </div>
                </div>

                {selectedLog.errorMessage && (
                  <div>
                    <label className="text-sm font-medium text-red-600">
                      Fehlermeldung
                    </label>
                    <div className="mt-1 p-3 bg-red-50 dark:bg-red-900/20 rounded text-red-600">
                      {selectedLog.errorMessage}
                    </div>
                  </div>
                )}

                <div>
                  <label className="text-sm font-medium text-gray-600 dark:text-gray-400 mb-2 block">
                    Email-Inhalt (HTML)
                  </label>
                  <div className="border border-gray-200 dark:border-gray-700 rounded-lg p-4 bg-white dark:bg-gray-900 max-h-96 overflow-y-auto">
                    <div dangerouslySetInnerHTML={{ __html: selectedLog.body }} />
                  </div>
                </div>
              </div>
            )}
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
