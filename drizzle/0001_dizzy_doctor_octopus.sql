CREATE TABLE `tickets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`customerName` varchar(255),
	`customerEmail` varchar(320),
	`company` varchar(255),
	`subject` varchar(500) NOT NULL,
	`message` text NOT NULL,
	`status` enum('open','in_progress','resolved','closed') NOT NULL DEFAULT 'open',
	`priority` enum('low','medium','high','urgent') NOT NULL DEFAULT 'medium',
	`adminNotes` text,
	`assignedTo` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`resolvedAt` timestamp,
	CONSTRAINT `tickets_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
ALTER TABLE `users` ADD `password` varchar(255);