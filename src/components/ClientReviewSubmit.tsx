import { useState } from 'react'
import type { ReactNode } from 'react'
import { useNavigate } from 'react-router'
import { CheckCircle2, Loader2 } from 'lucide-react'
import { useClientSignStore } from '../stores/clientSignStore'
import { submitClientSigning } from '../lib/clientSigning'
import { supabase } from '../lib/supabase'
import type { AgreementData } from '../types'
import type { Json } from '../lib/database.types'

interface ClientReviewSubmitProps {
  onBack: () => void
  agreementData: AgreementData
  token: string
}

function ReviewRow({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-luxury-ink">{value}</span>
    </div>
  )
}

function ReviewSection({ title, children }: { title: string; children: ReactNode }) {
  return (
    <div className="rounded-xl border border-luxury-ink/10 overflow-hidden">
      <div className="px-4 py-2.5 bg-luxury-bg/30 border-b border-luxury-ink/10">
        <h4 className="text-sm font-bold text-luxury-ink/50 uppercase tracking-wide">{title}</h4>
      </div>
      <div className="px-4 py-3 grid grid-cols-1 gap-3">{children}</div>
    </div>
  )
}

const ACKNOWLEDGMENT_LABELS: Record<string, string> = {
  payment: 'Payment Terms',
  insurance: 'Insurance Disclosure',
  gps: 'GPS Tracking',
  geo: 'Geographic Restrictions',
  recovery: 'Unauthorized Recovery',
}

