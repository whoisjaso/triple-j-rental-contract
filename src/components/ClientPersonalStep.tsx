import type { ChangeEvent } from 'react'
import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClientSignStore } from '../stores/clientSignStore'
import { formatPhone } from '../lib/formatters'
import { lookupZip, US_STATES } from '../lib/zipLookup'

const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full legal name as it appears on your ID.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  dlNumber: z.string().min(1, "Driver's license number is required."),
  dlExp: z.string().min(1, 'License expiration date is required.'),
  address: z.string().min(5, 'Please enter your full street address.'),
  zip: z.string().regex(/^\d{5}$/, 'Please enter a valid 5-digit ZIP code.'),
  city: z.string().min(2, 'City is required.'),
  state: z.string().min(2, 'State is required.'),
  phonePrimary: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Please enter a valid 10-digit phone number.'),
  phoneSecondary: z.string().optional(),
  email: z.string().email('Please enter a valid email address.'),
})

type PersonalInfoValues = z.infer<typeof personalInfoSchema>

interface ClientPersonalStepProps {
  onNext: () => void
  onBack: () => void
}

interface FieldProps {
  label: string
  name: keyof PersonalInfoValues
  type?: string
  placeholder?: string
  error?: string
  required?: boolean
  register: ReturnType<typeof useForm<PersonalInfoValues>>['register']
  inputMode?: 'text' | 'numeric' | 'email' | 'tel'
}

