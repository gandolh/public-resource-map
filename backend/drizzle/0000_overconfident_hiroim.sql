CREATE TABLE `event` (
	`id` text PRIMARY KEY NOT NULL,
	`place_id` text NOT NULL,
	`title` text NOT NULL,
	`normalized_title` text,
	`description` text,
	`category` text NOT NULL,
	`status` text DEFAULT 'live' NOT NULL,
	`start_date` text NOT NULL,
	`end_date` text,
	`buy_url` text,
	`source_url` text,
	`source_platform` text,
	`image_url` text,
	`price` real,
	`currency` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `event_place_idx` ON `event` (`place_id`);--> statement-breakpoint
CREATE INDEX `event_status_idx` ON `event` (`status`);--> statement-breakpoint
CREATE INDEX `event_dedup_idx` ON `event` (`normalized_title`,`start_date`,`place_id`);--> statement-breakpoint
CREATE TABLE `event_source` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`adapter_key` text NOT NULL,
	`mechanism` text NOT NULL,
	`url` text,
	`city` text,
	`enabled` integer DEFAULT true NOT NULL,
	`last_status` text,
	`last_event_count` integer,
	`last_successful_at` text,
	`last_run_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `event_source_adapter_key_unique` ON `event_source` (`adapter_key`);--> statement-breakpoint
CREATE TABLE `favorite_event` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`event_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorite_event_unique` ON `favorite_event` (`user_id`,`event_id`);--> statement-breakpoint
CREATE INDEX `favorite_event_user_idx` ON `favorite_event` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorite_event_event_idx` ON `favorite_event` (`event_id`);--> statement-breakpoint
CREATE TABLE `favorite_place` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`place_id` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `favorite_place_unique` ON `favorite_place` (`user_id`,`place_id`);--> statement-breakpoint
CREATE INDEX `favorite_place_user_idx` ON `favorite_place` (`user_id`);--> statement-breakpoint
CREATE INDEX `favorite_place_place_idx` ON `favorite_place` (`place_id`);--> statement-breakpoint
CREATE TABLE `geocode_cache` (
	`id` text PRIMARY KEY NOT NULL,
	`normalized_address` text NOT NULL,
	`city` text,
	`lat` real,
	`lng` real,
	`importance` real,
	`granularity` text,
	`raw` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `geocode_cache_address_unique` ON `geocode_cache` (`normalized_address`);--> statement-breakpoint
CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`kind` text NOT NULL,
	`place_id` text,
	`event_id` text,
	`batch_id` text,
	`title` text,
	`body` text,
	`read_at` text,
	`emailed_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_user_event_kind_unique` ON `notification` (`user_id`,`event_id`,`kind`);--> statement-breakpoint
CREATE INDEX `notification_user_idx` ON `notification` (`user_id`);--> statement-breakpoint
CREATE INDEX `notification_place_idx` ON `notification` (`place_id`);--> statement-breakpoint
CREATE INDEX `notification_event_idx` ON `notification` (`event_id`);--> statement-breakpoint
CREATE TABLE `notification_event` (
	`id` text PRIMARY KEY NOT NULL,
	`notification_id` text NOT NULL,
	`event_id` text NOT NULL,
	FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `notification_event_unique` ON `notification_event` (`notification_id`,`event_id`);--> statement-breakpoint
CREATE INDEX `notification_event_notification_idx` ON `notification_event` (`notification_id`);--> statement-breakpoint
CREATE INDEX `notification_event_event_idx` ON `notification_event` (`event_id`);--> statement-breakpoint
CREATE TABLE `place` (
	`id` text PRIMARY KEY NOT NULL,
	`name` text NOT NULL,
	`description` text,
	`category` text NOT NULL,
	`source` text DEFAULT 'osm' NOT NULL,
	`osm_type` text,
	`osm_id` text,
	`is_manual_pin` integer DEFAULT false NOT NULL,
	`address` text,
	`city` text NOT NULL,
	`lat` real NOT NULL,
	`lng` real NOT NULL,
	`website` text,
	`phone` text,
	`opening_hours` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `place_osm_unique` ON `place` (`osm_type`,`osm_id`) WHERE "place"."source" = 'osm';--> statement-breakpoint
CREATE INDEX `place_lat_lng_idx` ON `place` (`lat`,`lng`);--> statement-breakpoint
CREATE INDEX `place_city_idx` ON `place` (`city`);--> statement-breakpoint
CREATE TABLE `reset_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`used_at` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `reset_token_unique` ON `reset_token` (`token`);--> statement-breakpoint
CREATE INDEX `reset_token_user_idx` ON `reset_token` (`user_id`);--> statement-breakpoint
CREATE TABLE `session` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `session_user_idx` ON `session` (`user_id`);--> statement-breakpoint
CREATE TABLE `staged_event` (
	`id` text PRIMARY KEY NOT NULL,
	`source_id` text NOT NULL,
	`place_id` text,
	`event_id` text,
	`match_status` text NOT NULL,
	`status` text DEFAULT 'new' NOT NULL,
	`title` text NOT NULL,
	`normalized_title` text,
	`description` text,
	`category` text,
	`venue_name` text,
	`raw_address` text,
	`start_date` text NOT NULL,
	`end_date` text,
	`buy_url` text,
	`source_url` text,
	`source_platform` text,
	`image_url` text,
	`price` real,
	`currency` text,
	`candidates` text,
	`payload` text,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`source_id`) REFERENCES `event_source`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE INDEX `staged_event_source_idx` ON `staged_event` (`source_id`);--> statement-breakpoint
CREATE INDEX `staged_event_place_idx` ON `staged_event` (`place_id`);--> statement-breakpoint
CREATE INDEX `staged_event_event_idx` ON `staged_event` (`event_id`);--> statement-breakpoint
CREATE INDEX `staged_event_status_idx` ON `staged_event` (`status`);--> statement-breakpoint
CREATE TABLE `user` (
	`id` text PRIMARY KEY NOT NULL,
	`email` text NOT NULL,
	`password_hash` text NOT NULL,
	`display_name` text,
	`role` text DEFAULT 'user' NOT NULL,
	`email_verified` integer DEFAULT false NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	`updated_at` text DEFAULT (datetime('now')) NOT NULL
);
--> statement-breakpoint
CREATE UNIQUE INDEX `user_email_unique` ON `user` (`email`);--> statement-breakpoint
CREATE TABLE `verification_token` (
	`id` text PRIMARY KEY NOT NULL,
	`user_id` text NOT NULL,
	`token` text NOT NULL,
	`expires_at` text NOT NULL,
	`created_at` text DEFAULT (datetime('now')) NOT NULL,
	FOREIGN KEY (`user_id`) REFERENCES `user`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
CREATE UNIQUE INDEX `verification_token_unique` ON `verification_token` (`token`);--> statement-breakpoint
CREATE INDEX `verification_token_user_idx` ON `verification_token` (`user_id`);