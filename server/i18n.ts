/**
 * Internationalization (i18n) translations for invoices and emails
 * Supports: German (de), English (en), French (fr)
 */

export type Language = 'de' | 'en' | 'fr';

export interface InvoiceTranslations {
  // Invoice document
  invoice: string;
  quote: string;
  invoiceNumber: string;
  quoteNumber: string;
  invoiceDate: string;
  quoteDate: string;
  dueDate: string;
  validUntil: string;
  customerNumber: string;
  
  // Table headers
  position: string;
  description: string;
  quantity: string;
  unitPrice: string;
  vatRate: string;
  total: string;
  
  // Totals
  subtotal: string;
  discount: string;
  vat: string;
  totalAmount: string;
  
  // Payment terms
  paymentTerms: string;
  paymentDue: string;
  bankDetails: string;
  accountHolder: string;
  iban: string;
  bic: string;
  
  // Email subjects
  invoiceEmailSubject: string;
  quoteEmailSubject: string;
  reminderEmailSubject: string;
  
  // Email greetings
  dear: string;
  dearSir: string;
  
  // Email bodies
  invoiceEmailBody: string;
  quoteEmailBody: string;
  thankYou: string;
  bestRegards: string;
  
  // Reminder emails
  firstReminder: string;
  secondReminder: string;
  finalReminder: string;
  reminderMessage1: string;
  reminderMessage2: string;
  reminderMessageFinal: string;
  
  // Units
  piece: string;
  hour: string;
  day: string;
  month: string;
  year: string;
}

