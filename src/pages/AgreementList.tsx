import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router'
import { listAgreements, type AgreementListItem } from '../lib/agreements'

const statusColors: Record<string, string> = {
  draft: 'bg-gray-200 text-gray-700',
  sent: 'bg-blue-100 text-blue-700',
  signed: 'bg-green-100 text-green-700',
  completed: 'bg-luxury-ink text-white',
  viewed: 'bg-yellow-100 text-yellow-700',
  expired: 'bg-red-100 text-red-700',
}

export default function AgreementList() {
  const navigate = useNavigate()
  const [agreements, setAgreements] = useState<AgreementListItem[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    listAgreements()
      .then(setAgreements)
      .catch((err) => setError(err.message))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="p-8 flex items-center justify-center">
        <p className="text-gray-500 text-lg">Loading agreements...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="p-8">
        <p className="text-alert-red">Error loading agreements: {error}</p>
      </div>
    )
  }

  return (
    <div className="p-8 max-w-5xl mx-auto">
      <div className="relative mb-6">
        <h2 className="text-2xl font-bold text-luxury-ink text-center">Agreements</h2>
        <button
          type="button"
          onClick={() => navigate('/admin/agreements/new')}
          className="btn-primary absolute right-0 top-1/2 -translate-y-1/2"
        >
          New Agreement
        </button>
      </div>

      {agreements.length === 0 ? (
        <div className="text-center py-16">
          <p className="text-gray-500 text-lg mb-4">No agreements yet. Create your first one.</p>
          <button
            type="button"
            onClick={() => navigate('/admin/agreements/new')}
            className="btn-primary"
          >
            New Agreement
          </button>
        </div>
      ) : (
        <div className="bg-white rounded-xl card-float border border-luxury-ink/10 overflow-hidden">
          <table className="w-full text-left">
            <thead>
              <tr className="border-b border-luxury-ink/10">
                <th className="px-4 py-3 text-xs font-bold text-luxury-ink/50 uppercase tracking-wider">Agreement #</th>
                <th className="px-4 py-3 text-xs font-bold text-luxury-ink/50 uppercase tracking-wider">Renter Name</th>
                <th className="px-4 py-3 text-xs font-bold text-luxury-ink/50 uppercase tracking-wider">Status</th>
                <th className="px-4 py-3 text-xs font-bold text-luxury-ink/50 uppercase tracking-wider">Created</th>
              </tr>
            </thead>
            <tbody>
              {agreements.map((a) => (
                <tr
                  key={a.id}
                  onClick={() => navigate(`/admin/agreements/${a.id}`)}
                  className="border-b border-luxury-ink/10 hover:bg-luxury-gold/5 cursor-pointer transition-colors"
                >
                  <td className="px-4 py-3 font-medium text-luxury-ink">{a.agreement_number}</td>
                  <td className="px-4 py-3 text-luxury-ink">{a.renter_name || '\u2014'}</td>
                  <td className="px-4 py-3">
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-semibold capitalize ${statusColors[a.status] || 'bg-gray-200 text-gray-700'}`}>
                      {a.status}
                    </span>
                  </td>
                  <td className="px-4 py-3 text-sm text-gray-500">
                    {new Date(a.created_at).toLocaleDateString()}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  )
}
