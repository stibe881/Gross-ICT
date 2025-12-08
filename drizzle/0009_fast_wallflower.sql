CREATE TABLE `accountingSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`companyName` varchar(255) NOT NULL,
	`companyAddress` text,
	`companyPostalCode` varchar(20),
	`companyCity` varchar(100),
	`companyCountry` varchar(100) NOT NULL DEFAULT 'Schweiz',
	`companyPhone` varchar(50),
	`companyEmail` varchar(320),
	`companyWebsite` varchar(255),
	`taxId` varchar(50),
	`iban` varchar(34),
	`bankName` varchar(255),
	`logoUrl` varchar(500),
	`primaryColor` varchar(7) NOT NULL DEFAULT '#D4AF37',
	`invoicePrefix` varchar(20) NOT NULL DEFAULT '',
	`quotePrefix` varchar(20) NOT NULL DEFAULT 'OFF-',
	`defaultPaymentTerms` int NOT NULL DEFAULT 30,
	`defaultVatRate` decimal(5,2) NOT NULL DEFAULT '8.10',
	`invoiceFooter` text,
	`quoteFooter` text,
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `accountingSettings_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `customers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`type` enum('company','individual') NOT NULL DEFAULT 'company',
	`name` varchar(255) NOT NULL,
	`customerNumber` varchar(50),
	`contactPerson` varchar(255),
	`email` varchar(320) NOT NULL,
	`phone` varchar(50),
	`address` varchar(500),
	`postalCode` varchar(20),
	`city` varchar(100),
	`country` varchar(100) NOT NULL DEFAULT 'Schweiz',
	`paymentTermsDays` int NOT NULL DEFAULT 30,
	`defaultVatRate` decimal(5,2) NOT NULL DEFAULT '8.10',
	`defaultDiscount` decimal(5,2) NOT NULL DEFAULT '0.00',
	`notes` text,
	`userId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `customers_id` PRIMARY KEY(`id`),
	CONSTRAINT `customers_customerNumber_unique` UNIQUE(`customerNumber`)
);
--> statement-breakpoint
CREATE TABLE `invoiceItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`position` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`unit` varchar(50) NOT NULL DEFAULT 'Stück',
	`unitPrice` decimal(10,2) NOT NULL DEFAULT '0.00',
	`vatRate` decimal(5,2) NOT NULL DEFAULT '8.10',
	`discount` decimal(5,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	`ticketId` int,
	CONSTRAINT `invoiceItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `invoices` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`invoiceDate` timestamp NOT NULL DEFAULT (now()),
	`dueDate` timestamp NOT NULL,
	`status` enum('draft','sent','paid','overdue','cancelled') NOT NULL DEFAULT 'draft',
	`paidDate` timestamp,
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`vatAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(3) NOT NULL DEFAULT 'CHF',
	`notes` text,
	`footerText` text,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `invoices_id` PRIMARY KEY(`id`),
	CONSTRAINT `invoices_invoiceNumber_unique` UNIQUE(`invoiceNumber`)
);
--> statement-breakpoint
CREATE TABLE `quoteItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteId` int NOT NULL,
	`position` int NOT NULL,
	`description` text NOT NULL,
	`quantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`unit` varchar(50) NOT NULL DEFAULT 'Stück',
	`unitPrice` decimal(10,2) NOT NULL DEFAULT '0.00',
	`vatRate` decimal(5,2) NOT NULL DEFAULT '8.10',
	`discount` decimal(5,2) NOT NULL DEFAULT '0.00',
	`total` decimal(10,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `quoteItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `quotes` (
	`id` int AUTO_INCREMENT NOT NULL,
	`quoteNumber` varchar(50) NOT NULL,
	`customerId` int NOT NULL,
	`quoteDate` timestamp NOT NULL DEFAULT (now()),
	`validUntil` timestamp NOT NULL,
	`status` enum('draft','sent','accepted','rejected','expired') NOT NULL DEFAULT 'draft',
	`subtotal` decimal(10,2) NOT NULL DEFAULT '0.00',
	`discountAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`vatAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`totalAmount` decimal(10,2) NOT NULL DEFAULT '0.00',
	`currency` varchar(3) NOT NULL DEFAULT 'CHF',
	`notes` text,
	`footerText` text,
	`invoiceId` int,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `quotes_id` PRIMARY KEY(`id`),
	CONSTRAINT `quotes_quoteNumber_unique` UNIQUE(`quoteNumber`)
);
--> statement-breakpoint
CREATE INDEX `email_idx` ON `customers` (`email`);--> statement-breakpoint
CREATE INDEX `customer_number_idx` ON `customers` (`customerNumber`);--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `invoiceItems` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `invoice_number_idx` ON `invoices` (`invoiceNumber`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `invoices` (`customerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `invoices` (`status`);--> statement-breakpoint
CREATE INDEX `invoice_date_idx` ON `invoices` (`invoiceDate`);--> statement-breakpoint
CREATE INDEX `quote_idx` ON `quoteItems` (`quoteId`);--> statement-breakpoint
CREATE INDEX `quote_number_idx` ON `quotes` (`quoteNumber`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `quotes` (`customerId`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `quotes` (`status`);