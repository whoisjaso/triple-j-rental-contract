-- Allow anonymous clients to update agreement data when they hold a valid, non-expired token.
-- The anon SELECT policy (from 001_initial_schema.sql) already gates SELECT by token + expiry.
-- This UPDATE policy mirrors the same condition so clients can submit their filled fields and signature.
CREATE POLICY "agreements_update_anon_by_token" ON agreements
  FOR UPDATE TO anon
  USING (token IS NOT NULL AND token_expires_at > now())
  WITH CHECK (token IS NOT NULL AND token_expires_at > now());

-- Auto-populate ip_address and user_agent on audit_log inserts from PostgREST request headers.
-- Browsers cannot self-report their real IP address, but PostgREST forwards the client IP via
-- x-forwarded-for headers which are accessible inside Postgres via request.headers.
-- The get_client_ip() and get_user_agent() functions (from 001_initial_schema.sql) extract these.
-- This trigger fires for ALL inserts (admin and client), transparently filling NULL values.
-- Satisfies SIGN-06 (signature stored with IP + user agent) and AUDIT-02 (client view recorded with IP).
CREATE OR REPLACE FUNCTION audit_log_auto_ip()
RETURNS trigger AS $$
BEGIN
  IF NEW.ip_address IS NULL THEN
    NEW.ip_address := get_client_ip();
  END IF;
  IF NEW.user_agent IS NULL THEN
    NEW.user_agent := get_user_agent();
  END IF;
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER audit_log_auto_ip_trigger
  BEFORE INSERT ON audit_log
  FOR EACH ROW
  EXECUTE FUNCTION audit_log_auto_ip();
