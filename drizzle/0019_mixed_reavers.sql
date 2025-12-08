CREATE TABLE `slaPolicies` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`priority` varchar(50),
	`responseTimeMinutes` int NOT NULL,
	`resolutionTimeMinutes` int NOT NULL,
	`warningThreshold` int NOT NULL DEFAULT 80,
	`isActive` tinyint NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slaPolicies_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `slaTracking` (
	`id` int AUTO_INCREMENT NOT NULL,
	`ticketId` int NOT NULL,
	`policyId` int NOT NULL,
	`responseDeadline` timestamp NOT NULL,
	`resolutionDeadline` timestamp NOT NULL,
	`firstResponseAt` timestamp,
	`resolvedAt` timestamp,
	`responseStatus` varchar(50) NOT NULL DEFAULT 'pending',
	`resolutionStatus` varchar(50) NOT NULL DEFAULT 'pending',
	`responseWarningSent` tinyint NOT NULL DEFAULT 0,
	`responseBreachSent` tinyint NOT NULL DEFAULT 0,
	`resolutionWarningSent` tinyint NOT NULL DEFAULT 0,
	`resolutionBreachSent` tinyint NOT NULL DEFAULT 0,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `slaTracking_id` PRIMARY KEY(`id`)
);
