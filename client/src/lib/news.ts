export interface NewsItem {
  id: string;
  date: string;
  title: {
    de: string;
    en: string;
  };
  excerpt: {
    de: string;
    en: string;
  };
  category: 'Security' | 'Update' | 'Tech';
}

export const newsData: NewsItem[] = [
  {
    id: '1',
    date: '2025-12-01',
    title: {
      de: 'Sicherheitswarnung: Neue Phishing-Welle',
      en: 'Security Alert: New Phishing Wave'
    },
    excerpt: {
      de: 'Aktuell sind vermehrt gefälschte E-Mails im Umlauf. Bitte prüfen Sie Absender genau.',
      en: 'Currently, there are increased fake emails in circulation. Please check senders carefully.'
    },
    category: 'Security'
  },
  {
    id: '2',
    date: '2025-11-15',
    title: {
      de: 'Gross ICT erweitert Web-Services',
      en: 'Gross ICT expands Web Services'
    },
    excerpt: {
      de: 'Ab sofort bieten wir auch Headless-CMS-Integrationen für maximale Performance an.',
      en: 'We now offer Headless CMS integrations for maximum performance.'
    },
    category: 'Update'
  },
  {
    id: '3',
    date: '2025-10-20',
    title: {
      de: 'Windows 12: Was Sie wissen müssen',
      en: 'Windows 12: What you need to know'
    },
    excerpt: {
      de: 'Die ersten Leaks zum neuen Betriebssystem versprechen spannende KI-Features.',
      en: 'First leaks about the new OS promise exciting AI features.'
    },
    category: 'Tech'
  }
];
