CREATE TABLE `responseTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(255) NOT NULL,
	`content` text NOT NULL,
	`category` enum('network','security','hardware','software','email','other','general') NOT NULL DEFAULT 'general',
	`createdBy` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `responseTemplates_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `tickets` ADD `slaDueDate` timestamp;--> statement-breakpoint
ALTER TABLE `tickets` ADD `slaBreached` int DEFAULT 0 NOT NULL;--> statement-breakpoint
ALTER TABLE `tickets` ADD `escalationLevel` int DEFAULT 0 NOT NULL;