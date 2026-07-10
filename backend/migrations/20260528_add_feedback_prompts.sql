-- Create feedback_prompts table and add prompt_id to feedback

CREATE TABLE IF NOT EXISTS feedback_prompts (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  created_at timestamptz DEFAULT now(),
  expires_at timestamptz NOT NULL,
  message text NOT NULL
);

-- Add prompt_id column to existing feedback table
ALTER TABLE IF EXISTS feedback
  ADD COLUMN IF NOT EXISTS prompt_id uuid;
