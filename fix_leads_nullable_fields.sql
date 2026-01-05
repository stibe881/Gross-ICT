-- Make firstName, lastName, and email nullable in leads table
ALTER TABLE `leads` 
MODIFY COLUMN `firstName` VARCHAR(100) NULL,
MODIFY COLUMN `lastName` VARCHAR(100) NULL,
MODIFY COLUMN `email` VARCHAR(320) NULL;
