import { NewsItem, newsData } from "./news";

// This service simulates fetching data from a CMS (e.g. Strapi, Contentful)
// In the future, replace the mock return with actual API calls.

export const NewsService = {
  getAll: async (): Promise<NewsItem[]> => {
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 800));
    return newsData;
  },

  getLatest: async (count: number = 3): Promise<NewsItem[]> => {
    await new Promise(resolve => setTimeout(resolve, 500));
    return newsData.slice(0, count);
  },

  getById: async (id: string): Promise<NewsItem | undefined> => {
    await new Promise(resolve => setTimeout(resolve, 300));
    return newsData.find(item => item.id === id);
  }
};
