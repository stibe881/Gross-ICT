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

## In Progress - Accounting Module (Phase 3)
- [ ] Add "accounting" role and permissions
- [ ] Create customer portal for viewing invoices
- [ ] Add advanced reporting dashboard (revenue charts, customer analytics)

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

## Future Enhancements
- [ ] Implement automatic invoice generation scheduler (requires cron job or background worker)
- [ ] Add email templates customization
- [ ] Add PDF attachment to invoice emails
