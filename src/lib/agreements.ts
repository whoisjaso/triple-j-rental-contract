import { supabase } from './supabase'
import type { AgreementData } from '../types'
import type { Json } from './database.types'

export interface AgreementListItem {
  id: string
  agreement_number: string
  status: string
  created_at: string
  updated_at: string
  renter_name: string | null
}

export async function createAgreement(data: AgreementData, userId: string): Promise<{ id: string; agreement_number: string }> {
  const { data: row, error } = await supabase
    .from('agreements')
    .insert({ data: data as unknown as Json, created_by: userId })
    .select('id, agreement_number')
    .single()

  if (error) throw error
  if (!row) throw new Error('Failed to create agreement')

  await supabase.from('audit_log').insert({
    agreement_id: row.id,
    action: 'created' as const,
    actor_type: 'admin' as const,
    actor_id: userId,
    metadata: { agreement_number: row.agreement_number } as unknown as Json
  })

  return { id: row.id, agreement_number: row.agreement_number }
}

export async function getAgreement(id: string) {
  const { data: row, error } = await supabase
    .from('agreements')
    .select('*')
    .eq('id', id)
    .single()

  if (error) throw error
  return row
}

export async function updateAgreement(id: string, data: AgreementData, userId: string): Promise<void> {
  const { error } = await supabase
    .from('agreements')
    .update({ data: data as unknown as Json })
    .eq('id', id)

  if (error) throw error

  await supabase.from('audit_log').insert({
    agreement_id: id,
    action: 'updated' as const,
    actor_type: 'admin' as const,
    actor_id: userId,
  })
}

export async function listAgreements(): Promise<AgreementListItem[]> {
  const { data: rows, error } = await supabase
    .from('agreements')
    .select('id, agreement_number, status, created_at, updated_at, data')
    .order('created_at', { ascending: false })

  if (error) throw error

  return (rows || []).map((row) => ({
    id: row.id,
    agreement_number: row.agreement_number,
    status: row.status,
    created_at: row.created_at,
    updated_at: row.updated_at,
    renter_name: (row.data as Record<string, any>)?.renter?.fullName || null
  }))
}

export async function getAuditLog(agreementId: string) {
  const { data: rows, error } = await supabase
    .from('audit_log')
    .select('*')
    .eq('agreement_id', agreementId)
    .order('created_at', { ascending: true })

  if (error) throw error
  return rows || []
}

/**
 * Generate a cryptographically secure shareable link token for an agreement.
 * Updates the agreement status to 'sent' and records an audit_log entry.
 * The token grants anon clients read+write access via RLS (002 migration).
 */
export async function generateShareLink(
  agreementId: string,
  expiryDays: number = 7
): Promise<{ token: string; expiresAt: string }> {
  const token = crypto.randomUUID()
  const expiresAt = new Date()
  expiresAt.setDate(expiresAt.getDate() + expiryDays)

  const { error } = await supabase
    .from('agreements')
    .update({
      token,
      token_expires_at: expiresAt.toISOString(),
      status: 'sent',
    })
    .eq('id', agreementId)

  if (error) throw error

  await supabase.from('audit_log').insert({
    agreement_id: agreementId,
    action: 'sent' as const,
    actor_type: 'admin' as const,
    metadata: { expires_at: expiresAt.toISOString() } as unknown as Json
  })

  return { token, expiresAt: expiresAt.toISOString() }
}

/**
 * Revoke a shareable link by NULLing the token column.
 * The anon RLS USING clause requires token IS NOT NULL, so this blocks all anon access.
 * Status reverts to 'draft'. Records an audit_log entry with reason 'link_revoked'.
 */
export async function revokeLink(agreementId: string): Promise<void> {
  const { error } = await supabase
    .from('agreements')
    .update({
      token: null,
      token_expires_at: null,
      status: 'draft',
    })
    .eq('id', agreementId)

  if (error) throw error

  await supabase.from('audit_log').insert({
    agreement_id: agreementId,
    action: 'updated' as const,
    actor_type: 'admin' as const,
    metadata: { reason: 'link_revoked' } as unknown as Json
  })
}
