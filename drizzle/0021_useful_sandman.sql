CREATE TABLE `contractTemplateItems` (
	`id` int AUTO_INCREMENT NOT NULL,
	`templateId` int NOT NULL,
	`position` int NOT NULL,
	`description` text NOT NULL,
	`defaultQuantity` decimal(10,2) NOT NULL DEFAULT '1.00',
	`defaultUnit` varchar(50) NOT NULL DEFAULT 'Stück',
	`defaultUnitPrice` decimal(10,2) NOT NULL DEFAULT '0.00',
	`defaultVatRate` decimal(5,2) NOT NULL DEFAULT '8.10',
	`defaultDiscount` decimal(5,2) NOT NULL DEFAULT '0.00',
	CONSTRAINT `contractTemplateItems_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `contractTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`contractType` enum('service','license','support','hosting','maintenance','other') NOT NULL DEFAULT 'service',
	`defaultBillingInterval` enum('monthly','quarterly','yearly','one_time') NOT NULL DEFAULT 'monthly',
	`defaultDurationMonths` int NOT NULL DEFAULT 12,
	`defaultPaymentTermsDays` int NOT NULL DEFAULT 30,
	`defaultAutoRenew` int NOT NULL DEFAULT 0,
	`defaultRenewalNoticeDays` int NOT NULL DEFAULT 30,
	`defaultTerms` text,
	`isActive` int NOT NULL DEFAULT 1,
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `contractTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `template_idx` ON `contractTemplateItems` (`templateId`);--> statement-breakpoint
CREATE INDEX `name_idx` ON `contractTemplates` (`name`);--> statement-breakpoint
CREATE INDEX `is_active_idx` ON `contractTemplates` (`isActive`);