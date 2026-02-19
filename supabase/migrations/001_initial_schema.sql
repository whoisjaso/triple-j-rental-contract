-- Agreement number sequence
CREATE SEQUENCE agreement_number_seq START WITH 1;

-- Agreement number generator function
CREATE OR REPLACE FUNCTION generate_agreement_number()
RETURNS text AS $$
BEGIN
  RETURN 'TJ-' || EXTRACT(YEAR FROM NOW())::text || '-' || LPAD(nextval('agreement_number_seq')::text, 4, '0');
END;
$$ LANGUAGE plpgsql;

-- Agreements table
CREATE TABLE agreements (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  agreement_number text NOT NULL UNIQUE DEFAULT generate_agreement_number(),
  status text NOT NULL DEFAULT 'draft' CHECK (status IN ('draft', 'sent', 'viewed', 'signed', 'completed', 'expired')),
  data jsonb NOT NULL DEFAULT '{}'::jsonb,
  token text UNIQUE,
  token_expires_at timestamptz,
  created_by uuid REFERENCES auth.users(id),
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now()
);

-- Auto-update trigger for updated_at
CREATE OR REPLACE FUNCTION update_updated_at()
RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

CREATE TRIGGER agreements_updated_at
  BEFORE UPDATE ON agreements
  FOR EACH ROW
  EXECUTE FUNCTION update_updated_at();

-- Audit log table
CREATE TABLE audit_log (
  id bigserial PRIMARY KEY,
  agreement_id uuid REFERENCES agreements(id) ON DELETE SET NULL,
  action text NOT NULL CHECK (action IN ('created', 'updated', 'sent', 'viewed', 'signed', 'pdf_generated', 'downloaded', 'expired')),
  actor_type text NOT NULL DEFAULT 'admin' CHECK (actor_type IN ('admin', 'client', 'system')),
  actor_id uuid,
  ip_address text,
  user_agent text,
  metadata jsonb DEFAULT '{}'::jsonb,
  created_at timestamptz NOT NULL DEFAULT now()
);

-- IP and user-agent helper functions
CREATE OR REPLACE FUNCTION get_client_ip()
RETURNS text AS $$
DECLARE
  headers jsonb;
  forwarded text;
BEGIN
  headers := current_setting('request.headers', true)::jsonb;
  forwarded := headers->>'x-forwarded-for';
  IF forwarded IS NOT NULL THEN
    RETURN split_part(forwarded, ',', 1);
  END IF;
  RETURN NULL;
END;
$$ LANGUAGE plpgsql STABLE;

CREATE OR REPLACE FUNCTION get_user_agent()
RETURNS text AS $$
BEGIN
  RETURN current_setting('request.headers', true)::jsonb->>'user-agent';
END;
$$ LANGUAGE plpgsql STABLE;

-- Enable RLS
ALTER TABLE agreements ENABLE ROW LEVEL SECURITY;
ALTER TABLE audit_log ENABLE ROW LEVEL SECURITY;

-- RLS Policies for audit_log (append-only)
CREATE POLICY "audit_log_insert_authenticated" ON audit_log FOR INSERT TO authenticated WITH CHECK (true);
CREATE POLICY "audit_log_insert_anon" ON audit_log FOR INSERT TO anon WITH CHECK (true);
CREATE POLICY "audit_log_select_authenticated" ON audit_log FOR SELECT TO authenticated USING (true);
-- NO UPDATE or DELETE policies = append-only

-- RLS Policies for agreements
CREATE POLICY "agreements_all_authenticated" ON agreements FOR ALL TO authenticated USING (true) WITH CHECK (true);
CREATE POLICY "agreements_select_anon" ON agreements FOR SELECT TO anon USING (token IS NOT NULL AND token_expires_at > now());

-- Indexes
CREATE INDEX idx_agreements_token ON agreements(token) WHERE token IS NOT NULL;
CREATE INDEX idx_audit_log_agreement ON audit_log(agreement_id);
CREATE INDEX idx_audit_log_created ON audit_log USING brin(created_at);
