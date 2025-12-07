import { useEffect, useState } from "react";
import { useRoute, Link } from "wouter";
import Layout from "@/components/Layout";
import SEO from "@/components/SEO";
import { NewsService } from "@/lib/newsService";
import { NewsItem } from "@/lib/news";
import { useLanguage } from "@/contexts/LanguageContext";
import { ArrowLeft, Calendar, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";

export default function NewsDetail() {
  const [match, params] = useRoute("/news/:id");
  const { language } = useLanguage();
  const [article, setArticle] = useState<NewsItem | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchArticle = async () => {
      if (params?.id) {
        try {
          const data = await NewsService.getById(params.id);
          setArticle(data || null);
        } catch (error) {
          console.error("Failed to fetch article:", error);
        } finally {
          setIsLoading(false);
        }
      }
    };

    fetchArticle();
  }, [params?.id]);

  if (isLoading) {
    return (
      <Layout>
        <div className="min-h-screen flex items-center justify-center">
          <Loader2 className="w-8 h-8 animate-spin text-primary" />
        </div>
      </Layout>
    );
  }

  if (!article) {
    return (
      <Layout>
        <div className="container py-32 text-center">
          <h1 className="text-2xl font-bold mb-4">Artikel nicht gefunden</h1>
          <Link href="/">
            <Button>Zurück zur Startseite</Button>
          </Link>
        </div>
      </Layout>
    );
  }

  return (
    <Layout>
      <SEO 
        title={article.title[language]} 
        description={article.excerpt[language]}
        canonical={`/news/${article.id}`}
        type="article"
      />
      
      <article className="container py-32 max-w-3xl mx-auto">
        <Link href="/">
          <Button variant="ghost" className="mb-8 pl-0 hover:bg-transparent hover:text-primary">
            <ArrowLeft className="mr-2 h-4 w-4" />
            {language === 'de' ? 'Zurück' : 'Back'}
          </Button>
        </Link>

        <div className="flex items-center gap-4 mb-6">
          <span className="px-3 py-1 rounded-full text-sm font-medium bg-primary/20 text-primary border border-primary/20">
            {article.category}
          </span>
          <div className="flex items-center gap-2 text-sm text-muted-foreground">
            <Calendar className="w-4 h-4" />
            {article.date}
          </div>
        </div>

        <h1 className="text-4xl md:text-5xl font-bold mb-8 text-foreground leading-tight">
          {article.title[language]}
        </h1>

        <div className="prose prose-lg dark:prose-invert max-w-none">
          <p className="lead text-xl text-muted-foreground mb-8">
            {article.excerpt[language]}
          </p>
          {/* In a real CMS, this would be HTML content */}
          <div className="text-foreground/90 leading-relaxed space-y-6">
            {article.content?.[language] || "Content coming soon..."}
          </div>
        </div>
      </article>
    </Layout>
  );
}
