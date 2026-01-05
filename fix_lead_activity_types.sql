-- Add new activity types to leadActivities table
ALTER TABLE `leadActivities` 
MODIFY COLUMN `activityType` ENUM('note', 'email', 'call', 'meeting', 'status_change', 'email_sent', 'called', 'contacted') NOT NULL;
