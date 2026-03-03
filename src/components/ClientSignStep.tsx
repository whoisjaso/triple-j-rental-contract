import { useRef, useState, useEffect, useCallback } from 'react'
import { Eraser } from 'lucide-react'
import { useClientSignStore } from '../stores/clientSignStore'
import type { AgreementData } from '../types'

interface ClientSignStepProps {
  onNext: () => void
  onBack: () => void
  agreementData: AgreementData
}

const ACKNOWLEDGMENT_SECTIONS = [
  {
    key: 'payment',
    label: 'Payment Terms',
    text: 'I acknowledge and agree to the payment terms, including the amounts, due dates, and accepted payment methods described in Section 4.',
  },
  {
    key: 'insurance',
    label: 'Insurance Disclosure',
    text: 'I acknowledge that I am responsible for maintaining valid insurance on this vehicle as required in Section 5.',
  },
  {
    key: 'gps',
    label: 'GPS Tracking',
    text: 'I acknowledge that this vehicle is equipped with a GPS tracking device and consent to its use as described in Section 6.',
  },
  {
    key: 'geo',
    label: 'Geographic Restrictions',
    text: 'I acknowledge and agree to the geographic restrictions on the vehicle\'s use as described in Section 7.',
  },
  {
    key: 'recovery',
    label: 'Unauthorized Recovery',
    text: 'I acknowledge the terms regarding unauthorized recovery of the vehicle as described in Section 8.',
  },
]

// ---- Signature Canvas (Draw Tab) ----

interface DrawCanvasProps {
  height: number
  onSave: (dataUrl: string) => void
  onClear: () => void
  label?: string
}

function DrawCanvas({ height, onSave, onClear, label }: DrawCanvasProps) {
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const containerRef = useRef<HTMLDivElement>(null)
  const [hasDrawn, setHasDrawn] = useState(false)

  // Set up canvas size on mount
  useEffect(() => {
    const canvas = canvasRef.current
    const container = containerRef.current
    if (!canvas || !container) return

    const setCanvasSize = () => {
      canvas.width = container.clientWidth
      canvas.height = height
      const ctx = canvas.getContext('2d')
      if (ctx) {
        ctx.lineWidth = 2.5
        ctx.lineCap = 'round'
        ctx.lineJoin = 'round'
        ctx.strokeStyle = '#000000'
      }
      setHasDrawn(false)
    }

    setCanvasSize()
    window.addEventListener('resize', setCanvasSize)
    return () => window.removeEventListener('resize', setCanvasSize)
  }, [height])

  // Drawing event listeners
  useEffect(() => {
    const canvas = canvasRef.current
    if (!canvas) return

    let isDrawing = false

    const getPos = (e: MouseEvent | TouchEvent) => {
      const rect = canvas.getBoundingClientRect()
      let clientX: number, clientY: number
      if ('touches' in e) {
        clientX = e.touches[0].clientX
        clientY = e.touches[0].clientY
      } else {
        clientX = (e as MouseEvent).clientX
        clientY = (e as MouseEvent).clientY
      }
      return { x: clientX - rect.left, y: clientY - rect.top }
    }

    const start = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault()
      isDrawing = true
      setHasDrawn(true)
      const ctx = canvas.getContext('2d')
      const { x, y } = getPos(e)
      ctx?.beginPath()
      ctx?.moveTo(x, y)
    }

    const move = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault()
      if (!isDrawing) return
      const ctx = canvas.getContext('2d')
      const { x, y } = getPos(e)
      ctx?.lineTo(x, y)
      ctx?.stroke()
    }

    const end = (e: MouseEvent | TouchEvent) => {
      if (e.cancelable) e.preventDefault()
      if (!isDrawing) return
      isDrawing = false
      // Auto-save after each stroke
      const dataUrl = canvas.toDataURL('image/jpeg', 0.8)
      onSave(dataUrl)
    }

    canvas.addEventListener('mousedown', start)
    canvas.addEventListener('mousemove', move)
    canvas.addEventListener('mouseup', end)
    canvas.addEventListener('mouseleave', end)
    canvas.addEventListener('touchstart', start, { passive: false })
    canvas.addEventListener('touchmove', move, { passive: false })
    canvas.addEventListener('touchend', end, { passive: false })

    return () => {
      canvas.removeEventListener('mousedown', start)
      canvas.removeEventListener('mousemove', move)
      canvas.removeEventListener('mouseup', end)
      canvas.removeEventListener('mouseleave', end)
      canvas.removeEventListener('touchstart', start)
      canvas.removeEventListener('touchmove', move)
      canvas.removeEventListener('touchend', end)
    }
  }, [onSave])

  const handleClear = () => {
    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    ctx?.clearRect(0, 0, canvas.width, canvas.height)
    setHasDrawn(false)
    onClear()
  }

  return (
    <div className="relative w-full" ref={containerRef}>
      {label && (
        <p className="text-xs text-gray-400 italic mb-1">{label}</p>
      )}
      <div
        className="border-2 border-luxury-ink rounded-lg bg-white shadow-sm relative overflow-hidden"
        style={{ height: `${height}px` }}
      >
        <canvas
          ref={canvasRef}
          className="block w-full bg-white cursor-crosshair touch-none"
          style={{ height: `${height}px` }}
        />
        {/* Baseline helper */}
        <div
          className="absolute left-4 right-4 border-b border-gray-200 pointer-events-none"
          style={{ bottom: `${Math.round(height * 0.2)}px` }}
        />
        {/* Clear button */}
        <button
          type="button"
          onClick={handleClear}
          className="absolute top-2 right-2 p-2 bg-gray-100 rounded-full text-gray-600 hover:bg-red-50 hover:text-alert-red transition-colors shadow-sm z-10 active:bg-gray-300 min-w-[44px] min-h-[44px] flex items-center justify-center"
          title="Clear"
        >
          <Eraser size={18} />
        </button>
      </div>
      {!hasDrawn && (
        <p className="text-xs text-gray-400 text-center mt-1">
          Use your finger or mouse to draw
        </p>
      )}
    </div>
  )
}

