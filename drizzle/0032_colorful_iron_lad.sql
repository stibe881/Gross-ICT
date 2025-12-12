CREATE TABLE `oauthProviders` (
	`id` int AUTO_INCREMENT NOT NULL,
	`userId` int NOT NULL,
	`provider` varchar(64) NOT NULL,
	`providerUserId` varchar(255) NOT NULL,
	`accessToken` text,
	`refreshToken` text,
	`tokenExpiresAt` timestamp,
	`profileData` text,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oauthProviders_id` PRIMARY KEY(`id`)
);
--> statement-breakpoint
CREATE TABLE `oauthSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`provider` varchar(64) NOT NULL,
	`clientId` varchar(255) NOT NULL,
	`clientSecret` text NOT NULL,
	`tenantId` varchar(255),
	`redirectUri` varchar(500) NOT NULL,
	`scopes` text NOT NULL,
	`isActive` int NOT NULL DEFAULT 1,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `oauthSettings_id` PRIMARY KEY(`id`),
	CONSTRAINT `oauthSettings_provider_unique` UNIQUE(`provider`)
);
