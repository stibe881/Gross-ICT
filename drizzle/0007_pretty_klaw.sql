ALTER TABLE `kbArticles` ADD `visibility` enum('internal','public') DEFAULT 'public' NOT NULL;--> statement-breakpoint
ALTER TABLE `kbArticles` ADD `sourceTicketId` int;--> statement-breakpoint
ALTER TABLE `kbArticles` DROP COLUMN `isPublished`;