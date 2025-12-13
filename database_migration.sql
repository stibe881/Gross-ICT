-- =====================================================
-- GROSS ICT - Complete Database Migration Script
-- Run this in phpMyAdmin to add all missing columns
-- =====================================================

-- USERS table
ALTER TABLE users ADD COLUMN openId VARCHAR(255) NULL;

-- TICKETS table
ALTER TABLE tickets ADD COLUMN ticketNumber VARCHAR(50) NULL;
ALTER TABLE tickets ADD COLUMN description TEXT NULL;
ALTER TABLE tickets ADD COLUMN customerCompany VARCHAR(255) NULL;
ALTER TABLE tickets ADD COLUMN slaDeadline DATETIME NULL;
ALTER TABLE tickets ADD COLUMN escalationLevel INT DEFAULT 0;

-- TICKET COMMENTS table
ALTER TABLE ticketComments ADD COLUMN comment TEXT NULL;
ALTER TABLE ticketComments ADD COLUMN isInternal TINYINT(1) DEFAULT 0;

-- TICKET ATTACHMENTS table
ALTER TABLE ticketAttachments ADD COLUMN commentId INT NULL;
ALTER TABLE ticketAttachments ADD COLUMN uploadedBy INT NULL;

-- CUSTOMERS table
ALTER TABLE customers ADD COLUMN customerNumber VARCHAR(50) NULL;
ALTER TABLE customers ADD COLUMN company VARCHAR(255) NULL;
ALTER TABLE customers ADD COLUMN language VARCHAR(10) DEFAULT 'de';
ALTER TABLE customers ADD COLUMN currency VARCHAR(3) DEFAULT 'CHF';
ALTER TABLE customers ADD COLUMN type VARCHAR(20) DEFAULT 'company';
ALTER TABLE customers ADD COLUMN notes TEXT NULL;

-- CONTRACTS table
ALTER TABLE contracts ADD COLUMN contractNumber VARCHAR(50) NULL;
ALTER TABLE contracts ADD COLUMN title VARCHAR(255) NULL;
ALTER TABLE contracts ADD COLUMN description TEXT NULL;
ALTER TABLE contracts ADD COLUMN renewalType VARCHAR(50) DEFAULT 'none';
ALTER TABLE contracts ADD COLUMN billingCycle VARCHAR(50) DEFAULT 'monthly';
ALTER TABLE contracts ADD COLUMN value DECIMAL(10,2) DEFAULT 0;
ALTER TABLE contracts ADD COLUMN slaResponseMinutes INT NULL;
ALTER TABLE contracts ADD COLUMN slaResolutionMinutes INT NULL;
ALTER TABLE contracts ADD COLUMN terms TEXT NULL;
ALTER TABLE contracts ADD COLUMN signedByCustomer TINYINT(1) DEFAULT 0;
ALTER TABLE contracts ADD COLUMN signedByCompany TINYINT(1) DEFAULT 0;
ALTER TABLE contracts ADD COLUMN customerSignatureUrl VARCHAR(500) NULL;
ALTER TABLE contracts ADD COLUMN companySignatureUrl VARCHAR(500) NULL;
ALTER TABLE contracts ADD COLUMN customerSignedAt DATETIME NULL;
ALTER TABLE contracts ADD COLUMN companySignedAt DATETIME NULL;
ALTER TABLE contracts ADD COLUMN pdfUrl VARCHAR(500) NULL;

-- INVOICES table
ALTER TABLE invoices ADD COLUMN issueDate DATE NULL;
ALTER TABLE invoices ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE invoices ADD COLUMN total DECIMAL(10,2) NULL;

-- QUOTES table
ALTER TABLE quotes ADD COLUMN issueDate DATE NULL;
ALTER TABLE quotes ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE quotes ADD COLUMN total DECIMAL(10,2) NULL;

-- RECURRING INVOICES table
ALTER TABLE recurringInvoices ADD COLUMN frequency VARCHAR(50) NULL;
ALTER TABLE recurringInvoices ADD COLUMN startDate DATE NULL;
ALTER TABLE recurringInvoices ADD COLUMN endDate DATE NULL;
ALTER TABLE recurringInvoices ADD COLUMN subtotal DECIMAL(10,2) DEFAULT 0;
ALTER TABLE recurringInvoices ADD COLUMN tax DECIMAL(10,2) DEFAULT 0;
ALTER TABLE recurringInvoices ADD COLUMN total DECIMAL(10,2) NULL;

-- PRODUCTS table
ALTER TABLE products ADD COLUMN price DECIMAL(10,2) NOT NULL DEFAULT 0;

-- SMTP SETTINGS table
ALTER TABLE smtpSettings ADD COLUMN username VARCHAR(255) NULL;
ALTER TABLE smtpSettings ADD COLUMN isActive TINYINT(1) DEFAULT 1;

-- EMAIL LOGS table
ALTER TABLE emailLogs ADD COLUMN recipient VARCHAR(255) NULL;
ALTER TABLE emailLogs ADD COLUMN metadata TEXT NULL;

-- RESPONSE TEMPLATES table
ALTER TABLE responseTemplates ADD COLUMN name VARCHAR(255) NULL;
ALTER TABLE responseTemplates ADD COLUMN isActive TINYINT(1) DEFAULT 1;

-- AUTOMATION RULES table
ALTER TABLE automationRules ADD COLUMN `trigger` VARCHAR(50) NULL;
ALTER TABLE automationRules ADD COLUMN isActive TINYINT(1) DEFAULT 1;

