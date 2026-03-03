export default function ExpiredPage() {
  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col items-center justify-center px-6 py-12">
      {/* Brand Header */}
      <div className="text-center mb-8">
        <img src="/logo-crest.png" alt="JJAI" className="h-[80px] w-auto mb-4" />
        <p className="text-sm font-semibold text-gray-500 mt-1">
          Triple J Auto Investment LLC
        </p>
      </div>

      {/* Card */}
      <div className="bg-white rounded-2xl shadow-sm border border-luxury-ink/10 w-full max-w-sm px-8 py-8 text-center space-y-5">
        {/* Icon */}
        <div className="w-14 h-14 rounded-full bg-red-50 flex items-center justify-center mx-auto">
          <svg
            className="w-7 h-7 text-red-400"
            fill="none"
            stroke="currentColor"
            strokeWidth={1.5}
            viewBox="0 0 24 24"
            aria-hidden="true"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              d="M12 9v3.75m-9.303 3.376c-.866 1.5.217 3.374 1.948 3.374h14.71c1.73 0 2.813-1.874 1.948-3.374L13.949 3.378c-.866-1.5-3.032-1.5-3.898 0L2.697 16.126zM12 15.75h.007v.008H12v-.008z"
            />
          </svg>
        </div>

        <div>
          <h1 className="text-xl font-bold text-luxury-ink mb-2">
            This Agreement Link Has Expired
          </h1>
          <p className="text-sm text-gray-500 leading-relaxed">
            This link is no longer valid. Please contact Triple J Auto Investment LLC
            for a new link.
          </p>
        </div>

        {/* Contact */}
        <div className="border-t border-gray-100 pt-5 space-y-3">
          <p className="text-xs font-bold text-gray-400 uppercase tracking-wider">
            Contact Us
          </p>
          <a
            href="tel:+18324005294"
            className="flex items-center justify-center gap-2 text-luxury-gold font-semibold hover:opacity-75 transition-opacity"
          >
            <svg className="w-4 h-4 shrink-0" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M2.25 6.75c0 8.284 6.716 15 15 15h2.25a2.25 2.25 0 002.25-2.25v-1.372c0-.516-.351-.966-.852-1.091l-4.423-1.106c-.44-.11-.902.055-1.173.417l-.97 1.293c-.282.376-.769.542-1.21.38a12.035 12.035 0 01-7.143-7.143c-.162-.441.004-.928.38-1.21l1.293-.97c.363-.271.527-.734.417-1.173L6.963 3.102a1.125 1.125 0 00-1.091-.852H4.5A2.25 2.25 0 002.25 4.5v2.25z" />
            </svg>
            +1 (832) 400-5294
          </a>
          <address className="not-italic text-sm text-gray-500 leading-snug flex items-start justify-center gap-2">
            <svg className="w-4 h-4 shrink-0 mt-0.5 text-gray-400" fill="none" stroke="currentColor" strokeWidth={1.5} viewBox="0 0 24 24" aria-hidden="true">
              <path strokeLinecap="round" strokeLinejoin="round" d="M15 10.5a3 3 0 11-6 0 3 3 0 016 0z" />
              <path strokeLinecap="round" strokeLinejoin="round" d="M19.5 10.5c0 7.142-7.5 11.25-7.5 11.25S4.5 17.642 4.5 10.5a7.5 7.5 0 1115 0z" />
            </svg>
            <span className="text-left">
              8774 Almeda Genoa Road<br />
              Houston, TX 77075
            </span>
          </address>
        </div>
      </div>

      <p className="mt-6 text-xs text-gray-400 text-center max-w-xs leading-relaxed">
        If you believe this is an error, please reach out to us and we will send you
        a fresh agreement link.
      </p>
    </div>
  )
}
