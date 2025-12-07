import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Textarea } from "@/components/ui/textarea";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import {
  Dialog,
  DialogContent,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from "@/components/ui/dialog";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Label } from "@/components/ui/label";
import { Search, Plus, Edit, Trash2, Eye, ThumbsUp, Lock, Globe } from "lucide-react";
import { toast } from "sonner";
import { useAuth } from "@/_core/hooks/useAuth";

export default function KnowledgeBase() {
  const { user } = useAuth();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [selectedVisibility, setSelectedVisibility] = useState<string>("");
  const [isCreateOpen, setIsCreateOpen] = useState(false);
  const [editingArticle, setEditingArticle] = useState<any>(null);

  const [formData, setFormData] = useState({
    title: "",
    content: "",
    category: "",
    tags: "",
    visibility: "public" as "public" | "internal",
  });

  const utils = trpc.useUtils();
  const isAdmin = user?.role === "admin";

  const { data: articles, isLoading } = trpc.kb.all.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    visibility: selectedVisibility as any || undefined,
  });

  const { data: categories } = trpc.kb.categories.useQuery();

  const createMutation = trpc.kb.create.useMutation({
    onSuccess: () => {
      toast.success("Artikel erstellt");
      setIsCreateOpen(false);
      resetForm();
      utils.kb.all.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Erstellen");
    },
  });

  const updateMutation = trpc.kb.update.useMutation({
    onSuccess: () => {
      toast.success("Artikel aktualisiert");
      setEditingArticle(null);
      resetForm();
      utils.kb.all.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Aktualisieren");
    },
  });

  const deleteMutation = trpc.kb.delete.useMutation({
    onSuccess: () => {
      toast.success("Artikel gelöscht");
      utils.kb.all.invalidate();
    },
    onError: (error: any) => {
      toast.error(error.message || "Fehler beim Löschen");
    },
  });

  const resetForm = () => {
    setFormData({
      title: "",
      content: "",
      category: "",
      tags: "",
      visibility: "public",
    });
  };

  const handleSubmit = () => {
    if (!formData.title || !formData.content || !formData.category) {
      toast.error("Bitte füllen Sie alle Pflichtfelder aus");
      return;
    }

    if (editingArticle) {
      updateMutation.mutate({
        id: editingArticle.id,
        ...formData,
      });
    } else {
      createMutation.mutate(formData);
    }
  };

  const handleEdit = (article: any) => {
    setEditingArticle(article);
    setFormData({
      title: article.title,
      content: article.content,
      category: article.category,
      tags: article.tags || "",
      visibility: article.visibility,
    });
    setIsCreateOpen(true);
  };

  const handleDelete = (id: number) => {
    if (confirm("Möchten Sie diesen Artikel wirklich löschen?")) {
      deleteMutation.mutate({ id });
    }
  };

  const getVisibilityIcon = (visibility: string) => {
    return visibility === "internal" ? (
      <Lock className="h-4 w-4" />
    ) : (
      <Globe className="h-4 w-4" />
    );
  };

  return (
    <div className="min-h-screen bg-black text-white">
      {/* Header */}
      <div className="border-b border-white/10 bg-zinc-900/50 backdrop-blur-sm sticky top-0 z-10">
        <div className="container mx-auto px-4 py-4">
          <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
            <div>
              <h1 className="text-2xl font-bold">Wissensdatenbank</h1>
              <p className="text-gray-400 text-sm">Verwalten Sie FAQ und Lösungsartikel</p>
            </div>
            <Dialog open={isCreateOpen} onOpenChange={setIsCreateOpen}>
              <DialogTrigger asChild>
                <Button onClick={() => { setEditingArticle(null); resetForm(); }}>
                  <Plus className="h-4 w-4 mr-2" />
                  Neuer Artikel
                </Button>
              </DialogTrigger>
              <DialogContent className="max-w-3xl max-h-[90vh] overflow-y-auto bg-zinc-900 border-white/10">
                <DialogHeader>
                  <DialogTitle className="text-white">
                    {editingArticle ? "Artikel bearbeiten" : "Neuer Artikel"}
                  </DialogTitle>
                </DialogHeader>
                <div className="space-y-4">
                  <div>
                    <Label htmlFor="title" className="text-gray-300">Titel *</Label>
                    <Input
                      id="title"
                      value={formData.title}
                      onChange={(e) => setFormData({ ...formData, title: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="z.B. Wie setze ich mein Passwort zurück?"
                    />
                  </div>
                  <div>
                    <Label htmlFor="category" className="text-gray-300">Kategorie *</Label>
                    <Input
                      id="category"
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="z.B. Passwörter, E-Mail, Netzwerk"
                    />
                  </div>
                  <div>
                    <Label htmlFor="visibility" className="text-gray-300">Sichtbarkeit *</Label>
                    <Select
                      value={formData.visibility}
                      onValueChange={(value: any) => setFormData({ ...formData, visibility: value })}
                    >
                      <SelectTrigger className="bg-white/5 border-white/10 text-white">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent className="bg-zinc-800 border-white/10">
                        <SelectItem value="public">
                          <div className="flex items-center gap-2">
                            <Globe className="h-4 w-4" />
                            Öffentlich (Kunden können sehen)
                          </div>
                        </SelectItem>
                        <SelectItem value="internal">
                          <div className="flex items-center gap-2">
                            <Lock className="h-4 w-4" />
                            Intern (nur Mitarbeitende)
                          </div>
                        </SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div>
                    <Label htmlFor="tags" className="text-gray-300">Tags (kommagetrennt)</Label>
                    <Input
                      id="tags"
                      value={formData.tags}
                      onChange={(e) => setFormData({ ...formData, tags: e.target.value })}
                      className="bg-white/5 border-white/10 text-white"
                      placeholder="z.B. passwort, reset, login"
                    />
                  </div>
                  <div>
                    <Label htmlFor="content" className="text-gray-300">Inhalt (Markdown unterstützt) *</Label>
                    <Textarea
                      id="content"
                      value={formData.content}
                      onChange={(e) => setFormData({ ...formData, content: e.target.value })}
                      className="bg-white/5 border-white/10 text-white min-h-[300px]"
                      placeholder="Schreiben Sie hier die Lösung..."
                    />
                  </div>
                  <div className="flex justify-end gap-2">
                    <Button
                      variant="outline"
                      onClick={() => { setIsCreateOpen(false); setEditingArticle(null); resetForm(); }}
                    >
                      Abbrechen
                    </Button>
                    <Button
                      onClick={handleSubmit}
                      disabled={createMutation.isPending || updateMutation.isPending}
                    >
                      {editingArticle ? "Aktualisieren" : "Erstellen"}
                    </Button>
                  </div>
                </div>
              </DialogContent>
            </Dialog>
          </div>
        </div>
      </div>

      {/* Filters */}
      <div className="container mx-auto px-4 py-6">
        <Card className="bg-zinc-900/50 border-white/10 mb-6">
          <CardContent className="p-4">
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-gray-400" />
                <Input
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Suche nach Titel, Inhalt oder Tags..."
                  className="pl-10 bg-white/5 border-white/10 text-white"
                />
              </div>
              <Select value={selectedCategory} onValueChange={setSelectedCategory}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Alle Kategorien" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-white/10">
                  <SelectItem value="">Alle Kategorien</SelectItem>
                  {categories?.map((cat: string) => (
                    <SelectItem key={cat} value={cat}>
                      {cat}
                    </SelectItem>
                  ))}
                </SelectContent>
              </Select>
              <Select value={selectedVisibility} onValueChange={setSelectedVisibility}>
                <SelectTrigger className="bg-white/5 border-white/10 text-white">
                  <SelectValue placeholder="Alle Sichtbarkeiten" />
                </SelectTrigger>
                <SelectContent className="bg-zinc-800 border-white/10">
                  <SelectItem value="">Alle</SelectItem>
                  <SelectItem value="public">Öffentlich</SelectItem>
                  <SelectItem value="internal">Intern</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Articles List */}
        {isLoading ? (
          <div className="text-center py-12 text-gray-400">Lädt...</div>
        ) : articles && articles.length > 0 ? (
          <div className="grid grid-cols-1 gap-4">
            {articles.map((article: any) => (
              <Card key={article.id} className="bg-zinc-900/50 border-white/10 hover:border-white/20 transition-colors">
                <CardHeader>
                  <div className="flex justify-between items-start gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-2 mb-2">
                        <CardTitle className="text-white text-lg">{article.title}</CardTitle>
                        <Badge variant="outline" className="text-xs">
                          {getVisibilityIcon(article.visibility)}
                          <span className="ml-1">
                            {article.visibility === "internal" ? "Intern" : "Öffentlich"}
                          </span>
                        </Badge>
                      </div>
                      <div className="flex flex-wrap gap-2 text-sm text-gray-400">
                        <Badge variant="secondary">{article.category}</Badge>
                        {article.tags && article.tags.split(",").map((tag: string, i: number) => (
                          <Badge key={i} variant="outline" className="text-xs">
                            {tag.trim()}
                          </Badge>
                        ))}
                      </div>
                    </div>
                    <div className="flex gap-2">
                      <Button
                        variant="ghost"
                        size="sm"
                        onClick={() => handleEdit(article)}
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      {isAdmin && (
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => handleDelete(article.id)}
                        >
                          <Trash2 className="h-4 w-4 text-red-400" />
                        </Button>
                      )}
                    </div>
                  </div>
                </CardHeader>
                <CardContent>
                  <p className="text-gray-300 line-clamp-2 mb-3">{article.content}</p>
                  <div className="flex items-center gap-4 text-sm text-gray-400">
                    <div className="flex items-center gap-1">
                      <Eye className="h-4 w-4" />
                      {article.viewCount} Aufrufe
                    </div>
                    <div className="flex items-center gap-1">
                      <ThumbsUp className="h-4 w-4" />
                      {article.helpfulCount} Hilfreich
                    </div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        ) : (
          <div className="text-center py-12 text-gray-400">
            Keine Artikel gefunden. Erstellen Sie Ihren ersten Artikel!
          </div>
        )}
      </div>
    </div>
  );
}
