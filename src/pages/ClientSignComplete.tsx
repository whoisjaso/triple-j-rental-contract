import { CircleCheck } from 'lucide-react'
import { useParams } from 'react-router'

export default function ClientSignComplete() {
  const { token } = useParams<{ token: string }>()
  // token available for future reference (e.g., fetching agreement number)
  void token

  return (
    <div className="min-h-screen bg-luxury-bg flex flex-col">
      {/* Branded header */}
      <header className="bg-white border-b border-luxury-ink/10 px-6 py-4 text-center card-float">
        <img src="/logo-crest.png" alt="JJAI" className="h-[48px] w-auto mx-auto block" />
        <div className="text-sm font-semibold text-luxury-ink mt-0.5">Triple J Auto Investment LLC</div>
      </header>

      {/* Main content */}
      <div className="flex-1 flex flex-col items-center justify-center px-6 py-12">
        <div className="bg-white rounded-2xl card-float border border-luxury-ink/10 max-w-sm w-full px-8 py-10 flex flex-col items-center text-center animate-fadeInUp">

          {/* Brand mark */}
          <div className="mb-6 animate-fadeInUp">
            <img src="/logo-crest.png" alt="JJAI" className="h-[80px] w-auto" />
            <div className="text-xs font-semibold text-luxury-ink mt-1 tracking-wide">
              Triple J Auto Investment LLC
            </div>
          </div>

          {/* Success icon */}
          <CircleCheck
            className="mb-5 text-luxury-gold animate-scaleIn"
            size={64}
            strokeWidth={1.5}
          />

          {/* Heading */}
          <h1 className="text-2xl font-bold text-luxury-ink mb-3">
            Agreement Signed Successfully
          </h1>

          {/* Subtext */}
          <p className="text-gray-600 text-sm leading-relaxed mb-6">
            Thank you! A copy of your signed agreement will be emailed to you shortly.
          </p>

          {/* Divider */}
          <div className="w-full border-t border-gray-100 my-2" />

          {/* Contact section */}
          <div className="mt-4 text-center">
            <p className="text-xs text-gray-400 mb-1">Questions? Contact us at</p>
            <a
              href="tel:+18324005294"
              className="text-luxury-gold font-semibold text-sm hover:underline"
            >
              (832) 400-5294
            </a>
          </div>

        </div>
      </div>

      {/* Footer */}
      <footer className="pb-8 text-center text-xs text-gray-400">
        &copy; {new Date().getFullYear()} Triple J Auto Investment LLC &bull; 8774 Almeda Genoa Road, Houston, TX 77075
      </footer>
    </div>
  )
}
