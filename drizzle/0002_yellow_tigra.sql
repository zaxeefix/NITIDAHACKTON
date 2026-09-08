ALTER TABLE `incidents` ADD `indicators_json` text DEFAULT '[]' NOT NULL;--> statement-breakpoint
ALTER TABLE `incidents` ADD `duplicate_of` text;--> statement-breakpoint
ALTER TABLE `incidents` ADD `redaction_status` text DEFAULT 'Pending Review' NOT NULL;--> statement-breakpoint
ALTER TABLE `incidents` ADD `analysis_explanation` text DEFAULT '' NOT NULL;