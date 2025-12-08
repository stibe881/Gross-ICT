CREATE TABLE `paymentReminderLog` (
	`id` int AUTO_INCREMENT NOT NULL,
	`invoiceId` int NOT NULL,
	`customerId` int NOT NULL,
	`reminderType` enum('1st','2nd','final') NOT NULL,
	`emailTo` varchar(320) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`status` enum('sent','failed','bounced') NOT NULL DEFAULT 'sent',
	`messageId` varchar(255),
	`errorMessage` varchar(1000),
	`sentAt` timestamp NOT NULL DEFAULT (now()),
	`invoiceAmount` varchar(20) NOT NULL,
	`daysOverdue` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `paymentReminderLog_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE INDEX `invoice_idx` ON `paymentReminderLog` (`invoiceId`);--> statement-breakpoint
CREATE INDEX `customer_idx` ON `paymentReminderLog` (`customerId`);--> statement-breakpoint
CREATE INDEX `reminder_type_idx` ON `paymentReminderLog` (`reminderType`);--> statement-breakpoint
CREATE INDEX `status_idx` ON `paymentReminderLog` (`status`);--> statement-breakpoint
CREATE INDEX `sent_at_idx` ON `paymentReminderLog` (`sentAt`);