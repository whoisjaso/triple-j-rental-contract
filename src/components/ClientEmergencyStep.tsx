import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClientSignStore } from '../stores/clientSignStore'
import { formatPhone } from '../lib/formatters'

const RELATIONSHIP_OPTIONS = [
  'Spouse',
  'Parent',
  'Child',
  'Sibling',
  'Friend',
  'Employer',
  'Other',
] as const

const emergencyContactSchema = z.object({
  emergencyName: z.string().min(2, "Please enter your emergency contact's full name."),
  emergencyPhone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, 'Please enter a valid phone number.'),
  emergencyRelation: z.string().min(1, 'Please specify your relationship.'),
  emergencyRelationOther: z.string().optional(),
})

type EmergencyContactValues = z.infer<typeof emergencyContactSchema>

interface ClientEmergencyStepProps {
  onNext: () => void
  onBack: () => void
}

export default function ClientEmergencyStep({ onNext, onBack }: ClientEmergencyStepProps) {
  const clientData = useClientSignStore((s) => s.clientData)
  const updateClientField = useClientSignStore((s) => s.updateClientField)

  const savedRenter = clientData.renter as Partial<EmergencyContactValues> | undefined

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EmergencyContactValues>({
    resolver: zodResolver(emergencyContactSchema),
    defaultValues: {
      emergencyName: savedRenter?.emergencyName ?? '',
      emergencyPhone: savedRenter?.emergencyPhone ?? '',
      emergencyRelation: savedRenter?.emergencyRelation ?? '',
      emergencyRelationOther: '',
    },
  })

  const selectedRelation = watch('emergencyRelation')

  function onSubmit(values: EmergencyContactValues) {
    const finalRelation = values.emergencyRelation === 'Other'
      ? (values.emergencyRelationOther || 'Other')
      : values.emergencyRelation
    updateClientField('renter', 'emergencyName', values.emergencyName)
    updateClientField('renter', 'emergencyPhone', values.emergencyPhone)
    updateClientField('renter', 'emergencyRelation', finalRelation)
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-luxury-ink/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-luxury-ink/10">
        <h2 className="text-xl font-bold text-luxury-ink">Emergency Contact</h2>
        <p className="text-gray-600 text-sm mt-1">
          Please provide someone we can contact in case of an emergency.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Emergency Contact Name */}
          <div>
            <label htmlFor="emergencyName" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Full Name <span className="text-alert-red">*</span>
            </label>
            <input
              id="emergencyName"
              type="text"
              placeholder="Contact's full name"
              autoComplete="off"
              {...register('emergencyName')}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400"
            />
            {errors.emergencyName && (
              <p className="text-alert-red text-sm mt-1">{errors.emergencyName.message}</p>
            )}
          </div>

          {/* Emergency Phone */}
          <div>
            <label htmlFor="emergencyPhone" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Phone Number <span className="text-alert-red">*</span>
            </label>
            <input
              id="emergencyPhone"
              type="tel"
              inputMode="numeric"
              placeholder="(832) 555-0100"
              autoComplete="off"
              value={watch('emergencyPhone')}
              onChange={(e) => setValue('emergencyPhone', formatPhone(e.target.value), { shouldValidate: true })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400"
            />
            {errors.emergencyPhone && (
              <p className="text-alert-red text-sm mt-1">{errors.emergencyPhone.message}</p>
            )}
          </div>

          {/* Relationship */}
          <div>
            <label htmlFor="emergencyRelation" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Relationship <span className="text-alert-red">*</span>
            </label>
            <select
              id="emergencyRelation"
              {...register('emergencyRelation')}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors bg-white"
            >
              <option value="">Select relationship...</option>
              {RELATIONSHIP_OPTIONS.map((opt) => (
                <option key={opt} value={opt}>{opt}</option>
              ))}
            </select>
            {errors.emergencyRelation && (
              <p className="text-alert-red text-sm mt-1">{errors.emergencyRelation.message}</p>
            )}
          </div>

          {/* Custom Relationship (shown when "Other" is selected) */}
          {selectedRelation === 'Other' && (
            <div>
              <label htmlFor="emergencyRelationOther" className="block text-sm font-semibold text-luxury-ink mb-1.5">
                Please specify <span className="text-alert-red">*</span>
              </label>
              <input
                id="emergencyRelationOther"
                type="text"
                placeholder="e.g. Neighbor, Coworker"
                autoComplete="off"
                {...register('emergencyRelationOther')}
                className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400"
              />
            </div>
          )}
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
