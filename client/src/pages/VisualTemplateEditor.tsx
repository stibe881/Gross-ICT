import { useState } from "react";
import { useLocation, useParams } from "wouter";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Label } from "@/components/ui/label";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card } from "@/components/ui/card";
import { ArrowLeft, Save, Eye } from "lucide-react";
import { toast } from "sonner";
import EmailBuilderLazy from "@/components/EmailBuilderLazy";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";

const TEMPLATE_CATEGORIES = [
  { value: "newsletter", label: "Newsletter" },
  { value: "promotional", label: "Promotional" },
  { value: "announcement", label: "Announcement" },
  { value: "transactional", label: "Transactional" },
  { value: "other", label: "Other" },
];

export default function VisualTemplateEditor() {
  const [, setLocation] = useLocation();
  const params = useParams<{ id: string }>();
  const templateId = params.id === "new" ? null : Number(params.id);

  const [templateData, setTemplateData] = useState({
    name: "",
    description: "",
    category: "",
    htmlContent: "",
    cssContent: "",
  });
  const [showPreview, setShowPreview] = useState(false);

  // Fetch template if editing
  const { data: existingTemplate } = trpc.newsletter.templates.list.useQuery(
    undefined,
    {
      enabled: !!templateId,
      select: (templates) =>
        templates.find((t) => t.id === templateId),
    }
  );

  // Set initial data when template is loaded
  useState(() => {
    if (existingTemplate) {
      setTemplateData({
        name: existingTemplate.name,
        description: existingTemplate.description || "",
        category: existingTemplate.category || "",
        htmlContent: existingTemplate.htmlContent,
        cssContent: "",
      });
    }
  });

  // Create template mutation
  const createMutation = trpc.newsletter.templates.create.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich erstellt");
      setLocation("/newsletter/templates");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  // Update template mutation
  const updateMutation = trpc.newsletter.templates.update.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich aktualisiert");
      setLocation("/newsletter/templates");
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const handleSave = () => {
    if (!templateData.name || !templateData.htmlContent) {
      toast.error("Name und Inhalt sind erforderlich");
      return;
    }

    // Combine HTML and CSS
    const fullHtml = `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>${templateData.name}</title>
  <style>${templateData.cssContent}</style>
</head>
<body>
  ${templateData.htmlContent}
</body>
</html>`;

    if (templateId) {
      updateMutation.mutate({
        id: templateId,
        name: templateData.name,
        description: templateData.description || undefined,
        category: templateData.category || undefined,
        htmlContent: fullHtml,
      });
    } else {
      createMutation.mutate({
        name: templateData.name,
        description: templateData.description || undefined,
        category: templateData.category || undefined,
        htmlContent: fullHtml,
      });
    }
  };

  const handleBuilderChange = (html: string, css: string) => {
    setTemplateData({
      ...templateData,
      htmlContent: html,
      cssContent: css,
    });
  };

  const getPreviewHtml = () => {
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <style>${templateData.cssContent}</style>
</head>
<body style="margin: 0; padding: 0; font-family: Arial, sans-serif;">
  ${templateData.htmlContent}
</body>
</html>`;
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-50 to-gray-100 dark:from-gray-900 dark:to-gray-800">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 sticky top-0 z-10">
        <div className="container mx-auto px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Button
                onClick={() => setLocation("/newsletter/templates")}
                variant="ghost"
                size="sm"
              >
                <ArrowLeft className="w-4 h-4 mr-2" />
                Zurück
              </Button>
              <h1 className="text-2xl font-bold text-gray-900 dark:text-white">
                {templateId ? "Template bearbeiten" : "Neues Template erstellen"}
              </h1>
            </div>
            <div className="flex items-center gap-2">
              <Button
                onClick={() => setShowPreview(true)}
                variant="outline"
                disabled={!templateData.htmlContent}
              >
                <Eye className="w-4 h-4 mr-2" />
                Vorschau
              </Button>
              <Button
                onClick={handleSave}
                disabled={createMutation.isPending || updateMutation.isPending}
                className="bg-indigo-600 hover:bg-indigo-700"
              >
                <Save className="w-4 h-4 mr-2" />
                {createMutation.isPending || updateMutation.isPending
                  ? "Speichere..."
                  : "Speichern"}
              </Button>
            </div>
          </div>
        </div>
      </div>

      {/* Template Settings */}
      <div className="container mx-auto px-6 py-6">
        <Card className="p-6 mb-6 bg-white dark:bg-gray-800">
          <h2 className="text-lg font-semibold mb-4 text-gray-900 dark:text-white">
            Template-Einstellungen
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <Label htmlFor="name">Template-Name *</Label>
              <Input
                id="name"
                placeholder="z.B. Monatlicher Newsletter"
                value={templateData.name}
                onChange={(e) =>
                  setTemplateData({ ...templateData, name: e.target.value })
                }
                className="mt-2"
              />
            </div>
            <div>
              <Label htmlFor="category">Kategorie</Label>
              <Select
                value={templateData.category}
                onValueChange={(value) =>
                  setTemplateData({ ...templateData, category: value })
                }
              >
                <SelectTrigger className="mt-2">
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
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Input
                id="description"
                placeholder="Optionale Beschreibung"
                value={templateData.description}
                onChange={(e) =>
                  setTemplateData({
                    ...templateData,
                    description: e.target.value,
                  })
                }
                className="mt-2"
              />
            </div>
          </div>
        </Card>

        {/* Visual Builder */}
        <Card className="p-0 bg-white dark:bg-gray-800 overflow-hidden">
          <EmailBuilderLazy
            initialContent={templateData.htmlContent}
            onChange={handleBuilderChange}
            onSave={handleSave}
          />
        </Card>
      </div>

      {/* Preview Dialog */}
      <Dialog open={showPreview} onOpenChange={setShowPreview}>
        <DialogContent className="max-w-4xl max-h-[90vh]">
          <DialogHeader>
            <DialogTitle>Template-Vorschau</DialogTitle>
          </DialogHeader>
          <div className="border rounded-lg overflow-hidden bg-white">
            <iframe
              srcDoc={getPreviewHtml()}
              className="w-full h-[600px] border-0"
              title="Template Preview"
            />
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}
