ALTER TABLE `staged_event` ADD `external_key` text;--> statement-breakpoint
ALTER TABLE `staged_event` ADD `lat` real;--> statement-breakpoint
ALTER TABLE `staged_event` ADD `lng` real;--> statement-breakpoint
ALTER TABLE `staged_event` ADD `last_seen_at` text;--> statement-breakpoint
CREATE INDEX `staged_event_source_key_idx` ON `staged_event` (`source_id`,`external_key`);