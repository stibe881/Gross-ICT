-- Add city/location field to leads table
ALTER TABLE `leads` 
ADD COLUMN `city` VARCHAR(100) NULL AFTER `company`;
