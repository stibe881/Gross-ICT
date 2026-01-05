-- Add website field to leads table
ALTER TABLE `leads` 
ADD COLUMN `website` VARCHAR(255) NULL AFTER `email`;