export const translations: Record<Language, InvoiceTranslations> = {
  de: {
    // Invoice document
    invoice: 'Rechnung',
    quote: 'Offerte',
    invoiceNumber: 'Rechnungsnummer',
    quoteNumber: 'Offerten-Nr.',
    invoiceDate: 'Rechnungsdatum',
    quoteDate: 'Offertendatum',
    dueDate: 'Fälligkeitsdatum',
    validUntil: 'Gültig bis',
    customerNumber: 'Kundennummer',
    
    // Table headers
    position: 'Pos.',
    description: 'Beschreibung',
    quantity: 'Menge',
    unitPrice: 'Einzelpreis',
    vatRate: 'MwSt.',
    total: 'Betrag',
    
    // Totals
    subtotal: 'Zwischensumme',
    discount: 'Rabatt',
    vat: 'MwSt.',
    totalAmount: 'Gesamtbetrag',
    
    // Payment terms
    paymentTerms: 'Zahlungsbedingungen',
    paymentDue: 'Zahlbar innerhalb von',
    bankDetails: 'Bankverbindung',
    accountHolder: 'Kontoinhaber',
    iban: 'IBAN',
    bic: 'BIC',
    
    // Email subjects
    invoiceEmailSubject: 'Rechnung',
    quoteEmailSubject: 'Offerte',
    reminderEmailSubject: 'Zahlungserinnerung',
    
    // Email greetings
    dear: 'Sehr geehrte/r',
    dearSir: 'Sehr geehrte Damen und Herren',
    
    // Email bodies
    invoiceEmailBody: 'anbei erhalten Sie die Rechnung für unsere erbrachten Leistungen. Wir bitten um Begleichung innerhalb der angegebenen Frist.',
    quoteEmailBody: 'anbei erhalten Sie unsere Offerte. Bei Fragen stehen wir Ihnen gerne zur Verfügung.',
    thankYou: 'Vielen Dank für Ihr Vertrauen.',
    bestRegards: 'Mit freundlichen Grüssen',
    
    // Reminder emails
    firstReminder: '1. Zahlungserinnerung',
    secondReminder: '2. Zahlungserinnerung',
    finalReminder: 'Letzte Mahnung',
    reminderMessage1: 'Wir möchten Sie freundlich daran erinnern, dass die unten aufgeführte Rechnung noch offen ist. Bitte überweisen Sie den Betrag in den nächsten Tagen.',
    reminderMessage2: 'Leider haben wir bisher keine Zahlung für die unten aufgeführte Rechnung erhalten. Wir bitten Sie dringend, den offenen Betrag umgehend zu begleichen.',
    reminderMessageFinal: 'Dies ist unsere letzte Mahnung. Falls wir innerhalb der nächsten 7 Tage keine Zahlung erhalten, werden wir weitere rechtliche Schritte einleiten müssen.',
    
    // Units
    piece: 'Stk.',
    hour: 'Std.',
    day: 'Tag',
    month: 'Monat',
    year: 'Jahr',
  },
  
  en: {
    // Invoice document
    invoice: 'Invoice',
    quote: 'Quote',
    invoiceNumber: 'Invoice Number',
    quoteNumber: 'Quote Number',
    invoiceDate: 'Invoice Date',
    quoteDate: 'Quote Date',
    dueDate: 'Due Date',
    validUntil: 'Valid Until',
    customerNumber: 'Customer Number',
    
    // Table headers
    position: 'Pos.',
    description: 'Description',
    quantity: 'Quantity',
    unitPrice: 'Unit Price',
    vatRate: 'VAT',
    total: 'Amount',
    
    // Totals
    subtotal: 'Subtotal',
    discount: 'Discount',
    vat: 'VAT',
    totalAmount: 'Total Amount',
    
    // Payment terms
    paymentTerms: 'Payment Terms',
    paymentDue: 'Payment due within',
    bankDetails: 'Bank Details',
    accountHolder: 'Account Holder',
    iban: 'IBAN',
    bic: 'BIC/SWIFT',
    
    // Email subjects
    invoiceEmailSubject: 'Invoice',
    quoteEmailSubject: 'Quote',
    reminderEmailSubject: 'Payment Reminder',
    
    // Email greetings
    dear: 'Dear',
    dearSir: 'Dear Sir or Madam',
    
    // Email bodies
    invoiceEmailBody: 'please find attached the invoice for our services. We kindly request payment within the specified period.',
    quoteEmailBody: 'please find attached our quote. If you have any questions, please do not hesitate to contact us.',
    thankYou: 'Thank you for your business.',
    bestRegards: 'Best regards',
    
    // Reminder emails
    firstReminder: '1st Payment Reminder',
    secondReminder: '2nd Payment Reminder',
    finalReminder: 'Final Notice',
    reminderMessage1: 'We would like to kindly remind you that the invoice listed below is still outstanding. Please transfer the amount within the next few days.',
    reminderMessage2: 'Unfortunately, we have not yet received payment for the invoice listed below. We urgently request that you settle the outstanding amount immediately.',
    reminderMessageFinal: 'This is our final notice. If we do not receive payment within the next 7 days, we will be forced to take further legal action.',
    
    // Units
    piece: 'pc.',
    hour: 'hr.',
    day: 'day',
    month: 'month',
    year: 'year',
  },
  
  fr: {
    // Invoice document
    invoice: 'Facture',
    quote: 'Devis',
    invoiceNumber: 'Numéro de facture',
    quoteNumber: 'Numéro de devis',
    invoiceDate: 'Date de facture',
    quoteDate: 'Date du devis',
    dueDate: 'Date d\'échéance',
    validUntil: 'Valable jusqu\'au',
    customerNumber: 'Numéro de client',
    
    // Table headers
    position: 'Pos.',
    description: 'Description',
    quantity: 'Quantité',
    unitPrice: 'Prix unitaire',
    vatRate: 'TVA',
    total: 'Montant',
    
    // Totals
    subtotal: 'Sous-total',
    discount: 'Remise',
    vat: 'TVA',
    totalAmount: 'Montant total',
    
    // Payment terms
    paymentTerms: 'Conditions de paiement',
    paymentDue: 'Paiement dû dans',
    bankDetails: 'Coordonnées bancaires',
    accountHolder: 'Titulaire du compte',
    iban: 'IBAN',
    bic: 'BIC',
    
    // Email subjects
    invoiceEmailSubject: 'Facture',
    quoteEmailSubject: 'Devis',
    reminderEmailSubject: 'Rappel de paiement',
    
    // Email greetings
    dear: 'Cher/Chère',
    dearSir: 'Madame, Monsieur',
    
    // Email bodies
    invoiceEmailBody: 'veuillez trouver ci-joint la facture pour nos services. Nous vous prions de bien vouloir effectuer le paiement dans les délais indiqués.',
    quoteEmailBody: 'veuillez trouver ci-joint notre devis. Si vous avez des questions, n\'hésitez pas à nous contacter.',
    thankYou: 'Nous vous remercions de votre confiance.',
    bestRegards: 'Cordialement',
    
    // Reminder emails
    firstReminder: '1er rappel de paiement',
    secondReminder: '2ème rappel de paiement',
    finalReminder: 'Dernier rappel',
    reminderMessage1: 'Nous souhaitons vous rappeler aimablement que la facture ci-dessous est toujours en suspens. Veuillez effectuer le paiement dans les prochains jours.',
    reminderMessage2: 'Malheureusement, nous n\'avons pas encore reçu le paiement de la facture ci-dessous. Nous vous prions instamment de régler le montant en suspens immédiatement.',
    reminderMessageFinal: 'Ceci est notre dernier rappel. Si nous ne recevons pas le paiement dans les 7 prochains jours, nous serons contraints d\'engager des poursuites judiciaires.',
    
    // Units
    piece: 'pce',
    hour: 'h',
    day: 'jour',
    month: 'mois',
    year: 'an',
  },
};

/**
 * Get translations for a specific language
 */
export function getTranslations(language: Language): InvoiceTranslations {
  return translations[language] || translations.de;
}

/**
 * Format currency based on language
 */
export function formatCurrency(amount: number, currency: string, language: Language): string {
  const locale = {
    de: 'de-CH',
    en: 'en-US',
    fr: 'fr-CH',
  }[language];
  
  return new Intl.NumberFormat(locale, {
    style: 'currency',
    currency,
  }).format(amount);
}

/**
 * Format date based on language
 */
export function formatDate(date: Date, language: Language): string {
  const locale = {
    de: 'de-CH',
    en: 'en-US',
    fr: 'fr-CH',
  }[language];
  
  return new Intl.DateTimeFormat(locale, {
    day: '2-digit',
    month: '2-digit',
    year: 'numeric',
  }).format(date);
}
