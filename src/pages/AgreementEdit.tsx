import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router'
import { Share2, CheckCircle2 } from 'lucide-react'
import { useAgreementStore } from '../stores/agreementStore'
import { getAgreement, updateAgreement, getAuditLog } from '../lib/agreements'
import { Section } from '../components/Section'
import { InputLine } from '../components/InputLine'
import LinkShareModal from '../components/LinkShareModal'
import type { AgreementData } from '../types'

const ACKNOWLEDGMENT_SECTION_LABELS: Record<string, string> = {
  payment: 'Payment Terms',
  insurance: 'Insurance Disclosure',
  gps: 'GPS Tracking',
  geo: 'Geographic Restrictions',
  recovery: 'Unauthorized Recovery',
}

interface ReadOnlyFieldProps {
  label: string
  value?: string | null
}

function ReadOnlyField({ label, value }: ReadOnlyFieldProps) {
  if (!value) return null
  return (
    <div className="flex flex-col gap-0.5">
      <span className="text-xs font-semibold text-gray-500 uppercase tracking-wide">{label}</span>
      <span className="text-sm text-luxury-ink">{value || <span className="text-gray-400 italic">—</span>}</span>
    </div>
  )
}

const statusColors: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  signed: 'bg-green-100 text-green-700',
  completed: 'bg-luxury-ink text-white',
  viewed: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
}

interface AuditEntry {
  id: number
  action: string
  actor_type: string
  actor_id: string | null
  created_at: string
  metadata: Record<string, any> | null
}

