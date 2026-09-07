-- prm moves to Ward: the user tables go, and the per-person rows are re-keyed
-- onto Ward's opaque subject.
--
-- THIS MIGRATION DESTROYS EVERY ACCOUNT AND EVERYTHING KEYED ON ONE.
-- Take a database copy before running it. There is no down.
--
-- Why the data cannot be carried across: prm keyed people on **email** and Ward
-- keys them on a subject it mints. No mapping exists that was not invented at
-- cutover time, so the estate chose a full prune and recreation over a
-- migration path (wzd_auth/corpus/wiki/decisions-accounts.md). Favourites and
-- notifications go with the accounts that owned them — they are per-person rows
-- and there is no person left to attach them to.
--
-- What survives untouched: places, events, sources, staged events, the geocode
-- cache — every row that makes prm a public resource map. That half of the app
-- never knew about accounts and does not notice this.
--
-- SQLite cannot ALTER a column's foreign key, so the three per-person tables
-- are rebuilt rather than altered. They are rebuilt EMPTY, which is the same
-- decision as the drop above rather than a second one.

PRAGMA foreign_keys = OFF;
--> statement-breakpoint

-- Dependency order: notification_event references notification, and all three
-- per-person tables reference `user`.
DROP TABLE IF EXISTS `notification_event`;--> statement-breakpoint
DROP TABLE IF EXISTS `notification`;--> statement-breakpoint
DROP TABLE IF EXISTS `favorite_event`;--> statement-breakpoint
DROP TABLE IF EXISTS `favorite_place`;--> statement-breakpoint

-- Credentials. prm holds none of these any more: sign-in, registration, email
-- verification and password reset are all Ward's.
DROP TABLE IF EXISTS `reset_token`;--> statement-breakpoint
DROP TABLE IF EXISTS `verification_token`;--> statement-breakpoint
DROP TABLE IF EXISTS `session`;--> statement-breakpoint
DROP TABLE IF EXISTS `user`;--> statement-breakpoint

-- Rebuilt on `subject`. No foreign key for it, and there must not be: the table
-- it would reference does not exist here, and a local `user` table would be a
-- second, stale answer to "who exists".
CREATE TABLE `favorite_place` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`place_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX `favorite_place_unique` ON `favorite_place` (`subject`,`place_id`);--> statement-breakpoint
CREATE INDEX `favorite_place_subject_idx` ON `favorite_place` (`subject`);--> statement-breakpoint

CREATE TABLE `favorite_event` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`event_id` text NOT NULL,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
CREATE UNIQUE INDEX `favorite_event_unique` ON `favorite_event` (`subject`,`event_id`);--> statement-breakpoint
CREATE INDEX `favorite_event_subject_idx` ON `favorite_event` (`subject`);--> statement-breakpoint

CREATE TABLE `notification` (
	`id` text PRIMARY KEY NOT NULL,
	`subject` text NOT NULL,
	`kind` text NOT NULL,
	`place_id` text,
	`event_id` text,
	`batch_id` text,
	`title` text,
	`body` text,
	`read_at` text,
	`emailed_at` text,
	`created_at` text DEFAULT (CURRENT_TIMESTAMP) NOT NULL,
	FOREIGN KEY (`place_id`) REFERENCES `place`(`id`) ON UPDATE no action ON DELETE no action,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint
-- Idempotency for per-event reminders. new-event rows have a null event_id and
-- SQLite treats NULLs as distinct, so they are not collapsed here.
CREATE UNIQUE INDEX `notification_subject_event_kind_unique` ON `notification` (`subject`,`event_id`,`kind`);--> statement-breakpoint
CREATE INDEX `notification_subject_idx` ON `notification` (`subject`);--> statement-breakpoint
CREATE INDEX `notification_place_idx` ON `notification` (`place_id`);--> statement-breakpoint
CREATE INDEX `notification_event_idx` ON `notification` (`event_id`);--> statement-breakpoint

CREATE TABLE `notification_event` (
	`notification_id` text NOT NULL,
	`event_id` text NOT NULL,
	PRIMARY KEY(`notification_id`, `event_id`),
	FOREIGN KEY (`notification_id`) REFERENCES `notification`(`id`) ON UPDATE no action ON DELETE cascade,
	FOREIGN KEY (`event_id`) REFERENCES `event`(`id`) ON UPDATE no action ON DELETE no action
);--> statement-breakpoint

PRAGMA foreign_keys = ON;
