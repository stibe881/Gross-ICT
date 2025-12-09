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

## Completed - Multi-Currency Support
- [x] Add currency field to customers table
- [x] Update invoice schema to support multiple currencies (already had currency field)
- [x] Add currency dropdown to CRM forms (CHF, EUR, USD, GBP)
- [x] Update API validation for currency field
- [ ] Add currency conversion API integration (future enhancement)
- [ ] Create currency settings in accounting settings (future enhancement)
- [ ] Update invoice calculations for multi-currency (future enhancement)

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
- [x] Create admin user stefan@gross-ict.ch

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

## Completed - Logo & Favicon
- [x] Generate professional logo with network/tech theme
- [x] Create favicon in multiple sizes (16x16, 32x32, 192x192, 512x512, .ico)
- [x] Implement favicon in index.html with all required link tags
- [x] Replace with existing G logo from IMG_1033.PNG
- [x] Create favicon versions from existing logo
- [x] Create download package with README

## Completed - Admin Dashboard Improvements
- [x] Implement dropdown menu "Verwaltung" for admin management functions (Vorlagen, Benutzerverwaltung, Produkte)
- [x] Add dashboard cards in content area with quick links to Finanzen, Mahnungs-Log, etc.
- [x] Create mobile-optimized hamburger menu for all admin functions

## Current Issues
- [x] Fix navigation menu overflow - Kontakt button extends beyond screen edge

## Completed - Dashboard Navigation
- [x] Fix dashboard tile navigation to link to correct sub-dashboards

## Completed - Dashboard Enhancements
- [x] Add live data to dashboard quick-access cards (offene Rechnungen, neue Tickets, etc.)
- [x] Implement notification center with bell icon and dropdown in header
- [x] Create favorites system for frequently used functions

## Completed - Advanced Dashboard Features
- [x] Install Chart.js and create dashboard chart widgets (Umsatz-Trend, Ticket-Status-Verteilung, Kunden-Wachstum)
- [x] Implement notification settings page with configurable preferences (E-Mail, Push, Kategorien)
- [x] Create dashboard personalization with drag-and-drop for card reordering and widget management

## Completed - Real-time Updates & Export Features
- [x] Implement WebSocket connections for real-time dashboard updates (tickets, invoices, reminders)
- [x] Add export functionality to charts (PNG, PDF, CSV download)
- [x] Create predefined dashboard templates (Finanz-fokussiert, Support-fokussiert, Management-Übersicht)
- [x] Add template switcher UI with one-click activation

## Completed - Activity Feed & Advanced Filters
- [x] Create database schema for activity feed (activities table)
- [x] Implement backend tRPC router for activity logging and retrieval
- [x] Create ActivityFeed UI component with chronological timeline
- [x] Add WebSocket events for real-time activity updates
- [x] Create database schema for saved filter presets
- [x] Implement backend for saving, loading, and deleting filter presets
- [x] Add UI for creating, managing, and applying filter presets
- [x] Integrate filter presets with existing ticket search/filter system

## Completed - Bulk Actions, Collaboration & Automation
- [x] Implement bulk selection for tickets with checkboxes
- [x] Create bulk actions toolbar (change status, priority, assignment, delete)
- [x] Add backend support for bulk operations
- [x] Extend database schema for internal notes and mentions
- [x] Implement @mention functionality in comments
- [x] Create internal notes system (team-only visibility)
- [x] Add ticket assignment with user selection
- [x] Implement notification system for mentions and assignments
- [x] Create automation rules database schema
- [x] Build rule builder UI with condition-action editor
- [x] Implement backend rule engine for automatic execution
- [x] Add rule management interface (create, edit, delete, enable/disable)

## Logo Creation
- [x] Generate new professional logo based on grossICTLogo.png (3 Varianten: modern, minimal, badge)
- [x] Create multiple logo variations for download
- [x] Provide logo package to user

## In Progress - Email Integration & SLA System
- [ ] Configure SMTP settings (host, port, username, password, from address)
- [ ] Create email notification service with templates
- [ ] Implement email notifications for mentions (@username)
- [ ] Add email notifications for ticket assignments
- [ ] Integrate email sending with automation rules actions
- [ ] Create SLA policies database schema (response time, resolution time, priority-based)
- [ ] Implement SLA tracking logic (time calculations, business hours)
- [ ] Add automatic escalation system for SLA breaches
- [ ] Build SLA management UI (create, edit, delete policies)
- [ ] Create SLA monitoring dashboard with breach alerts
- [ ] Add SLA status indicators to ticket list and detail views

