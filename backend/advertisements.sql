CREATE TABLE IF NOT EXISTS public.advertisements (
    id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
    server_name text NOT NULL CHECK (char_length(server_name) <= 100),
    invite_url text NOT NULL,
    icon_url text,
    description text CHECK (description IS NULL OR char_length(description) <= 500),
    message text CHECK (message IS NULL OR char_length(message) <= 500),
    is_active boolean NOT NULL DEFAULT false,
    created_at timestamptz NOT NULL DEFAULT now(),
    updated_at timestamptz NOT NULL DEFAULT now()
);

DROP INDEX IF EXISTS one_active_advertisement;
CREATE UNIQUE INDEX one_active_advertisement
ON public.advertisements (is_active)
WHERE is_active = true;

CREATE OR REPLACE FUNCTION public.set_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS advertisements_set_updated_at ON public.advertisements;
CREATE TRIGGER advertisements_set_updated_at
BEFORE UPDATE ON public.advertisements
FOR EACH ROW EXECUTE FUNCTION public.set_updated_at();

ALTER TABLE public.advertisements ENABLE ROW LEVEL SECURITY;

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
