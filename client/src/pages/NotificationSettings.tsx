import { useAuth } from "@/_core/hooks/useAuth";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
import { Switch } from "@/components/ui/switch";
import { Label } from "@/components/ui/label";
import { useLocation } from "wouter";
import { ArrowLeft, Bell, Mail, Smartphone, Save } from "lucide-react";
import { toast } from "sonner";
import { useState, useEffect } from "react";

export default function NotificationSettings() {
  const { user, loading: authLoading } = useAuth();
  const [, setLocation] = useLocation();

  // Notification preferences state
  const [emailNotifications, setEmailNotifications] = useState({
    newTickets: true,
    ticketUpdates: true,
    overdueInvoices: true,
    paymentReminders: true,
    systemAlerts: false,
  });

  const [pushNotifications, setPushNotifications] = useState({
    urgentTickets: true,
    mentions: true,
    assignedTickets: true,
    invoiceAlerts: false,
  });

  const [notificationCategories, setNotificationCategories] = useState({
    tickets: true,
    accounting: true,
    crm: false,
    system: false,
  });

  // Load saved preferences from localStorage
  useEffect(() => {
    const savedEmail = localStorage.getItem("emailNotifications");
    const savedPush = localStorage.getItem("pushNotifications");
    const savedCategories = localStorage.getItem("notificationCategories");

    if (savedEmail) setEmailNotifications(JSON.parse(savedEmail));
    if (savedPush) setPushNotifications(JSON.parse(savedPush));
    if (savedCategories) setNotificationCategories(JSON.parse(savedCategories));
  }, []);

  const handleSave = () => {
    // Save to localStorage (in production, this would be saved to database)
    localStorage.setItem("emailNotifications", JSON.stringify(emailNotifications));
    localStorage.setItem("pushNotifications", JSON.stringify(pushNotifications));
    localStorage.setItem("notificationCategories", JSON.stringify(notificationCategories));

    toast.success("Benachrichtigungs-Einstellungen gespeichert");
  };

  if (authLoading) {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-primary mx-auto"></div>
          <p className="mt-4 text-gray-400">Lädt...</p>
        </div>
      </div>
    );
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="min-h-screen bg-black text-white flex items-center justify-center">
        <div className="text-center">
          <h1 className="text-2xl font-bold mb-4">Zugriff verweigert</h1>
          <p className="text-gray-400 mb-6">Sie haben keine Berechtigung für diese Seite.</p>
          <Button onClick={() => setLocation("/")}>Zurück zur Startseite</Button>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-white/5 backdrop-blur-xl">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center gap-4">
            <Button
              variant="outline"
              size="sm"
              onClick={() => setLocation("/admin")}
              className="border-white/20 bg-white/5 hover:bg-white/10"
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Zurück
            </Button>
            <div>
              <h1 className="text-xl md:text-2xl font-bold">Benachrichtigungs-Einstellungen</h1>
              <p className="text-xs md:text-sm text-gray-400">Verwalten Sie Ihre Benachrichtigungs-Präferenzen</p>
            </div>
          </div>
        </div>
      </div>

      {/* Main Content */}
      <div className="container mx-auto px-4 py-8">
        <div className="max-w-4xl mx-auto space-y-6">
          {/* E-Mail Notifications */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-primary/20 rounded-lg">
                  <Mail className="h-5 w-5 text-primary" />
                </div>
                <div>
                  <CardTitle>E-Mail-Benachrichtigungen</CardTitle>
                  <CardDescription>Erhalten Sie Updates per E-Mail</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="email-new-tickets" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Neue Tickets</p>
                    <p className="text-sm text-gray-400">Benachrichtigung bei neuen Support-Tickets</p>
                  </div>
                </Label>
                <Switch
                  id="email-new-tickets"
                  checked={emailNotifications.newTickets}
                  onCheckedChange={(checked) =>
                    setEmailNotifications({ ...emailNotifications, newTickets: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-ticket-updates" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Ticket-Updates</p>
                    <p className="text-sm text-gray-400">Benachrichtigung bei Änderungen an Tickets</p>
                  </div>
                </Label>
                <Switch
                  id="email-ticket-updates"
                  checked={emailNotifications.ticketUpdates}
                  onCheckedChange={(checked) =>
                    setEmailNotifications({ ...emailNotifications, ticketUpdates: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-overdue-invoices" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Überfällige Rechnungen</p>
                    <p className="text-sm text-gray-400">Benachrichtigung bei überfälligen Zahlungen</p>
                  </div>
                </Label>
                <Switch
                  id="email-overdue-invoices"
                  checked={emailNotifications.overdueInvoices}
                  onCheckedChange={(checked) =>
                    setEmailNotifications({ ...emailNotifications, overdueInvoices: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-payment-reminders" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Zahlungserinnerungen</p>
                    <p className="text-sm text-gray-400">Benachrichtigung über Mahnungen</p>
                  </div>
                </Label>
                <Switch
                  id="email-payment-reminders"
                  checked={emailNotifications.paymentReminders}
                  onCheckedChange={(checked) =>
                    setEmailNotifications({ ...emailNotifications, paymentReminders: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="email-system-alerts" className="cursor-pointer">
                  <div>
                    <p className="font-medium">System-Benachrichtigungen</p>
                    <p className="text-sm text-gray-400">Wichtige System-Updates und Wartungen</p>
                  </div>
                </Label>
                <Switch
                  id="email-system-alerts"
                  checked={emailNotifications.systemAlerts}
                  onCheckedChange={(checked) =>
                    setEmailNotifications({ ...emailNotifications, systemAlerts: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Push Notifications */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-blue-500/20 rounded-lg">
                  <Smartphone className="h-5 w-5 text-blue-400" />
                </div>
                <div>
                  <CardTitle>Push-Benachrichtigungen</CardTitle>
                  <CardDescription>Sofortige Benachrichtigungen auf Ihrem Gerät</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="push-urgent-tickets" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Dringende Tickets</p>
                    <p className="text-sm text-gray-400">Sofortige Benachrichtigung bei dringenden Tickets</p>
                  </div>
                </Label>
                <Switch
                  id="push-urgent-tickets"
                  checked={pushNotifications.urgentTickets}
                  onCheckedChange={(checked) =>
                    setPushNotifications({ ...pushNotifications, urgentTickets: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-mentions" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Erwähnungen</p>
                    <p className="text-sm text-gray-400">Wenn Sie in Kommentaren erwähnt werden</p>
                  </div>
                </Label>
                <Switch
                  id="push-mentions"
                  checked={pushNotifications.mentions}
                  onCheckedChange={(checked) =>
                    setPushNotifications({ ...pushNotifications, mentions: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-assigned-tickets" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Zugewiesene Tickets</p>
                    <p className="text-sm text-gray-400">Wenn Ihnen ein Ticket zugewiesen wird</p>
                  </div>
                </Label>
                <Switch
                  id="push-assigned-tickets"
                  checked={pushNotifications.assignedTickets}
                  onCheckedChange={(checked) =>
                    setPushNotifications({ ...pushNotifications, assignedTickets: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="push-invoice-alerts" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Rechnungs-Benachrichtigungen</p>
                    <p className="text-sm text-gray-400">Updates zu Rechnungen und Zahlungen</p>
                  </div>
                </Label>
                <Switch
                  id="push-invoice-alerts"
                  checked={pushNotifications.invoiceAlerts}
                  onCheckedChange={(checked) =>
                    setPushNotifications({ ...pushNotifications, invoiceAlerts: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Notification Categories */}
          <Card className="bg-white/5 border-white/10">
            <CardHeader>
              <div className="flex items-center gap-3">
                <div className="p-2 bg-purple-500/20 rounded-lg">
                  <Bell className="h-5 w-5 text-purple-400" />
                </div>
                <div>
                  <CardTitle>Benachrichtigungs-Kategorien</CardTitle>
                  <CardDescription>Wählen Sie, welche Bereiche Sie benachrichtigen sollen</CardDescription>
                </div>
              </div>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center justify-between">
                <Label htmlFor="category-tickets" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Tickets & Support</p>
                    <p className="text-sm text-gray-400">Alle Benachrichtigungen zum Support-System</p>
                  </div>
                </Label>
                <Switch
                  id="category-tickets"
                  checked={notificationCategories.tickets}
                  onCheckedChange={(checked) =>
                    setNotificationCategories({ ...notificationCategories, tickets: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="category-accounting" className="cursor-pointer">
                  <div>
                    <p className="font-medium">Buchhaltung & Finanzen</p>
                    <p className="text-sm text-gray-400">Rechnungen, Zahlungen und Mahnungen</p>
                  </div>
                </Label>
                <Switch
                  id="category-accounting"
                  checked={notificationCategories.accounting}
                  onCheckedChange={(checked) =>
                    setNotificationCategories({ ...notificationCategories, accounting: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="category-crm" className="cursor-pointer">
                  <div>
                    <p className="font-medium">CRM & Kunden</p>
                    <p className="text-sm text-gray-400">Kundenverwaltung und Kontakte</p>
                  </div>
                </Label>
                <Switch
                  id="category-crm"
                  checked={notificationCategories.crm}
                  onCheckedChange={(checked) =>
                    setNotificationCategories({ ...notificationCategories, crm: checked })
                  }
                />
              </div>

              <div className="flex items-center justify-between">
                <Label htmlFor="category-system" className="cursor-pointer">
                  <div>
                    <p className="font-medium">System & Verwaltung</p>
                    <p className="text-sm text-gray-400">Benutzerverwaltung und System-Updates</p>
                  </div>
                </Label>
                <Switch
                  id="category-system"
                  checked={notificationCategories.system}
                  onCheckedChange={(checked) =>
                    setNotificationCategories({ ...notificationCategories, system: checked })
                  }
                />
              </div>
            </CardContent>
          </Card>

          {/* Save Button */}
          <div className="flex justify-end">
            <Button onClick={handleSave} className="bg-primary hover:bg-primary/90">
              <Save className="h-4 w-4 mr-2" />
              Einstellungen speichern
            </Button>
          </div>
        </div>
      </div>
    </div>
  );
}
