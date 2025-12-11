import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
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
  FileText,
  Plus,
  Edit,
  Trash2,
  Eye,
  ArrowLeft,
  Copy,
} from "lucide-react";
import { toast } from "sonner";
import { useLocation } from "wouter";

const TEMPLATE_CATEGORIES = [
  { value: "newsletter", label: "Newsletter" },
  { value: "promotional", label: "Promotional" },
  { value: "announcement", label: "Announcement" },
  { value: "transactional", label: "Transactional" },
  { value: "other", label: "Other" },
];

const DEFAULT_TEMPLATES = [
  {
    name: "Einfacher Newsletter",
    category: "newsletter",
    description: "Klassisches Newsletter-Design mit Header, Content und Footer",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Newsletter</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">
          <!-- Header -->
          <tr>
            <td style="background-color: #2563eb; padding: 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0; font-size: 28px;">Ihr Newsletter</h1>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Willkommen!</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 20px 0;">
                Dies ist Ihr Newsletter-Template. Passen Sie den Inhalt nach Ihren Wünschen an.
              </p>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Fügen Sie hier Ihre Nachrichten, Updates oder Angebote ein.
              </p>
              <table cellpadding="0" cellspacing="0" border="0">
                <tr>
                  <td style="background-color: #2563eb; border-radius: 6px; padding: 12px 30px;">
                    <a href="#" style="color: #ffffff; text-decoration: none; font-weight: bold; font-size: 16px;">Mehr erfahren</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 30px; text-align: center; border-top: 1px solid #e5e7eb;">
              <p style="color: #6b7280; font-size: 14px; margin: 0 0 10px 0;">
                © 2024 Ihr Unternehmen. Alle Rechte vorbehalten.
              </p>
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="#" style="color: #2563eb; text-decoration: none;">Abmelden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
  {
    name: "Promotional Banner",
    category: "promotional",
    description: "Auffälliges Design für Werbeaktionen und Angebote",
    htmlContent: `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>Promotion</title>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif; background-color: #f4f4f4;">
  <table width="100%" cellpadding="0" cellspacing="0" border="0" style="background-color: #f4f4f4;">
    <tr>
      <td align="center" style="padding: 40px 0;">
        <table width="600" cellpadding="0" cellspacing="0" border="0" style="background-color: #ffffff; border-radius: 8px; overflow: hidden;">
          <!-- Hero Banner -->
          <tr>
            <td style="background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); padding: 60px 30px; text-align: center;">
              <h1 style="color: #ffffff; margin: 0 0 15px 0; font-size: 36px; font-weight: bold;">Exklusives Angebot!</h1>
              <p style="color: #ffffff; font-size: 20px; margin: 0 0 30px 0;">Nur für kurze Zeit verfügbar</p>
              <table cellpadding="0" cellspacing="0" border="0" style="margin: 0 auto;">
                <tr>
                  <td style="background-color: #ffffff; border-radius: 50px; padding: 15px 40px;">
                    <a href="#" style="color: #667eea; text-decoration: none; font-weight: bold; font-size: 18px;">Jetzt zugreifen</a>
                  </td>
                </tr>
              </table>
            </td>
          </tr>
          <!-- Content -->
          <tr>
            <td style="padding: 40px 30px; text-align: center;">
              <h2 style="color: #1f2937; margin: 0 0 20px 0;">Verpassen Sie nicht diese Gelegenheit</h2>
              <p style="color: #4b5563; line-height: 1.6; margin: 0 0 30px 0;">
                Beschreiben Sie hier Ihr Angebot und die Vorteile für Ihre Kunden.
              </p>
            </td>
          </tr>
          <!-- Footer -->
          <tr>
            <td style="background-color: #f9fafb; padding: 20px; text-align: center;">
              <p style="color: #6b7280; font-size: 12px; margin: 0;">
                <a href="#" style="color: #667eea; text-decoration: none;">Abmelden</a>
              </p>
            </td>
          </tr>
        </table>
      </td>
    </tr>
  </table>
</body>
</html>`,
  },
];

export default function TemplateLibrary() {
  const [, setLocation] = useLocation();
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [selectedTemplate, setSelectedTemplate] = useState<any>(null);
  const [newTemplate, setNewTemplate] = useState({
    name: "",
    description: "",
    category: "",
    htmlContent: "",
  });

  // Fetch templates
  const {
    data: templates,
    isLoading,
    refetch,
  } = trpc.newsletter.templates.list.useQuery();

  // Create template mutation
  const createMutation = trpc.newsletter.templates.create.useMutation({
    onSuccess: () => {
      toast.success("Template erstellt");
      setIsCreateDialogOpen(false);
      setNewTemplate({ name: "", description: "", category: "", htmlContent: "" });
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Delete template mutation
  const deleteMutation = trpc.newsletter.templates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleCreate = () => {
    if (!newTemplate.name || !newTemplate.htmlContent) {
      toast.error("Name und HTML-Content sind erforderlich");
      return;
    }

    createMutation.mutate({
      name: newTemplate.name,
      description: newTemplate.description || undefined,
      category: newTemplate.category || undefined,
      htmlContent: newTemplate.htmlContent,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie dieses Template wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleUseDefaultTemplate = (template: typeof DEFAULT_TEMPLATES[0]) => {
    setNewTemplate({
      name: template.name,
      description: template.description,
      category: template.category,
      htmlContent: template.htmlContent,
    });
    setIsCreateDialogOpen(true);
  };

  const getCategoryBadge = (category: string | null) => {
    if (!category) return null;
    const cat = TEMPLATE_CATEGORIES.find((c) => c.value === category);
    return (
      <Badge variant="outline" className="text-xs">
        {cat?.label || category}
      </Badge>
    );
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
                <div className="p-2 bg-indigo-500/10 rounded-lg">
                  <FileText className="w-6 h-6 text-indigo-600" />
                </div>
                <h1 className="text-3xl font-bold text-gray-900 dark:text-white">
                  Template-Bibliothek
                </h1>
              </div>
              <p className="text-gray-600 dark:text-gray-400">
                Verwalten Sie wiederverwendbare E-Mail-Templates
              </p>
            </div>
            <Button
              onClick={() => setIsCreateDialogOpen(true)}
              className="bg-indigo-600 hover:bg-indigo-700"
            >
              <Plus className="w-4 h-4 mr-2" />
              Neues Template
            </Button>
          </div>
        </div>

        {/* Default Templates */}
        <Card className="bg-white dark:bg-gray-800 mb-6">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Vorgefertigte Templates
            </h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {DEFAULT_TEMPLATES.map((template, index) => (
                <div
                  key={index}
                  className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 transition-colors"
                >
                  <div className="flex items-start justify-between mb-2">
                    <div>
                      <h3 className="font-medium text-gray-900 dark:text-white">
                        {template.name}
                      </h3>
                      <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                        {template.description}
                      </p>
                    </div>
                    {getCategoryBadge(template.category)}
                  </div>
                  <div className="flex gap-2 mt-4">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => {
                      setSelectedTemplate(template);
                      setIsPreviewDialogOpen(true);
                    }}
                  >
                    <Eye className="w-4 h-4 mr-2" />
                    Vorschau
                  </Button>
                  <Button
                    size="sm"
                    onClick={() => handleUseDefaultTemplate(template)}
                    className="bg-indigo-600 hover:bg-indigo-700"
                  >
                    <Copy className="w-4 h-4 mr-2" />
                    Verwenden
                  </Button>
                  </div>
                </div>
              ))}
            </div>
          </div>
        </Card>

        {/* Custom Templates */}
        <Card className="bg-white dark:bg-gray-800">
          <div className="p-6">
            <h2 className="text-xl font-semibold mb-4 text-gray-900 dark:text-white">
              Eigene Templates
            </h2>
            {isLoading ? (
              <div className="flex justify-center py-12">
                <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600"></div>
              </div>
            ) : !templates || templates.length === 0 ? (
              <div className="text-center py-12">
                <FileText className="w-16 h-16 text-gray-400 mx-auto mb-4" />
                <p className="text-gray-500 mb-4">Noch keine eigenen Templates erstellt</p>
                <Button
                  onClick={() => setIsCreateDialogOpen(true)}
                  variant="outline"
                >
                  <Plus className="w-4 h-4 mr-2" />
                  Erstes Template erstellen
                </Button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                {templates.map((template) => (
                  <div
                    key={template.id}
                    className="p-4 border border-gray-200 dark:border-gray-700 rounded-lg hover:border-indigo-500 transition-colors"
                  >
                    <div className="flex items-start justify-between mb-2">
                      <div className="flex-1">
                        <h3 className="font-medium text-gray-900 dark:text-white">
                          {template.name}
                        </h3>
                        {template.description && (
                          <p className="text-sm text-gray-600 dark:text-gray-400 mt-1">
                            {template.description}
                          </p>
                        )}
                      </div>
                      {getCategoryBadge(template.category)}
                    </div>
                    <div className="flex gap-2 mt-4">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => {
                          setSelectedTemplate(template);
                          setIsPreviewDialogOpen(true);
                        }}
                      >
                        <Eye className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() =>
                          setLocation(`/newsletter/templates/${template.id}/edit`)
                        }
                      >
                        <Edit className="w-4 h-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleDelete(template.id)}
                      >
                        <Trash2 className="w-4 h-4" />
                      </Button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        </Card>

        {/* Create Template Dialog */}
        <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
            <DialogHeader>
              <DialogTitle>Neues Template erstellen</DialogTitle>
              <DialogDescription>
                Erstellen Sie ein wiederverwendbares E-Mail-Template
              </DialogDescription>
            </DialogHeader>
            <div className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Template-Name *
                  </label>
                  <Input
                    placeholder="z.B. Monatlicher Newsletter"
                    value={newTemplate.name}
                    onChange={(e) =>
                      setNewTemplate({ ...newTemplate, name: e.target.value })
                    }
                  />
                </div>
                <div>
                  <label className="text-sm font-medium mb-2 block">
                    Kategorie
                  </label>
                  <Select
                    value={newTemplate.category}
                    onValueChange={(value) =>
                      setNewTemplate({ ...newTemplate, category: value })
                    }
                  >
                    <SelectTrigger>
                      <SelectValue placeholder="Kategorie wählen" />
                    </SelectTrigger>
                    <SelectContent>
                      {TEMPLATE_CATEGORIES.map((cat) => (
                        <SelectItem key={cat.value} value={cat.value}>
                          {cat.label}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  Beschreibung
                </label>
                <Input
                  placeholder="Optionale Beschreibung"
                  value={newTemplate.description}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      description: e.target.value,
                    })
                  }
                />
              </div>
              <div>
                <label className="text-sm font-medium mb-2 block">
                  HTML-Content *
                </label>
                <Textarea
                  placeholder="Fügen Sie hier Ihren HTML-Code ein..."
                  value={newTemplate.htmlContent}
                  onChange={(e) =>
                    setNewTemplate({
                      ...newTemplate,
                      htmlContent: e.target.value,
                    })
                  }
                  rows={15}
                  className="font-mono text-sm"
                />
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
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                {createMutation.isPending ? "Erstelle..." : "Template erstellen"}
              </Button>
            </DialogFooter>
          </DialogContent>
        </Dialog>

        {/* Preview Dialog */}
        <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
          <DialogContent className="max-w-4xl max-h-[90vh]">
            <DialogHeader>
              <DialogTitle>
                {selectedTemplate?.name || "Template-Vorschau"}
              </DialogTitle>
            </DialogHeader>
            <div className="border rounded-lg overflow-hidden bg-white">
              <iframe
                srcDoc={selectedTemplate?.htmlContent}
                className="w-full h-[600px] border-0"
                title="Template Preview"
              />
            </div>
          </DialogContent>
        </Dialog>
      </div>
    </div>
  );
}
