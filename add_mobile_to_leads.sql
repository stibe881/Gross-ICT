-- Add mobile phone field to leads table
ALTER TABLE `leads` 
ADD COLUMN `mobile` VARCHAR(50) NULL AFTER `phone`;
