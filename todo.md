# Project TODO

## Completed Features
- [x] Basic homepage layout
- [x] Navigation menu
- [x] Support Center page
- [x] Ticket system backend (database, API)
- [x] User authentication (login/registration)
- [x] Admin dashboard
- [x] User dashboard

## Current Issues
- [x] Fix login redirect - users not redirected to dashboard after successful login

## Future Enhancements
- [ ] E-Mail notifications for ticket updates
- [ ] Ticket comments/communication
- [ ] File uploads for tickets

## Completed
- [x] Ticket comments/communication system
- [x] File uploads for tickets (screenshots, logs)

## Completed
- [x] Ticket filter & search functionality
- [x] Ticket categories system

## Completed
- [x] Redesign ticket system filters with improved visual design and UX

## Completed
- [x] Make statistics widgets clickable to filter tickets by status

## Completed
- [x] Remove status filter dropdown and emojis from priority/category filters
- [x] Fix login redirect - automatically redirect after successful login

## Completed
- [x] Add support role with limited permissions (ticket management only)
- [x] Implement admin user management (create users, assign roles)
- [x] Role-based access control (admin vs support permissions)

## Completed
- [x] Ticket assignment system (assign tickets to support staff)
- [x] Dashboard statistics with charts (tickets per category over time, avg resolution time)
- [x] Mobile-responsive headers for admin dashboard and user management

## Completed
- [x] Ticket response templates system
- [x] SLA management with automatic escalations

## Completed
- [x] Collapsible statistics in ticket dashboard (default: hidden)
- [x] Fix responsive layout - ticket cards width optimization
- [x] Clickable ticket cards to open full detail view
- [x] Enhanced ticket detail modal with full message history
- [x] Private notes system (visible only to staff, not customers)

## Completed
- [x] Fix ticket card width for mobile view in dashboard
- [x] Add supporter assignment dropdown to ticket detail modal
- [x] Fix title overlap issue in ticket detail modal
- [x] Fix checkbox visibility in lower section of ticket detail modal

## Completed
- [x] Knowledge Base database schema with visibility control (internal/public)
- [x] KB article management (create, edit, delete, search)
- [x] Create KB article directly from ticket solution
- [x] Admin KB management interface
- [x] KB search integration in ticket detail modal for quick insertion
- [x] Public KB page for customer self-service (only public articles)

## Current Issues
- [x] Fix JavaScript error on published site related to Select component

## Completed
- [x] Create seed data with initial FAQ articles for KB (8 articles: 7 public, 1 internal)
- [x] Implement KB article rating system (helpful/not helpful buttons)

## Completed
- [x] Enable support staff to create tickets on behalf of customers

## Completed - Accounting Module (Phase 1)
- [x] Design and create database schema (customers, invoices, quotes, line items)
- [x] Implement customer management API (CRUD operations)
- [x] Implement invoice management API (create, edit, delete, mark as paid, statistics)
- [x] Implement quote management API (create, edit, convert to invoice)
- [x] Create invoice management UI with filters (year, status, search)
- [x] Implement "Create invoice from tickets" API
- [x] Add invoices navigation to admin dashboard

## Completed - Accounting Module (Phase 2)
- [x] Add "Create invoice" button in ticket detail modal
- [x] Implement quote management UI and conversion to invoices
- [x] Add PDF generation for invoices and quotes
- [x] Create customer management UI (CRM)
- [x] Create accounting settings page (company info, bank details, invoice design)

## Completed - Accounting Module (Phase 3)
- [x] Add "accounting" role and permissions

## Completed - Accounting Module (Phase 4)
- [x] Create customer portal for viewing invoices (basic structure, needs myInvoices query activation)

## Completed - Accounting Module (Phase 5)
- [x] Add advanced reporting dashboard (revenue charts, customer analytics)

## Completed - UI Reorganization
- [x] Merge invoices and quotes into one "Buchhaltung" module with tabs
- [x] Fix menu icons (different icons for templates and knowledge base)
- [x] Add CRM/Customers navigation button

