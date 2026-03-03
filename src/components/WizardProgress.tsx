interface WizardProgressProps {
  currentStep: number
  totalSteps: number
  stepLabels: string[]
}

export default function WizardProgress({ currentStep, totalSteps, stepLabels }: WizardProgressProps) {
  return (
    <>
      {/* Mobile: simplified text indicator */}
      <div className="md:hidden text-sm text-gray-600 font-medium text-center mb-4">
        Step {currentStep + 1} of {totalSteps}:{' '}
        <span className="text-luxury-gold font-semibold">{stepLabels[currentStep]}</span>
      </div>

      {/* Desktop: full step bar */}
      <div className="hidden md:flex items-center justify-between mb-6">
        {stepLabels.map((label, index) => {
          const isCompleted = index < currentStep
          const isCurrent = index === currentStep
          const isFuture = index > currentStep

          return (
            <div key={label} className="flex flex-col items-center flex-1">
              <div className="flex items-center w-full">
                {/* Left connector line */}
                {index > 0 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isCompleted || isCurrent ? 'bg-luxury-gold' : 'bg-gray-300'
                    }`}
                  />
                )}

                {/* Step circle */}
                <div
                  className={`
                    flex-shrink-0 flex items-center justify-center rounded-full font-bold text-sm transition-all
                    ${isCompleted
                      ? 'w-8 h-8 bg-luxury-gold text-white'
                      : isCurrent
                      ? 'w-9 h-9 bg-luxury-gold text-white ring-2 ring-luxury-gold ring-offset-2'
                      : 'w-8 h-8 border-2 border-gray-300 text-gray-400 bg-white'
                    }
                  `}
                >
                  {isCompleted ? (
                    <svg
                      className="w-4 h-4"
                      fill="none"
                      stroke="currentColor"
                      strokeWidth={3}
                      viewBox="0 0 24 24"
                      aria-hidden="true"
                    >
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                    </svg>
                  ) : (
                    <span>{index + 1}</span>
                  )}
                </div>

                {/* Right connector line */}
                {index < totalSteps - 1 && (
                  <div
                    className={`flex-1 h-0.5 ${
                      isCompleted ? 'bg-luxury-gold' : 'bg-gray-300'
                    }`}
                  />
                )}
              </div>

              {/* Label */}
              <span
                className={`mt-1.5 text-xs font-medium text-center leading-tight ${
                  isCurrent
                    ? 'text-luxury-gold'
                    : isFuture
                    ? 'text-gray-400'
                    : 'text-gray-500'
                }`}
              >
                {label}
              </span>
            </div>
          )
        })}
      </div>
    </>
  )
}
