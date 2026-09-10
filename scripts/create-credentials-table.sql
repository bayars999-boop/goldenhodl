-- Run this in the Supabase Dashboard -> SQL Editor for your project.
-- It creates the missing public.user_credentials table used by /api/auth/login and /api/auth/register.

CREATE TABLE IF NOT EXISTS public.user_credentials (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	contact TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
-- No end-user policies: only the server-side service role may read or write password hashes.

-- Required so PostgREST picks up the new table without waiting for its cache to expire.
NOTIFY pgrst, 'reload schema';
