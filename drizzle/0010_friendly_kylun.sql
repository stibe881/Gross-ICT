CREATE TABLE `products` (
	`id` int AUTO_INCREMENT NOT NULL,
	`sku` varchar(100),
	`name` varchar(255) NOT NULL,
	`description` text,
	`category` varchar(100),
	`unitPrice` decimal(10,2) NOT NULL,
	`unit` varchar(50) NOT NULL DEFAULT 'Stück',
	`vatRate` decimal(5,2) NOT NULL DEFAULT '8.10',
	`isActive` boolean NOT NULL DEFAULT true,
	`createdAt` timestamp NOT NULL DEFAULT (now()),
	`updatedAt` timestamp NOT NULL DEFAULT (now()) ON UPDATE CURRENT_TIMESTAMP,
	CONSTRAINT `products_id` PRIMARY KEY(`id`),
	CONSTRAINT `products_sku_unique` UNIQUE(`sku`)
);