## Logo Replacement
- [x] Copy large2.png to public folder
- [x] Update Layout component to use new logo
- [x] Adjust logo sizing to fit menu without making it larger

## Favicon Update
- [x] Copy GrossICT-favicon.png to public folder
- [x] Create multiple favicon sizes (16x16, 32x32, 192x192, 512x512, .ico)
- [x] Update index.html with new favicon links (already configured)

## Dashboard Reorganization
- [x] Create main admin dashboard with selection tiles (Buchhaltung, CRM, Wissensdatenbank, Verwaltung, Tickets)
- [x] Implement permission-based tile visibility
- [x] Move ticket system to separate TicketManagement dashboard
- [x] Add back buttons to all sub-dashboards (Buchhaltung, CRM, Wissensdatenbank, Verwaltung, Tickets)
- [x] Update routing structure for new dashboard organization
- [x] Implement live data for admin dashboard statistics cards (offene Tickets, Kunden, offene Rechnungen, KB-Artikel)
- [x] Make statistics cards clickable with navigation to filtered views
- [x] Add trend indicators showing weekly comparison (↑↓)
- [x] Integrate WebSocket for real-time statistics updates
- [x] Fix build error - install missing socket.io-client dependency
- [x] Remove quick access cards from ticket dashboard
- [x] Remove activity feed from ticket dashboard
- [x] Move revenue trends chart to accounting dashboard
- [x] Move customer growth chart to CRM dashboard
- [x] Fix financial dashboard error (statistics tile click)
- [x] Create tRPC queries for real revenue data from invoices
- [x] Create tRPC queries for real customer growth data
- [x] Add time period filter dropdown to RevenueTrendChart
- [x] Add time period filter dropdown to CustomerGrowthChart
- [x] Implement click handlers for interactive chart details
- [x] Create detail modal/dialog for revenue breakdown
- [x] Create detail modal/dialog for customer details by month

## Contract Management System
- [x] Create contracts database schema (contracts, contractItems, contractAttachments tables)
- [x] Create contract tRPC router with CRUD operations
- [x] Build contract list view in CRM
- [x] Build create/edit contract form
- [x] Implement contract-to-invoice conversion
- [x] Implement contract-to-recurring-invoice conversion
- [x] Add contract status management (draft, active, expired, cancelled)
- [x] Add contract renewal notifications

## Contract Templates & Dashboard
- [x] Create contract templates database schema
- [x] Create contract templates tRPC router
- [x] Build contract template management UI
- [x] Add "Create from template" feature to contract creation
- [x] Create contract dashboard with expiring contracts overview
- [x] Add revenue forecast calculations
- [x] Add contract renewal rate analytics
- [x] Add contract status distribution chart

## SLA-Contract Integration
- [x] Add SLA field to contracts schema
- [x] Update contract creation form to include SLA selection
- [x] Implement automatic ticket prioritization based on customer contract SLA
- [x] Create SLA monitoring dashboard with compliance metrics
- [x] Add SLA performance tracking per contract
- [x] Implement SLA breach notifications

## Contract PDF Export & Digital Signature
- [x] Create PDF generation backend with professional contract template
- [x] Implement digital signature fields for both parties
- [x] Add S3 archiving for signed contracts with versioning (PDFs automatically saved to S3)
- [x] Build UI for PDF export and download
- [x] Add signature management interface
- [x] Implement signature status tracking

## Customer Growth Chart & Contract Navigation
- [x] Fix customer growth chart query to show actual customer data (MySQL DATE_FORMAT)
- [x] Add contract navigation link to admin dashboard (Verträge tile added)
- [x] Improve contract-customer assignment UX (customer dropdown in contract form)

## FinancialDashboard React Hook Error
- [x] Fix React Hook #310 error in FinancialDashboard component (removed non-existent export mutations)

## Completed - Loading Screen Animation
- [x] Create LoadingScreen component with logo assembly animation
- [x] Three logo elements (left arc, right arc, dot) slide in from outside
- [x] Add glow effect when animation completes
- [x] Integrate into App.tsx
- [x] Deploy to production server