## Completed - CRM Module
- [x] Customer management UI with list and search
- [x] Customer detail view with invoice history and statistics
- [x] Create/edit/delete customer functionality
- [x] Filter by customer type (company/individual)
- [x] CRM navigation in admin dashboard

## Completed - Ticket Bulk Operations
- [x] Add checkboxes to select multiple tickets
- [x] Add bulk actions bar with select/deselect all
- [x] Implement bulk delete functionality with confirmation
- [x] Add bulk operation API endpoints (delete, status change, assign)

## Completed - Product Catalog
- [x] Create product catalog database schema (SKU, name, description, category, price, unit, VAT)
- [x] Implement product management API (CRUD operations)
- [x] Create product catalog UI (list, create, edit, delete, search, filter by category)
- [x] Add products navigation to admin dashboard

## Completed - Product Integration
- [x] Integrate product selection into invoice creation (dropdown to select products)
- [x] Integrate product selection into quote creation (dropdown to select products)
- [x] Auto-fill price, unit, and VAT when product is selected

## Completed - Customer Improvements
- [x] Optimize customer details view for mobile devices (responsive grid layout)
- [x] Set customer number to start at 101

## Completed - Invoice Automation
- [x] Create recurring invoice database schema (interval, next run date, template)
- [x] Implement recurring invoice API (create, edit, delete, pause/resume)
- [x] Add email sending functionality for invoices (SMTP configuration with nodemailer)
- [x] Create UI for managing recurring invoices
- [x] Add "Send via Email" button to invoice detail view
- [x] Add recurring invoices route and navigation

## Completed - Email Notifications
- [x] Implement email notifications for ticket status updates
- [x] Add sendNotification parameter to ticket update mutation
- [x] Create ticket notification email template

## Completed - Recurring Invoice Scheduler
- [x] Implement automatic invoice generation scheduler
- [x] Create recurringInvoiceScheduler service
- [x] Add scheduler to server startup (runs every hour)
- [x] Auto-generate invoices from recurring templates
- [x] Update next run date after generation

## Completed - PDF Email Attachments
- [x] Add PDF attachment to invoice emails
- [x] Create pdfService for PDF generation
- [x] Update emailService to support PDF attachments
- [x] Integrate PDF generation into email sending workflow

## Future Enhancements
- [ ] Add email templates customization

## Completed - Email Template Customization
- [x] Add logo support to email templates
- [x] Update invoice email template with logo
- [x] Update ticket notification email template with logo
- [x] Add customizable email header/footer (logo from accounting settings)

## Completed - Payment Reminders
- [x] Create payment reminder scheduler
- [x] Add reminder email templates (1st, 2nd, final reminder)
- [x] Implement automatic overdue invoice detection
- [x] Schedule reminder emails based on due date (daily at 9 AM)
- [x] Three-stage reminder system: 7 days, 14 days, 21 days overdue
- [x] Automatic status update to 'overdue' after first reminder

## Completed - Financial Dashboard Widgets
- [x] Create financial dashboard API endpoints (cashflow, outstanding, forecasts)
- [x] Build cashflow widget (income vs expenses)
- [x] Build outstanding invoices widget (overdue amounts)
- [x] Build revenue forecast widget (based on recurring invoices)
- [x] Build monthly comparison widget
- [x] Integrate widgets into admin dashboard
- [x] Add navigation button to AdminDashboard

## Completed - Export Functions
- [x] Add Excel export for financial reports (cashflow, revenue forecast)
- [x] Create export button in FinancialDashboard
- [x] Generate formatted Excel files with summary data
- [x] Export outstanding invoices to Excel

## Completed - Payment Reminder Tracking
- [x] Create payment reminder log table in database
- [x] Add tracking to payment reminder scheduler
- [x] Create ReminderLog dashboard page
- [x] Show sent reminders with status and success rates
- [x] Add daily statistics chart
- [x] Add filtering by status and reminder type
- [x] Add navigation from AccountingDashboard