function Field({ label, name, type = 'text', placeholder, error, required = true, register, inputMode }: FieldProps) {
  return (
    <div>
      <label htmlFor={name} className="block text-sm font-semibold text-luxury-ink mb-1.5">
        {label}
        {required && <span className="text-alert-red ml-0.5">*</span>}
      </label>
      <input
        id={name}
        type={type}
        placeholder={placeholder}
        autoComplete="off"
        inputMode={inputMode}
        {...register(name)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400 input-smooth"
      />
      {error && (
        <p className="text-alert-red text-sm mt-1">{error}</p>
      )}
    </div>
  )
}

const inputClassName = "w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400 input-smooth"
const selectClassName = "w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors bg-white input-smooth"

export default function ClientPersonalStep({ onNext, onBack }: ClientPersonalStepProps) {
  const clientData = useClientSignStore((s) => s.clientData)
  const updateClientField = useClientSignStore((s) => s.updateClientField)

  const savedRenter = clientData.renter as Partial<PersonalInfoValues> | undefined

  const { register, handleSubmit, setValue, watch, formState: { errors } } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: savedRenter?.fullName ?? '',
      dob: savedRenter?.dob ?? '',
      dlNumber: savedRenter?.dlNumber ?? '',
      dlExp: savedRenter?.dlExp ?? '',
      address: savedRenter?.address ?? '',
      zip: savedRenter?.zip ?? '',
      city: savedRenter?.city ?? '',
      state: savedRenter?.state ?? '',
      phonePrimary: savedRenter?.phonePrimary ?? '',
      phoneSecondary: savedRenter?.phoneSecondary ?? '',
      email: savedRenter?.email ?? '',
    },
  })

  async function handleZipChange(e: ChangeEvent<HTMLInputElement>) {
    const digits = e.target.value.replace(/\D/g, '').slice(0, 5)
    setValue('zip', digits, { shouldValidate: digits.length === 5 })
    if (digits.length === 5) {
      const result = await lookupZip(digits)
      if (result) {
        setValue('city', result.city, { shouldValidate: true })
        setValue('state', result.state, { shouldValidate: true })
      }
    }
  }

  function onSubmit(values: PersonalInfoValues) {
    updateClientField('renter', 'fullName', values.fullName)
    updateClientField('renter', 'dob', values.dob)
    updateClientField('renter', 'dlNumber', values.dlNumber)
    updateClientField('renter', 'dlExp', values.dlExp)
    updateClientField('renter', 'address', values.address)
    updateClientField('renter', 'zip', values.zip)
    updateClientField('renter', 'city', values.city)
    updateClientField('renter', 'state', values.state)
    updateClientField('renter', 'phonePrimary', values.phonePrimary)
    updateClientField('renter', 'phoneSecondary', values.phoneSecondary ?? '')
    updateClientField('renter', 'email', values.email)
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl card-float border border-luxury-ink/10 overflow-hidden animate-fadeInUp">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-luxury-ink/10 text-center">
        <h2 className="text-xl font-bold text-luxury-ink">Personal Information</h2>
        <p className="text-gray-600 text-sm mt-1">
          Please enter your information exactly as it appears on your driver&apos;s license.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="px-6 py-5 grid grid-cols-1 md:grid-cols-2 gap-4">
          <div className="md:col-span-2">
            <Field
              label="Full Legal Name"
              name="fullName"
              placeholder="As it appears on your ID"
              register={register}
              error={errors.fullName?.message}
            />
          </div>
          <Field
            label="Date of Birth"
            name="dob"
            type="date"
            register={register}
            error={errors.dob?.message}
          />
          <Field
            label="Driver's License Number"
            name="dlNumber"
            placeholder="e.g. TX12345678"
            register={register}
            error={errors.dlNumber?.message}
          />
          <Field
            label="License Expiration Date"
            name="dlExp"
            type="date"
            register={register}
            error={errors.dlExp?.message}
          />
          <div className="md:col-span-2">
            <Field
              label="Street Address"
              name="address"
              placeholder="e.g. 123 Main Street, Apt 4"
              register={register}
              error={errors.address?.message}
            />
          </div>

          {/* ZIP / City / State — split fields with auto-lookup */}
          <div className="md:col-span-2 grid grid-cols-1 md:grid-cols-3 gap-4">
            {/* ZIP Code */}
            <div>
              <label htmlFor="zip" className="block text-sm font-semibold text-luxury-ink mb-1.5">
                ZIP Code<span className="text-alert-red ml-0.5">*</span>
              </label>
              <input
                id="zip"
                type="text"
                inputMode="numeric"
                placeholder="77075"
                autoComplete="off"
                maxLength={5}
                value={watch('zip')}
                onChange={handleZipChange}
                className={inputClassName}
              />
              {errors.zip && (
                <p className="text-alert-red text-sm mt-1">{errors.zip.message}</p>
              )}
            </div>

            {/* City */}
            <div>
              <label htmlFor="city" className="block text-sm font-semibold text-luxury-ink mb-1.5">
                City<span className="text-alert-red ml-0.5">*</span>
              </label>
              <input
                id="city"
                type="text"
                placeholder="Houston"
                autoComplete="off"
                value={watch('city')}
                onChange={(e) => setValue('city', e.target.value, { shouldValidate: true })}
                className={inputClassName}
              />
              {errors.city && (
                <p className="text-alert-red text-sm mt-1">{errors.city.message}</p>
              )}
            </div>

            {/* State */}
            <div>
              <label htmlFor="state" className="block text-sm font-semibold text-luxury-ink mb-1.5">
                State<span className="text-alert-red ml-0.5">*</span>
              </label>
              <select
                id="state"
                value={watch('state')}
                onChange={(e) => setValue('state', e.target.value, { shouldValidate: true })}
                className={selectClassName}
              >
                <option value="">Select state</option>
                {US_STATES.map((s) => (
                  <option key={s.value} value={s.value}>{s.label}</option>
                ))}
              </select>
              {errors.state && (
                <p className="text-alert-red text-sm mt-1">{errors.state.message}</p>
              )}
            </div>
          </div>

          {/* Phone fields — controlled with formatPhone */}
          <div>
            <label htmlFor="phonePrimary" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Primary Phone<span className="text-alert-red ml-0.5">*</span>
            </label>
            <input
              id="phonePrimary"
              type="tel"
              inputMode="numeric"
              placeholder="(832) 555-0100"
              autoComplete="off"
              value={watch('phonePrimary')}
              onChange={(e) => setValue('phonePrimary', formatPhone(e.target.value), { shouldValidate: true })}
              className={inputClassName}
            />
            {errors.phonePrimary && (
              <p className="text-alert-red text-sm mt-1">{errors.phonePrimary.message}</p>
            )}
          </div>
          <div>
            <label htmlFor="phoneSecondary" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Secondary Phone
            </label>
            <input
              id="phoneSecondary"
              type="tel"
              inputMode="numeric"
              placeholder="Optional"
              autoComplete="off"
              value={watch('phoneSecondary') ?? ''}
              onChange={(e) => setValue('phoneSecondary', formatPhone(e.target.value), { shouldValidate: true })}
              className={inputClassName}
            />
            {errors.phoneSecondary && (
              <p className="text-alert-red text-sm mt-1">{errors.phoneSecondary.message}</p>
            )}
          </div>

          {/* Email */}
          <div className="md:col-span-2">
            <Field
              label="Email Address"
              name="email"
              type="email"
              placeholder="your@email.com"
              register={register}
              error={errors.email?.message}
              inputMode="email"
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-5 bg-luxury-bg/30 border-t border-luxury-ink/10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="btn-secondary"
          >
            Back
          </button>
          <button
            type="submit"
            className="btn-primary flex-1 md:flex-none md:min-w-48"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}
