import { useState } from 'react';
import { trpc } from '@/lib/trpc';
import { Button } from '@/components/ui/button';
import { Card } from '@/components/ui/card';
import { Dialog, DialogContent, DialogHeader, DialogTitle, DialogTrigger } from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { toast } from 'sonner';
import { Link } from 'wouter';

export default function TemplateManagement() {
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [title, setTitle] = useState('');
  const [content, setContent] = useState('');
  const [category, setCategory] = useState<'network' | 'security' | 'hardware' | 'software' | 'email' | 'other' | 'general'>('general');
  const [editingId, setEditingId] = useState<number | null>(null);

  const utils = trpc.useUtils();
  const { data: templates, isLoading } = trpc.templates.all.useQuery();
  const createMutation = trpc.templates.create.useMutation({
    onSuccess: () => {
      toast.success('Vorlage erstellt');
      utils.templates.all.invalidate();
      setIsCreateOpen(false);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const updateMutation = trpc.templates.update.useMutation({
    onSuccess: () => {
      toast.success('Vorlage aktualisiert');
      utils.templates.all.invalidate();
      setEditingId(null);
      resetForm();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const deleteMutation = trpc.templates.delete.useMutation({
    onSuccess: () => {
      toast.success('Vorlage gelöscht');
      utils.templates.all.invalidate();
    },
    onError: (error: any) => {
      toast.error(`Fehler: ${error.message}`);
    },
  });

  const resetForm = () => {
    setTitle('');
    setContent('');
    setCategory('general');
    setEditingId(null);
  };

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (editingId) {
      updateMutation.mutate({ id: editingId, title, content, category });
    } else {
      createMutation.mutate({ title, content, category });
    }
  };

  const handleEdit = (template: { id: number; title: string; content: string; category: string }) => {
    setEditingId(template.id);
    setTitle(template.title);
    setContent(template.content);
    setCategory(template.category as any);
    setIsCreateOpen(true);
  };

  const getCategoryLabel = (cat: string) => {
    const labels: Record<string, string> = {
      network: 'Netzwerk',
      security: 'Sicherheit',
      hardware: 'Hardware',
      software: 'Software',
      email: 'E-Mail',
      other: 'Sonstiges',
      general: 'Allgemein',
    };
    return labels[cat] || cat;
  };

  const getCategoryColor = (cat: string) => {
    const colors: Record<string, string> = {
      network: 'bg-blue-100 text-blue-800',
      security: 'bg-red-100 text-red-800',
      hardware: 'bg-green-100 text-green-800',
      software: 'bg-purple-100 text-purple-800',
      email: 'bg-yellow-100 text-yellow-800',
      other: 'bg-gray-100 text-gray-800',
      general: 'bg-cyan-100 text-cyan-800',
    };
    return colors[cat] || colors.other;
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-gray-800 bg-black/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-4">
              <Link href="/admin">
                <Button variant="ghost" size="sm">
                  ← Zurück
                </Button>
              </Link>
              <h1 className="text-2xl font-bold">Antwort-Vorlagen</h1>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={(open) => {
              setIsCreateOpen(open);
              if (!open) resetForm();
            }}>
              <DialogTrigger asChild>
                <Button className="bg-yellow-500 hover:bg-yellow-600 text-black">
                  + Neue Vorlage
                </Button>
              </DialogTrigger>
              <DialogContent className="bg-gray-900 text-white border-gray-800">
                <DialogHeader>
                  <DialogTitle>{editingId ? 'Vorlage bearbeiten' : 'Neue Vorlage erstellen'}</DialogTitle>
                </DialogHeader>
                <form onSubmit={handleSubmit} className="space-y-4">
                  <div>
                    <Label htmlFor="title">Titel</Label>
                    <Input
                      id="title"
                      value={title}
                      onChange={(e) => setTitle(e.target.value)}
                      required
                      className="bg-gray-800 border-gray-700"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category">Kategorie</Label>
                    <Select value={category} onValueChange={(value: any) => setCategory(value)}>
                      <SelectTrigger className="bg-gray-800 border-gray-700">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-gray-800 border-gray-700">
                        <SelectItem value="general">Allgemein</SelectItem>
                        <SelectItem value="network">Netzwerk</SelectItem>
                        <SelectItem value="security">Sicherheit</SelectItem>
                        <SelectItem value="hardware">Hardware</SelectItem>
                        <SelectItem value="software">Software</SelectItem>
                        <SelectItem value="email">E-Mail</SelectItem>
                        <SelectItem value="other">Sonstiges</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="content">Inhalt</Label>
                    <Textarea
                      id="content"
                      value={content}
                      onChange={(e) => setContent(e.target.value)}
                      required
                      rows={8}
                      className="bg-gray-800 border-gray-700"
                      placeholder="Geben Sie hier die Antwort-Vorlage ein..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => {
                        setIsCreateOpen(false);
                        resetForm();
                      }}
                      className="border-gray-700"
                    >
                      Abbrechen
                    </Button>
                    <Button
                      type="submit"
                      className="bg-yellow-500 hover:bg-yellow-600 text-black"
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingId ? 'Aktualisieren' : 'Erstellen'}
                    </Button>
                  </div>
                </form>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="container mx-auto px-4 py-8">
        {isLoading ? (
          <div className="text-center py-12">
            <div className="inline-block animate-spin rounded-full h-8 w-8 border-b-2 border-yellow-500"></div>
            <p className="mt-4 text-gray-400">Lade Vorlagen...</p>
          </div>
        ) : templates && templates.length > 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
            {templates.map((template: any) => (
              <Card key={template.id} className="bg-gray-900 border-gray-800 p-6">
                <div className="flex items-start justify-between mb-4">
                  <div>
                    <h3 className="font-semibold text-lg">{template.title}</h3>
                    <span className={`inline-block px-2 py-1 rounded text-xs mt-2 ${getCategoryColor(template.category)}`}>
                      {getCategoryLabel(template.category)}
                    </span>
                  </div>
                </div>
                <p className="text-gray-400 text-sm mb-4 line-clamp-3">{template.content}</p>
                <div className="flex gap-2">
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => handleEdit(template)}
                    className="border-gray-700"
                  >
                    Bearbeiten
                  </Button>
                  <Button
                    size="sm"
                    variant="outline"
                    onClick={() => {
                      if (confirm('Möchten Sie diese Vorlage wirklich löschen?')) {
                        deleteMutation.mutate({ id: template.id });
                      }
                    }}
                    className="border-red-700 text-red-500 hover:bg-red-900"
                  >
                    Löschen
                  </Button>
                </div>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12">
            <p className="text-gray-400 mb-4">Keine Vorlagen vorhanden</p>
            <Button
              onClick={() => setIsCreateOpen(true)}
              className="bg-yellow-500 hover:bg-yellow-600 text-black"
            >
              Erste Vorlage erstellen
            </Button>
          </div>
        )}
      </div>
    </div>
  );
}
