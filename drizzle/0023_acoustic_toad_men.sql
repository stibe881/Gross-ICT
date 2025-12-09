ALTER TABLE `contracts` ADD `signatureStatus` varchar(50) DEFAULT 'unsigned' NOT NULL;--> statement-breakpoint
ALTER TABLE `contracts` ADD `customerSignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD `customerSignedBy` varchar(255);--> statement-breakpoint
ALTER TABLE `contracts` ADD `companySignedAt` timestamp;--> statement-breakpoint
ALTER TABLE `contracts` ADD `companySignedBy` int;