// ---- Main ClientSignStep ----

export default function ClientSignStep({ onNext, onBack }: ClientSignStepProps) {
  // Store state
  const drawnSignature = useClientSignStore((s) => s.drawnSignature)
  const drawnInitials = useClientSignStore((s) => s.drawnInitials)
  const signatureType = useClientSignStore((s) => s.signatureType)
  const typedSignatureName = useClientSignStore((s) => s.typedSignatureName)
  const acknowledgedSections = useClientSignStore((s) => s.acknowledgedSections)

  const setDrawnSignature = useClientSignStore((s) => s.setDrawnSignature)
  const setDrawnInitials = useClientSignStore((s) => s.setDrawnInitials)
  const setSignatureType = useClientSignStore((s) => s.setSignatureType)
  const setTypedSignatureName = useClientSignStore((s) => s.setTypedSignatureName)
  const toggleAcknowledgment = useClientSignStore((s) => s.toggleAcknowledgment)

  // Local UI state
  const [validationError, setValidationError] = useState<string | null>(null)
  const isMobileTouch = window.matchMedia('(pointer: coarse)').matches

  // Typed signature name rendering to canvas for typed sig mode
  const typedSigCanvasRef = useRef<HTMLCanvasElement>(null)

  // Render typed name to canvas whenever it changes
  useEffect(() => {
    if (signatureType !== 'type') return
    const canvas = typedSigCanvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return
    canvas.width = 400
    canvas.height = 80
    ctx.clearRect(0, 0, canvas.width, canvas.height)
    if (typedSignatureName) {
      ctx.font = 'italic 48px "Cormorant Garamond", serif'
      ctx.fillStyle = '#000000'
      ctx.fillText(typedSignatureName, 10, 60)
    }
  }, [typedSignatureName, signatureType])

  // Render typed name to canvas and get dataURL
  const getTypedSignatureDataUrl = useCallback((): string => {
    const canvas = document.createElement('canvas')
    canvas.width = 400
    canvas.height = 80
    const ctx = canvas.getContext('2d')
    if (!ctx) return ''
    ctx.font = 'italic 48px "Cormorant Garamond", serif'
    ctx.fillStyle = '#000000'
    ctx.fillText(typedSignatureName, 10, 60)
    return canvas.toDataURL('image/jpeg', 0.8)
  }, [typedSignatureName])

  // Validation
  const canAdvance = () => {
    if (signatureType === 'draw' && !drawnSignature) return false
    if (signatureType === 'type' && !typedSignatureName.trim()) return false
    if (!drawnInitials) return false
    if (acknowledgedSections.length < ACKNOWLEDGMENT_SECTIONS.length) return false
    return true
  }

  function handleNext() {
    // Validate
    if (signatureType === 'draw' && !drawnSignature) {
      setValidationError('Please provide your signature by drawing it above.')
      return
    }
    if (signatureType === 'type' && !typedSignatureName.trim()) {
      setValidationError('Please type your full legal name for your signature.')
      return
    }
    if (!drawnInitials) {
      setValidationError('Please draw your initials above.')
      return
    }
    if (acknowledgedSections.length < ACKNOWLEDGMENT_SECTIONS.length) {
      setValidationError('Please acknowledge all sections by checking each box.')
      return
    }

    // For typed signature: store rendered canvas dataURL
    if (signatureType === 'type') {
      const dataUrl = getTypedSignatureDataUrl()
      setDrawnSignature(dataUrl)
    }

    setValidationError(null)
    onNext()
  }

  return (
    <div className="bg-white rounded-2xl shadow-sm border border-luxury-ink/10 overflow-hidden">
      {/* Header */}
      <div className="px-6 pt-6 pb-4 border-b border-luxury-ink/10">
        <h2 className="text-xl font-bold text-luxury-ink">Sign Agreement</h2>
        <p className="text-gray-600 text-sm mt-1">
          Provide your signature and initials to complete the agreement.
        </p>
      </div>

      <div className="px-6 py-5 flex flex-col gap-6">

        {/* ---- Signature Section ---- */}
        <div>
          <h3 className="text-base font-bold text-luxury-ink mb-3">Your Signature</h3>

          {/* Tab bar */}
          <div className="flex rounded-lg border border-gray-200 overflow-hidden mb-4">
            <button
              type="button"
              onClick={() => { setSignatureType('draw'); setValidationError(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                signatureType === 'draw'
                  ? 'bg-luxury-ink text-white'
                  : 'bg-white text-luxury-ink border-r border-gray-200 hover:bg-gray-50'
              }`}
            >
              Draw
            </button>
            <button
              type="button"
              onClick={() => { setSignatureType('type'); setValidationError(null) }}
              className={`flex-1 py-2.5 text-sm font-semibold transition-colors ${
                signatureType === 'type'
                  ? 'bg-luxury-ink text-white'
                  : 'bg-white text-luxury-ink hover:bg-gray-50'
              }`}
            >
              Type
            </button>
          </div>

          {/* Draw tab */}
          {signatureType === 'draw' && (
            <DrawCanvas
              height={200}
              onSave={setDrawnSignature}
              onClear={() => setDrawnSignature('')}
              label={isMobileTouch ? 'Use your finger to sign' : undefined}
            />
          )}

          {/* Type tab */}
          {signatureType === 'type' && (
            <div className="flex flex-col gap-3">
              <div>
                <label htmlFor="typed-sig" className="block text-sm font-semibold text-luxury-ink mb-1.5">
                  Type your full legal name
                </label>
                <input
                  id="typed-sig"
                  type="text"
                  value={typedSignatureName}
                  onChange={(e) => { setTypedSignatureName(e.target.value); setValidationError(null) }}
                  placeholder="Your full legal name"
                  autoComplete="off"
                  className="w-full rounded-lg border border-gray-300 px-4 py-3 text-base focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold transition-colors placeholder:text-gray-400"
                />
              </div>
              {/* Live preview */}
              {typedSignatureName && (
                <div className="border-b-2 border-luxury-ink pb-2 mt-1">
                  <p
                    className="text-luxury-ink"
                    style={{ fontFamily: '"Cormorant Garamond", serif', fontStyle: 'italic', fontSize: '2rem', lineHeight: '1.3' }}
                  >
                    {typedSignatureName}
                  </p>
                  <p className="text-xs text-gray-400 mt-1">Signed electronically</p>
                </div>
              )}
              {/* Hidden canvas for rendering typed sig as JPEG */}
              <canvas ref={typedSigCanvasRef} className="hidden" />
            </div>
          )}
        </div>

        {/* ---- Initials Section ---- */}
        <div>
          <h3 className="text-base font-bold text-luxury-ink mb-1">Your Initials</h3>
          <p className="text-gray-500 text-sm mb-3">
            Draw your initials once below. Then tap the checkbox next to each section to confirm you&apos;ve read and understood it.
          </p>

          <DrawCanvas
            height={100}
            onSave={setDrawnInitials}
            onClear={() => setDrawnInitials('')}
            label={isMobileTouch ? 'Use your finger to draw your initials' : undefined}
          />
        </div>

        {/* ---- Acknowledgment Sections ---- */}
        <div>
          <h3 className="text-base font-bold text-luxury-ink mb-3">Acknowledgments</h3>

          {!drawnInitials && (
            <p className="text-sm text-amber-700 bg-amber-50 border border-amber-200 rounded-lg px-4 py-3 mb-3">
              Please draw your initials above first to enable acknowledgment checkboxes.
            </p>
          )}

          <div className="flex flex-col gap-3">
            {ACKNOWLEDGMENT_SECTIONS.map((section) => {
              const isChecked = acknowledgedSections.includes(section.key)
              const isDisabled = !drawnInitials

              return (
                <label
                  key={section.key}
                  className={`flex items-start gap-3 p-4 rounded-xl border transition-colors ${
                    isChecked
                      ? 'border-luxury-gold bg-luxury-bg/30'
                      : 'border-gray-200 bg-gray-50'
                  } ${isDisabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'}`}
                >
                  <input
                    type="checkbox"
                    checked={isChecked}
                    disabled={isDisabled}
                    onChange={() => {
                      if (!isDisabled) {
                        toggleAcknowledgment(section.key)
                        setValidationError(null)
                      }
                    }}
                    className="mt-0.5 h-5 w-5 shrink-0 rounded border-gray-400 accent-luxury-gold cursor-pointer disabled:cursor-not-allowed"
                  />
                  <div className="flex-1 min-w-0">
                    <p className="font-semibold text-luxury-ink text-sm mb-0.5">{section.label}</p>
                    <p className="text-gray-600 text-sm leading-relaxed">{section.text}</p>
                    {/* Initials thumbnail shown when checked */}
                    {isChecked && drawnInitials && (
                      <div className="mt-2 flex items-center gap-2">
                        <img
                          src={drawnInitials}
                          alt="Your initials"
                          className="h-8 object-contain border border-gray-200 rounded bg-white px-1"
                        />
                        <span className="text-xs text-luxury-gold font-semibold">Initialed</span>
                      </div>
                    )}
                  </div>
                </label>
              )
            })}
          </div>
        </div>

        {/* Validation error */}
        {validationError && (
          <div className="p-3 bg-red-50 border border-alert-red rounded-lg text-alert-red text-sm">
            {validationError}
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
          type="button"
          onClick={handleNext}
          disabled={!canAdvance()}
          className="flex-1 md:flex-none md:min-w-48 bg-luxury-ink text-white font-semibold py-3 px-6 rounded-xl text-base hover:bg-opacity-90 active:scale-95 transition-all shadow-sm disabled:opacity-40 disabled:cursor-not-allowed disabled:active:scale-100"
        >
          Review &amp; Submit
        </button>
      </div>
    </div>
  )
}
