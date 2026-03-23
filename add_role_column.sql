-- Add role column to project_assignments table
ALTER TABLE project_assignments ADD COLUMN IF NOT EXISTS role TEXT DEFAULT 'Team Member';

-- Update RLS policies if necessary (usually not needed if already using company_id via projects)
-- For example, ensuring admins can see/edit roles:
-- This depends on your existing policies in production_setup.sql
