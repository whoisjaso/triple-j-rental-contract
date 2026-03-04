export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col items-center justify-center px-6 py-12">
      <div className="text-center mb-8">
        <img src="/logo-crest.png" alt="Triple J" className="h-[80px] w-auto mb-4" />
        <p className="text-sm font-semibold text-gray-500 mt-1">Triple J Auto Investment LLC</p>
      </div>

      <div className="bg-white rounded-2xl card-float border border-luxury-ink/10 w-full max-w-sm px-8 py-8 text-center space-y-5 animate-fadeInUp">
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg className="w-7 h-7 text-red-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z" />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-luxury-ink mb-2">This Agreement Link Has Expired</h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            This link is no longer valid. Please contact Triple J Auto Investment LLC for a new link.
          </p>
        </div>

        <div className="border-t border-gray-100 pt-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">Contact Us</p>
          <a href="tel:+18324005294" className="flex items-center justify-center gap-2 text-luxury-gold font-semibold hover:opacity-75 transition-opacity">
            (832) 400-5294
          </a>
          <address className="not-italic text-sm text-gray-500 leading-snug">
            8774 Almeda Genoa Road, Houston, TX 77075
          </address>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center max-w-xs leading-relaxed">
        If you believe this is an error, please reach out to us and we will send you a fresh agreement link.
      </p>
    </div>
  )
}
