import { useState } from "react";
import { trpc } from "@/lib/trpc";
import { Input } from "@/components/ui/input";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Search, BookOpen, ThumbsUp, Eye, ChevronDown, ChevronUp } from "lucide-react";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { useLanguage } from "@/contexts/LanguageContext";

export default function PublicKnowledgeBase() {
  const { t } = useLanguage();
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedCategory, setSelectedCategory] = useState<string>("");
  const [expandedArticle, setExpandedArticle] = useState<number | null>(null);

  const { data: articles, isLoading } = trpc.kb.all.useQuery({
    search: searchQuery || undefined,
    category: selectedCategory || undefined,
    visibility: "public",
  });

  const { data: categories } = trpc.kb.categories.useQuery();

  const toggleArticle = (id: number) => {
    setExpandedArticle(expandedArticle === id ? null : id);
  };

  return (
    <Layout>
      <SEO
        title="Wissensdatenbank"
        description="Durchsuchen Sie unsere Wissensdatenbank nach Lösungen für häufige IT-Probleme und Fragen."
      />
      <div className="min-h-screen py-20">
        <div className="container mx-auto px-4">
          {/* Header */}
          <div className="text-center mb-12">
            <div className="inline-flex items-center justify-center w-16 h-16 bg-primary/10 rounded-full mb-4">
              <BookOpen className="h-8 w-8 text-primary" />
            </div>
            <h1 className="text-4xl md:text-5xl font-bold mb-4">Wissensdatenbank</h1>
            <p className="text-xl text-muted-foreground max-w-2xl mx-auto">
              Finden Sie schnell Antworten auf häufige Fragen und Lösungen für IT-Probleme
            </p>
          </div>

          {/* Search and Filters */}
          <Card className="mb-8 bg-card/50 backdrop-blur-sm">
            <CardContent className="p-6">
              <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                <div className="md:col-span-2 relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-5 w-5 text-muted-foreground" />
                  <Input
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    placeholder="Suche nach Lösungen, Stichwörtern..."
                    className="pl-10 h-12 text-lg"
                  />
                </div>
                <Select value={selectedCategory || "all"} onValueChange={(val) => setSelectedCategory(val === "all" ? "" : val)}>
                  <SelectTrigger className="h-12">
                    <SelectValue placeholder="Alle Kategorien" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="all">Alle Kategorien</SelectItem>
                    {categories?.map((cat: string) => (
                      <SelectItem key={cat} value={cat}>
                        {cat}
                      </SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
            </CardContent>
          </Card>

          {/* Articles List */}
          {isLoading ? (
            <div className="text-center py-12">
              <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary"></div>
              <p className="mt-4 text-muted-foreground">Lädt...</p>
            </div>
          ) : articles && articles.length > 0 ? (
            <div className="grid grid-cols-1 gap-4">
              {articles.map((article: any) => (
                <Card key={article.id} className="bg-card/50 backdrop-blur-sm hover:shadow-lg transition-shadow">
                  <CardHeader className="cursor-pointer" onClick={() => toggleArticle(article.id)}>
                    <div className="flex justify-between items-start gap-4">
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-2">
                          <CardTitle className="text-xl">{article.title}</CardTitle>
                          {expandedArticle === article.id ? (
                            <ChevronUp className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          ) : (
                            <ChevronDown className="h-5 w-5 text-muted-foreground flex-shrink-0" />
                          )}
                        </div>
                        <div className="flex flex-wrap gap-2 text-sm">
                          <Badge variant="secondary">{article.category}</Badge>
                          {article.tags && article.tags.split(",").map((tag: string, i: number) => (
                            <Badge key={i} variant="outline" className="text-xs">
                              {tag.trim()}
                            </Badge>
                          ))}
                        </div>
                      </div>
                    </div>
                  </CardHeader>
                  {expandedArticle === article.id && (
                    <CardContent>
                      <div className="prose prose-invert max-w-none mb-4">
                        <p className="whitespace-pre-wrap">{article.content}</p>
                      </div>
                      <div className="flex items-center gap-6 text-sm text-muted-foreground pt-4 border-t border-border">
                        <div className="flex items-center gap-2">
                          <Eye className="h-4 w-4" />
                          {article.viewCount} Aufrufe
                        </div>
                        <div className="flex items-center gap-2">
                          <ThumbsUp className="h-4 w-4" />
                          {article.helpfulCount} Hilfreich
                        </div>
                      </div>
                    </CardContent>
                  )}
                </Card>
              ))}
            </div>
          ) : (
            <Card className="bg-card/50 backdrop-blur-sm">
              <CardContent className="py-12 text-center">
                <BookOpen className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
                <h3 className="text-xl font-semibold mb-2">Keine Artikel gefunden</h3>
                <p className="text-muted-foreground mb-6">
                  {searchQuery || selectedCategory
                    ? "Versuchen Sie es mit anderen Suchbegriffen oder Kategorien"
                    : "Noch keine Artikel in der Wissensdatenbank"}
                </p>
                <Button asChild>
                  <a href="/support-center">Ticket erstellen</a>
                </Button>
              </CardContent>
            </Card>
          )}

          {/* Help Section */}
          <Card className="mt-8 bg-primary/5 border-primary/20">
            <CardContent className="p-6 text-center">
              <h3 className="text-xl font-semibold mb-2">Nicht gefunden, was Sie suchen?</h3>
              <p className="text-muted-foreground mb-4">
                Unser Support-Team hilft Ihnen gerne weiter
              </p>
              <Button asChild>
                <a href="/support-center">Support-Ticket erstellen</a>
              </Button>
            </CardContent>
          </Card>
        </div>
      </div>
    </Layout>
  );
}
