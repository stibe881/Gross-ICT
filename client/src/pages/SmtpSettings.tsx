import { useState } from "react";
import DashboardLayout from "@/components/DashboardLayout";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Switch } from "@/components/ui/switch";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import { Loader2, Mail, Server, CheckCircle2, XCircle, Eye, EyeOff } from "lucide-react";

export default function SmtpSettings() {
  const { data: settings, isLoading, refetch } = trpc.smtp.getSettings.useQuery();
  const upsertMutation = trpc.smtp.upsertSettings.useMutation();
  const testMutation = trpc.smtp.testConnection.useMutation();

  const [formData, setFormData] = useState({
    host: "",
    port: 587,
    secure: false,
    user: "",
    password: "",
    fromEmail: "",
    fromName: "Gross ICT",
  });

  const [showPassword, setShowPassword] = useState(false);
  const [isTesting, setIsTesting] = useState(false);

  // Load settings when available
  useState(() => {
    if (settings) {
      setFormData({
        host: settings.host,
        port: settings.port,
        secure: settings.secure,
        user: settings.user,
        password: "", // Don't load password for security
        fromEmail: settings.fromEmail,
        fromName: settings.fromName,
      });
    }
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!formData.password && !settings) {
      toast.error("Password is required for new configuration");
      return;
    }

    try {
      await upsertMutation.mutateAsync(formData);
      toast.success("SMTP settings saved successfully");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "Failed to save SMTP settings");
    }
  };

  const handleTest = async () => {
    if (!formData.host || !formData.user || !formData.password) {
      toast.error("Please fill in all required fields before testing");
      return;
    }

    setIsTesting(true);
    try {
      const result = await testMutation.mutateAsync({
        host: formData.host,
        port: formData.port,
        secure: formData.secure,
        user: formData.user,
        password: formData.password,
      });
      toast.success(result.message || "SMTP connection successful!");
      refetch();
    } catch (error: any) {
      toast.error(error.message || "SMTP connection failed");
    } finally {
      setIsTesting(false);
    }
  };

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <Loader2 className="w-8 h-8 animate-spin text-muted-foreground" />
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="container max-w-4xl py-8">
        <div className="mb-8">
          <h1 className="text-3xl font-bold mb-2">SMTP Configuration</h1>
          <p className="text-muted-foreground">
            Configure email server settings for sending notifications and invoices
          </p>
        </div>

        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Server className="w-5 h-5" />
              Email Server Settings
            </CardTitle>
            <CardDescription>
              Enter your SMTP server details. Test the connection before saving.
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit} className="space-y-6">
              {/* SMTP Host */}
              <div className="space-y-2">
                <Label htmlFor="host">SMTP Host *</Label>
                <Input
                  id="host"
                  type="text"
                  placeholder="smtp.gmail.com"
                  value={formData.host}
                  onChange={(e) => setFormData({ ...formData, host: e.target.value })}
                  required
                />
                <p className="text-sm text-muted-foreground">
                  Example: smtp.gmail.com, smtp.office365.com, mail.your-domain.com
                </p>
              </div>

              {/* SMTP Port & Secure */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div className="space-y-2">
                  <Label htmlFor="port">SMTP Port *</Label>
                  <Input
                    id="port"
                    type="number"
                    placeholder="587"
                    value={formData.port}
                    onChange={(e) => setFormData({ ...formData, port: parseInt(e.target.value) })}
                    required
                  />
                  <p className="text-sm text-muted-foreground">
                    Common: 587 (TLS), 465 (SSL), 25 (Plain)
                  </p>
                </div>

                <div className="space-y-2">
                  <Label htmlFor="secure">Use SSL/TLS</Label>
                  <div className="flex items-center space-x-2 pt-2">
                    <Switch
                      id="secure"
                      checked={formData.secure}
                      onCheckedChange={(checked) => setFormData({ ...formData, secure: checked })}
                    />
                    <span className="text-sm text-muted-foreground">
                      {formData.secure ? "Enabled (Port 465)" : "Disabled (Port 587)"}
                    </span>
                  </div>
                </div>
              </div>

              {/* SMTP User */}
              <div className="space-y-2">
                <Label htmlFor="user">SMTP Username / Email *</Label>
                <Input
                  id="user"
                  type="email"
                  placeholder="your-email@example.com"
                  value={formData.user}
                  onChange={(e) => setFormData({ ...formData, user: e.target.value })}
                  required
                />
              </div>

              {/* SMTP Password */}
              <div className="space-y-2">
                <Label htmlFor="password">SMTP Password *</Label>
                <div className="relative">
                  <Input
                    id="password"
                    type={showPassword ? "text" : "password"}
                    placeholder={settings ? "Leave empty to keep current password" : "Enter password"}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    required={!settings}
                    className="pr-10"
                  />
                  <Button
                    type="button"
                    variant="ghost"
                    size="sm"
                    className="absolute right-0 top-0 h-full px-3 hover:bg-transparent"
                    onClick={() => setShowPassword(!showPassword)}
                  >
                    {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                  </Button>
                </div>
                <p className="text-sm text-muted-foreground">
                  For Gmail, use an App Password instead of your account password
                </p>
              </div>

              {/* From Email */}
              <div className="space-y-2">
                <Label htmlFor="fromEmail">From Email Address *</Label>
                <Input
                  id="fromEmail"
                  type="email"
                  placeholder="noreply@gross-ict.ch"
                  value={formData.fromEmail}
                  onChange={(e) => setFormData({ ...formData, fromEmail: e.target.value })}
                  required
                />
              </div>

              {/* From Name */}
              <div className="space-y-2">
                <Label htmlFor="fromName">From Name *</Label>
                <Input
                  id="fromName"
                  type="text"
                  placeholder="Gross ICT"
                  value={formData.fromName}
                  onChange={(e) => setFormData({ ...formData, fromName: e.target.value })}
                  required
                />
              </div>

              {/* Last Test Status */}
              {settings?.lastTestStatus && (
                <div className="p-4 rounded-lg bg-muted">
                  <div className="flex items-center gap-2">
                    {settings.lastTestStatus === "success" ? (
                      <>
                        <CheckCircle2 className="w-5 h-5 text-green-600" />
                        <span className="text-sm font-medium">Last test: Successful</span>
                      </>
                    ) : (
                      <>
                        <XCircle className="w-5 h-5 text-red-600" />
                        <span className="text-sm font-medium">Last test: Failed</span>
                      </>
                    )}
                  </div>
                  {settings.lastTestedAt && (
                    <p className="text-sm text-muted-foreground mt-1">
                      Tested on {new Date(settings.lastTestedAt).toLocaleString()}
                    </p>
                  )}
                </div>
              )}

              {/* Actions */}
              <div className="flex gap-3">
                <Button
                  type="button"
                  variant="outline"
                  onClick={handleTest}
                  disabled={isTesting || upsertMutation.isPending}
                >
                  {isTesting ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Testing...
                    </>
                  ) : (
                    <>
                      <Mail className="w-4 h-4 mr-2" />
                      Test Connection
                    </>
                  )}
                </Button>

                <Button type="submit" disabled={upsertMutation.isPending || isTesting}>
                  {upsertMutation.isPending ? (
                    <>
                      <Loader2 className="w-4 h-4 mr-2 animate-spin" />
                      Saving...
                    </>
                  ) : (
                    "Save Settings"
                  )}
                </Button>
              </div>
            </form>
          </CardContent>
        </Card>

        {/* Help Section */}
        <Card className="mt-6">
          <CardHeader>
            <CardTitle>Common SMTP Providers</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-4 text-sm">
              <div>
                <h4 className="font-semibold mb-1">Gmail</h4>
                <p className="text-muted-foreground">
                  Host: smtp.gmail.com | Port: 587 | SSL: Off
                  <br />
                  Use App Password (not account password)
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Microsoft 365 / Outlook</h4>
                <p className="text-muted-foreground">
                  Host: smtp.office365.com | Port: 587 | SSL: Off
                </p>
              </div>
              <div>
                <h4 className="font-semibold mb-1">Custom Domain</h4>
                <p className="text-muted-foreground">
                  Contact your hosting provider for SMTP details
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
