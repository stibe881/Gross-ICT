-- Add 'akquise' to emailTemplates category enum
ALTER TABLE `emailTemplates` 
MODIFY COLUMN `category` ENUM('ticket', 'sla', 'invoice', 'customer', 'akquise', 'system', 'custom') NOT NULL DEFAULT 'custom';