## Completed - Loading Screen Improvements
- [x] Fix LoadingScreen animation - currently only shows "LOADING" text briefly
- [x] Make logo elements (arcs and dot) more visible and prominent
- [x] Increase animation duration for better visibility (3.5s total)
- [x] Ensure smooth assembly animation of logo elements
- [x] Increase SVG size from 120x120 to 160x160
- [x] Increase stroke width from 10 to 12
- [x] Enhance glow effect for better visibility

## Completed - LoadingScreen Logo Fix
- [x] Logo elements (arcs and dot) are not visible in the animation
- [x] Replace SVG paths with actual logo image for better visibility
- [x] Test animation with real logo file
- [x] Implemented bounce effect with framer-motion
- [x] Added pulsing glow effect
- [x] Added animated progress bar
- [x] Added drop-shadow to logo for better visibility

## Completed - Navigation Fix
- [x] Fix Support Center link on Contact page - clicking does nothing
- [x] Added Link wrapper to Support Center button
- [x] Button now navigates to /support-center correctly

## Completed - TypeScript Fixes
- [x] Fix TypeScript errors in FinancialDashboard.tsx (15 errors)
- [x] Fix data type mismatches in monthly comparison and outstanding invoices
- [x] Fix cashflow data structure (use cashflow.months)
- [x] Fix forecast data structure (use forecast.forecast)
- [x] Fix summary card properties (thisMonthRevenue, overdueAmount, etc.)
- [x] All TypeScript errors resolved - clean build

## Completed - Production Fixes
- [x] Fix Umami analytics error - Unexpected token '<'
- [x] Added conditional loading for Umami script (only loads if env vars are set)
- [x] Verified cookie sameSite settings are correct (lax, secure for HTTPS)

## Completed - Contact Page UX
- [x] Make phone numbers clickable with tel: links
- [x] Make email addresses clickable with mailto: links
- [x] Added hover effects (underline) for better UX

## Completed - SLA System & Email Integration
- [x] Create SLA Management UI with CRUD operations
- [x] Integrate SLA Management with existing SLA router
- [x] Create email service with SMTP configuration (nodemailer)
- [x] Create email templates for SLA warnings and breaches
- [x] Integrate email notifications into SLA tracking system
- [x] Add SLA Management route to App.tsx
- [x] Email notifications for ticket assignments
- [x] Email notifications for mentions in comments
- [x] Automatic SLA breach and warning emails

## Future Enhancements - Email & SLA
- [ ] Add email templates customization UI
- [ ] Add SMTP configuration UI in settings
- [ ] Add email delivery logs and tracking
- [ ] Add SLA dashboard with real-time metrics
- [ ] Add SLA reports and analytics

## Completed - SLA Management Filters
- [x] Add filter UI for priority (all, urgent, high, normal, low)
- [x] Add filter UI for status (all, active, inactive)
- [x] Implement filter logic to show/hide policies based on selection
- [x] Filter card with two dropdowns for easy filtering
- [x] Real-time filtering without page reload

## Completed - SLA Management Enhancements
- [x] Add column sorting to SLA table (name, response time, resolution time)
- [x] Implement bulk actions with checkboxes (activate/deactivate/delete multiple policies)
- [x] Add CSV export for filtered SLA policies
- [x] Bulk actions toolbar appears when policies are selected
- [x] Select all checkbox in table header
- [x] Sort direction indicator with ArrowUpDown icon
- [ ] Add PDF export for filtered SLA policies (future enhancement)

## Completed - Rate Limiting & Security
- [x] Implement rate limiting for API endpoints (already configured with express-rate-limit)
- [x] Configure rate limits per endpoint (stricter for auth, looser for read operations)
- [x] Add rate limit headers to responses
- [ ] Adjust trust proxy settings for production deployment (configuration note)

## Completed - Performance & Accessibility
- [x] Optimize bundle size with lazy loading for large components (already implemented in App.tsx)
- [x] Implement code splitting for better initial load time (React.lazy used throughout)
- [x] Add ARIA labels for screen readers (SLA Management complete)
- [x] Add aria-hidden for decorative icons
- [x] Add descriptive labels for buttons and checkboxes
- [ ] Improve keyboard navigation across all pages (future enhancement)
- [ ] Add skip-to-content links (future enhancement)
