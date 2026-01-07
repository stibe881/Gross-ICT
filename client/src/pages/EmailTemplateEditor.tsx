import { useState } from "react";
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from "@/components/ui/card";
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
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
} from "@/components/ui/dialog";
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from "@/components/ui/table";
import { Badge } from "@/components/ui/badge";
import { Switch } from "@/components/ui/switch";
import {
  Plus,
  Edit,
  Trash2,
  Copy,
  Eye,
  Save,
  X,
  Code,
  FileText,
} from "lucide-react";
import { trpc } from "@/lib/trpc";
import { toast } from "sonner";
import EmailBuilder from "@/components/EmailBuilder";

type TemplateCategory = "kundenakquise" | "newsletter" | "custom";

export default function EmailTemplateEditor() {
  const [selectedTemplate, setSelectedTemplate] = useState<number | null>(null);
  const [isCreateDialogOpen, setIsCreateDialogOpen] = useState(false);
  const [isEditDialogOpen, setIsEditDialogOpen] = useState(false);
  const [isPreviewDialogOpen, setIsPreviewDialogOpen] = useState(false);
  const [filterCategory, setFilterCategory] = useState<string>("all");
  const [filterActive, setFilterActive] = useState(false);

  // Form state
  const [formData, setFormData] = useState({
    name: "",
    title: "",
    description: "",
    subject: "",
    body: "",
    designJson: "",
    category: "custom" as TemplateCategory,
    isActive: true,
    placeholders: [] as string[],
  });

  // Fetch templates
  const { data: templates, refetch } = trpc.emailTemplates.list.useQuery({
    category: filterCategory === "all" ? undefined : (filterCategory as any),
    activeOnly: filterActive,
  });

  // Mutations
  const createMutation = trpc.emailTemplates.create.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich erstellt");
      setIsCreateDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.emailTemplates.update.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich aktualisiert");
      setIsEditDialogOpen(false);
      resetForm();
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.emailTemplates.delete.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich gelöscht");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const duplicateMutation = trpc.emailTemplates.duplicate.useMutation({
    onSuccess: () => {
      toast.success("Template erfolgreich dupliziert");
      refetch();
    },
    onError: (error) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setFormData({
      name: "",
      title: "",
      description: "",
      subject: "",
      body: "",
      designJson: "",
      category: "custom",
      isActive: true,
      placeholders: [],
    });
    setSelectedTemplate(null);
  };

  const handleCreate = () => {
    createMutation.mutate(formData);
  };

  const handleUpdate = () => {
    if (!selectedTemplate) return;
    updateMutation.mutate({
      id: selectedTemplate,
      ...formData,
    });
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie dieses Template wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const handleDuplicate = (id: number, name: string) => {
    const newName = prompt("Neuer Name für das duplizierte Template:", `${name}_copy`);
    if (newName) {
      duplicateMutation.mutate({ id, newName });
    }
  };

  const handleEdit = (template: any) => {
    setSelectedTemplate(template.id);
    setFormData({
      name: template.name,
      title: template.title,
      description: template.description || "",
      subject: template.subject,
      body: template.body,
      designJson: template.designJson || "",
      category: template.category,
      isActive: template.isActive,
      placeholders: template.placeholders ? JSON.parse(template.placeholders) : [],
    });
    setIsEditDialogOpen(true);
  };

  const handlePreview = (template: any) => {
    setFormData({
      name: template.name,
      title: template.title,
      description: template.description || "",
      subject: template.subject,
      body: template.body,
      category: template.category,
      isActive: template.isActive,
      placeholders: template.placeholders ? JSON.parse(template.placeholders) : [],
    });
    setIsPreviewDialogOpen(true);
  };

  const getCategoryBadge = (category: string) => {
    const variants: Record<string, { variant: "default" | "secondary" | "outline"; label: string }> = {
      kundenakquise: { variant: "default", label: "Kundenakquise" },
      newsletter: { variant: "secondary", label: "Newsletter" },
      custom: { variant: "outline", label: "Benutzerdefiniert" },
    };
    const config = variants[category] || variants.custom;
    return <Badge variant={config.variant}>{config.label}</Badge>;
  };

  // Common placeholders
  const commonPlaceholders = [
    "{{customerName}}",
    "{{customerEmail}}",
    "{{ticketId}}",
    "{{ticketSubject}}",
    "{{invoiceNumber}}",
    "{{amount}}",
    "{{dueDate}}",
    "{{companyName}}",
  ];

  const insertPlaceholder = (placeholder: string) => {
    setFormData({
      ...formData,
      body: formData.body + placeholder,
    });
  };

  return (
    <div className="container mx-auto py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">Template-Editor</h1>
          <p className="text-muted-foreground">Erstellen und verwalten Sie Template-Vorlagen</p>
        </div>
        <Button onClick={() => setIsCreateDialogOpen(true)} aria-label="Neues Template erstellen">
          <Plus className="h-4 w-4 mr-2" aria-hidden="true" />
          Neues Template
        </Button>
      </div>

      {/* Filters */}
      <Card className="mb-6">
        <CardHeader>
          <CardTitle>Filter</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="flex gap-4 items-center">
            <div className="flex-1">
              <Label>Kategorie</Label>
              <Select value={filterCategory} onValueChange={setFilterCategory}>
                <SelectTrigger aria-label="Kategorie filtern">
                  <SelectValue />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">Alle</SelectItem>
                  <SelectItem value="kundenakquise">Kundenakquise</SelectItem>
                  <SelectItem value="newsletter">Newsletter</SelectItem>
                  <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                </SelectContent>
              </Select>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={filterActive}
                onCheckedChange={setFilterActive}
                aria-label="Nur aktive Templates anzeigen"
              />
              <Label>Nur Aktive</Label>
            </div>
          </div>
        </CardContent>
      </Card>

      {/* Templates Table */}
      <Card>
        <CardHeader>
          <CardTitle>Templates</CardTitle>
          <CardDescription>
            {templates?.length || 0} Template(s) gefunden
          </CardDescription>
        </CardHeader>
        <CardContent>
          {templates && templates.length > 0 ? (
            <Table>
              <TableHeader>
                <TableRow>
                  <TableHead>Name</TableHead>
                  <TableHead>Titel</TableHead>
                  <TableHead>Kategorie</TableHead>
                  <TableHead>Status</TableHead>
                  <TableHead>Erstellt</TableHead>
                  <TableHead className="text-right">Aktionen</TableHead>
                </TableRow>
              </TableHeader>
              <TableBody>
                {templates.map((template) => (
                  <TableRow key={template.id}>
                    <TableCell className="font-medium">{template.name}</TableCell>
                    <TableCell>{template.title}</TableCell>
                    <TableCell>{getCategoryBadge(template.category)}</TableCell>
                    <TableCell>
                      {template.isActive ? (
                        <Badge variant="default">Aktiv</Badge>
                      ) : (
                        <Badge variant="outline">Inaktiv</Badge>
                      )}
                    </TableCell>
                    <TableCell>
                      {new Date(template.createdAt).toLocaleDateString("de-DE")}
                    </TableCell>
                    <TableCell className="text-right">
                      <div className="flex justify-end gap-2">
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handlePreview(template)}
                          aria-label={`Template ${template.name} Vorschau anzeigen`}
                        >
                          <Eye className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleEdit(template)}
                          aria-label={`Template ${template.name} bearbeiten`}
                        >
                          <Edit className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDuplicate(template.id, template.name)}
                          aria-label={`Template ${template.name} duplizieren`}
                        >
                          <Copy className="h-4 w-4" aria-hidden="true" />
                        </Button>
                        {!template.isSystem && (
                          <Button
                            variant="ghost"
                            size="sm"
                            onClick={() => handleDelete(template.id)}
                            aria-label={`Template ${template.name} löschen`}
                          >
                            <Trash2 className="h-4 w-4" aria-hidden="true" />
                          </Button>
                        )}
                      </div>
                    </TableCell>
                  </TableRow>
                ))}
              </TableBody>
            </Table>
          ) : (
            <div className="text-center py-12 text-muted-foreground">
              <FileText className="h-16 w-16 mx-auto mb-4" aria-hidden="true" />
              <p className="text-lg font-medium">Keine Templates gefunden</p>
              <p className="text-sm">Erstellen Sie Ihr erstes Email-Template</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Create Dialog */}
      <Dialog open={isCreateDialogOpen} onOpenChange={setIsCreateDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Neues Template erstellen</DialogTitle>
            <DialogDescription>
              Erstellen Sie eine neue Template-Vorlage
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label htmlFor="name">Template-Name (ID)</Label>
                <Input
                  id="name"
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  placeholder="z.B. ticket_created"
                />
              </div>
              <div>
                <Label htmlFor="category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as TemplateCategory })}
                >
                  <SelectTrigger id="category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kundenakquise">Kundenakquise</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="title">Titel</Label>
              <Input
                id="title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                placeholder="Anzeigename des Templates"
              />
            </div>
            <div>
              <Label htmlFor="description">Beschreibung</Label>
              <Textarea
                id="description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Optionale Beschreibung"
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="subject">Betreff</Label>
              <Input
                id="subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
                placeholder="Email-Betreff (Platzhalter erlaubt)"
              />
            </div>
            <div>
              <Label htmlFor="body">Email-Inhalt (Visueller Builder)</Label>
              <div style={{ height: "600px", marginTop: "8px" }}>
                <EmailBuilder
                  initialContent={formData.body}
                  onChange={(html, css) => {
                    const fullHtml = css ? `<style>${css}</style>${html}` : html;
                    setFormData({
                      ...formData,
                      body: fullHtml,
                      designJson: JSON.stringify({ html, css })
                    });
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Platzhalter einfügen</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {commonPlaceholders.map((placeholder) => (
                  <Button
                    key={placeholder}
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder)}
                    type="button"
                  >
                    <Code className="h-3 w-3 mr-1" aria-hidden="true" />
                    {placeholder}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                id="isActive"
              />
              <Label htmlFor="isActive">Template aktivieren</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsCreateDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" aria-hidden="true" />
              Abbrechen
            </Button>
            <Button onClick={handleCreate} disabled={createMutation.isPending}>
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {createMutation.isPending ? "Wird erstellt..." : "Erstellen"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Edit Dialog - Similar to Create */}
      <Dialog open={isEditDialogOpen} onOpenChange={setIsEditDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Template bearbeiten</DialogTitle>
            <DialogDescription>
              Ändern Sie die Template-Vorlage
            </DialogDescription>
          </DialogHeader>
          <div className="grid gap-4 py-4">
            <div className="grid grid-cols-2 gap-4">
              <div>
                <Label>Template-Name (ID)</Label>
                <Input value={formData.name} disabled />
              </div>
              <div>
                <Label htmlFor="edit-category">Kategorie</Label>
                <Select
                  value={formData.category}
                  onValueChange={(value) => setFormData({ ...formData, category: value as TemplateCategory })}
                >
                  <SelectTrigger id="edit-category">
                    <SelectValue />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="kundenakquise">Kundenakquise</SelectItem>
                    <SelectItem value="newsletter">Newsletter</SelectItem>
                    <SelectItem value="custom">Benutzerdefiniert</SelectItem>
                  </SelectContent>
                </Select>
              </div>
            </div>
            <div>
              <Label htmlFor="edit-title">Titel</Label>
              <Input
                id="edit-title"
                value={formData.title}
                onChange={(e) => setFormData({ ...formData, title: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-description">Beschreibung</Label>
              <Textarea
                id="edit-description"
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                rows={2}
              />
            </div>
            <div>
              <Label htmlFor="edit-subject">Betreff</Label>
              <Input
                id="edit-subject"
                value={formData.subject}
                onChange={(e) => setFormData({ ...formData, subject: e.target.value })}
              />
            </div>
            <div>
              <Label htmlFor="edit-body">Email-Inhalt (Visueller Builder)</Label>
              <div style={{ height: "600px", marginTop: "8px" }}>
                <EmailBuilder
                  initialContent={formData.body}
                  onChange={(html, css) => {
                    const fullHtml = css ? `<style>${css}</style>${html}` : html;
                    setFormData({
                      ...formData,
                      body: fullHtml,
                      designJson: JSON.stringify({ html, css })
                    });
                  }}
                />
              </div>
            </div>
            <div>
              <Label>Platzhalter einfügen</Label>
              <div className="flex flex-wrap gap-2 mt-2">
                {commonPlaceholders.map((placeholder) => (
                  <Button
                    key={placeholder}
                    variant="outline"
                    size="sm"
                    onClick={() => insertPlaceholder(placeholder)}
                    type="button"
                  >
                    <Code className="h-3 w-3 mr-1" aria-hidden="true" />
                    {placeholder}
                  </Button>
                ))}
              </div>
            </div>
            <div className="flex items-center gap-2">
              <Switch
                checked={formData.isActive}
                onCheckedChange={(checked) => setFormData({ ...formData, isActive: checked })}
                id="edit-isActive"
              />
              <Label htmlFor="edit-isActive">Template aktivieren</Label>
            </div>
          </div>
          <DialogFooter>
            <Button variant="outline" onClick={() => setIsEditDialogOpen(false)}>
              <X className="h-4 w-4 mr-2" aria-hidden="true" />
              Abbrechen
            </Button>
            <Button onClick={handleUpdate} disabled={updateMutation.isPending}>
              <Save className="h-4 w-4 mr-2" aria-hidden="true" />
              {updateMutation.isPending ? "Wird gespeichert..." : "Speichern"}
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>

      {/* Preview Dialog */}
      <Dialog open={isPreviewDialogOpen} onOpenChange={setIsPreviewDialogOpen}>
        <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
          <DialogHeader>
            <DialogTitle>Vorschau: {formData.title}</DialogTitle>
            <DialogDescription>
              So wird die Email aussehen
            </DialogDescription>
          </DialogHeader>
          <div className="space-y-4">
            <div>
              <Label>Betreff:</Label>
              <div className="p-3 bg-muted rounded-md mt-1">
                {formData.subject}
              </div>
            </div>
            <div>
              <Label>Inhalt:</Label>
              <div
                className="p-4 bg-white border rounded-md mt-1"
                dangerouslySetInnerHTML={{ __html: formData.body }}
              />
            </div>
          </div>
          <DialogFooter>
            <Button onClick={() => setIsPreviewDialogOpen(false)}>
              Schließen
            </Button>
          </DialogFooter>
        </DialogContent>
      </Dialog>
    </div>
  );
}
