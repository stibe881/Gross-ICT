-- Add street and ZIP code fields to leads table
ALTER TABLE `leads` 
ADD COLUMN `street` VARCHAR(255) NULL AFTER `company`,
ADD COLUMN `zipCode` VARCHAR(20) NULL AFTER `street`;
