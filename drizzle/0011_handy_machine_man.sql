CREATE TABLE `recurringInvoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`customerId` int NOT NULL,
	`templateName` varchar(255) NOT NULL,
	`interval` enum('monthly','quarterly','yearly') NOT NULL,
	`nextRunDate` timestamp NOT NULL,
	`lastRunDate` timestamp,
	`isActive` boolean NOT NULL DEFAULT true,
	`notes` text,
	`items` text NOT NULL,
	`discount` varchar(20) DEFAULT '0',
	`taxRate` varchar(10) DEFAULT '8.1',
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `recurringInvoices_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `customer_idx` ON `recurringInvoices` (`customerId`);--> statement-breakpoint
CREATE INDEX `next_run_date_idx` ON `recurringInvoices` (`nextRunDate`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `recurringInvoices` (`isActive`);