import React, { forwardRef } from 'react'
import type { AgreementData } from '../types'

interface Props {
  data: AgreementData
  agreementNumber: string
}

function Field({ label, value }: { label: string; value?: string | null }) {
  if (!value) return null
  return (
    <div className="flex gap-2 py-1 border-b border-gray-100">
      <span className="text-xs font-bold text-gray-500 uppercase tracking-wide w-40 shrink-0">{label}</span>
      <span className="text-sm text-luxury-ink">{value}</span>
    </div>
  )
}

function SectionTitle({ children }: { children: React.ReactNode }) {
  return (
    <h3 className="text-sm font-bold text-luxury-ink uppercase tracking-widest border-b-2 border-luxury-ink pb-1 mt-6 mb-3">
      {children}
    </h3>
  )
}

const AgreementPrintView = forwardRef<HTMLDivElement, Props>(({ data, agreementNumber }, ref) => {
  const { vehicle, rentalTerm, payment, options, renter, signatures } = data

  return (
    <div ref={ref} className="force-desktop bg-white text-luxury-ink font-sans">
      {/* Header */}
      <div className="text-center mb-6">
        <img src="/logo-crest.png" alt="JJAI" className="h-[80px] w-auto mx-auto block mb-2" />
        <h1 className="text-xl font-bold text-luxury-ink">Triple J Auto Investment LLC</h1>
        <p className="text-xs text-gray-500 mt-1">8774 Almeda Genoa Road, Houston, TX 77075 &bull; (832) 400-5294</p>
      </div>

      <div className="text-center mb-6">
        <h2 className="text-lg font-bold text-luxury-ink uppercase tracking-wider">Vehicle Rental Agreement</h2>
        <div className="flex items-center justify-center gap-4 mt-2 text-sm">
          <span className="font-bold text-luxury-gold">{agreementNumber}</span>
          <span className="text-gray-400">|</span>
          <span>{data.agreementDate}</span>
        </div>
      </div>

      {/* Vehicle Information */}
      <SectionTitle>Vehicle Information</SectionTitle>
      <div className="grid grid-cols-2 gap-x-8">
        <Field label="Year / Make / Model" value={vehicle.yearMakeModel} />
        <Field label="VIN" value={vehicle.vin} />
        <Field label="License Plate" value={vehicle.plateNumber} />
        <Field label="Color" value={vehicle.color} />
        <Field label="Odometer" value={vehicle.odometer} />
        <Field label="Fuel Level" value={vehicle.fuelLevel} />
      </div>
      <Field label="Pre-Existing Damage" value={vehicle.damage} />

      {/* Rental Term */}
      <SectionTitle>Rental Term</SectionTitle>
      <div className="grid grid-cols-2 gap-x-8">
        <Field label="Start Date" value={rentalTerm.startDate} />
        <Field label="End Date" value={rentalTerm.endDate} />
        <Field label="Duration" value={rentalTerm.duration} />
        <Field label="Rate" value={rentalTerm.rate} />
        <Field label="Rate Period" value={rentalTerm.ratePeriod === 'custom' ? rentalTerm.customRatePeriod : rentalTerm.ratePeriod} />
      </div>

      {/* Payment Terms */}
      <SectionTitle>Payment Terms</SectionTitle>
      <div className="grid grid-cols-2 gap-x-8">
        <Field label="Base Rate" value={payment.baseRate} />
        <Field label="Security Deposit" value={payment.deposit} />
        <Field label="Cleaning Fee" value={payment.cleaningFee} />
        <Field label="Insurance Surcharge" value={payment.insuranceSurcharge} />
        <Field label="GPS Fee" value={payment.gpsFee} />
        <Field label="Total Due" value={payment.totalDue} />
        <Field label="Recurring Amount" value={payment.recurringAmount} />
        <Field label="Due Dates" value={payment.dueDates} />
        <Field label="Payment Methods" value={payment.methods} />
      </div>

      {/* Mileage Options */}
      <SectionTitle>Mileage</SectionTitle>
      {options.unlimitedMileage ? (
        <p className="text-sm">Unlimited Mileage</p>
      ) : (
        <div className="grid grid-cols-2 gap-x-8">
          <Field label="Mileage Cap" value={options.limitedMileageCap} />
          <Field label="Cap Period" value={`Per ${options.limitedMileagePeriod}`} />
          <Field label="Excess Cost" value={options.excessMileageCost} />
        </div>
      )}

      {/* Renter Information (if signed) */}
      {renter.fullName && (
        <>
          <SectionTitle>Renter Information</SectionTitle>
          <div className="grid grid-cols-2 gap-x-8">
            <Field label="Full Name" value={renter.fullName} />
            <Field label="Date of Birth" value={renter.dob} />
            <Field label="Driver's License" value={renter.dlNumber} />
            <Field label="License Expiration" value={renter.dlExp} />
            <Field label="Address" value={renter.address} />
            <Field label="City" value={renter.city} />
            <Field label="State" value={renter.state} />
            <Field label="ZIP" value={renter.zip} />
            <Field label="Primary Phone" value={renter.phonePrimary} />
            <Field label="Secondary Phone" value={renter.phoneSecondary} />
            <Field label="Email" value={renter.email} />
          </div>

          <SectionTitle>Employment</SectionTitle>
          <div className="grid grid-cols-2 gap-x-8">
            <Field label="Employer" value={renter.employerName} />
            <Field label="Employer Phone" value={renter.employerPhone} />
            <Field label="Monthly Income" value={renter.monthlyIncome} />
          </div>

          <SectionTitle>Emergency Contact</SectionTitle>
          <div className="grid grid-cols-2 gap-x-8">
            <Field label="Name" value={renter.emergencyName} />
            <Field label="Phone" value={renter.emergencyPhone} />
            <Field label="Relationship" value={renter.emergencyRelation} />
          </div>
        </>
      )}

      {/* Signatures */}
      {signatures.renterSig && (
        <>
          <SectionTitle>Signatures</SectionTitle>
          <div className="grid grid-cols-2 gap-x-8 mt-4">
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Renter</p>
              <div className="border-b-2 border-luxury-ink pb-2 h-16 flex items-end">
                <img src={signatures.renterSig} alt="Renter signature" className="h-14 object-contain" />
              </div>
              <p className="text-xs text-gray-400 mt-1">{signatures.renterName} &mdash; {signatures.renterDate}</p>
            </div>
            <div>
              <p className="text-xs font-bold text-gray-500 uppercase tracking-wide mb-2">Company Representative</p>
              <div className="border-b-2 border-luxury-ink pb-2 h-16 flex items-end">
                <span className="text-sm font-serif italic">{signatures.companyRepSig || signatures.companyRepName}</span>
              </div>
              <p className="text-xs text-gray-400 mt-1">{signatures.companyRepName}, {signatures.companyRepTitle}</p>
            </div>
          </div>
        </>
      )}

      {/* Footer */}
      <div className="mt-8 pt-4 border-t border-gray-200 text-center text-xs text-gray-400">
        <p>&copy; {new Date().getFullYear()} Triple J Auto Investment LLC &bull; Dealer License P171632</p>
        <p>This document is a legal agreement between the parties named above.</p>
      </div>
    </div>
  )
})

AgreementPrintView.displayName = 'AgreementPrintView'

export default AgreementPrintView
