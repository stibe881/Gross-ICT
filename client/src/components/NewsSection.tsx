import { useEffect, useState } from "react";
import { motion } from "framer-motion";
import { useLanguage } from "@/contexts/LanguageContext";
import { NewsService } from "@/lib/newsService";
import { NewsItem } from "@/lib/news";
import { ArrowRight, Calendar, Loader2 } from "lucide-react";
import { Link } from "wouter";

export default function NewsSection() {
  const { language } = useLanguage();
  const [news, setNews] = useState<NewsItem[]>([]);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    const fetchNews = async () => {
      try {
        const data = await NewsService.getLatest(3);
        setNews(data);
      } catch (error) {
        console.error("Failed to fetch news:", error);
      } finally {
        setIsLoading(false);
      }
    };

    fetchNews();
  }, []);

  return (
    <section className="py-24 relative border-t border-white/5">
      <div className="container">
        <motion.div 
          initial={{ opacity: 0, y: 20 }}
          whileInView={{ opacity: 1, y: 0 }}
          viewport={{ once: true }}
          className="mb-12 flex justify-between items-end"
        >
          <div>
            <h2 className="text-3xl md:text-4xl font-bold mb-4 text-white">
              {language === 'de' ? 'Aktuelles' : 'Latest News'}
            </h2>
            <p className="text-muted-foreground">
              {language === 'de' 
                ? 'Updates aus der IT-Welt und von Gross ICT' 
                : 'Updates from the IT world and Gross ICT'}
            </p>
          </div>
          <Link href="/news">
            <span className="hidden md:flex items-center gap-2 text-primary hover:text-primary/80 transition-colors cursor-pointer">
              {language === 'de' ? 'Alle News' : 'All News'} <ArrowRight className="w-4 h-4" />
            </span>
          </Link>
        </motion.div>

        {isLoading ? (
          <div className="flex justify-center py-12">
            <Loader2 className="w-8 h-8 animate-spin text-primary" />
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {news.map((item, index) => (
              <motion.div
                key={item.id}
                initial={{ opacity: 0, y: 20 }}
                whileInView={{ opacity: 1, y: 0 }}
                viewport={{ once: true }}
                transition={{ delay: index * 0.1 }}
                className="group relative bg-white/5 border border-white/10 rounded-2xl p-6 hover:bg-white/10 transition-colors"
              >
                <div className="flex justify-between items-start mb-4">
                  <span className="px-3 py-1 rounded-full text-xs font-medium bg-primary/20 text-primary border border-primary/20">
                    {item.category}
                  </span>
                  <div className="flex items-center gap-2 text-xs text-muted-foreground">
                    <Calendar className="w-3 h-3" />
                    {item.date}
                  </div>
                </div>
                
                <h3 className="text-xl font-bold mb-3 text-white group-hover:text-primary transition-colors">
                  {item.title[language]}
                </h3>
                
                <p className="text-sm text-muted-foreground mb-6 line-clamp-3">
                  {item.excerpt[language]}
                </p>
                
                <div className="flex items-center gap-2 text-sm font-medium text-white group-hover:translate-x-2 transition-transform">
                  {language === 'de' ? 'Mehr lesen' : 'Read more'} <ArrowRight className="w-4 h-4" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>
    </section>
  );
}
