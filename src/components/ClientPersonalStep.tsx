import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClientSignStore } from '../stores/clientSignStore'

const phoneRegex = /^\+?[\d\s\-().]{10,}$/

const personalInfoSchema = z.object({
  fullName: z.string().min(2, 'Please enter your full legal name as it appears on your ID.'),
  dob: z.string().min(1, 'Date of birth is required.'),
  dlNumber: z.string().min(1, "Driver's license number is required."),
  dlExp: z.string().min(1, 'License expiration date is required.'),
  address: z.string().min(5, 'Please enter your full street address.'),
  cityStateZip: z.string().min(5, 'Please enter your city, state, and ZIP code.'),
  phonePrimary: z.string().regex(phoneRegex, 'Please enter a valid phone number.'),
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
}

function Field({ label, name, type = 'text', placeholder, error, required = true, register }: FieldProps) {
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
        {...register(name)}
        className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400"
      />
      {error && (
        <p className="text-alert-red text-sm mt-1">{error}</p>
      )}
    </div>
  )
}

export default function ClientPersonalStep({ onNext, onBack }: ClientPersonalStepProps) {
  const clientData = useClientSignStore((s) => s.clientData)
  const updateClientField = useClientSignStore((s) => s.updateClientField)

  const savedRenter = clientData.renter as Partial<PersonalInfoValues> | undefined

  const { register, handleSubmit, formState: { errors } } = useForm<PersonalInfoValues>({
    resolver: zodResolver(personalInfoSchema),
    defaultValues: {
      fullName: savedRenter?.fullName ?? '',
      dob: savedRenter?.dob ?? '',
      dlNumber: savedRenter?.dlNumber ?? '',
      dlExp: savedRenter?.dlExp ?? '',
      address: savedRenter?.address ?? '',
      cityStateZip: savedRenter?.cityStateZip ?? '',
      phonePrimary: savedRenter?.phonePrimary ?? '',
      phoneSecondary: savedRenter?.phoneSecondary ?? '',
      email: savedRenter?.email ?? '',
    },
  })

  function onSubmit(values: PersonalInfoValues) {
    updateClientField('renter', 'fullName', values.fullName)
    updateClientField('renter', 'dob', values.dob)
    updateClientField('renter', 'dlNumber', values.dlNumber)
    updateClientField('renter', 'dlExp', values.dlExp)
    updateClientField('renter', 'address', values.address)
    updateClientField('renter', 'cityStateZip', values.cityStateZip)
    updateClientField('renter', 'phonePrimary', values.phonePrimary)
    updateClientField('renter', 'phoneSecondary', values.phoneSecondary ?? '')
    updateClientField('renter', 'email', values.email)
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-luxury-ink/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-luxury-ink/10">
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
          <div className="md:col-span-2">
            <Field
              label="City, State, ZIP"
              name="cityStateZip"
              placeholder="e.g. Houston, TX 77075"
              register={register}
              error={errors.cityStateZip?.message}
            />
          </div>
          <Field
            label="Primary Phone"
            name="phonePrimary"
            type="tel"
            placeholder="(832) 555-0100"
            register={register}
            error={errors.phonePrimary?.message}
          />
          <Field
            label="Secondary Phone"
            name="phoneSecondary"
            type="tel"
            placeholder="Optional"
            required={false}
            register={register}
            error={errors.phoneSecondary?.message}
          />
          <div className="md:col-span-2">
            <Field
              label="Email Address"
              name="email"
              type="email"
              placeholder="your@email.com"
              register={register}
              error={errors.email?.message}
            />
          </div>
        </div>

        {/* Navigation */}
        <div className="px-6 py-5 bg-luxury-bg/30 border-t border-luxury-ink/10 flex items-center justify-between gap-4">
          <button
            type="button"
            onClick={onBack}
            className="text-luxury-ink font-semibold text-base py-3 px-5 rounded-xl hover:bg-gray-100 active:scale-95 transition-all"
          >
            Back
          </button>
          <button
            type="submit"
            className="flex-1 md:flex-none md:min-w-48 bg-luxury-ink text-white font-semibold py-3 px-6 rounded-xl text-base hover:bg-opacity-90 active:scale-95 transition-all shadow-sm"
          >
            Continue
          </button>
        </div>
      </form>
    </div>
  )
}
