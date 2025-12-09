CREATE TABLE `emailTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(100) NOT NULL,
	`title` varchar(255) NOT NULL,
	`description` text,
	`subject` varchar(500) NOT NULL,
	`body` text NOT NULL,
	`category` enum('ticket','sla','invoice','customer','system','custom') NOT NULL DEFAULT 'custom',
	`isActive` boolean NOT NULL DEFAULT true,
	`isSystem` boolean NOT NULL DEFAULT false,
	`placeholders` text,
	`createdBy` int,
	`updatedBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `emailTemplates_id` PRIMARY KEY(`id`),
	CONSTRAINT `emailTemplates_name_unique` UNIQUE(`name`)
);
