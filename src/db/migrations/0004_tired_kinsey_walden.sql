CREATE TABLE `guild_autoroles` (
	`guild_id` text NOT NULL,
	`role_id` text NOT NULL,
	`created_at` integer NOT NULL,
	PRIMARY KEY(`guild_id`, `role_id`)
);
