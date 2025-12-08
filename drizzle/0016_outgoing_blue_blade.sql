CREATE TABLE `activities` (
	`id` int AUTO_INCREMENT NOT NULL,
	`activityType` varchar(50) NOT NULL,
	`userId` int NOT NULL,
	`userName` varchar(255),
	`title` varchar(500) NOT NULL,
	`description` text,
	`entityType` varchar(50),
	`entityId` int,
	`metadata` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `activities_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `filterPresets` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`name` varchar(255) NOT NULL,
	`filterType` varchar(50) NOT NULL,
	`filters` text NOT NULL,
	`isDefault` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `filterPresets_id` PRIMARY KEY(`id`)
);
