CREATE TABLE `newsletterAutomationExecutions` (
	`id` int AUTO_INCREMENT NOT NULL,
	`automationId` int NOT NULL,
	`subscriberId` int NOT NULL,
	`currentStepId` int,
	`status` varchar(20) NOT NULL DEFAULT 'pending',
	`startedAt` timestamp NOT NULL DEFAULT (now()),
	`completedAt` timestamp,
	`nextStepAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterAutomationExecutions_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterAutomationStepLogs` (
	`id` int AUTO_INCREMENT NOT NULL,
	`executionId` int NOT NULL,
	`stepId` int NOT NULL,
	`status` varchar(20) NOT NULL,
	`emailId` int,
	`errorMessage` text,
	`sentAt` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletterAutomationStepLogs_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterAutomationSteps` (
	`id` int AUTO_INCREMENT NOT NULL,
	`automationId` int NOT NULL,
	`stepOrder` int NOT NULL,
	`delayValue` int NOT NULL DEFAULT 0,
	`delayUnit` varchar(20) NOT NULL DEFAULT 'minutes',
	`subject` varchar(500) NOT NULL,
	`htmlContent` text NOT NULL,
	`templateId` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterAutomationSteps_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterAutomations` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`triggerType` varchar(50) NOT NULL,
	`triggerConfig` text,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`segmentId` int,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	`lastTriggeredAt` timestamp,
	CONSTRAINT `newsletterAutomations_id` PRIMARY KEY(`id`)
);
