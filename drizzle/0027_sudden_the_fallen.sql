CREATE TABLE `newsletterActivity` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`subscriberId` int NOT NULL,
	`variantType` varchar(10) DEFAULT 'A',
	`activityType` varchar(20) NOT NULL,
	`ipAddress` varchar(45),
	`userAgent` text,
	`linkUrl` varchar(500),
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	CONSTRAINT `newsletterActivity_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterCampaigns` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`subject` varchar(500) NOT NULL,
	`subjectB` varchar(500),
	`preheader` varchar(255),
	`htmlContent` text NOT NULL,
	`templateId` int,
	`status` varchar(20) NOT NULL DEFAULT 'draft',
	`recipientType` varchar(20) NOT NULL DEFAULT 'all',
	`segmentId` int,
	`recipientCount` int NOT NULL DEFAULT 0,
	`scheduledAt` timestamp,
	`sentAt` timestamp,
	`abTestEnabled` boolean NOT NULL DEFAULT false,
	`abTestSplitPercent` int DEFAULT 50,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterCampaigns_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterSegments` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`criteria` text NOT NULL,
	`subscriberCount` int NOT NULL DEFAULT 0,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterSegments_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterStats` (
	`id` int AUTO_INCREMENT NOT NULL,
	`campaignId` int NOT NULL,
	`variantType` varchar(10) DEFAULT 'A',
	`totalSent` int NOT NULL DEFAULT 0,
	`totalDelivered` int NOT NULL DEFAULT 0,
	`totalOpened` int NOT NULL DEFAULT 0,
	`totalClicked` int NOT NULL DEFAULT 0,
	`totalBounced` int NOT NULL DEFAULT 0,
	`totalUnsubscribed` int NOT NULL DEFAULT 0,
	`uniqueOpens` int NOT NULL DEFAULT 0,
	`uniqueClicks` int NOT NULL DEFAULT 0,
	`openRate` int NOT NULL DEFAULT 0,
	`clickRate` int NOT NULL DEFAULT 0,
	`bounceRate` int NOT NULL DEFAULT 0,
	`unsubscribeRate` int NOT NULL DEFAULT 0,
	`lastUpdated` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterStats_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `newsletterSubscribers` (
	`id` int AUTO_INCREMENT NOT NULL,
	`email` varchar(320) NOT NULL,
	`firstName` varchar(100),
	`lastName` varchar(100),
	`status` varchar(20) NOT NULL DEFAULT 'active',
	`tags` text,
	`source` varchar(100),
	`customFields` text,
	`subscribedAt` timestamp NOT NULL DEFAULT (now()),
	`unsubscribedAt` timestamp,
	`lastEmailSent` timestamp,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterSubscribers_id` PRIMARY KEY(`id`),
	CONSTRAINT `newsletterSubscribers_email_unique` UNIQUE(`email`)
);
--> statement-breakpoint
CREATE TABLE `newsletterTemplates` (
	`id` int AUTO_INCREMENT NOT NULL,
	`name` varchar(255) NOT NULL,
	`description` text,
	`htmlContent` text NOT NULL,
	`thumbnail` varchar(500),
	`category` varchar(100),
	`isSystem` boolean NOT NULL DEFAULT false,
	`createdBy` int,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `newsletterTemplates_id` PRIMARY KEY(`id`)
);
