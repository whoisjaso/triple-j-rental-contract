-- Add renewal chain support
ALTER TABLE agreements ADD COLUMN renewed_from uuid REFERENCES agreements(id) ON DELETE SET NULL;

-- Index for querying renewal chains
CREATE INDEX idx_agreements_renewed_from ON agreements(renewed_from) WHERE renewed_from IS NOT NULL;

-- Add 'renewed' to audit_log action CHECK
ALTER TABLE audit_log DROP CONSTRAINT audit_log_action_check;
ALTER TABLE audit_log ADD CONSTRAINT audit_log_action_check
  CHECK (action IN ('created', 'updated', 'sent', 'viewed', 'signed', 'pdf_generated', 'downloaded', 'expired', 'renewed'));
