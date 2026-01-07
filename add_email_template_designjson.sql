-- Migration: Add designJson field and update category enum
-- Date: 2026-01-07

-- Add designJson column for storing GrapesJS editor state
ALTER TABLE emailTemplates 
ADD COLUMN designJson TEXT AFTER placeholders;

-- Update category enum to include kundenakquise and newsletter
ALTER TABLE emailTemplates 
MODIFY COLUMN category ENUM(
  'ticket', 
  'sla', 
  'invoice', 
  'customer', 
  'system', 
  'kundenakquise', 
  'newsletter', 
  'custom'
) DEFAULT 'custom' NOT NULL;
