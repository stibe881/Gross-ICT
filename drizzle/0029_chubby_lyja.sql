CREATE TABLE `smtpSettings` (
	`id` int AUTO_INCREMENT NOT NULL,
	`host` varchar(255) NOT NULL,
	`port` int NOT NULL,
	`secure` int NOT NULL DEFAULT 1,
	`user` varchar(320) NOT NULL,
	`password` varchar(500) NOT NULL,
	`fromEmail` varchar(320) NOT NULL,
	`fromName` varchar(255) NOT NULL,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `smtpSettings_id` PRIMARY KEY(`id`)
);
