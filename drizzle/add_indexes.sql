-- Performance Optimization: Add indexes for frequently queried fields

-- Users table indexes
CREATE INDEX IF NOT EXISTS idx_users_email ON users(email);
CREATE INDEX IF NOT EXISTS idx_users_role ON users(role);

-- Tickets table indexes
CREATE INDEX IF NOT EXISTS idx_tickets_status ON tickets(status);
CREATE INDEX IF NOT EXISTS idx_tickets_assigned_to ON tickets(assignedTo);
CREATE INDEX IF NOT EXISTS idx_tickets_customer_email ON tickets(customerEmail);
CREATE INDEX IF NOT EXISTS idx_tickets_created_at ON tickets(createdAt);
CREATE INDEX IF NOT EXISTS idx_tickets_priority ON tickets(priority);

-- Invoices table indexes
CREATE INDEX IF NOT EXISTS idx_invoices_status ON invoices(status);
CREATE INDEX IF NOT EXISTS idx_invoices_customer_id ON invoices(customerId);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_date ON invoices(invoiceDate);
CREATE INDEX IF NOT EXISTS idx_invoices_due_date ON invoices(dueDate);
CREATE INDEX IF NOT EXISTS idx_invoices_invoice_number ON invoices(invoiceNumber);

-- Quotes table indexes
CREATE INDEX IF NOT EXISTS idx_quotes_status ON quotes(status);
CREATE INDEX IF NOT EXISTS idx_quotes_customer_id ON quotes(customerId);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_date ON quotes(quoteDate);
CREATE INDEX IF NOT EXISTS idx_quotes_quote_number ON quotes(quoteNumber);

-- Customers table indexes
CREATE INDEX IF NOT EXISTS idx_customers_email ON customers(email);
CREATE INDEX IF NOT EXISTS idx_customers_type ON customers(type);
CREATE INDEX IF NOT EXISTS idx_customers_name ON customers(name);

-- Invoice Items indexes
CREATE INDEX IF NOT EXISTS idx_invoice_items_invoice_id ON invoiceItems(invoiceId);

-- Quote Items indexes
CREATE INDEX IF NOT EXISTS idx_quote_items_quote_id ON quoteItems(quoteId);

-- Recurring Invoices indexes
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_customer_id ON recurringInvoices(customerId);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_is_active ON recurringInvoices(isActive);
CREATE INDEX IF NOT EXISTS idx_recurring_invoices_next_run_date ON recurringInvoices(nextRunDate);

-- KB Articles indexes
CREATE INDEX IF NOT EXISTS idx_kb_articles_category ON kbArticles(category);
CREATE INDEX IF NOT EXISTS idx_kb_articles_visibility ON kbArticles(visibility);
CREATE INDEX IF NOT EXISTS idx_kb_articles_created_at ON kbArticles(createdAt);

-- Products indexes
CREATE INDEX IF NOT EXISTS idx_products_category ON products(category);
CREATE INDEX IF NOT EXISTS idx_products_is_active ON products(isActive);
CREATE INDEX IF NOT EXISTS idx_products_sku ON products(sku);

-- Payment Reminder Log indexes
CREATE INDEX IF NOT EXISTS idx_payment_reminder_log_invoice_id ON paymentReminderLog(invoiceId);
CREATE INDEX IF NOT EXISTS idx_payment_reminder_log_customer_id ON paymentReminderLog(customerId);
CREATE INDEX IF NOT EXISTS idx_payment_reminder_log_sent_at ON paymentReminderLog(sentAt);
CREATE INDEX IF NOT EXISTS idx_payment_reminder_log_status ON paymentReminderLog(status);

-- Composite indexes for common query patterns
CREATE INDEX IF NOT EXISTS idx_invoices_status_date ON invoices(status, invoiceDate);
CREATE INDEX IF NOT EXISTS idx_tickets_status_priority ON tickets(status, priority);
CREATE INDEX IF NOT EXISTS idx_recurring_active_next_run ON recurringInvoices(isActive, nextRunDate);
