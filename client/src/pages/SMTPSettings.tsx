import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { Mail, Save, TestTube, AlertCircle, CheckCircle } from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";

export default function SMTPSettings() {
  const { data: settings, refetch } = trpc.smtp.getSettings.useQuery();
  const updateMutation = trpc.smtp.updateSettings.useMutation({
    onSuccess: () => {
      toast.success("SMTP-Einstellungen gespeichert");
      refetch();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const testMutation = trpc.smtp.testConnection.useMutation({
    onSuccess: () => {
      toast.success("SMTP-Verbindung erfolgreich getestet!");
    },
    onError: (error: any) => {
      toast.error(`Verbindungstest fehlgeschlagen: ${error.message}`);
    },
  });

  const [formData, setFormData] = useState({
    host: settings?.host || "",
    port: settings?.port || 587,
    secure: settings?.secure || false,
    user: settings?.user || "",
    password: "",
    fromEmail: settings?.fromEmail || "noreply@gross-ict.ch",
    fromName: settings?.fromName || "Gross ICT",
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    updateMutation.mutate(formData);
  };

  const handleTest = () => {
    testMutation.mutate();
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        <div>
          <h1 className="text-3xl font-bold">SMTP-Einstellungen</h1>
          <p className="text-muted-foreground mt-2">
            Konfigurieren Sie Ihren E-Mail-Server für den Versand von System-E-Mails
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Mail className="w-5 h-5" />
              E-Mail-Server Konfiguration
            </CardTitle>
            <CardDescription>
              Geben Sie die SMTP-Zugangsdaten Ihres E-Mail-Providers ein
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="host">SMTP Host</Label>
                  <Input
                    id="host"
                    placeholder="smtp.gmail.com"
                    value={formData.host}
                    onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    z.B. smtp.gmail.com, smtp.office365.com
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="port">Port</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="587"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-xs text-muted-foreground">
                    Standard: 587 (TLS) oder 465 (SSL)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="user">Benutzername / E-Mail</Label>
                  <Input
                    id="user"
                    type="email"
                    placeholder="ihre-email@domain.com"
                    value={formData.user}
                    onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="password">Passwort</Label>
                  <Input
                    id="password"
                    type="password"
                    placeholder="••••••••"
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                  />
                  <p className="text-xs text-muted-foreground">
                    Leer lassen, um bestehendes Passwort beizubehalten
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromEmail">Absender E-Mail</Label>
                  <Input
                    id="fromEmail"
                    type="email"
                    placeholder="noreply@gross-ict.ch"
                    value={formData.fromEmail}
                    onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                    required
                  />
                </div>

                <div className="space-y-2">
                  <Label htmlFor="fromName">Absender Name</Label>
                  <Input
                    id="fromName"
                    placeholder="Gross ICT"
                    value={formData.fromName}
                    onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                    required
                  />
                </div>
              </div>

              <div className="flex items-center space-x-2 p-4 bg-muted rounded-lg">
                <Switch
                  id="secure"
                  checked={formData.secure}
                  onCheckedChange={(checked) => setFormData({ ...formData, secure: checked })}
                />
                <Label htmlFor="secure" className="cursor-pointer">
                  SSL/TLS Verschlüsselung verwenden
                </Label>
              </div>

              <div className="bg-blue-50 dark:bg-blue-950/30 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                <div className="flex gap-3">
                  <AlertCircle className="w-5 h-5 text-blue-600 dark:text-blue-400 flex-shrink-0 mt-0.5" />
                  <div className="space-y-2 text-sm">
                    <p className="font-semibold text-blue-900 dark:text-blue-100">
                      Wichtige Hinweise:
                    </p>
                    <ul className="list-disc list-inside space-y-1 text-blue-800 dark:text-blue-200">
                      <li>Gmail: Verwenden Sie ein App-Passwort (nicht Ihr normales Passwort)</li>
                      <li>Office 365: Aktivieren Sie SMTP AUTH in den Admin-Einstellungen</li>
                      <li>Testen Sie die Verbindung nach dem Speichern</li>
                    </ul>
                  </div>
                </div>
              </div>

              <div className="flex gap-4">
                <Button type="submit" disabled={updateMutation.isPending}>
                  <Save className="w-4 h-4 mr-2" />
                  {updateMutation.isPending ? "Speichert..." : "Einstellungen speichern"}
                </Button>
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={testMutation.isPending || !settings}
                >
                  <TestTube className="w-4 h-4 mr-2" />
                  {testMutation.isPending ? "Teste..." : "Verbindung testen"}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {settings && (
          <Card>
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                <CheckCircle className="w-5 h-5 text-green-600" />
                Aktuelle Konfiguration
              </CardTitle>
            </CardHeader>
            <CardContent>
              <dl className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">SMTP Host</dt>
                  <dd className="mt-1 text-sm font-mono">{settings.host || "Nicht konfiguriert"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Port</dt>
                  <dd className="mt-1 text-sm font-mono">{settings.port || "Nicht konfiguriert"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Benutzername</dt>
                  <dd className="mt-1 text-sm font-mono">{settings.user || "Nicht konfiguriert"}</dd>
                </div>
                <div>
                  <dt className="text-sm font-medium text-muted-foreground">Verschlüsselung</dt>
                  <dd className="mt-1 text-sm">
                    {settings.secure ? (
                      <span className="text-green-600 font-medium">SSL/TLS aktiviert</span>
                    ) : (
                      <span className="text-orange-600 font-medium">Nicht verschlüsselt</span>
                    )}
                  </dd>
                </div>
              </dl>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
