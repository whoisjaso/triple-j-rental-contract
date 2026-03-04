import { useForm } from 'react-hook-form'
import { zodResolver } from '@hookform/resolvers/zod'
import { z } from 'zod'
import { useClientSignStore } from '../stores/clientSignStore'
import { formatPhone, formatCurrency } from '../lib/formatters'

const employmentSchema = z.object({
  employerName: z.string().min(2, "Please enter your employer's name."),
  employerPhone: z.string().regex(/^\(\d{3}\) \d{3}-\d{4}$/, "Please enter your employer's phone number."),
  monthlyIncome: z.string().min(1, 'Please enter your approximate monthly income.'),
})

type EmploymentValues = z.infer<typeof employmentSchema>

interface ClientEmploymentStepProps {
  onNext: () => void
  onBack: () => void
}

export default function ClientEmploymentStep({ onNext, onBack }: ClientEmploymentStepProps) {
  const clientData = useClientSignStore((s) => s.clientData)
  const updateClientField = useClientSignStore((s) => s.updateClientField)

  const savedRenter = clientData.renter as Partial<EmploymentValues> | undefined

  const { register, handleSubmit, formState: { errors }, setValue, watch } = useForm<EmploymentValues>({
    resolver: zodResolver(employmentSchema),
    defaultValues: {
      employerName: savedRenter?.employerName ?? '',
      employerPhone: savedRenter?.employerPhone ?? '',
      monthlyIncome: savedRenter?.monthlyIncome ?? '',
    },
  })

  function onSubmit(values: EmploymentValues) {
    updateClientField('renter', 'employerName', values.employerName)
    updateClientField('renter', 'employerPhone', values.employerPhone)
    updateClientField('renter', 'monthlyIncome', values.monthlyIncome)
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl card-float border border-luxury-ink/10 overflow-hidden animate-fadeInUp">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-luxury-ink/10">
        <h2 className="text-xl font-bold text-luxury-ink">Employment Information</h2>
        <p className="text-gray-600 text-sm mt-1">
          This helps us verify your rental eligibility.
        </p>
      </div>

      <form onSubmit={handleSubmit(onSubmit)} noValidate>
        <div className="px-6 py-5 flex flex-col gap-4">
          {/* Employer Name */}
          <div>
            <label htmlFor="employerName" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Employer Name <span className="text-alert-red">*</span>
            </label>
            <input
              id="employerName"
              type="text"
              placeholder="e.g. ABC Transportation LLC"
              autoComplete="organization"
              {...register('employerName')}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400 input-smooth"
            />
            {errors.employerName && (
              <p className="text-alert-red text-sm mt-1">{errors.employerName.message}</p>
            )}
          </div>

          {/* Employer Phone */}
          <div>
            <label htmlFor="employerPhone" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Employer Phone <span className="text-alert-red">*</span>
            </label>
            <input
              id="employerPhone"
              type="tel"
              inputMode="numeric"
              placeholder="(713) 555-0100"
              autoComplete="off"
              value={watch('employerPhone')}
              onChange={(e) => setValue('employerPhone', formatPhone(e.target.value), { shouldValidate: true })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400 input-smooth"
            />
            {errors.employerPhone && (
              <p className="text-alert-red text-sm mt-1">{errors.employerPhone.message}</p>
            )}
          </div>

          {/* Monthly Income */}
          <div>
            <label htmlFor="monthlyIncome" className="block text-sm font-semibold text-luxury-ink mb-1.5">
              Approximate Monthly Income <span className="text-alert-red">*</span>
            </label>
            <input
              id="monthlyIncome"
              type="text"
              inputMode="numeric"
              placeholder="e.g. $3,200"
              autoComplete="off"
              value={watch('monthlyIncome')}
              onChange={(e) => setValue('monthlyIncome', formatCurrency(e.target.value), { shouldValidate: true })}
              className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400 input-smooth"
            />
            {errors.monthlyIncome && (
              <p className="text-alert-red text-sm mt-1">{errors.monthlyIncome.message}</p>
            )}
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
