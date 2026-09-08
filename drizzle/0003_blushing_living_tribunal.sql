CREATE TABLE `notifications` (
	`id` integer PRIMARY KEY AUTOINCREMENT NOT NULL,
	`recipient_email` text,
	`incident_id` text,
	`type` text NOT NULL,
	`title` text NOT NULL,
	`message` text NOT NULL,
	`read_at` text,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
--> statement-breakpoint
CREATE TABLE `workspace_users` (
	`email` text PRIMARY KEY NOT NULL,
	`display_name` text NOT NULL,
	`role` text DEFAULT 'Reporter' NOT NULL,
	`status` text DEFAULT 'Active' NOT NULL,
	`created_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL,
	`updated_at` text DEFAULT CURRENT_TIMESTAMP NOT NULL
);