-- MENTIONS table
ALTER TABLE mentions ADD COLUMN mentionedBy INT NULL;

-- NEWSLETTER SUBSCRIBERS table
ALTER TABLE newsletterSubscribers ADD COLUMN dateOfBirth DATE NULL;
ALTER TABLE newsletterSubscribers ADD COLUMN lastActivityAt DATETIME NULL;

-- NEWSLETTER CAMPAIGNS table
ALTER TABLE newsletterCampaigns ADD COLUMN content TEXT NULL;
ALTER TABLE newsletterCampaigns ADD COLUMN sentCount INT DEFAULT 0;
ALTER TABLE newsletterCampaigns ADD COLUMN failedCount INT DEFAULT 0;

-- NEWSLETTER TEMPLATES table  
ALTER TABLE newsletterTemplates ADD COLUMN isDefault TINYINT(1) DEFAULT 0;

-- FILTER PRESETS table
ALTER TABLE filterPresets ADD COLUMN module VARCHAR(100) NULL;

-- ACTIVITIES table
ALTER TABLE activities ADD COLUMN action VARCHAR(100) NULL;
ALTER TABLE activities ADD COLUMN details TEXT NULL;

-- SLA TRACKING table
ALTER TABLE slaTracking ADD COLUMN slaPolicyId INT NULL;
ALTER TABLE slaTracking ADD COLUMN respondedAt DATETIME NULL;
ALTER TABLE slaTracking ADD COLUMN isBreached TINYINT(1) DEFAULT 0;

-- PAYMENT REMINDER LOG table
ALTER TABLE paymentReminderLog ADD COLUMN emailMessageId VARCHAR(255) NULL;

-- NEWSLETTER AUTOMATION EXECUTIONS table
ALTER TABLE newsletterAutomationExecutions ADD COLUMN currentStep INT DEFAULT 0;
ALTER TABLE newsletterAutomationExecutions ADD COLUMN nextExecutionAt DATETIME NULL;

-- =====================================================
-- Create missing tables if they don't exist
-- =====================================================

CREATE TABLE IF NOT EXISTS automationExecutionLog (
  id INT AUTO_INCREMENT PRIMARY KEY,
  ruleId INT NOT NULL,
  ticketId INT NULL,
  status ENUM('success', 'failed') NOT NULL,
  errorMessage TEXT NULL,
  executedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS contractLineItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  contractId INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'Stk.'
);

CREATE TABLE IF NOT EXISTS dashboardPreferences (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  layout TEXT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS invoiceLineItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  invoiceId INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'Stk.',
  vatRate DECIMAL(5,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS quoteLineItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  quoteId INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'Stk.',
  vatRate DECIMAL(5,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS recurringInvoiceLineItems (
  id INT AUTO_INCREMENT PRIMARY KEY,
  recurringInvoiceId INT NOT NULL,
  description VARCHAR(500) NOT NULL,
  quantity DECIMAL(10,2) NOT NULL,
  unitPrice DECIMAL(10,2) NOT NULL,
  total DECIMAL(10,2) NOT NULL,
  unit VARCHAR(50) DEFAULT 'Stk.',
  vatRate DECIMAL(5,2) DEFAULT 0.00
);

CREATE TABLE IF NOT EXISTS oauthProviders (
  id INT AUTO_INCREMENT PRIMARY KEY,
  userId INT NOT NULL,
  provider VARCHAR(50) NOT NULL,
  providerUserId VARCHAR(255),
  accessToken TEXT,
  refreshToken TEXT,
  expiresAt DATETIME NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS knowledgeBaseArticles (
  id INT AUTO_INCREMENT PRIMARY KEY,
  title VARCHAR(255) NOT NULL,
  content TEXT NOT NULL,
  category VARCHAR(100),
  tags TEXT,
  visibility ENUM('public', 'internal') DEFAULT 'public',
  views INT DEFAULT 0,
  helpful INT DEFAULT 0,
  notHelpful INT DEFAULT 0,
  createdBy INT NULL,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletterStatistics (
  id INT AUTO_INCREMENT PRIMARY KEY,
  campaignId INT NOT NULL,
  totalSent INT DEFAULT 0,
  delivered INT DEFAULT 0,
  opened INT DEFAULT 0,
  clicked INT DEFAULT 0,
  bounced INT DEFAULT 0,
  unsubscribed INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletterAutomationSteps (
  id INT AUTO_INCREMENT PRIMARY KEY,
  automationId INT NOT NULL,
  stepOrder INT NOT NULL,
  type VARCHAR(50) NOT NULL,
  config TEXT,
  delayMinutes INT DEFAULT 0,
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP
);

CREATE TABLE IF NOT EXISTS newsletterAutomationStepLogs (
  id INT AUTO_INCREMENT PRIMARY KEY,
  executionId INT NOT NULL,
  stepId INT NOT NULL,
  status ENUM('pending', 'success', 'failed') DEFAULT 'pending',
  executedAt DATETIME NULL,
  errorMessage TEXT NULL
);

CREATE TABLE IF NOT EXISTS newsletterAutomations (
  id INT AUTO_INCREMENT PRIMARY KEY,
  name VARCHAR(255) NOT NULL,
  trigger VARCHAR(100) NOT NULL,
  status ENUM('active', 'paused', 'draft') DEFAULT 'draft',
  createdAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
  updatedAt TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
);

-- =====================================================
-- NOTE: Ignore "Duplicate column" errors - they mean
-- the column already exists (which is fine)
-- =====================================================
