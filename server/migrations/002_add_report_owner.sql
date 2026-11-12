-- Link pet reports to registered users
ALTER TABLE pet_reports
ADD COLUMN IF NOT EXISTS user_id BIGINT
REFERENCES users(id)
ON DELETE SET NULL;

-- Improve performance when loading a user's reports
CREATE INDEX IF NOT EXISTS idx_pet_reports_user_id
ON pet_reports(user_id);
