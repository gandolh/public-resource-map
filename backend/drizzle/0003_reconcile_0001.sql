PRAGMA foreign_keys=OFF;--> statement-breakpoint
CREATE TABLE `__new_notification_event` (
	`notification_id` text NOT NULL,
	`event_id` text NOT NULL,
	PRIMARY KEY(`notification_id`, `event_id`),
	FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);
--> statement-breakpoint
INSERT INTO `__new_notification_event`("notification_id", "event_id") SELECT "notification_id", "event_id" FROM `notification_event`;--> statement-breakpoint
DROP TABLE `notification_event`;--> statement-breakpoint
ALTER TABLE `__new_notification_event` RENAME TO `notification_event`;--> statement-breakpoint
PRAGMA foreign_keys=ON;--> statement-breakpoint
CREATE INDEX `notification_event_event_idx` ON `notification_event` (`event_id`);--> statement-breakpoint
-- Hand-added (brief 29): 0001 rebuilt the favourite tables without these two
-- indexes, and the snapshot already lists them, so drizzle-kit cannot see they
-- are missing. IF NOT EXISTS keeps this safe on a database that has them.
CREATE INDEX IF NOT EXISTS `favorite_place_place_idx` ON `favorite_place` (`place_id`);--> statement-breakpoint
CREATE INDEX IF NOT EXISTS `favorite_event_event_idx` ON `favorite_event` (`event_id`);
