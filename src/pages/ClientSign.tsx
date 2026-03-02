import { useEffect, useRef, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router'
import { createClientSignStore, ClientSignStoreContext, useClientSignStore } from '../stores/clientSignStore'
import { fetchAgreementByToken, recordClientView } from '../lib/clientSigning'
import type { AgreementData } from '../types'
import WizardProgress from '../components/WizardProgress'
import ClientReviewStep from '../components/ClientReviewStep'
import ClientPersonalStep from '../components/ClientPersonalStep'
import ClientEmploymentStep from '../components/ClientEmploymentStep'
import ClientEmergencyStep from '../components/ClientEmergencyStep'
import ClientSignStep from '../components/ClientSignStep'
import ClientReviewSubmit from '../components/ClientReviewSubmit'

const STEP_LABELS = ['Review', 'Personal Info', 'Employment', 'Emergency', 'Sign', 'Confirm']

// Inner component that consumes the store (must be inside the Provider)
function WizardInner({ agreementData, token }: { agreementData: AgreementData; token: string }) {
  const step = useClientSignStore((s) => s.step)
  const setStep = useClientSignStore((s) => s.setStep)

  function onNext() {
    setStep(step + 1)
  }
  function onBack() {
    setStep(step - 1)
  }

  return (
    <div className="max-w-2xl mx-auto px-4 py-6">
      {/* Progress bar */}
      <WizardProgress
        currentStep={step}
        totalSteps={STEP_LABELS.length}
        stepLabels={STEP_LABELS}
      />

      {/* Step content */}
      <div className="mt-4">
        {step === 0 && (
          <ClientReviewStep agreementData={agreementData} onNext={onNext} />
        )}
        {step === 1 && (
          <ClientPersonalStep onNext={onNext} onBack={onBack} />
        )}
        {step === 2 && (
          <ClientEmploymentStep onNext={onNext} onBack={onBack} />
        )}
        {step === 3 && (
          <ClientEmergencyStep onNext={onNext} onBack={onBack} />
        )}
        {step === 4 && (
          <ClientSignStep onNext={onNext} onBack={onBack} agreementData={agreementData} />
        )}
        {step === 5 && (
          <ClientReviewSubmit onBack={onBack} agreementData={agreementData} token={token} />
        )}
      </div>
    </div>
  )
}

export default function ClientSign() {
  const { token } = useParams<{ token: string }>()
  const navigate = useNavigate()

  const [agreementData, setAgreementData] = useState<AgreementData | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(false)

  // Create a stable per-token store instance. useMemo ensures it is only created once.
  const store = useMemo(
    () => createClientSignStore(token ?? ''),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [token]
  )

  // Ref to prevent duplicate recordClientView calls on re-renders
  const viewRecorded = useRef(false)

  useEffect(() => {
    if (!token) {
      navigate('/sign/expired', { replace: true })
      return
    }

    let cancelled = false

    async function load() {
      setLoading(true)
      setError(false)

      const result = await fetchAgreementByToken(token!)

      if (cancelled) return

      if (!result) {
        navigate('/sign/expired', { replace: true })
        return
      }

      if (result.status === 'signed' || result.status === 'completed') {
        navigate(`/sign/${token}/complete`, { replace: true })
        return
      }

      setAgreementData(result.data)

      // Set agreement metadata on the store
      store.getState().setAgreementMeta(result.id, result.agreement_number)

      // Record view once
      if (!viewRecorded.current) {
        viewRecorded.current = true
        recordClientView(result.id)
      }

      setLoading(false)
    }

    load().catch(() => {
      if (!cancelled) {
        setError(true)
        setLoading(false)
      }
    })

    return () => {
      cancelled = true
    }
  }, [token, navigate, store])

  // Loading state
  if (loading) {
    return (
      <div className="min-h-screen bg-light-gray flex flex-col items-center justify-center px-6">
        <div className="text-3xl font-bold text-gold tracking-widest mb-1">JJAI</div>
        <div className="text-sm font-semibold text-forest-green mb-8">Triple J Auto Investment LLC</div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-forest-green border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your agreement&hellip;</p>
        </div>
      </div>
    )
  }

  // Network error state (not an expired token — that navigates away)
  if (error || !agreementData) {
    return (
      <div className="min-h-screen bg-light-gray flex flex-col items-center justify-center px-6">
        <div className="text-3xl font-bold text-gold tracking-widest mb-1">JJAI</div>
        <div className="text-sm font-semibold text-forest-green mb-8">Triple J Auto Investment LLC</div>
        <div className="bg-white rounded-2xl shadow-sm border border-gray-200 px-8 py-10 max-w-sm w-full text-center">
          <p className="text-charcoal font-semibold mb-2">Something went wrong.</p>
          <p className="text-gray-500 text-sm mb-6">Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="w-full bg-forest-green text-white font-semibold py-3 px-6 rounded-lg text-base hover:bg-opacity-90 active:scale-95 transition-all"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-light-gray">
      {/* Branded header */}
      <header className="bg-white border-b border-gray-200 px-6 py-4 text-center shadow-sm">
        <div className="text-2xl font-bold text-gold tracking-widest leading-none">JJAI</div>
        <div className="text-sm font-semibold text-forest-green mt-0.5">Triple J Auto Investment LLC</div>
      </header>

      {/* Wizard */}
      <ClientSignStoreContext.Provider value={store}>
        <WizardInner agreementData={agreementData} token={token!} />
      </ClientSignStoreContext.Provider>

      {/* Footer */}
      <footer className="pb-8 text-center text-xs text-gray-400 mt-4">
        &copy; {new Date().getFullYear()} Triple J Auto Investment LLC &bull; Houston, TX 77075
      </footer>
    </div>
  )
}
