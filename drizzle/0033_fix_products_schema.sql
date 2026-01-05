-- Migration to fix products table schema
-- Rename 'price' column to 'unitPrice'
-- Make 'sku' column nullable

ALTER TABLE `products` CHANGE COLUMN `price` `unitPrice` DECIMAL(10,2) NOT NULL;
ALTER TABLE `products` MODIFY COLUMN `sku` VARCHAR(100) UNIQUE;
