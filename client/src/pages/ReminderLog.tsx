import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Card } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Skeleton } from '@/components/ui/skeleton';
import { Select } from '@/components/ui/select';
import { Mail, AlertCircle, CheckCircle, XCircle, TrendingUp, Calendar } from 'lucide-react';
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer } from 'recharts';

export default function ReminderLog() {
  const [page, setPage] = useState(1);
  const [status, setStatus] = useState<'sent' | 'failed' | 'bounced' | undefined>();
  const [reminderType, setReminderType] = useState<'1st' | '2nd' | 'final' | undefined>();

  const { data: logs, isLoading: logsLoading } = trpc.reminderLog.list.useQuery({
    page,
    pageSize: 20,
    status,
    reminderType,
  });

  const { data: stats, isLoading: statsLoading } = trpc.reminderLog.getStatistics.useQuery({
    days: 30,
  });

  if (statsLoading) {
    return (
      <div className="container py-8">
        <h1 className="text-3xl font-bold mb-8">Zahlungserinnerungs-Log</h1>
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {[...Array(4)].map((_, i) => (
            <Card key={i} className="p-6">
              <Skeleton className="h-4 w-24 mb-2" />
              <Skeleton className="h-8 w-32" />
            </Card>
          ))}
        </div>
      </div>
    );
  }

  const getStatusBadge = (status: string) => {
    switch (status) {
      case 'sent':
        return <Badge className="bg-green-500"><CheckCircle className="h-3 w-3 mr-1" />Gesendet</Badge>;
      case 'failed':
        return <Badge variant="destructive"><XCircle className="h-3 w-3 mr-1" />Fehlgeschlagen</Badge>;
      case 'bounced':
        return <Badge variant="outline"><AlertCircle className="h-3 w-3 mr-1" />Zurückgewiesen</Badge>;
      default:
        return <Badge variant="secondary">{status}</Badge>;
    }
  };

  const getReminderTypeBadge = (type: string) => {
    switch (type) {
      case '1st':
        return <Badge variant="outline" className="bg-blue-50">1. Erinnerung</Badge>;
      case '2nd':
        return <Badge variant="outline" className="bg-orange-50">2. Erinnerung</Badge>;
      case 'final':
        return <Badge variant="outline" className="bg-red-50">Letzte Mahnung</Badge>;
      default:
        return <Badge variant="secondary">{type}</Badge>;
    }
  };

  return (
    <div className="container py-8">
      <div className="flex justify-between items-center mb-8">
        <h1 className="text-3xl font-bold">Zahlungserinnerungs-Log</h1>
      </div>

      {/* Statistics Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Gesamt gesendet</span>
            <Mail className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="text-2xl font-bold">{stats?.totalSent || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">Letzte 30 Tage</p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Erfolgsrate</span>
            <TrendingUp className="h-4 w-4 text-green-600" />
          </div>
          <div className="text-2xl font-bold text-green-600">
            {stats?.successRate || 0}%
          </div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats ? stats.totalSent - stats.totalFailed - stats.totalBounced : 0} erfolgreich
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Fehlgeschlagen</span>
            <XCircle className="h-4 w-4 text-red-600" />
          </div>
          <div className="text-2xl font-bold text-red-600">{stats?.totalFailed || 0}</div>
          <p className="text-xs text-muted-foreground mt-1">
            {stats?.totalBounced || 0} zurückgewiesen
          </p>
        </Card>

        <Card className="p-6">
          <div className="flex items-center justify-between mb-2">
            <span className="text-sm font-medium text-muted-foreground">Nach Typ</span>
            <Calendar className="h-4 w-4 text-muted-foreground" />
          </div>
          <div className="space-y-1">
            <div className="flex justify-between text-sm">
              <span>1. Erinnerung:</span>
              <span className="font-medium">{stats?.byType.first || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>2. Erinnerung:</span>
              <span className="font-medium">{stats?.byType.second || 0}</span>
            </div>
            <div className="flex justify-between text-sm">
              <span>Letzte Mahnung:</span>
              <span className="font-medium">{stats?.byType.final || 0}</span>
            </div>
          </div>
        </Card>
      </div>

      {/* Daily Statistics Chart */}
      {stats && stats.dailyStats && stats.dailyStats.length > 0 && (
        <Card className="p-6 mb-8">
          <h3 className="text-lg font-semibold mb-4">Tägliche Statistik (Letzte 30 Tage)</h3>
          <ResponsiveContainer width="100%" height={300}>
            <BarChart data={stats.dailyStats}>
              <CartesianGrid strokeDasharray="3 3" />
              <XAxis dataKey="date" />
              <YAxis />
              <Tooltip />
              <Legend />
              <Bar dataKey="sent" fill="#22c55e" name="Gesendet" />
              <Bar dataKey="failed" fill="#ef4444" name="Fehlgeschlagen" />
            </BarChart>
          </ResponsiveContainer>
        </Card>
      )}

      {/* Filters */}
      <Card className="p-6 mb-6">
        <div className="flex gap-4 flex-wrap">
          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Status</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={status || ''}
              onChange={(e) => setStatus(e.target.value as any || undefined)}
            >
              <option value="">Alle</option>
              <option value="sent">Gesendet</option>
              <option value="failed">Fehlgeschlagen</option>
              <option value="bounced">Zurückgewiesen</option>
            </select>
          </div>

          <div className="flex-1 min-w-[200px]">
            <label className="text-sm font-medium mb-2 block">Typ</label>
            <select
              className="w-full px-3 py-2 border rounded-md"
              value={reminderType || ''}
              onChange={(e) => setReminderType(e.target.value as any || undefined)}
            >
              <option value="">Alle</option>
              <option value="1st">1. Erinnerung</option>
              <option value="2nd">2. Erinnerung</option>
              <option value="final">Letzte Mahnung</option>
            </select>
          </div>

          <div className="flex items-end">
            <Button
              variant="outline"
              onClick={() => {
                setStatus(undefined);
                setReminderType(undefined);
                setPage(1);
              }}
            >
              Filter zurücksetzen
            </Button>
          </div>
        </div>
      </Card>

      {/* Reminder Logs Table */}
      <Card className="p-6">
        <h3 className="text-lg font-semibold mb-4">Erinnerungs-Verlauf</h3>
        
        {logsLoading ? (
          <div className="space-y-4">
            {[...Array(5)].map((_, i) => (
              <Skeleton key={i} className="h-16 w-full" />
            ))}
          </div>
        ) : logs && logs.logs.length > 0 ? (
          <>
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b">
                    <th className="text-left py-3 px-4">Datum</th>
                    <th className="text-left py-3 px-4">Kunde</th>
                    <th className="text-left py-3 px-4">Rechnung</th>
                    <th className="text-left py-3 px-4">Typ</th>
                    <th className="text-left py-3 px-4">Betrag</th>
                    <th className="text-left py-3 px-4">Tage überfällig</th>
                    <th className="text-left py-3 px-4">Status</th>
                  </tr>
                </thead>
                <tbody>
                  {logs.logs.map((log) => (
                    <tr key={log.id} className="border-b hover:bg-muted/50">
                      <td className="py-3 px-4">
                        {new Date(log.sentAt).toLocaleDateString('de-CH', {
                          day: '2-digit',
                          month: '2-digit',
                          year: 'numeric',
                          hour: '2-digit',
                          minute: '2-digit',
                        })}
                      </td>
                      <td className="py-3 px-4">
                        <div>
                          <div className="font-medium">{log.customerName}</div>
                          <div className="text-sm text-muted-foreground">{log.customerEmail}</div>
                        </div>
                      </td>
                      <td className="py-3 px-4 font-mono">{log.invoiceNumber}</td>
                      <td className="py-3 px-4">{getReminderTypeBadge(log.reminderType)}</td>
                      <td className="py-3 px-4 font-medium">
                        CHF {parseFloat(log.invoiceAmount).toFixed(2)}
                      </td>
                      <td className="py-3 px-4">
                        <Badge variant={log.daysOverdue > 21 ? 'destructive' : 'outline'}>
                          {log.daysOverdue} Tage
                        </Badge>
                      </td>
                      <td className="py-3 px-4">
                        {getStatusBadge(log.status)}
                        {log.errorMessage && (
                          <div className="text-xs text-red-600 mt-1">{log.errorMessage}</div>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>

            {/* Pagination */}
            <div className="flex justify-between items-center mt-6">
              <div className="text-sm text-muted-foreground">
                Seite {logs.page} von {logs.totalPages} ({logs.total} Einträge)
              </div>
              <div className="flex gap-2">
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page === 1}
                  onClick={() => setPage(page - 1)}
                >
                  Zurück
                </Button>
                <Button
                  variant="outline"
                  size="sm"
                  disabled={page >= logs.totalPages}
                  onClick={() => setPage(page + 1)}
                >
                  Weiter
                </Button>
              </div>
            </div>
          </>
        ) : (
          <div className="text-center py-12 text-muted-foreground">
            <Mail className="h-12 w-12 mx-auto mb-4 opacity-50" />
            <p>Keine Erinnerungen gefunden</p>
          </div>
        )}
      </Card>
    </div>
  );
}
