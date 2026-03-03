import { useState, useEffect, useCallback } from 'react'
import { QRCodeSVG } from 'qrcode.react'
import { X, Copy, Check, Link, RefreshCw, AlertTriangle } from 'lucide-react'
import { generateShareLink, revokeLink } from '../lib/agreements'

interface LinkShareModalProps {
  isOpen: boolean
  onClose: () => void
  agreementId: string
  agreementNumber: string
  existingToken: string | null
  existingExpiry: string | null
  onLinkGenerated: (token: string, expiresAt: string) => void
  onLinkRevoked: () => void
}

export default function LinkShareModal({
  isOpen,
  onClose,
  agreementId,
  agreementNumber,
  existingToken,
  existingExpiry,
  onLinkGenerated,
  onLinkRevoked,
}: LinkShareModalProps) {
  const [token, setToken] = useState<string | null>(existingToken)
  const [expiry, setExpiry] = useState<string | null>(existingExpiry)
  const [loading, setLoading] = useState(false)
  const [copied, setCopied] = useState(false)
  const [showRevokeConfirm, setShowRevokeConfirm] = useState(false)
  const [error, setError] = useState<string | null>(null)

  // Sync with parent state when modal opens
  useEffect(() => {
    if (isOpen) {
      setToken(existingToken)
      setExpiry(existingExpiry)
      setError(null)
      setShowRevokeConfirm(false)
      setCopied(false)
    }
  }, [isOpen, existingToken, existingExpiry])

  // Close on Escape key
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (e.key === 'Escape') onClose()
    },
    [onClose]
  )

  useEffect(() => {
    if (isOpen) {
      document.addEventListener('keydown', handleKeyDown)
      return () => document.removeEventListener('keydown', handleKeyDown)
    }
  }, [isOpen, handleKeyDown])

  const signUrl = token
    ? `${window.location.origin}/sign/${token}`
    : null

  async function handleGenerate() {
    setLoading(true)
    setError(null)
    try {
      const { token: newToken, expiresAt } = await generateShareLink(agreementId)
      setToken(newToken)
      setExpiry(expiresAt)
      onLinkGenerated(newToken, expiresAt)
    } catch (err: any) {
      setError(err.message || 'Failed to generate link')
    } finally {
      setLoading(false)
    }
  }

  async function handleRevokeAndRegenerate() {
    setLoading(true)
    setError(null)
    setShowRevokeConfirm(false)
    try {
      await revokeLink(agreementId)
      const { token: newToken, expiresAt } = await generateShareLink(agreementId)
      setToken(newToken)
      setExpiry(expiresAt)
      onLinkGenerated(newToken, expiresAt)
      onLinkRevoked()
      // onLinkGenerated immediately gives the new token so no need to call revoked + generated separately
    } catch (err: any) {
      setError(err.message || 'Failed to revoke link')
    } finally {
      setLoading(false)
    }
  }

  async function handleCopy() {
    if (!signUrl) return
    try {
      await navigator.clipboard.writeText(signUrl)
      setCopied(true)
      setTimeout(() => setCopied(false), 2000)
    } catch {
      setError('Failed to copy to clipboard')
    }
  }

  function formatExpiry(iso: string) {
    return new Date(iso).toLocaleDateString('en-US', {
      weekday: 'long',
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    })
  }

  if (!isOpen) return null

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      role="dialog"
      aria-modal="true"
      aria-labelledby="link-modal-title"
    >
      {/* Overlay */}
      <div
        className="absolute inset-0 bg-black/50"
        onClick={onClose}
        aria-hidden="true"
      />

      {/* Modal Panel */}
      <div className="relative bg-white rounded-2xl shadow-2xl w-full max-w-md mx-auto overflow-hidden">
        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-gray-100">
          <div className="flex items-center gap-3">
            <Link className="w-5 h-5 text-luxury-ink" />
            <h2 id="link-modal-title" className="text-lg font-bold text-luxury-ink">
              Share Agreement
            </h2>
            <span className="bg-luxury-gold text-white text-xs font-bold px-2 py-0.5 rounded">
              {agreementNumber}
            </span>
          </div>
          <button
            type="button"
            onClick={onClose}
            className="text-gray-400 hover:text-gray-600 transition-colors rounded-full p-1 hover:bg-gray-100"
            aria-label="Close modal"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Body */}
        <div className="px-6 py-5 space-y-5">
          {error && (
            <div className="flex items-center gap-2 p-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              <AlertTriangle className="w-4 h-4 shrink-0" />
              <span>{error}</span>
            </div>
          )}

          {token && signUrl ? (
            <>
              {/* QR Code */}
              <div className="flex flex-col items-center gap-2">
                <div className="bg-white border-2 border-gray-100 rounded-xl p-4 inline-block shadow-sm">
                  <QRCodeSVG
                    value={signUrl}
                    size={180}
                    level="M"
                    fgColor="#1a1a1a"
                    bgColor="#ffffff"
                  />
                </div>
                <p className="text-xs text-gray-400 text-center">
                  Client can scan this to open the signing page
                </p>
              </div>

              {/* URL Copy */}
              <div>
                <label className="text-xs font-bold text-luxury-ink/50 uppercase tracking-wider mb-1.5 block">
                  Signing Link
                </label>
                <div className="flex items-center gap-2">
                  <input
                    type="text"
                    readOnly
                    value={signUrl}
                    className="flex-1 min-w-0 text-xs text-gray-600 bg-gray-50 border border-gray-200 rounded-lg px-3 py-2.5 focus:outline-none font-mono truncate"
                    onClick={(e) => (e.target as HTMLInputElement).select()}
                    aria-label="Signing URL"
                  />
                  <button
                    type="button"
                    onClick={handleCopy}
                    className={`shrink-0 flex items-center gap-1.5 px-3 py-2.5 rounded-lg text-sm font-medium transition-all ${
                      copied
                        ? 'bg-green-100 text-green-700 border border-green-200'
                        : 'btn-dark'
                    }`}
                    aria-label={copied ? 'Link copied' : 'Copy link'}
                  >
                    {copied ? (
                      <>
                        <Check className="w-4 h-4" />
                        <span>Copied!</span>
                      </>
                    ) : (
                      <>
                        <Copy className="w-4 h-4" />
                        <span>Copy</span>
                      </>
                    )}
                  </button>
                </div>
              </div>

              {/* Expiry */}
              {expiry && (
                <p className="text-xs text-gray-500 text-center">
                  This link expires on{' '}
                  <span className="font-medium text-gray-700">
                    {formatExpiry(expiry)}
                  </span>
                </p>
              )}

              {/* Revoke Section */}
              <div className="border-t border-gray-100 pt-4">
                {showRevokeConfirm ? (
                  <div className="bg-red-50 border border-red-200 rounded-lg p-4 space-y-3">
                    <div className="flex items-start gap-2">
                      <AlertTriangle className="w-4 h-4 text-red-500 shrink-0 mt-0.5" />
                      <p className="text-sm text-red-700 font-medium">
                        Revoking this link will invalidate it immediately and create a new one.
                        The client will no longer be able to use the previous link.
                      </p>
                    </div>
                    <div className="flex items-center gap-3">
                      <button
                        type="button"
                        onClick={handleRevokeAndRegenerate}
                        disabled={loading}
                        className="flex-1 bg-red-600 text-white text-sm font-medium py-2 rounded-lg hover:bg-red-700 transition-colors disabled:opacity-50"
                      >
                        {loading ? 'Revoking...' : 'Yes, Revoke & Regenerate'}
                      </button>
                      <button
                        type="button"
                        onClick={() => setShowRevokeConfirm(false)}
                        disabled={loading}
                        className="flex-1 border border-gray-300 text-gray-700 text-sm font-medium py-2 rounded-lg hover:bg-gray-50 transition-colors disabled:opacity-50"
                      >
                        Cancel
                      </button>
                    </div>
                  </div>
                ) : (
                  <button
                    type="button"
                    onClick={() => setShowRevokeConfirm(true)}
                    disabled={loading}
                    className="w-full flex items-center justify-center gap-2 py-2 border border-red-300 text-red-600 rounded-lg text-sm font-medium hover:bg-red-50 transition-colors disabled:opacity-50"
                  >
                    <RefreshCw className="w-4 h-4" />
                    Revoke &amp; Regenerate
                  </button>
                )}
              </div>
            </>
          ) : (
            /* No token — show Generate button */
            <div className="text-center py-6 space-y-4">
              <div className="w-16 h-16 bg-gray-50 rounded-full flex items-center justify-center mx-auto">
                <Link className="w-8 h-8 text-gray-300" />
              </div>
              <div>
                <p className="text-gray-700 font-medium mb-1">No link generated yet</p>
                <p className="text-sm text-gray-400">
                  Generate a shareable link to send this agreement to the client.
                  The link will be valid for 7 days.
                </p>
              </div>
              <button
                type="button"
                onClick={handleGenerate}
                disabled={loading}
                className="btn-primary mx-auto"
              >
                {loading ? (
                  <>
                    <RefreshCw className="w-4 h-4 animate-spin" />
                    Generating...
                  </>
                ) : (
                  <>
                    <Link className="w-4 h-4" />
                    Generate Link
                  </>
                )}
              </button>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t border-gray-100 bg-gray-50">
          <button
            type="button"
            onClick={onClose}
            className="btn-dark w-full"
          >
            Done
          </button>
        </div>
      </div>
    </div>
  )
}
