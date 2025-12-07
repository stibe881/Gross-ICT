// This service handles all email-related operations.
// It is designed to be easily swappable with real providers like Mailchimp, SendGrid, or Brevo.

export interface EmailPayload {
  email: string;
  name?: string;
  subject?: string;
  message?: string;
  consent: boolean;
}

export const EmailService = {
  subscribeToNewsletter: async (payload: EmailPayload): Promise<boolean> => {
    // TODO: Replace with actual API call to newsletter provider (e.g. Mailchimp)
    console.log("Subscribing to newsletter:", payload);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  },

  sendContactForm: async (payload: EmailPayload): Promise<boolean> => {
    // TODO: Replace with actual API call to email service (e.g. SendGrid/EmailJS)
    console.log("Sending contact form:", payload);
    
    // Simulate network delay
    await new Promise(resolve => setTimeout(resolve, 1000));
    
    return true;
  }
};
