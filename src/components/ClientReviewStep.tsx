import type { AgreementData } from '../types'

interface ClientReviewStepProps {
  agreementData: AgreementData
  onNext: () => void
}

interface FieldRowProps {
  label: string
  value: string | boolean | undefined | null
}

function FieldRow({ label, value }: FieldRowProps) {
  const displayValue = value === true ? 'Yes' : value === false ? 'No' : (value ?? '—')
  return (
    <div className="flex flex-col sm:flex-row sm:gap-4 py-2 border-b border-luxury-ink/10 last:border-0">
      <dt className="text-xs font-semibold text-gray-500 uppercase tracking-wide sm:w-44 sm:shrink-0">
        {label}
      </dt>
      <dd className="text-sm text-luxury-ink mt-0.5 sm:mt-0">{String(displayValue)}</dd>
    </div>
  )
}

function SectionHeading({ children }: { children: string }) {
  return (
    <h3 className="text-sm font-bold text-luxury-ink/50 uppercase tracking-wider mt-6 mb-2 pb-1 border-b border-luxury-ink/20">
      {children}
    </h3>
  )
}

export default function ClientReviewStep({ agreementData, onNext }: ClientReviewStepProps) {
  const { vehicle, rentalTerm, payment, options } = agreementData

  const ratePeriodLabel =
    rentalTerm.ratePeriod === 'custom'
      ? rentalTerm.customRatePeriod
      : rentalTerm.ratePeriod

  return (
    <div className="bg-white rounded-2xl card-float border border-luxury-ink/10 overflow-hidden animate-fadeInUp">
      {/* Hero brand crest */}
      <div className="flex flex-col items-center pt-8 pb-4">
        <img src="/logo-crest.png" alt="JJAI" className="h-[120px] w-auto mb-2" />
        <div className="text-base font-serif font-semibold text-luxury-gold tracking-wide">
          Triple J Auto Investment LLC
        </div>
      </div>

      {/* Header */}
      <div className="px-6 pt-2 pb-4 border-b border-luxury-ink/10">
        <h2 className="text-xl font-bold text-luxury-ink">Review Your Agreement</h2>
        <p className="text-gray-500 text-sm mt-1">
          Please review the terms of your vehicle rental agreement below.
        </p>
      </div>

      {/* Document body */}
      <div className="px-6 py-4 font-serif text-base leading-relaxed">

        {/* Vehicle */}
        <SectionHeading>Vehicle</SectionHeading>
        <dl>
          <FieldRow label="Vehicle" value={vehicle.yearMakeModel} />
          <FieldRow label="VIN" value={vehicle.vin} />
          <FieldRow label="Color" value={vehicle.color} />
          <FieldRow label="Plate Number" value={vehicle.plateNumber} />
          <FieldRow label="Odometer" value={vehicle.odometer ? `${vehicle.odometer} miles` : ''} />
          <FieldRow label="Fuel Level" value={vehicle.fuelLevel} />
          {vehicle.damage && <FieldRow label="Pre-existing Damage" value={vehicle.damage} />}
        </dl>

        {/* Rental Term */}
        <SectionHeading>Rental Term</SectionHeading>
        <dl>
          <FieldRow label="Start Date" value={rentalTerm.startDate} />
          <FieldRow label="End Date" value={rentalTerm.endDate} />
          <FieldRow label="Duration" value={rentalTerm.duration} />
          <FieldRow label="Rate" value={`$${rentalTerm.rate} per ${ratePeriodLabel}`} />
        </dl>

        {/* Payment Terms */}
        <SectionHeading>Payment Terms</SectionHeading>
        <dl>
          <FieldRow label="Base Rate" value={payment.baseRate ? `$${payment.baseRate}` : ''} />
          <FieldRow label="Security Deposit" value={payment.deposit ? `$${payment.deposit}` : ''} />
          {payment.cleaningFee && (
            <FieldRow label="Cleaning Fee" value={`$${payment.cleaningFee}`} />
          )}
          {payment.insuranceSurcharge && (
            <FieldRow label="Insurance Surcharge" value={`$${payment.insuranceSurcharge}`} />
          )}
          {payment.gpsFee && (
            <FieldRow label="GPS Fee" value={`$${payment.gpsFee}`} />
          )}
          <FieldRow label="Total Due at Signing" value={payment.totalDue ? `$${payment.totalDue}` : ''} />
          <FieldRow label="Recurring Amount" value={payment.recurringAmount ? `$${payment.recurringAmount}` : ''} />
          <FieldRow label="Due Dates" value={payment.dueDates} />
          <FieldRow label="Accepted Payment Methods" value={payment.methods} />
        </dl>

        {/* Mileage */}
        <SectionHeading>Mileage</SectionHeading>
        <dl>
          {options.unlimitedMileage ? (
            <FieldRow label="Mileage Policy" value="Unlimited Mileage" />
          ) : (
            <>
              <FieldRow
                label="Mileage Cap"
                value={`${options.limitedMileageCap} miles per ${options.limitedMileagePeriod}`}
              />
              <FieldRow
                label="Excess Mileage Cost"
                value={`$${options.excessMileageCost} per mile over limit`}
              />
            </>
          )}
        </dl>
      </div>

      {/* CTA */}
      <div className="px-6 py-5 bg-luxury-bg/30 border-t border-luxury-ink/10">
        <button
          type="button"
          onClick={onNext}
          className="btn-primary w-full"
        >
          I&apos;ve Reviewed the Terms — Continue
        </button>
      </div>
    </div>
  )
}
