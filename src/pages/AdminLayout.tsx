import { Outlet } from 'react-router'

export default function AdminLayout() {
  return (
    <div className="min-h-screen bg-luxury-bg">
      <nav className="bg-white border-b border-luxury-ink/10 px-6 py-3 flex items-center gap-3">
        <img
          src="/logo-crest.png"
          alt="JJAI"
          className="h-[60px] w-auto"
        />
        <span className="text-lg font-bold text-luxury-ink tracking-wide">
          Triple J Auto Investment
        </span>
      </nav>
      <Outlet />
    </div>
  )
}