## In Progress - Multi-Currency Support
- [ ] Add currency field to customers table
- [ ] Update invoice schema to support multiple currencies
- [ ] Add currency conversion API integration
- [ ] Create currency settings in accounting settings
- [ ] Update invoice calculations for multi-currency

## Completed - Multilingual Invoices
- [x] Add language field to customers table
- [x] Create i18n translations file (DE/EN/FR)
- [x] Update customer creation/edit forms with language selection (language field available in schema)
- [x] Create German invoice PDF template
- [x] Create English invoice PDF template
- [x] Create French invoice PDF template
- [x] Update PDF generation to support multiple languages
- [x] Add multilingual formatting (currency, dates)
- [x] Update email service for multilingual notifications
- [x] Create multilingual invoice email templates
- [x] Create multilingual payment reminder email templates

## Completed - Language Selection UI
- [x] Add language dropdown to customer creation form
- [x] Add language dropdown to customer edit form
- [x] Language field already supported in customer router (schema updated)
- [x] UI shows flag emojis for DE/EN/FR selection

## Completed - Invoice Template Editor
- [x] Create template editor page UI
- [x] Add color picker for primary color (with preset colors)
- [x] Add logo upload functionality (with URL input)
- [x] Add live template preview (invoice/quote toggle)
- [x] Save template settings to accountingSettings
- [x] PDF generation already uses custom settings (primaryColor, logoUrl)
- [x] Add navigation button in AccountingSettings

## Completed - Website Optimization
- [x] Fix TypeScript errors in CRM.tsx (language field)
- [x] Remove code duplicates and improve code quality (N+1 queries fixed)
- [x] Optimize database queries and add indexes
- [x] Create comprehensive database indexes (45+ indexes)
- [x] Fix N+1 query problem in recurringInvoiceRouter
- [x] Improve error handling and validation (already implemented in routers)
- [x] Enhance UI/UX and responsive design
- [x] Add loading states and skeleton screens (LoadingSkeleton component)
- [ ] Optimize bundle size and lazy loading
- [ ] Improve accessibility (ARIA labels, keyboard navigation)
- [x] Add input validation and sanitization (Zod schemas implemented)
- [x] Enhance security (SQL injection, XSS prevention)
- [x] Create comprehensive security audit document
- [ ] Implement rate limiting (high priority)
- [ ] Add file upload validation (medium priority)

## Completed - Final Optimizations
- [x] Move technology partners section above footer on homepage
- [x] Implement rate limiting for API endpoints
- [x] General API limiter: 100 req/15min
- [x] Auth limiter: 5 attempts/15min
- [x] Email limiter: 10 emails/hour
- [x] PDF limiter: 20 PDFs/5min
- [x] Export limiter: 5 exports/10min
- [x] Optimize bundle size with code-splitting and lazy loading
- [x] Add React.lazy for page components (already implemented)
- [x] Implement manual chunks for vendor libraries
- [x] Improve Suspense fallback with loading spinner
- [x] Configure Vite for optimal bundle splitting

## Completed - Bug Fixes
- [x] Fix financial dashboard error (added null checks, improved loading states)
- [x] Fix login transformation error (convert user.id to string, add fallback values)

## Hetzner Deployment Issues
- [x] Fix navigation overflow - Kontakt button goes beyond screen edge
- [x] Check database for user stefan.gross@hotmail.ch
- [ ] Create admin user stefan@gross-ict.ch

## Current Issues
- [x] Fix login redirect - user sees "Login erfolgreich" but is not redirected
- [x] Remove Termin button from navigation to prevent overflow

## Production Issues (Hetzner)
- [ ] Fix Umami analytics error - Unexpected token '<'
- [x] Verify admin user stefan@gross-ict.ch exists in database
- [x] Remove Manus OAuth dependency - implement standalone email/password auth
- [ ] Fix cookie sameSite settings for production login

## UI Improvements
- [x] Simplify admin dashboard menu - remove redundant dashboard links
- [x] Reorganize menu items for better space utilization
