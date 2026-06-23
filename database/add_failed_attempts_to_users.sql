USE parking_db;

ALTER TABLE users
ADD COLUMN failed_attempts INT DEFAULT 0 AFTER status;