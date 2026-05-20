-- Schema updates for clearance and admin analytics support

-- 1. Tie clearance history to the canonical Discord user table.
ALTER TABLE public.clearance_generations
ADD CONSTRAINT clearance_generations_user_id_fkey
FOREIGN KEY (user_id)
REFERENCES public.discord_users(id)
ON DELETE SET NULL;

-- 2. Add indexes for the queries used by admin analytics and user history.
CREATE INDEX IF NOT EXISTS idx_clearance_generations_created_at
    ON public.clearance_generations (created_at DESC);

CREATE INDEX IF NOT EXISTS idx_clearance_generations_user_id
    ON public.clearance_generations (user_id);

CREATE INDEX IF NOT EXISTS idx_clearance_generations_callsign
    ON public.clearance_generations (callsign);

-- 3. Backend change, not a SQL change: stop falling back to a nonexistent public.users table.
--    The application should read users from public.discord_users only.

-- 4. RPC verification: confirm these functions exist and still return the expected shapes.
--    update_user_from_discord_login
--    get_user_clearances
--    get_leaderboard_details
--    get_admin_users
