import { useState, type FormEvent } from 'react'
import { Navigate } from 'react-router'
import { useAuth } from '../lib/auth'

export default function AdminLogin() {
  const { signIn, user } = useAuth()
  const [email, setEmail] = useState('')
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')
  const [isSubmitting, setIsSubmitting] = useState(false)

  if (user) {
    return <Navigate to="/admin" replace />
  }

  async function handleSubmit(e: FormEvent) {
    e.preventDefault()
    setError('')
    setIsSubmitting(true)

    try {
      await signIn(email, password)
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Login failed. Please try again.')
    } finally {
      setIsSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen bg-luxury-bg flex items-center justify-center px-4">
      <div className="w-full max-w-md">
        <div className="bg-white rounded-lg shadow-lg border-t-4 border-luxury-gold p-8">
          <div className="text-center mb-8">
            <h1 className="text-xl font-bold text-luxury-ink tracking-wide">
              Triple J Auto Investment LLC
            </h1>
            <h2 className="text-2xl font-bold text-luxury-ink mt-4">
              Admin Login
            </h2>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            <div>
              <label htmlFor="email" className="block text-sm font-medium text-luxury-ink mb-1">
                Email
              </label>
              <input
                id="email"
                type="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                placeholder="admin@triplejautoinvestment.com"
                disabled={isSubmitting}
              />
            </div>

            <div>
              <label htmlFor="password" className="block text-sm font-medium text-luxury-ink mb-1">
                Password
              </label>
              <input
                id="password"
                type="password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-luxury-gold focus:border-luxury-gold"
                placeholder="Enter your password"
                disabled={isSubmitting}
              />
            </div>

            {error && (
              <p className="text-alert-red text-sm font-medium">{error}</p>
            )}

            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-luxury-ink text-white py-2.5 rounded-md font-bold hover:opacity-90 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? 'Signing in...' : 'Sign In'}
            </button>
          </form>
        </div>
      </div>
    </div>
  )
}