export default function ClientReviewSubmit({ onBack, agreementData, token }: ClientReviewSubmitProps) {
  const navigate = useNavigate()

  // Store state
  const clientData = useClientSignStore((s) => s.clientData)
  const drawnSignature = useClientSignStore((s) => s.drawnSignature)
  const signatureType = useClientSignStore((s) => s.signatureType)
  const typedSignatureName = useClientSignStore((s) => s.typedSignatureName)
  const drawnInitials = useClientSignStore((s) => s.drawnInitials)
  const acknowledgedSections = useClientSignStore((s) => s.acknowledgedSections)
  const agreementId = useClientSignStore((s) => s.agreementId)
  const agreementNumber = useClientSignStore((s) => s.agreementNumber)
  const setStep = useClientSignStore((s) => s.setStep)
  const reset = useClientSignStore((s) => s.reset)

  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState<string | null>(null)

  // Resolve signature: drawn takes precedence; typed may have been rendered already
  const signatureImageUrl = drawnSignature || ''

  const renter = clientData.renter as Partial<AgreementData['renter']> | undefined

  async function handleSubmit() {
    if (submitting) return
    setSubmitting(true)
    setSubmitError(null)

    try {
      // Build clientData payload — merge client sections into agreement data shape
      const sigDataUrl = signatureImageUrl

      const clientPayload: Partial<AgreementData> = {
        renter: {
          fullName: renter?.fullName ?? '',
          dob: renter?.dob ?? '',
          dlNumber: renter?.dlNumber ?? '',
          dlExp: renter?.dlExp ?? '',
          address: renter?.address ?? '',
          cityStateZip: renter?.cityStateZip ?? '',
          phonePrimary: renter?.phonePrimary ?? '',
          phoneSecondary: renter?.phoneSecondary ?? '',
          email: renter?.email ?? '',
          emergencyName: renter?.emergencyName ?? '',
          emergencyPhone: renter?.emergencyPhone ?? '',
          emergencyRelation: renter?.emergencyRelation ?? '',
          employerName: renter?.employerName ?? '',
          employerPhone: renter?.employerPhone ?? '',
          monthlyIncome: renter?.monthlyIncome ?? '',
        },
        signatures: {
          renterName: signatureType === 'type' ? typedSignatureName : (renter?.fullName ?? ''),
          renterSig: sigDataUrl,
          renterDate: new Date().toLocaleDateString(),
          companyRepName: agreementData.signatures?.companyRepName ?? '',
          companyRepTitle: agreementData.signatures?.companyRepTitle ?? '',
          companyRepSig: agreementData.signatures?.companyRepSig ?? '',
          companyRepDate: agreementData.signatures?.companyRepDate ?? '',
        },
        // Apply initials to each acknowledged section
        payment: {
          ...agreementData.payment,
          acknowledgmentInitials: acknowledgedSections.includes('payment') ? drawnInitials : '',
        },
        insurance: {
          acknowledgmentInitials: acknowledgedSections.includes('insurance') ? drawnInitials : '',
        },
        gps: {
          acknowledgmentInitials: acknowledgedSections.includes('gps') ? drawnInitials : '',
        },
        geo: {
          acknowledgmentInitials: acknowledgedSections.includes('geo') ? drawnInitials : '',
        },
        recovery: {
          acknowledgmentInitials: acknowledgedSections.includes('recovery') ? drawnInitials : '',
        },
      }

      // AUDIT-03: Log initials capture BEFORE main signing call
      if (agreementId) {
        await supabase.from('audit_log').insert({
          agreement_id: agreementId,
          action: 'signed' as const,
          actor_type: 'client' as const,
          user_agent: navigator.userAgent,
          metadata: {
            event: 'initials_captured',
            field: 'acknowledgmentInitials',
            sections: acknowledgedSections,
            captured_at: new Date().toISOString(),
          } as unknown as Json,
        })

        // Log signature capture event
        await supabase.from('audit_log').insert({
          agreement_id: agreementId,
          action: 'signed' as const,
          actor_type: 'client' as const,
          user_agent: navigator.userAgent,
          metadata: {
            event: 'signature_captured',
            field: 'renterSig',
            signatureType: signatureType,
            captured_at: new Date().toISOString(),
          } as unknown as Json,
        })
      }

      // Main submit: deep-merges client data, updates status to 'signed', inserts final audit entry
      await submitClientSigning(token, clientPayload, { userAgent: navigator.userAgent })

      // Clear local store
      reset()

      // Navigate to confirmation page
      navigate(`/sign/${token}/complete`, { replace: true })
    } catch {
      setSubmitError("We couldn't submit your agreement. Please check your connection and try again.")
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-luxury-ink/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-luxury-ink/10">
        <h2 className="text-xl font-bold text-luxury-ink">Review &amp; Submit</h2>
        <p className="text-gray-600 text-sm mt-1">
          Please review your information below. Once submitted, your agreement will be finalized.
        </p>
        {agreementNumber && (
          <p className="text-xs text-gray-400 mt-0.5">Agreement #{agreementNumber}</p>
        )}
      </div>

      <div className="px-6 py-5 flex flex-col gap-4">

        {/* Section 1: Personal Information */}
        <ReviewSection title="Personal Information">
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={() => setStep(1)}
              className="text-xs text-luxury-gold font-semibold hover:underline"
            >
              Edit
            </button>
          </div>
          <ReviewRow label="Full Name" value={renter?.fullName} />
          <ReviewRow label="Date of Birth" value={renter?.dob} />
          <ReviewRow label="Driver's License" value={renter?.dlNumber} />
          <ReviewRow label="License Expiration" value={renter?.dlExp} />
          <ReviewRow label="Address" value={renter?.address} />
          <ReviewRow label="City, State, ZIP" value={renter?.cityStateZip} />
          <ReviewRow label="Primary Phone" value={renter?.phonePrimary} />
          <ReviewRow label="Secondary Phone" value={renter?.phoneSecondary} />
          <ReviewRow label="Email" value={renter?.email} />
        </ReviewSection>

        {/* Section 2: Employment */}
        <ReviewSection title="Employment">
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={() => setStep(2)}
              className="text-xs text-luxury-gold font-semibold hover:underline"
            >
              Edit
            </button>
          </div>
          <ReviewRow label="Employer Name" value={renter?.employerName} />
          <ReviewRow label="Employer Phone" value={renter?.employerPhone} />
          <ReviewRow label="Monthly Income" value={renter?.monthlyIncome} />
        </ReviewSection>

        {/* Section 3: Emergency Contact */}
        <ReviewSection title="Emergency Contact">
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={() => setStep(3)}
              className="text-xs text-luxury-gold font-semibold hover:underline"
            >
              Edit
            </button>
          </div>
          <ReviewRow label="Name" value={renter?.emergencyName} />
          <ReviewRow label="Phone" value={renter?.emergencyPhone} />
          <ReviewRow label="Relationship" value={renter?.emergencyRelation} />
        </ReviewSection>

        {/* Section 4: Signature */}
        <ReviewSection title="Signature">
          <div className="flex justify-end mb-1">
            <button
              type="button"
              onClick={() => setStep(4)}
              className="text-xs text-luxury-gold font-semibold hover:underline"
            >
              Edit
            </button>
          </div>
          {signatureImageUrl ? (
            <div className="border-b-2 border-luxury-ink pb-2 pt-1">
              <img
                src={signatureImageUrl}
                alt="Your signature"
                className="h-16 object-contain mr-auto"
              />
              <p className="text-xs text-gray-400 mt-1">Signed electronically</p>
            </div>
          ) : signatureType === 'type' && typedSignatureName ? (
            <div className="border-b-2 border-luxury-ink pb-2">
              <p
                className="text-luxury-ink"
                style={{ fontFamily: '"Dancing Script", cursive', fontSize: '2rem', lineHeight: '1.3' }}
              >
                {typedSignatureName}
              </p>
              <p className="text-xs text-gray-400 mt-1">Signed electronically</p>
            </div>
          ) : (
            <p className="text-sm text-gray-400 italic">No signature captured</p>
          )}
        </ReviewSection>

        {/* Section 5: Acknowledged Sections */}
        <ReviewSection title="Acknowledged Sections">
          {acknowledgedSections.length === 0 ? (
            <p className="text-sm text-gray-400 italic">No sections acknowledged</p>
          ) : (
            <div className="flex flex-col gap-2">
              {acknowledgedSections.map((key) => (
                <div key={key} className="flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4 text-luxury-gold shrink-0" />
                  <span className="text-sm text-luxury-ink">
                    {ACKNOWLEDGMENT_LABELS[key] ?? key}
                  </span>
                </div>
              ))}
            </div>
          )}
        </ReviewSection>

        {/* Submission error */}
        {submitError && (
          <div className="p-4 bg-red-50 border border-alert-red rounded-xl">
            <p className="text-alert-red text-sm font-medium">{submitError}</p>
            <button
              type="button"
              onClick={handleSubmit}
              className="mt-2 text-sm text-luxury-gold font-semibold hover:underline"
            >
              Try again
            </button>
          </div>
        )}
      </div>

      {/* Navigation */}
      <div className="px-6 py-5 bg-luxury-bg/30 border-t border-luxury-ink/10 flex items-center justify-between gap-4">
        <button
          type="button"
          onClick={onBack}
          disabled={submitting}
          className="text-luxury-ink font-semibold text-base py-3 px-5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all disabled:opacity-40"
        >
          Back
        </button>
        <button
          type="button"
          onClick={handleSubmit}
          disabled={submitting}
          className="flex-1 md:flex-none md:min-w-48 bg-luxury-ink text-white font-bold py-3 px-6 rounded-xl text-base hover:bg-opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-60 disabled:cursor-not-allowed disabled:active:scale-100 flex items-center justify-center gap-2"
        >
          {submitting ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Submitting...
            </>
          ) : (
            'Submit Agreement'
          )}
        </button>
      </div>
    </div>
  )
}
