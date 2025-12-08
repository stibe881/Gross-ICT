CREATE TABLE `favorites` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`itemType` varchar(50) NOT NULL,
	`itemLabel` varchar(255) NOT NULL,
	`itemPath` varchar(500) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `favorites_id` PRIMARY KEY(`id`),
	CONSTRAINT `unique_user_item` UNIQUE(`userId`,`itemType`)
);
