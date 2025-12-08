CREATE TABLE `mentions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`commentId` int NOT NULL,
	`ticketId` int NOT NULL,
	`mentionedUserId` int NOT NULL,
	`mentionedByUserId` int NOT NULL,
	`isRead` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `mentions_id` PRIMARY KEY(`id`)
);
