CREATE TABLE `contractAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`fileName` varchar(255) NOT NULL,
	`filePath` varchar(500) NOT NULL,
	`fileUrl` varchar(500) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`uploadedBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `contractAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractId` int NOT NULL,
	`position` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`unit` varchar(50) NOT NULL DEFAULT 'Stück',
	`unitPrice` decimal(10,2) NOT NULL DEFAULT '0.00',
	`vatRate` decimal(5,2) NOT NULL DEFAULT '8.10',
	`discount` decimal(5,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `contractItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contracts` (
	`id` int AUTO_INCREMENT NOT NULL,
	`contractNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`contractType` enum('service','license','support','hosting','maintenance','other') NOT NULL DEFAULT 'service',
	`status` enum('draft','active','expired','cancelled','renewed') NOT NULL DEFAULT 'draft',
	`startDate` timestamp NOT NULL,
	`endDate` timestamp NOT NULL,
	`billingInterval` enum('monthly','quarterly','yearly','one_time') NOT NULL DEFAULT 'monthly',
	`nextBillingDate` timestamp,
	`lastBillingDate` timestamp,
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`vatAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(3) NOT NULL DEFAULT 'CHF',
	`autoRenew` int NOT NULL DEFAULT 0,
	`renewalNoticeDays` int NOT NULL DEFAULT 30,
	`paymentTermsDays` int NOT NULL DEFAULT 30,
	`notes` text,
	`terms` text,
	`recurringInvoiceId` int,
	`createdBy` int NOT NULL,
	`signedDate` timestamp,
	`cancelledDate` timestamp,
	`cancellationReason` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contracts_id` PRIMARY KEY(`id`),
	CONSTRAINT `contracts_contractNumber_unique` UNIQUE(`contractNumber`)
);
--> statement-breakpoint
CREATE INDEX `contract_idx` ON `contractAttachments` (`contractId`);--> statement-breakpoint
CREATE INDEX `contract_idx` ON `contractItems` (`contractId`);--> statement-breakpoint
CREATE INDEX `contract_number_idx` ON `contracts` (`contractNumber`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `contracts` (`customerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `contracts` (`status`);--> statement-breakpoint
CREATE INDEX `start_date_idx` ON `contracts` (`startDate`);--> statement-breakpoint
CREATE INDEX `end_date_idx` ON `contracts` (`endDate`);