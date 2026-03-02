import { supabase } from './supabase'
import type { AgreementData } from '../types'
import type { Json } from './database.types'

/**
 * Deep merge two objects. Merges top-level sections and their fields recursively.
 * Used to apply client-filled fields onto the existing admin-filled agreement data.
 */
function deepMerge<T extends Record<string, unknown>>(base: T, override: Partial<T>): T {
  const result = { ...base }
  for (const key in override) {
    const overrideVal = override[key]
    const baseVal = base[key]
    if (
      overrideVal !== null &&
      typeof overrideVal === 'object' &&
      !Array.isArray(overrideVal) &&
      baseVal !== null &&
      typeof baseVal === 'object' &&
      !Array.isArray(baseVal)
    ) {
      result[key] = deepMerge(
        baseVal as Record<string, unknown>,
        overrideVal as Record<string, unknown>
      ) as T[typeof key]
    } else if (overrideVal !== undefined) {
      result[key] = overrideVal as T[typeof key]
    }
  }
  return result
}

/**
 * Fetch an agreement by its shareable token using the anon Supabase client.
 * The anon SELECT RLS policy (001 migration) blocks expired tokens automatically.
 * Returns null if the token is invalid, expired, or not found.
 */
export async function fetchAgreementByToken(token: string): Promise<{
  id: string
  agreement_number: string
  status: string
  data: AgreementData
  token_expires_at: string | null
} | null> {
  const { data, error } = await supabase
    .from('agreements')
    .select('id, agreement_number, status, data, token_expires_at')
    .eq('token', token)
    .single()

  if (error) return null
  return data as unknown as {
    id: string
    agreement_number: string
    status: string
    data: AgreementData
    token_expires_at: string | null
  }
}

/**
 * Record that a client has viewed the agreement.
 * Fire-and-forget — does not block the UI.
 *
 * Inserts an audit_log entry with action='viewed', actor_type='client'.
 * ip_address is intentionally omitted — the audit_log_auto_ip_trigger (002 migration)
 * auto-populates it from PostgREST x-forwarded-for headers. Browsers cannot self-report
 * their real IP address, so we never attempt to capture or pass it from client-side JS.
 *
 * Also updates agreement status from 'sent' to 'viewed' (without overwriting 'signed').
 */
export function recordClientView(agreementId: string): void {
  // Fire-and-forget: intentionally not awaited
  Promise.all([
    supabase.from('audit_log').insert({
      agreement_id: agreementId,
      action: 'viewed' as const,
      actor_type: 'client' as const,
      user_agent: navigator.userAgent,
      metadata: { timestamp: new Date().toISOString() } as unknown as Json
    }),
    // Only advance status from 'sent' to 'viewed', never overwrite 'signed'
    supabase
      .from('agreements')
      .update({ status: 'viewed' })
      .eq('id', agreementId)
      .eq('status', 'sent')
  ]).catch(() => {
    // Intentionally swallow errors — audit view is best-effort
  })
}

/**
 * Submit the client's completed signing data to Supabase.
 * Fetches the current agreement data, deep-merges the client's fields,
 * updates the agreement to 'signed' status, and inserts an audit_log entry.
 *
 * ip_address is NOT passed from client code — it is auto-populated by the
 * audit_log_auto_ip_trigger database trigger from PostgREST request headers.
 *
 * @param token - The shareable token from the URL (used for RLS gating)
 * @param clientData - Only the sections the client filled (renter, signatures, acknowledgments)
 * @param auditMeta - { userAgent } captured from navigator.userAgent
 */
export async function submitClientSigning(
  token: string,
  clientData: Partial<AgreementData>,
  auditMeta: { userAgent: string }
): Promise<void> {
  // Fetch current agreement to get existing admin-filled data
  const { data: agreement, error: fetchError } = await supabase
    .from('agreements')
    .select('id, data')
    .eq('token', token)
    .single()

  if (fetchError || !agreement) {
    throw new Error('Agreement not found or link has expired. Please contact Triple J Auto Investment.')
  }

  // Deep merge: client data overlays on top of admin data (admin fields are preserved)
  const mergedData = deepMerge(agreement.data as unknown as Record<string, unknown>, clientData as Record<string, unknown>)

  // Update agreement: write merged data and advance status to 'signed'
  const { error: updateError } = await supabase
    .from('agreements')
    .update({ data: mergedData as unknown as Json, status: 'signed' })
    .eq('token', token)

  if (updateError) throw updateError

  // Audit log the signing event
  // ip_address omitted — database trigger auto-populates from PostgREST headers
  const { error: auditError } = await supabase.from('audit_log').insert({
    agreement_id: agreement.id,
    action: 'signed' as const,
    actor_type: 'client' as const,
    user_agent: auditMeta.userAgent,
    metadata: {
      signed_at: new Date().toISOString(),
      fields_signed: ['renterSig', 'renterName', 'acknowledgmentInitials']
    } as unknown as Json
  })

  if (auditError) throw auditError
}
