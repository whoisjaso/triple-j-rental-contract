import { Navigate, Outlet } from 'react-router'
import { useAuth } from '../lib/auth'

export default function AdminLayout() {
  const { user, loading, signOut } = useAuth()

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading...</p>
      </div>
    )
  }

  if (!user) {
    return <Navigate to="/login" replace />
  }

  return (
    <div className="min-h-screen bg-luxury-bg">
      <nav className="bg-white border-b border-luxury-ink/10 px-6 py-3 flex items-center justify-between">
        <span className="text-lg font-bold text-luxury-ink tracking-wide">
          Triple J Auto
        </span>
        <button
          type="button"
          onClick={() => signOut()}
          className="text-sm text-gray-600 hover:text-alert-red transition-colors font-medium"
        >
          Sign Out
        </button>
      </nav>
      <Outlet />
    </div>
  )
}
