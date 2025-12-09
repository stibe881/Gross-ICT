import { useState, useEffect } from "react";
import { useLocation, useParams, useRoute } from "wouter";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import { Textarea } from "@/components/ui/textarea";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Switch } from "@/components/ui/switch";
import {
  ArrowLeft,
  Send,
  Save,
  Eye,
  Mail,
  Calendar,
  Users,
  FileText,
} from "lucide-react";
import { toast } from "sonner";

export default function CampaignEditor() {
  const [, setLocation] = useLocation();
  const [, params] = useRoute("/newsletter/campaigns/:id");
  const campaignId = params?.id === "new" ? null : Number(params?.id);

  const [step, setStep] = useState(1);
  const [campaignData, setCampaignData] = useState({
    name: "",
    subject: "",
    subjectB: "",
    preheader: "",
    htmlContent: "",
    recipientType: "all" as "all" | "segment" | "custom",
    segmentId: undefined as number | undefined,
    scheduledAt: "",
    abTestEnabled: false,
    abTestSplitPercent: 50,
    templateId: undefined as number | undefined,
  });

  const [testEmail, setTestEmail] = useState("");
  const [showPreview, setShowPreview] = useState(false);

  // Fetch campaign if editing
  const { data: existingCampaign } = trpc.newsletter.campaigns.getById.useQuery(
    { id: campaignId! },
    { enabled: !!campaignId }
  );

  // Fetch templates
  const { data: templates } = trpc.newsletter.templates.list.useQuery();

  // Fetch subscriber stats for recipient count
  const { data: subscriberStats } = trpc.newsletter.subscribers.stats.useQuery();

  useEffect(() => {
    if (existingCampaign?.campaign) {
      const c = existingCampaign.campaign;
      setCampaignData({
        name: c.name,
        subject: c.subject,
        subjectB: c.subjectB || "",
        preheader: c.preheader || "",
        htmlContent: c.htmlContent,
        recipientType: c.recipientType as "all" | "segment" | "custom",
        segmentId: c.segmentId || undefined,
        scheduledAt: c.scheduledAt
          ? new Date(c.scheduledAt).toISOString().slice(0, 16)
          : "",
        abTestEnabled: c.abTestEnabled,
        abTestSplitPercent: c.abTestSplitPercent || 50,
        templateId: c.templateId || undefined,
      });
    }
  }, [existingCampaign]);

  // Create campaign mutation
  const createCampaignMutation = trpc.newsletter.campaigns.create.useMutation({
    onSuccess: (data) => {
      toast.success("Kampagne erfolgreich erstellt");
      setLocation(`/newsletter/campaigns/${data.id}`);
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Update campaign mutation
  const updateCampaignMutation = trpc.newsletter.campaigns.update.useMutation({
    onSuccess: () => {
      toast.success("Kampagne erfolgreich aktualisiert");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Send test email mutation
  const sendTestMutation = trpc.newsletter.campaigns.sendTest.useMutation({
    onSuccess: () => {
      toast.success("Test-E-Mail erfolgreich versendet");
      setTestEmail("");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSave = (status?: "draft" | "scheduled") => {
    if (!campaignData.name || !campaignData.subject || !campaignData.htmlContent) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    const payload = {
      ...campaignData,
      scheduledAt: campaignData.scheduledAt || undefined,
    };

    if (campaignId) {
      updateCampaignMutation.mutate({
        id: campaignId,
        ...payload,
        status,
      });
    } else {
      createCampaignMutation.mutate(payload);
    }
  };

  const handleSendTest = () => {
    if (!testEmail) {
      toast.error("Bitte geben Sie eine Test-E-Mail-Adresse ein");
      return;
    }
    if (!campaignId) {
      toast.error("Bitte speichern Sie die Kampagne zuerst");
      return;
    }
    sendTestMutation.mutate({ campaignId, testEmail });
  };

  const handleTemplateSelect = (templateId: string) => {
    const template = templates?.find((t) => t.id === Number(templateId));
    if (template) {
      setCampaignData({
        ...campaignData,
        templateId: template.id,
        htmlContent: template.htmlContent,
      });
      toast.success("Template geladen");
    }
  };

  const getRecipientCount = () => {
    if (campaignData.recipientType === "all") {
      return subscriberStats?.active || 0;
    }
    return 0; // TODO: Calculate based on segment
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800 p-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="mb-8">
          <Button
            variant="ghost"
            onClick={() => setLocation("/newsletter")}
            className="mb-4"
          >
            <ArrowLeft className="w-4 h-4 mr-2" />
            Zurück zum Dashboard
          </Button>
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                {campaignId ? "Kampagne bearbeiten" : "Neue Kampagne erstellen"}
              </h1>
              <p className="text-gray-600 dark:text-gray-400 mt-1">
                Erstellen Sie eine professionelle Newsletter-Kampagne
              </p>
            </div>
            <div className="flex gap-2">
              <Button variant="outline" onClick={() => handleSave("draft")}>
                <Save className="w-4 h-4 mr-2" />
                Als Entwurf speichern
              </Button>
              <Button
                onClick={() => handleSave("scheduled")}
                className="bg-blue-600 hover:bg-blue-700"
                disabled={!campaignData.scheduledAt}
              >
                <Calendar className="w-4 h-4 mr-2" />
                Planen
              </Button>
            </div>
          </div>
        </div>

        {/* Progress Steps */}
        <div className="mb-8">
          <div className="flex items-center justify-between">
            {[
              { num: 1, label: "Grundeinstellungen", icon: FileText },
              { num: 2, label: "Empfänger", icon: Users },
              { num: 3, label: "Inhalt", icon: Mail },
              { num: 4, label: "Vorschau & Versand", icon: Send },
            ].map((s, idx) => (
              <div key={s.num} className="flex items-center flex-1">
                <div
                  className={`flex items-center gap-3 cursor-pointer ${
                    step === s.num ? "text-blue-600" : "text-gray-400"
                  }`}
                  onClick={() => setStep(s.num)}
                >
                  <div
                    className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      step === s.num
                        ? "bg-blue-600 text-white"
                        : "bg-gray-200 dark:bg-gray-700"
                    }`}
                  >
                    <s.icon className="w-5 h-5" />
                  </div>
                  <span className="font-medium hidden md:block">{s.label}</span>
                </div>
                {idx < 3 && (
                  <div className="flex-1 h-0.5 bg-gray-200 dark:bg-gray-700 mx-4" />
                )}
              </div>
            ))}
          </div>
        </div>

        {/* Step Content */}
        <Card className="p-8 bg-white dark:bg-gray-800">
          {/* Step 1: Basic Settings */}
          {step === 1 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Grundeinstellungen</h2>

              <div>
                <Label htmlFor="name">Kampagnenname *</Label>
                <Input
                  id="name"
                  placeholder="z.B. Newsletter März 2024"
                  value={campaignData.name}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, name: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="subject">Betreffzeile *</Label>
                <Input
                  id="subject"
                  placeholder="z.B. Ihre monatlichen Updates"
                  value={campaignData.subject}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, subject: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div className="flex items-center gap-4 p-4 bg-gray-50 dark:bg-gray-700/50 rounded-lg">
                <Switch
                  checked={campaignData.abTestEnabled}
                  onCheckedChange={(checked) =>
                    setCampaignData({ ...campaignData, abTestEnabled: checked })
                  }
                />
                <div className="flex-1">
                  <Label>A/B-Testing aktivieren</Label>
                  <p className="text-sm text-gray-500">
                    Testen Sie zwei verschiedene Betreffzeilen
                  </p>
                </div>
              </div>

              {campaignData.abTestEnabled && (
                <div>
                  <Label htmlFor="subjectB">Alternative Betreffzeile (B)</Label>
                  <Input
                    id="subjectB"
                    placeholder="z.B. Verpassen Sie nicht unsere Updates"
                    value={campaignData.subjectB}
                    onChange={(e) =>
                      setCampaignData({ ...campaignData, subjectB: e.target.value })
                    }
                    className="mt-2"
                  />
                </div>
              )}

              <div>
                <Label htmlFor="preheader">Preheader (optional)</Label>
                <Input
                  id="preheader"
                  placeholder="Kurze Vorschau, die in E-Mail-Clients angezeigt wird"
                  value={campaignData.preheader}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, preheader: e.target.value })
                  }
                  className="mt-2"
                />
              </div>

              <div>
                <Label htmlFor="scheduledAt">Versandzeitpunkt (optional)</Label>
                <Input
                  id="scheduledAt"
                  type="datetime-local"
                  value={campaignData.scheduledAt}
                  onChange={(e) =>
                    setCampaignData({ ...campaignData, scheduledAt: e.target.value })
                  }
                  className="mt-2"
                />
                <p className="text-sm text-gray-500 mt-1">
                  Leer lassen für sofortigen Versand
                </p>
              </div>

              <div className="flex justify-end">
                <Button onClick={() => setStep(2)}>
                  Weiter
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 2: Recipients */}
          {step === 2 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Empfänger auswählen</h2>

              <div>
                <Label>Empfängergruppe</Label>
                <Select
                  value={campaignData.recipientType}
                  onValueChange={(value: "all" | "segment" | "custom") =>
                    setCampaignData({ ...campaignData, recipientType: value })
                  }
                >
                  <SelectTrigger className="mt-2">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle aktiven Abonnenten</SelectItem>
                    <SelectItem value="segment">Segment auswählen</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>

              <Card className="p-6 bg-blue-50 dark:bg-blue-900/20 border-blue-200 dark:border-blue-800">
                <div className="flex items-center gap-3">
                  <Users className="w-8 h-8 text-blue-600" />
                  <div>
                    <p className="font-semibold text-gray-900 dark:text-white">
                      Geschätzte Empfänger
                    </p>
                    <p className="text-2xl font-bold text-blue-600">
                      {getRecipientCount()}
                    </p>
                  </div>
                </div>
              </Card>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(1)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                <Button onClick={() => setStep(3)}>
                  Weiter
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 3: Content */}
          {step === 3 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Inhalt erstellen</h2>

              {templates && templates.length > 0 && (
                <div>
                  <Label>Template auswählen (optional)</Label>
                  <Select onValueChange={handleTemplateSelect}>
                    <SelectTrigger className="mt-2">
                      <SelectValue placeholder="Wählen Sie ein Template" />
                    </SelectTrigger>
                    <SelectContent>
                      {templates.map((template) => (
                        <SelectItem key={template.id} value={String(template.id)}>
                          {template.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              )}

              <Tabs defaultValue="editor" className="w-full">
                <TabsList>
                  <TabsTrigger value="editor">HTML Editor</TabsTrigger>
                  <TabsTrigger value="preview">Vorschau</TabsTrigger>
                </TabsList>

                <TabsContent value="editor" className="mt-4">
                  <Label htmlFor="htmlContent">HTML-Inhalt *</Label>
                  <Textarea
                    id="htmlContent"
                    placeholder="<html>...</html>"
                    value={campaignData.htmlContent}
                    onChange={(e) =>
                      setCampaignData({
                        ...campaignData,
                        htmlContent: e.target.value,
                      })
                    }
                    className="mt-2 font-mono text-sm"
                    rows={20}
                  />
                </TabsContent>

                <TabsContent value="preview" className="mt-4">
                  <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 min-h-[400px]">
                    <div
                      dangerouslySetInnerHTML={{ __html: campaignData.htmlContent }}
                    />
                  </div>
                </TabsContent>
              </Tabs>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(2)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                <Button onClick={() => setStep(4)}>
                  Weiter
                  <ArrowLeft className="w-4 h-4 ml-2 rotate-180" />
                </Button>
              </div>
            </div>
          )}

          {/* Step 4: Preview & Send */}
          {step === 4 && (
            <div className="space-y-6">
              <h2 className="text-2xl font-semibold mb-6">Vorschau & Versand</h2>

              <Card className="p-6 bg-gray-50 dark:bg-gray-700/50">
                <h3 className="font-semibold mb-4">Kampagnen-Zusammenfassung</h3>
                <div className="space-y-2 text-sm">
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">Name:</span>
                    <span className="font-medium">{campaignData.name}</span>
                  </div>
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Betreff:
                    </span>
                    <span className="font-medium">{campaignData.subject}</span>
                  </div>
                  {campaignData.abTestEnabled && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Betreff B:
                      </span>
                      <span className="font-medium">{campaignData.subjectB}</span>
                    </div>
                  )}
                  <div className="flex justify-between">
                    <span className="text-gray-600 dark:text-gray-400">
                      Empfänger:
                    </span>
                    <span className="font-medium">{getRecipientCount()}</span>
                  </div>
                  {campaignData.scheduledAt && (
                    <div className="flex justify-between">
                      <span className="text-gray-600 dark:text-gray-400">
                        Geplant für:
                      </span>
                      <span className="font-medium">
                        {new Date(campaignData.scheduledAt).toLocaleString("de-CH")}
                      </span>
                    </div>
                  )}
                </div>
              </Card>

              <div>
                <Label>Test-E-Mail senden</Label>
                <div className="flex gap-2 mt-2">
                  <Input
                    type="email"
                    placeholder="test@example.com"
                    value={testEmail}
                    onChange={(e) => setTestEmail(e.target.value)}
                  />
                  <Button
                    onClick={handleSendTest}
                    disabled={sendTestMutation.isPending || !campaignId}
                  >
                    <Mail className="w-4 h-4 mr-2" />
                    Senden
                  </Button>
                </div>
                {!campaignId && (
                  <p className="text-sm text-amber-600 mt-1">
                    Speichern Sie die Kampagne zuerst, um Test-E-Mails zu senden
                  </p>
                )}
              </div>

              <div className="border rounded-lg p-6 bg-white dark:bg-gray-900 max-h-[500px] overflow-auto">
                <h3 className="font-semibold mb-4">E-Mail-Vorschau</h3>
                <div dangerouslySetInnerHTML={{ __html: campaignData.htmlContent }} />
              </div>

              <div className="flex justify-between">
                <Button variant="outline" onClick={() => setStep(3)}>
                  <ArrowLeft className="w-4 h-4 mr-2" />
                  Zurück
                </Button>
                <div className="flex gap-2">
                  <Button variant="outline" onClick={() => handleSave("draft")}>
                    <Save className="w-4 h-4 mr-2" />
                    Speichern
                  </Button>
                  <Button
                    onClick={() => handleSave("scheduled")}
                    className="bg-blue-600 hover:bg-blue-700"
                    disabled={!campaignData.scheduledAt}
                  >
                    <Send className="w-4 h-4 mr-2" />
                    {campaignData.scheduledAt ? "Planen" : "Jetzt senden"}
                  </Button>
                </div>
              </div>
            </div>
          )}
        </Card>
      </div>
    </div>
  );
}
