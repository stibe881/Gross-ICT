-- ============================================
-- Migration: Fix Products Table Schema
-- Date: 2026-01-05
-- ============================================
-- This migration updates the products table to match the backend code:
-- 1. Renames 'price' column to 'unitPrice'
-- 2. Makes 'sku' column nullable (removes NOT NULL constraint)

-- Step 1: Rename 'price' to 'unitPrice'
ALTER TABLE `products` CHANGE COLUMN `price` `unitPrice` DECIMAL(10,2) NOT NULL;

-- Step 2: Make 'sku' nullable
ALTER TABLE `products` MODIFY COLUMN `sku` VARCHAR(100) UNIQUE;

-- Verify the changes
-- SELECT * FROM products LIMIT 1;
