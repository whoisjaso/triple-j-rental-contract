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

  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }, [step])

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
      <div className="min-h-screen bg-luxury-bg flex flex-col items-center justify-center px-6">
        <img src="/logo-crest.png" alt="JJAI" className="h-[120px] w-auto mb-2 animate-scaleIn" />
        <div className="text-sm font-semibold text-luxury-ink mb-8">Triple J Auto Investment LLC</div>
        <div className="flex flex-col items-center gap-3">
          <div className="w-8 h-8 border-3 border-luxury-gold border-t-transparent rounded-full animate-spin" />
          <p className="text-gray-500 text-sm">Loading your agreement&hellip;</p>
        </div>
      </div>
    )
  }

  // Network error state (not an expired token — that navigates away)
  if (error || !agreementData) {
    return (
      <div className="min-h-screen bg-luxury-bg flex flex-col items-center justify-center px-6">
        <img src="/logo-crest.png" alt="JJAI" className="h-[120px] w-auto mb-2" />
        <div className="text-sm font-semibold text-luxury-ink mb-8">Triple J Auto Investment LLC</div>
        <div className="bg-white rounded-2xl card-float border border-luxury-ink/10 px-8 py-10 max-w-sm w-full text-center">
          <p className="text-luxury-ink font-semibold mb-2">Something went wrong.</p>
          <p className="text-gray-500 text-sm mb-6">Please check your connection and try again.</p>
          <button
            type="button"
            onClick={() => window.location.reload()}
            className="btn-primary w-full"
          >
            Try Again
          </button>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-luxury-bg">
      {/* Branded header */}
      <header className="bg-white border-b border-luxury-ink/10 px-6 py-4 text-center card-float">
        <img src="/logo-crest.png" alt="JJAI" className="h-[48px] w-auto mx-auto block" />
        <div className="text-sm font-semibold text-luxury-ink mt-0.5">Triple J Auto Investment LLC</div>
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
