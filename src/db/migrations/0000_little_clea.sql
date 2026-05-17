CREATE TABLE `cases` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`guild_id` text NOT NULL,
	`user_id` text NOT NULL,
	`moderator_id` text NOT NULL,
	`type` text NOT NULL,
	`reason` text,
	`created_at` integer NOT NULL
);
--> statement-breakpoint
CREATE INDEX `cases_guild_user_idx` ON `cases` (`guild_id`,`user_id`);