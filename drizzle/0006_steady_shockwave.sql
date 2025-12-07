CREATE TABLE `kbArticles` (
	`id` int AUTO_INCREMENT NOT NULL,
	`title` varchar(500) NOT NULL,
	`content` text NOT NULL,
	`category` varchar(100) NOT NULL,
	`tags` text,
	`isPublished` int NOT NULL DEFAULT 1,
	`viewCount` int NOT NULL DEFAULT 0,
	`helpfulCount` int NOT NULL DEFAULT 0,
	`authorId` int NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `kbArticles_id` PRIMARY KEY(`id`)
);