export default function AgreementEdit() {
  const { id } = useParams<{ id: string }>()
  const navigate = useNavigate()
  const { data, updateField, setData, setAgreementMeta, isSaving, setSaving } = useAgreementStore()

  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [saveSuccess, setSaveSuccess] = useState(false)
  const [status, setStatus] = useState('draft')
  const [agreementNum, setAgreementNum] = useState('')
  const [auditLog, setAuditLog] = useState<AuditEntry[]>([])
  const [showLinkModal, setShowLinkModal] = useState(false)
  const [currentToken, setCurrentToken] = useState<string | null>(null)
  const [currentTokenExpiry, setCurrentTokenExpiry] = useState<string | null>(null)

  const isSigned = status === 'signed' || status === 'completed'

  useEffect(() => {
    if (!id) return
    Promise.all([getAgreement(id), getAuditLog(id)])
      .then(([row, log]) => {
        const agreementData = row.data as unknown as AgreementData
        setData(agreementData)
        setAgreementMeta(row.id, row.agreement_number)
        setStatus(row.status)
        setAgreementNum(row.agreement_number)
        setCurrentToken(row.token ?? null)
        setCurrentTokenExpiry(row.token_expires_at ?? null)
        setAuditLog(log as AuditEntry[])
      })
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [id, setData, setAgreementMeta])

  async function handleSave() {
    if (!id) return
    setSaving(true)
    setError(null)
    setSaveSuccess(false)
    try {
      await updateAgreement(id, data, 'admin')
      setSaveSuccess(true)
      setTimeout(() => setSaveSuccess(false), 3000)
      // Refresh audit log
      const log = await getAuditLog(id)
      setAuditLog(log as AuditEntry[])
    } catch (err: any) {
      setError(err.message || 'Failed to save changes')
    } finally {
      setSaving(false)
    }
  }

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading agreement...</p>
      </div>
    )
  }

  if (error && !data.vehicle.yearMakeModel && !data.rentalTerm.startDate) {
    return (
      <div className="p-8">
        <p className="text-alert-red mb-4">Error loading agreement: {error}</p>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="text-luxury-ink font-medium hover:underline"
        >
          Back to Agreements
        </button>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <h1 className="text-2xl font-bold text-luxury-ink">Edit Agreement</h1>
          <span className="inline-block bg-luxury-gold text-white px-3 py-1 rounded text-sm font-bold">
            {agreementNum}
          </span>
          <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusColors[status] || 'bg-gray-200 text-gray-700'}`}>
            {status}
          </span>
        </div>
        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="text-luxury-ink font-medium hover:underline text-sm"
        >
          Back to Agreements
        </button>
      </div>

      {/* Read-only notice for signed agreements */}
      {isSigned && (
        <div className="mb-6 p-3 bg-green-50 border border-green-200 rounded text-green-700 text-sm flex items-center gap-2">
          <CheckCircle2 className="w-4 h-4 shrink-0" />
          This agreement has been signed. All fields are read-only to preserve the signed record.
        </div>
      )}

      {/* Agreement Date */}
      <div className="bg-white rounded-sm border border-luxury-ink/10 p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
          <InputLine
            label="Agreement Date"
            type="date"
            value={data.agreementDate}
            onChange={(v) => updateField('agreementDate' as any, '' as any, v)}
            readOnly={isSigned}
          />
        </div>
      </div>

      {/* Vehicle Information - Section 3 */}
      <div className="bg-white rounded-sm border border-luxury-ink/10 p-6 mb-6">
        <Section title="Vehicle Information" number="SECTION 3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InputLine label="Year / Make / Model" value={data.vehicle.yearMakeModel} onChange={(v) => updateField('vehicle', 'yearMakeModel', v)} className="col-span-1 md:col-span-2" readOnly={isSigned} />
            <InputLine label="VIN" value={data.vehicle.vin} onChange={(v) => updateField('vehicle', 'vin', v)} readOnly={isSigned} />
            <InputLine label="License Plate" value={data.vehicle.plateNumber} onChange={(v) => updateField('vehicle', 'plateNumber', v)} readOnly={isSigned} />
            <InputLine label="Exterior Color" value={data.vehicle.color} onChange={(v) => updateField('vehicle', 'color', v)} readOnly={isSigned} />
            <InputLine label="Current Odometer" value={data.vehicle.odometer} onChange={(v) => updateField('vehicle', 'odometer', v)} readOnly={isSigned} />
            <InputLine label="Fuel Level" value={data.vehicle.fuelLevel} onChange={(v) => updateField('vehicle', 'fuelLevel', v)} readOnly={isSigned} />
            <InputLine label="Known Pre-Existing Damage" value={data.vehicle.damage} onChange={(v) => updateField('vehicle', 'damage', v)} className="col-span-1 md:col-span-2" readOnly={isSigned} />
          </div>
        </Section>
      </div>

      {/* Rental Term - Section 4.1 */}
      <div className="bg-white rounded-sm border border-luxury-ink/10 p-6 mb-6">
        <Section title="Rental Term" number="SECTION 4.1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InputLine label="Start Date" type="date" value={data.rentalTerm.startDate} onChange={(v) => updateField('rentalTerm', 'startDate', v)} readOnly={isSigned} />
            <InputLine label="End Date" type="date" value={data.rentalTerm.endDate} onChange={(v) => updateField('rentalTerm', 'endDate', v)} readOnly={isSigned} />
            <InputLine label="Duration" value={data.rentalTerm.duration} onChange={(v) => updateField('rentalTerm', 'duration', v)} placeholder="e.g. 30 days" readOnly={isSigned} />
            <InputLine label="Rental Rate" value={data.rentalTerm.rate} onChange={(v) => updateField('rentalTerm', 'rate', v)} placeholder="e.g. $500.00" readOnly={isSigned} />
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold text-luxury-ink/50 uppercase tracking-wider mb-2 block">Rate Period</label>
            <div className="flex items-center gap-6 flex-wrap">
              {(['day', 'week', 'month', 'custom'] as const).map((period) => (
                <label key={period} className={`flex items-center gap-2 ${isSigned ? 'cursor-default opacity-60' : 'cursor-pointer'}`}>
                  <input
                    type="radio"
                    name="ratePeriod"
                    value={period}
                    checked={data.rentalTerm.ratePeriod === period}
                    onChange={() => !isSigned && updateField('rentalTerm', 'ratePeriod', period)}
                    readOnly={isSigned}
                    disabled={isSigned}
                    className="accent-luxury-gold"
                  />
                  <span className="text-sm text-luxury-ink capitalize">{period}</span>
                </label>
              ))}
            </div>
            {data.rentalTerm.ratePeriod === 'custom' && (
              <div className="mt-2">
                <InputLine label="Custom Rate Period" value={data.rentalTerm.customRatePeriod} onChange={(v) => updateField('rentalTerm', 'customRatePeriod', v)} placeholder="Describe custom period" readOnly={isSigned} />
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Payment Terms - Section 4.2 */}
      <div className="bg-white rounded-sm border border-luxury-ink/10 p-6 mb-6">
        <Section title="Payment Terms" number="SECTION 4.2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InputLine label="Base Rate" value={data.payment.baseRate} onChange={(v) => updateField('payment', 'baseRate', v)} placeholder="$0.00" readOnly={isSigned} />
            <InputLine label="Security Deposit" value={data.payment.deposit} onChange={(v) => updateField('payment', 'deposit', v)} placeholder="$0.00" readOnly={isSigned} />
            <InputLine label="Cleaning Fee" value={data.payment.cleaningFee} onChange={(v) => updateField('payment', 'cleaningFee', v)} placeholder="$0.00" readOnly={isSigned} />
            <InputLine label="Insurance Surcharge" value={data.payment.insuranceSurcharge} onChange={(v) => updateField('payment', 'insuranceSurcharge', v)} placeholder="$0.00" readOnly={isSigned} />
            <InputLine label="GPS Fee" value={data.payment.gpsFee} onChange={(v) => updateField('payment', 'gpsFee', v)} placeholder="$0.00" readOnly={isSigned} />
            <InputLine label="Total Due" value={data.payment.totalDue} onChange={(v) => updateField('payment', 'totalDue', v)} placeholder="$0.00" readOnly={isSigned} />
            <InputLine label="Recurring Amount" value={data.payment.recurringAmount} onChange={(v) => updateField('payment', 'recurringAmount', v)} placeholder="$0.00" readOnly={isSigned} />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
            <InputLine label="Payment Due Dates" value={data.payment.dueDates} onChange={(v) => updateField('payment', 'dueDates', v)} placeholder="e.g. 1st and 15th of each month" readOnly={isSigned} />
            <InputLine label="Accepted Payment Methods" value={data.payment.methods} onChange={(v) => updateField('payment', 'methods', v)} placeholder="e.g. Cash, Zelle, CashApp" readOnly={isSigned} />
          </div>
        </Section>
      </div>

      {/* Mileage Options - Section 10.1 */}
      <div className="bg-white rounded-sm border border-luxury-ink/10 p-6 mb-6">
        <Section title="Mileage Options" number="SECTION 10.1">
          <div className="mb-4">
            <label className={`flex items-center gap-2 ${isSigned ? 'cursor-default opacity-60' : 'cursor-pointer'}`}>
              <input
                type="checkbox"
                checked={data.options.unlimitedMileage}
                onChange={(e) => !isSigned && updateField('options', 'unlimitedMileage', e.target.checked)}
                disabled={isSigned}
                className="accent-luxury-gold w-4 h-4"
              />
              <span className="text-sm font-medium text-luxury-ink">Unlimited Mileage</span>
            </label>
          </div>
          {!data.options.unlimitedMileage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <InputLine label="Mileage Cap" value={data.options.limitedMileageCap} onChange={(v) => updateField('options', 'limitedMileageCap', v)} placeholder="e.g. 1000" readOnly={isSigned} />
              <div>
                <label className="text-xs font-bold text-luxury-ink/50 uppercase tracking-wider mb-1 block">Cap Period</label>
                <select
                  value={data.options.limitedMileagePeriod}
                  onChange={(e) => updateField('options', 'limitedMileagePeriod', e.target.value)}
                  disabled={isSigned}
                  className="w-full border-b border-luxury-ink/10 py-1 text-sm text-luxury-ink bg-transparent focus:outline-none focus:border-luxury-gold disabled:opacity-60 disabled:cursor-not-allowed"
                >
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                </select>
              </div>
              <InputLine label="Excess Mileage Cost" value={data.options.excessMileageCost} onChange={(v) => updateField('options', 'excessMileageCost', v)} placeholder="$ per mile" readOnly={isSigned} />
            </div>
          )}
        </Section>
      </div>

      {/* Action Buttons */}
      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-alert-red rounded text-alert-red text-sm">
          {error}
        </div>
      )}
      {saveSuccess && (
        <div className="mb-4 p-3 bg-green-50 border border-green-300 rounded text-green-700 text-sm">
          Changes saved successfully.
        </div>
      )}
      <div className="flex items-center gap-4 mb-8 flex-wrap">
        {/* Save Changes — hidden when signed/completed */}
        {!isSigned && (
          <button
            type="button"
            onClick={handleSave}
            disabled={isSaving}
            className="bg-luxury-ink text-white px-6 py-2 rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
          >
            {isSaving ? 'Saving...' : 'Save Changes'}
          </button>
        )}

        {/* Send to Client / View Share Link / Client has signed */}
        {isSigned ? (
          <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-4 py-2 rounded font-medium text-sm">
            <CheckCircle2 className="w-4 h-4" />
            Client has signed
          </span>
        ) : (
          <button
            type="button"
            onClick={() => setShowLinkModal(true)}
            className="inline-flex items-center gap-2 px-5 py-2 rounded font-medium text-white transition-opacity hover:opacity-90"
            style={{ backgroundColor: '#b89b5e' }}
          >
            <Share2 className="w-4 h-4" />
            {status === 'sent' || status === 'viewed' ? 'View Share Link' : 'Send to Client'}
          </button>
        )}

        <button
          type="button"
          onClick={() => navigate('/admin')}
          className="text-gray-600 hover:text-luxury-ink px-4 py-2 font-medium transition-colors"
        >
          Back to Agreements
        </button>
      </div>

      {/* LinkShareModal */}
      {id && (
        <LinkShareModal
          isOpen={showLinkModal}
          onClose={() => setShowLinkModal(false)}
          agreementId={id}
          agreementNumber={agreementNum}
          existingToken={currentToken}
          existingExpiry={currentTokenExpiry}
          onLinkGenerated={(token, expiresAt) => {
            setCurrentToken(token)
            setCurrentTokenExpiry(expiresAt)
            setStatus('sent')
          }}
          onLinkRevoked={() => {
            setCurrentToken(null)
            setCurrentTokenExpiry(null)
            setStatus('draft')
          }}
        />
      )}

      {/* Client Submitted Information — read-only, only visible when signed/completed */}
      {isSigned && (
        <div className="bg-green-50 border border-green-200 rounded shadow p-6 mb-6">
          <div className="flex items-center gap-3 mb-5">
            <h2 className="text-lg font-bold text-luxury-ink">Client Submitted Information</h2>
            <span className="inline-flex items-center gap-1.5 bg-green-100 text-green-700 px-3 py-1 rounded-full text-xs font-semibold">
              <CheckCircle2 className="w-3.5 h-3.5" />
              Signed
            </span>
          </div>

          {/* Personal Information — read-only */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Personal Information</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 bg-white rounded-lg border border-green-100 p-4">
              <ReadOnlyField label="Full Name" value={data.renter?.fullName} />
              <ReadOnlyField label="Date of Birth" value={data.renter?.dob} />
              <ReadOnlyField label="Driver's License" value={data.renter?.dlNumber} />
              <ReadOnlyField label="License Expiration" value={data.renter?.dlExp} />
              <ReadOnlyField label="Address" value={data.renter?.address} />
              {data.renter?.city ? (
                <>
                  <ReadOnlyField label="City" value={data.renter?.city} />
                  <ReadOnlyField label="State" value={data.renter?.state} />
                  <ReadOnlyField label="ZIP" value={data.renter?.zip} />
                </>
              ) : (
                <ReadOnlyField label="City, State, ZIP" value={(data.renter as any)?.cityStateZip} />
              )}
              <ReadOnlyField label="Primary Phone" value={data.renter?.phonePrimary} />
              <ReadOnlyField label="Secondary Phone" value={data.renter?.phoneSecondary} />
              <ReadOnlyField label="Email" value={data.renter?.email} />
            </div>
          </div>

          {/* Employment — read-only */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Employment</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 bg-white rounded-lg border border-green-100 p-4">
              <ReadOnlyField label="Employer Name" value={data.renter?.employerName} />
              <ReadOnlyField label="Employer Phone" value={data.renter?.employerPhone} />
              <ReadOnlyField label="Monthly Income" value={data.renter?.monthlyIncome} />
            </div>
          </div>

          {/* Emergency Contact — read-only */}
          <div className="mb-5">
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Emergency Contact</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-3 bg-white rounded-lg border border-green-100 p-4">
              <ReadOnlyField label="Name" value={data.renter?.emergencyName} />
              <ReadOnlyField label="Phone" value={data.renter?.emergencyPhone} />
              <ReadOnlyField label="Relationship" value={data.renter?.emergencyRelation} />
            </div>
          </div>

          {/* Signature — read-only */}
          {data.signatures?.renterSig && (
            <div className="mb-5">
              <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Client Signature</h3>
              <div className="bg-white rounded-lg border border-green-100 p-4">
                <div className="border-b-2 border-luxury-ink pb-2 inline-block">
                  <img
                    src={data.signatures.renterSig}
                    alt="Client signature"
                    className="h-16 object-contain"
                  />
                </div>
                <p className="text-xs text-gray-400 mt-1">
                  Signed electronically
                  {data.signatures.renterDate ? ` on ${data.signatures.renterDate}` : ''}
                </p>
              </div>
            </div>
          )}

          {/* Acknowledged Sections — read-only */}
          <div>
            <h3 className="text-xs font-bold text-gray-500 uppercase tracking-widest mb-3">Acknowledged Sections</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
              {(['payment', 'insurance', 'gps', 'geo', 'recovery'] as const).map((key) => {
                const sectionData = data[key] as { acknowledgmentInitials?: string } | undefined
                const hasInitials = !!sectionData?.acknowledgmentInitials
                return (
                  <div
                    key={key}
                    className={`flex items-center gap-2 p-3 rounded-lg border text-sm ${
                      hasInitials
                        ? 'bg-green-50 border-green-200 text-green-700'
                        : 'bg-gray-50 border-gray-200 text-gray-400'
                    }`}
                  >
                    <CheckCircle2 className={`w-4 h-4 shrink-0 ${hasInitials ? 'text-luxury-gold' : 'text-gray-300'}`} />
                    <span className="font-medium">{ACKNOWLEDGMENT_SECTION_LABELS[key]}</span>
                    {hasInitials && sectionData?.acknowledgmentInitials && (
                      <img
                        src={sectionData.acknowledgmentInitials}
                        alt="Client initials"
                        className="h-6 ml-auto object-contain border border-gray-200 rounded bg-white px-0.5"
                      />
                    )}
                  </div>
                )
              })}
            </div>
          </div>
        </div>
      )}

      {/* Audit Log */}
      {auditLog.length > 0 && (
        <div className="bg-white rounded-sm border border-luxury-ink/10 p-6">
          <Section title="Activity Log">
            <div className="space-y-3">
              {auditLog.map((entry) => (
                <div key={entry.id} className="flex items-start gap-3 text-sm">
                  <div className="w-2 h-2 rounded-full bg-luxury-gold mt-1.5 shrink-0" />
                  <div>
                    <span className="font-medium text-luxury-ink capitalize">{entry.action}</span>
                    <span className="text-gray-400 mx-2">by</span>
                    <span className="text-gray-600">{entry.actor_type}</span>
                    <span className="text-gray-400 ml-3 text-xs">
                      {new Date(entry.created_at).toLocaleString()}
                    </span>
                  </div>
                </div>
              ))}
            </div>
          </Section>
        </div>
      )}
    </div>
  )
}
