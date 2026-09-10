-- Run this ONCE in the Supabase Dashboard -> SQL Editor for project gbalcymcuhnvpbpzhzcl.
-- It creates every table that database/schema.sql documents but the live project is missing.
-- Safe to re-run: uses IF NOT EXISTS and OR REPLACE everywhere.

-- Consent records (checked by /api/auth/register and the compliance check scripts).
CREATE TABLE IF NOT EXISTS public.consents (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	document_id TEXT NOT NULL,
	version TEXT NOT NULL,
	action TEXT NOT NULL CHECK (action IN ('accepted', 'withdrawn')),
	ip_address INET NULL,
	user_agent TEXT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.consents ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS consents_user_id_idx ON public.consents (user_id);

-- Password hashes (bcrypt only). Required by /api/auth/login and /api/auth/register.
CREATE TABLE IF NOT EXISTS public.user_credentials (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	contact TEXT NOT NULL UNIQUE,
	password_hash TEXT NOT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.user_credentials ENABLE ROW LEVEL SECURITY;
-- No end-user policies: only the server-side service role may read or write password hashes.

-- Security audit trail.
CREATE TABLE IF NOT EXISTS public.security_audit_events (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id UUID NULL REFERENCES auth.users(id) ON DELETE SET NULL,
	event_type TEXT NOT NULL,
	metadata JSONB NOT NULL DEFAULT '{}'::jsonb,
	ip_address INET NULL,
	user_agent TEXT NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.security_audit_events ENABLE ROW LEVEL SECURITY;

CREATE INDEX IF NOT EXISTS security_audit_events_created_at_idx ON public.security_audit_events (created_at);
CREATE INDEX IF NOT EXISTS security_audit_events_user_id_idx ON public.security_audit_events (user_id);

-- GDPR / data-subject requests.
CREATE TABLE IF NOT EXISTS public.data_subject_requests (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	user_id UUID NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
	request_type TEXT NOT NULL CHECK (request_type IN ('erasure')),
	details TEXT NULL,
	status TEXT NOT NULL CHECK (status IN ('completed', 'failed')),
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	completed_at TIMESTAMPTZ NULL
);

ALTER TABLE public.data_subject_requests ENABLE ROW LEVEL SECURITY;

-- Profile storage + RBAC role (id = auth.users.id). Required by /api/profile and app/lib/require-auth.ts.
CREATE TABLE IF NOT EXISTS public.profiles (
	id UUID PRIMARY KEY REFERENCES auth.users(id) ON DELETE CASCADE,
	full_name TEXT NULL,
	phone TEXT NULL,
	country TEXT NULL,
	app_role TEXT NOT NULL DEFAULT 'user' CHECK (app_role IN ('user', 'admin')),
	email TEXT NULL,
	deletion_requested_at TIMESTAMPTZ NULL,
	anonymized_at TIMESTAMPTZ NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now(),
	updated_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.profiles ENABLE ROW LEVEL SECURITY;

-- Profiles contain contact data and are never publicly readable.
DROP POLICY IF EXISTS "Public profiles are viewable by everyone." ON public.profiles;

-- Remove legacy duplicate policies that differ only by a trailing period. The matching policy
-- must have the same command, roles, and predicates before the punctuated name is removed.
DO $$
DECLARE
	policy_record RECORD;
BEGIN
	FOR policy_record IN
		SELECT punctuated.schemaname, punctuated.tablename, punctuated.policyname
		FROM pg_policies AS punctuated
		JOIN pg_policies AS canonical
			ON canonical.schemaname = punctuated.schemaname
			AND canonical.tablename = punctuated.tablename
			AND canonical.policyname = regexp_replace(punctuated.policyname, '\\.$', '')
			AND canonical.cmd = punctuated.cmd
			AND canonical.roles IS NOT DISTINCT FROM punctuated.roles
			AND canonical.qual IS NOT DISTINCT FROM punctuated.qual
			AND canonical.with_check IS NOT DISTINCT FROM punctuated.with_check
		WHERE punctuated.schemaname = 'public'
			AND punctuated.policyname LIKE 'Users can view own%.%'
			AND punctuated.policyname ~ '\\.$'
	LOOP
		EXECUTE format(
			'DROP POLICY IF EXISTS %I ON %I.%I',
			policy_record.policyname,
			policy_record.schemaname,
			policy_record.tablename
		);
	END LOOP;
END;
$$;

DROP POLICY IF EXISTS "Users can read their own profile" ON public.profiles;
CREATE POLICY "Users can read their own profile" ON public.profiles FOR SELECT USING (auth.uid() = id);
DROP POLICY IF EXISTS "Users can insert their own profile" ON public.profiles;
CREATE POLICY "Users can insert their own profile" ON public.profiles FOR INSERT WITH CHECK (auth.uid() = id);
DROP POLICY IF EXISTS "Users can update their own profile" ON public.profiles;
CREATE POLICY "Users can update their own profile" ON public.profiles FOR UPDATE USING (auth.uid() = id) WITH CHECK (auth.uid() = id);

CREATE OR REPLACE FUNCTION public.prevent_profile_role_change()
RETURNS trigger
LANGUAGE plpgsql
SECURITY DEFINER
AS $$
BEGIN
  IF NEW.app_role IS DISTINCT FROM OLD.app_role AND COALESCE(current_setting('request.jwt.claim.role', true), '') <> 'service_role' THEN
    RAISE EXCEPTION 'Only the service role may change app_role';
  END IF;
  RETURN NEW;
END;
$$;

DROP TRIGGER IF EXISTS protect_profile_role ON public.profiles;
CREATE TRIGGER protect_profile_role
	BEFORE UPDATE ON public.profiles
	FOR EACH ROW EXECUTE FUNCTION public.prevent_profile_role_change();

-- One-time passcodes for real email/SMS OTP verification (app/lib/otp.ts, /api/auth/otp/*).
CREATE TABLE IF NOT EXISTS public.otp_codes (
	id BIGINT GENERATED ALWAYS AS IDENTITY PRIMARY KEY,
	contact TEXT NOT NULL,
	purpose TEXT NOT NULL,
	code_hash TEXT NOT NULL,
	attempts INT NOT NULL DEFAULT 0,
	expires_at TIMESTAMPTZ NOT NULL,
	consumed_at TIMESTAMPTZ NULL,
	created_at TIMESTAMPTZ NOT NULL DEFAULT now()
);

ALTER TABLE public.otp_codes ENABLE ROW LEVEL SECURITY;
-- No end-user policies: only the server-side service role may read or write OTP codes.

CREATE INDEX IF NOT EXISTS otp_codes_contact_purpose_idx ON public.otp_codes (contact, purpose);

-- Audit trails are append-only (WORM): once written, a consent/audit/data-request record must never
-- be edited, even by an administrator. Corrections must be new rows, not mutated history.
CREATE OR REPLACE FUNCTION public.reject_audit_update()
RETURNS trigger
LANGUAGE plpgsql
AS $$
BEGIN
  RAISE EXCEPTION 'Audit records are immutable and cannot be updated.';
END;
$$;

DROP TRIGGER IF EXISTS reject_consents_update ON public.consents;
CREATE TRIGGER reject_consents_update BEFORE UPDATE ON public.consents FOR EACH ROW EXECUTE FUNCTION public.reject_audit_update();

DROP TRIGGER IF EXISTS reject_security_audit_events_update ON public.security_audit_events;
CREATE TRIGGER reject_security_audit_events_update BEFORE UPDATE ON public.security_audit_events FOR EACH ROW EXECUTE FUNCTION public.reject_audit_update();

DROP TRIGGER IF EXISTS reject_data_subject_requests_update ON public.data_subject_requests;
CREATE TRIGGER reject_data_subject_requests_update BEFORE UPDATE ON public.data_subject_requests FOR EACH ROW EXECUTE FUNCTION public.reject_audit_update();

-- Required so PostgREST picks up the new tables immediately.
NOTIFY pgrst, 'reload schema';
