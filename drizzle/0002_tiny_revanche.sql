CREATE TABLE `ticketAttachments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`filename` varchar(255) NOT NULL,
	`fileUrl` varchar(1000) NOT NULL,
	`fileSize` int NOT NULL,
	`mimeType` varchar(100) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `ticketAttachments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `ticketComments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`userId` int NOT NULL,
	`message` text NOT NULL,
	`isInternal` int NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `ticketComments_id` PRIMARY KEY(`id`)
);
