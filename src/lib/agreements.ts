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

/**
 * Create a renewal agreement by cloning an existing signed agreement.
 * Pre-fills vehicle, renter, payment, and options data.
 * Clears signatures, dates, and acknowledgment initials.
 * Sets renewed_from to link back to the original.
 */
export async function renewAgreement(
  originalId: string,
  userId: string
): Promise<{ id: string; agreement_number: string }> {
  const original = await getAgreement(originalId)
  if (!original) throw new Error('Original agreement not found')

  const originalData = original.data as unknown as AgreementData

  const renewedData: AgreementData = {
    ...originalData,
    agreementNumber: '',
    agreementDate: new Date().toLocaleDateString(),
    rentalTerm: {
      ...originalData.rentalTerm,
      startDate: '',
      endDate: '',
      duration: '',
    },
    payment: {
      ...originalData.payment,
      acknowledgmentInitials: '',
    },
    insurance: { acknowledgmentInitials: '' },
    gps: { acknowledgmentInitials: '' },
    geo: { acknowledgmentInitials: '' },
    recovery: { acknowledgmentInitials: '' },
    signatures: {
      renterName: '',
      renterSig: '',
      renterDate: '',
      companyRepName: 'Triple J Auto Investment LLC',
      companyRepTitle: 'Authorized Agent',
      companyRepSig: '',
      companyRepDate: '',
    },
    condition: {
      frontBumper: '', frontBumperNotes: '', rearBumper: '', rearBumperNotes: '',
      driverSide: '', driverSideNotes: '', passengerSide: '', passengerSideNotes: '',
      hood: '', hoodNotes: '', roof: '', roofNotes: '', trunk: '', trunkNotes: '',
      windshield: '', windshieldNotes: '', rearWindow: '', rearWindowNotes: '',
      sideMirrors: '', sideMirrorsNotes: '', tires: '', tiresNotes: '',
      interior: '', interiorNotes: '', lights: '', lightsNotes: '',
      signals: '', signalsNotes: '', horn: '', hornNotes: '', hvac: '', hvacNotes: '',
      photosTaken: false, photoCount: '', renterInitials: '', repInitials: '',
    },
    additionalDrivers: {
      d1Name: '', d1Dob: '', d1Dl: '', d1Rel: '', d1Ins: false, d1Sig: '', d1Date: '',
      d2Name: '', d2Dob: '', d2Dl: '', d2Rel: '', d2Ins: false, d2Sig: '', d2Date: '',
    },
  }

  const { data: row, error } = await supabase
    .from('agreements')
    .insert({
      data: renewedData as unknown as Json,
      created_by: userId,
      renewed_from: originalId,
    })
    .select('id, agreement_number')
    .single()

  if (error) throw error
  if (!row) throw new Error('Failed to create renewal agreement')

  await supabase.from('audit_log').insert({
    agreement_id: row.id,
    action: 'created' as const,
    actor_type: 'admin' as const,
    actor_id: userId,
    metadata: {
      agreement_number: row.agreement_number,
      renewed_from: originalId,
      original_agreement_number: original.agreement_number,
    } as unknown as Json,
  })

  await supabase.from('audit_log').insert({
    agreement_id: originalId,
    action: 'renewed' as const,
    actor_type: 'admin' as const,
    actor_id: userId,
    metadata: {
      new_agreement_id: row.id,
      new_agreement_number: row.agreement_number,
    } as unknown as Json,
  })

  return { id: row.id, agreement_number: row.agreement_number }
}

/**
 * Get the renewal chain for an agreement.
 * Returns the original and all renewals linked to it.
 */
export async function getAgreementRenewals(agreementId: string): Promise<{
  id: string
  agreement_number: string
  status: string
  created_at: string
  renewed_from: string | null
}[]> {
  let rootId = agreementId
  let current = await getAgreement(agreementId)
  while (current?.renewed_from) {
    rootId = current.renewed_from
    current = await getAgreement(rootId)
  }

  const { data: rows, error } = await supabase
    .from('agreements')
    .select('id, agreement_number, status, created_at, renewed_from')
    .or(`id.eq.${rootId},renewed_from.eq.${rootId}`)
    .order('created_at', { ascending: true })

  if (error) throw error

  const allIds = new Set((rows || []).map((r) => r.id))
  if (rows && rows.length > 1) {
    const childIds = rows.filter((r) => r.id !== rootId).map((r) => r.id)
    if (childIds.length > 0) {
      const { data: deeper } = await supabase
        .from('agreements')
        .select('id, agreement_number, status, created_at, renewed_from')
        .in('renewed_from', childIds)
        .order('created_at', { ascending: true })
      if (deeper) {
        for (const d of deeper) {
          if (!allIds.has(d.id)) {
            rows.push(d)
            allIds.add(d.id)
          }
        }
      }
    }
  }

  return rows || []
}

/**
 * Log a PDF generation or download event to the audit trail.
 */
export async function logExportAction(
  agreementId: string,
  action: 'pdf_generated' | 'downloaded',
  userId: string
): Promise<void> {
  await supabase.from('audit_log').insert({
    agreement_id: agreementId,
    action,
    actor_type: 'admin' as const,
    actor_id: userId,
    metadata: { timestamp: new Date().toISOString() } as unknown as Json,
  })
}
