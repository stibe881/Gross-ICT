-- Create leads table
CREATE TABLE IF NOT EXISTS `leads` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `firstName` VARCHAR(100) NOT NULL,
  `lastName` VARCHAR(100) NOT NULL,
  `email` VARCHAR(320) NOT NULL,
  `phone` VARCHAR(50),
  `company` VARCHAR(255),
  `position` VARCHAR(100),
  `status` ENUM('new', 'contacted', 'qualified', 'proposal', 'won', 'lost') DEFAULT 'new' NOT NULL,
  `priority` ENUM('A', 'B', 'C') DEFAULT 'B' NOT NULL,
  `source` ENUM('website', 'referral', 'cold_call', 'email', 'social_media', 'trade_show', 'other') DEFAULT 'other' NOT NULL,
  `estimatedValue` DECIMAL(10, 2),
  `notes` TEXT,
  `assignedTo` INT,
  `convertedToCustomerId` INT,
  `convertedAt` TIMESTAMP NULL,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  `updatedAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP NOT NULL,
  INDEX `status_idx` (`status`),
  INDEX `priority_idx` (`priority`),
  INDEX `assigned_to_idx` (`assignedTo`),
  INDEX `email_idx` (`email`),
  FOREIGN KEY (`assignedTo`) REFERENCES `users`(`id`) ON DELETE SET NULL,
  FOREIGN KEY (`convertedToCustomerId`) REFERENCES `customers`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Create lead activities table
CREATE TABLE IF NOT EXISTS `leadActivities` (
  `id` INT AUTO_INCREMENT PRIMARY KEY,
  `leadId` INT NOT NULL,
  `activityType` ENUM('note', 'email', 'call', 'meeting', 'status_change') NOT NULL,
  `description` TEXT NOT NULL,
  `userId` INT,
  `createdAt` TIMESTAMP DEFAULT CURRENT_TIMESTAMP NOT NULL,
  INDEX `lead_idx` (`leadId`),
  INDEX `activity_type_idx` (`activityType`),
  FOREIGN KEY (`leadId`) REFERENCES `leads`(`id`) ON DELETE CASCADE,
  FOREIGN KEY (`userId`) REFERENCES `users`(`id`) ON DELETE SET NULL
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;
