-- Enable RLS on all tables
ALTER TABLE public.discord_users ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.clearance_generations ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.flight_plans_received ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.site_documents ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback_prompts ENABLE ROW LEVEL SECURITY;
ALTER TABLE public.feedback ENABLE ROW LEVEL SECURITY;


-- =========================================================
-- discord_users RLS
-- Block all direct anon/authenticated access.
-- Backend/RPC operations should use service_role.
-- =========================================================

DROP POLICY IF EXISTS "Deny direct access to discord_users" ON public.discord_users;
CREATE POLICY "Deny direct access to discord_users"
ON public.discord_users
FOR ALL
USING (false)
WITH CHECK (false);


-- =========================================================
-- clearance_generations RLS
-- Allow anon inserts.
-- =========================================================

DROP POLICY IF EXISTS "Allow anon insert clearance_generations" ON public.clearance_generations;
CREATE POLICY "Allow anon insert clearance_generations with validation"
ON public.clearance_generations
FOR INSERT
WITH CHECK (
    LENGTH(clearance_text) <= 5000 AND
    clearance_text IS NOT NULL AND
    clearance_text != '' AND
    (callsign IS NULL OR LENGTH(callsign) <= 20) AND
    (destination IS NULL OR LENGTH(destination) <= 10)
);

DROP POLICY IF EXISTS "Deny anon updates clearance_generations" ON public.clearance_generations;
CREATE POLICY "Deny anon updates clearance_generations"
ON public.clearance_generations
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deny anon deletes clearance_generations" ON public.clearance_generations;
CREATE POLICY "Deny anon deletes clearance_generations"
ON public.clearance_generations
FOR DELETE
USING (auth.role() = 'authenticated');


-- =========================================================
-- flight_plans_received RLS
-- Block all direct access.
-- =========================================================

DROP POLICY IF EXISTS "Deny direct access to flight_plans_received" ON public.flight_plans_received;
CREATE POLICY "Deny direct access to flight_plans_received"
ON public.flight_plans_received
FOR ALL
USING (false)
WITH CHECK (false);


-- =========================================================
-- site_documents RLS
-- Public can read specific allowed documents.
-- =========================================================

DROP POLICY IF EXISTS "Public read allowed documents" ON public.site_documents;
CREATE POLICY "Public read allowed documents"
ON public.site_documents
FOR SELECT
USING (
    doc_key IN (
        'privacy_terms',
        'changelog',
        'credits',
        'support'
    )
);

DROP POLICY IF EXISTS "Deny anon inserts site_documents" ON public.site_documents;
CREATE POLICY "Deny anon inserts site_documents"
ON public.site_documents
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deny anon updates site_documents" ON public.site_documents;
CREATE POLICY "Deny anon updates site_documents"
ON public.site_documents
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deny anon deletes site_documents" ON public.site_documents;
CREATE POLICY "Deny anon deletes site_documents"
ON public.site_documents
FOR DELETE
USING (auth.role() = 'authenticated');


-- =========================================================
-- feedback_prompts RLS
-- Public can read active prompts.
-- =========================================================

DROP POLICY IF EXISTS "Public read active feedback prompts" ON public.feedback_prompts;
CREATE POLICY "Public read active feedback prompts"
ON public.feedback_prompts
FOR SELECT
USING (expires_at > NOW());

DROP POLICY IF EXISTS "Deny anon inserts feedback_prompts" ON public.feedback_prompts;
CREATE POLICY "Deny anon inserts feedback_prompts"
ON public.feedback_prompts
FOR INSERT
WITH CHECK (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deny anon updates feedback_prompts" ON public.feedback_prompts;
CREATE POLICY "Deny anon updates feedback_prompts"
ON public.feedback_prompts
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deny anon deletes feedback_prompts" ON public.feedback_prompts;
CREATE POLICY "Deny anon deletes feedback_prompts"
ON public.feedback_prompts
FOR DELETE
USING (auth.role() = 'authenticated');


-- =========================================================
-- feedback RLS
-- Allow anon inserts.
-- =========================================================

DROP POLICY IF EXISTS "Allow anon insert feedback" ON public.feedback;
CREATE POLICY "Allow anon insert feedback"
ON public.feedback
FOR INSERT
WITH CHECK (true);

DROP POLICY IF EXISTS "Deny anon updates feedback" ON public.feedback;
CREATE POLICY "Deny anon updates feedback"
ON public.feedback
FOR UPDATE
USING (auth.role() = 'authenticated');

DROP POLICY IF EXISTS "Deny anon deletes feedback" ON public.feedback;
CREATE POLICY "Deny anon deletes feedback"
ON public.feedback
FOR DELETE
USING (auth.role() = 'authenticated');


-- =========================================================
-- Service role policies
-- =========================================================

DROP POLICY IF EXISTS "Service role full access discord_users" ON public.discord_users;
CREATE POLICY "Service role full access discord_users"
ON public.discord_users
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access clearance_generations" ON public.clearance_generations;
CREATE POLICY "Service role full access clearance_generations"
ON public.clearance_generations
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access flight_plans_received" ON public.flight_plans_received;
CREATE POLICY "Service role full access flight_plans_received"
ON public.flight_plans_received
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access site_documents" ON public.site_documents;
CREATE POLICY "Service role full access site_documents"
ON public.site_documents
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access feedback_prompts" ON public.feedback_prompts;
CREATE POLICY "Service role full access feedback_prompts"
ON public.feedback_prompts
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');

DROP POLICY IF EXISTS "Service role full access feedback" ON public.feedback;
CREATE POLICY "Service role full access feedback"
ON public.feedback
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');


-- =========================================================
-- advertisements RLS
-- Public can read active advertisements.
-- =========================================================

DROP POLICY IF EXISTS "Public read active advertisement" ON public.advertisements;
CREATE POLICY "Public read active advertisement"
ON public.advertisements
FOR SELECT
USING (is_active = true);

DROP POLICY IF EXISTS "Service role full access advertisements" ON public.advertisements;
CREATE POLICY "Service role full access advertisements"
ON public.advertisements
FOR ALL
USING (auth.role() = 'service_role')
WITH CHECK (auth.role() = 'service_role');