ALTER TABLE `attachments` ADD `ocr_confidence` real;--> statement-breakpoint
ALTER TABLE `attachments` ADD `ocr_indicators_json` text DEFAULT '[]' NOT NULL;