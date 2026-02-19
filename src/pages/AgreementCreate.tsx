import { useState } from 'react'
import { useNavigate } from 'react-router'
import { useAuth } from '../lib/auth'
import { useAgreementStore } from '../stores/agreementStore'
import { createAgreement } from '../lib/agreements'
import { Section } from '../components/Section'
import { InputLine } from '../components/InputLine'

export default function AgreementCreate() {
  const navigate = useNavigate()
  const { user } = useAuth()
  const { data, updateField, reset, isSaving, setSaving } = useAgreementStore()
  const [error, setError] = useState<string | null>(null)

  async function handleSave() {
    if (!user) return
    setSaving(true)
    setError(null)
    try {
      const { id } = await createAgreement(data, user.id)
      navigate(`/admin/agreements/${id}`)
    } catch (err: any) {
      setError(err.message || 'Failed to save agreement')
    } finally {
      setSaving(false)
    }
  }

  function handleCancel() {
    reset()
    navigate('/admin')
  }

  return (
    <div className="p-8 max-w-4xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-forest-green">New Agreement</h1>
      </div>

      <div className="bg-white rounded shadow p-6 mb-6">
        <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mb-6">
          <div>
            <label className="text-xs font-bold text-forest-green uppercase tracking-wider mb-1 block">Agreement Number</label>
            <p className="text-sm text-gray-400 italic py-1">Auto-generated on save</p>
          </div>
          <InputLine
            label="Agreement Date"
            type="date"
            value={data.agreementDate}
            onChange={(v) => updateField('agreementDate' as any, '' as any, v)}
          />
        </div>
      </div>

      {/* Vehicle Information - Section 3 */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <Section title="Vehicle Information" number="SECTION 3">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InputLine label="Year / Make / Model" value={data.vehicle.yearMakeModel} onChange={(v) => updateField('vehicle', 'yearMakeModel', v)} className="col-span-1 md:col-span-2" />
            <InputLine label="VIN" value={data.vehicle.vin} onChange={(v) => updateField('vehicle', 'vin', v)} />
            <InputLine label="License Plate" value={data.vehicle.plateNumber} onChange={(v) => updateField('vehicle', 'plateNumber', v)} />
            <InputLine label="Exterior Color" value={data.vehicle.color} onChange={(v) => updateField('vehicle', 'color', v)} />
            <InputLine label="Current Odometer" value={data.vehicle.odometer} onChange={(v) => updateField('vehicle', 'odometer', v)} />
            <InputLine label="Fuel Level" value={data.vehicle.fuelLevel} onChange={(v) => updateField('vehicle', 'fuelLevel', v)} />
            <InputLine label="Known Pre-Existing Damage" value={data.vehicle.damage} onChange={(v) => updateField('vehicle', 'damage', v)} className="col-span-1 md:col-span-2" />
          </div>
        </Section>
      </div>

      {/* Rental Term - Section 4.1 */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <Section title="Rental Term" number="SECTION 4.1">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InputLine label="Start Date" type="date" value={data.rentalTerm.startDate} onChange={(v) => updateField('rentalTerm', 'startDate', v)} />
            <InputLine label="End Date" type="date" value={data.rentalTerm.endDate} onChange={(v) => updateField('rentalTerm', 'endDate', v)} />
            <InputLine label="Duration" value={data.rentalTerm.duration} onChange={(v) => updateField('rentalTerm', 'duration', v)} placeholder="e.g. 30 days" />
            <InputLine label="Rental Rate" value={data.rentalTerm.rate} onChange={(v) => updateField('rentalTerm', 'rate', v)} placeholder="e.g. $500.00" />
          </div>
          <div className="mt-4">
            <label className="text-xs font-bold text-forest-green uppercase tracking-wider mb-2 block">Rate Period</label>
            <div className="flex items-center gap-6 flex-wrap">
              {(['day', 'week', 'month', 'custom'] as const).map((period) => (
                <label key={period} className="flex items-center gap-2 cursor-pointer">
                  <input
                    type="radio"
                    name="ratePeriod"
                    value={period}
                    checked={data.rentalTerm.ratePeriod === period}
                    onChange={() => updateField('rentalTerm', 'ratePeriod', period)}
                    className="accent-forest-green"
                  />
                  <span className="text-sm text-charcoal capitalize">{period}</span>
                </label>
              ))}
            </div>
            {data.rentalTerm.ratePeriod === 'custom' && (
              <div className="mt-2">
                <InputLine label="Custom Rate Period" value={data.rentalTerm.customRatePeriod} onChange={(v) => updateField('rentalTerm', 'customRatePeriod', v)} placeholder="Describe custom period" />
              </div>
            )}
          </div>
        </Section>
      </div>

      {/* Payment Terms - Section 4.2 */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <Section title="Payment Terms" number="SECTION 4.2">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4">
            <InputLine label="Base Rate" value={data.payment.baseRate} onChange={(v) => updateField('payment', 'baseRate', v)} placeholder="$0.00" />
            <InputLine label="Security Deposit" value={data.payment.deposit} onChange={(v) => updateField('payment', 'deposit', v)} placeholder="$0.00" />
            <InputLine label="Cleaning Fee" value={data.payment.cleaningFee} onChange={(v) => updateField('payment', 'cleaningFee', v)} placeholder="$0.00" />
            <InputLine label="Insurance Surcharge" value={data.payment.insuranceSurcharge} onChange={(v) => updateField('payment', 'insuranceSurcharge', v)} placeholder="$0.00" />
            <InputLine label="GPS Fee" value={data.payment.gpsFee} onChange={(v) => updateField('payment', 'gpsFee', v)} placeholder="$0.00" />
            <InputLine label="Total Due" value={data.payment.totalDue} onChange={(v) => updateField('payment', 'totalDue', v)} placeholder="$0.00" />
            <InputLine label="Recurring Amount" value={data.payment.recurringAmount} onChange={(v) => updateField('payment', 'recurringAmount', v)} placeholder="$0.00" />
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-x-8 gap-y-4 mt-4">
            <InputLine label="Payment Due Dates" value={data.payment.dueDates} onChange={(v) => updateField('payment', 'dueDates', v)} placeholder="e.g. 1st and 15th of each month" />
            <InputLine label="Accepted Payment Methods" value={data.payment.methods} onChange={(v) => updateField('payment', 'methods', v)} placeholder="e.g. Cash, Zelle, CashApp" />
          </div>
        </Section>
      </div>

      {/* Mileage Options - Section 10.1 */}
      <div className="bg-white rounded shadow p-6 mb-6">
        <Section title="Mileage Options" number="SECTION 10.1">
          <div className="mb-4">
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={data.options.unlimitedMileage}
                onChange={(e) => updateField('options', 'unlimitedMileage', e.target.checked)}
                className="accent-forest-green w-4 h-4"
              />
              <span className="text-sm font-medium text-charcoal">Unlimited Mileage</span>
            </label>
          </div>
          {!data.options.unlimitedMileage && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-x-8 gap-y-4">
              <InputLine label="Mileage Cap" value={data.options.limitedMileageCap} onChange={(v) => updateField('options', 'limitedMileageCap', v)} placeholder="e.g. 1000" />
              <div>
                <label className="text-xs font-bold text-forest-green uppercase tracking-wider mb-1 block">Cap Period</label>
                <select
                  value={data.options.limitedMileagePeriod}
                  onChange={(e) => updateField('options', 'limitedMileagePeriod', e.target.value)}
                  className="w-full border-b border-gray-300 py-1 text-sm text-charcoal bg-transparent focus:outline-none focus:border-forest-green"
                >
                  <option value="day">Per Day</option>
                  <option value="week">Per Week</option>
                  <option value="month">Per Month</option>
                </select>
              </div>
              <InputLine label="Excess Mileage Cost" value={data.options.excessMileageCost} onChange={(v) => updateField('options', 'excessMileageCost', v)} placeholder="$ per mile" />
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
      <div className="flex items-center gap-4">
        <button
          type="button"
          onClick={handleSave}
          disabled={isSaving}
          className="bg-forest-green text-white px-6 py-2 rounded font-medium hover:opacity-90 transition-opacity disabled:opacity-50"
        >
          {isSaving ? 'Saving...' : 'Save Agreement'}
        </button>
        <button
          type="button"
          onClick={handleCancel}
          className="text-gray-600 hover:text-charcoal px-4 py-2 font-medium transition-colors"
        >
          Cancel
        </button>
      </div>
    </div>
  )
}
