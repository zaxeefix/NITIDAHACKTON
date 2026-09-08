ALTER TABLE `delivery_queue` ADD `response_code` integer;--> statement-breakpoint
ALTER TABLE `delivery_queue` ADD `response_body_hash` text;--> statement-breakpoint
ALTER TABLE `delivery_queue` ADD `delivered_at` text;--> statement-breakpoint
ALTER TABLE `delivery_queue` ADD `signature_algorithm` text;