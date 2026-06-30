import { useState, useEffect } from 'react'
import { Clock, RefreshCw, User, ChevronRight, AlertCircle } from 'lucide-react'
import type { Submission, Verdict } from '../types'
import { getHistory } from '../api'

interface Props {
  onViewApplicant: (id: string) => void
}

const VERDICT_BADGE: Record<Verdict, string> = {
  GENUINE: 'badge-genuine',
  REVIEW: 'badge-review',
  SUSPICIOUS: 'badge-suspicious',
  FORGED: 'badge-forged',
}

const DOC_TYPE_LABEL: Record<string, string> = {
  SALARY_SLIP: 'Salary Slip',
  BANK_STATEMENT: 'Bank Statement',
  ITR: 'ITR',
  FORM16: 'Form 16',
  CHEQUE: 'Cheque',
  AADHAAR: 'Aadhaar',
}

const INTAKE_LABEL: Record<string, string> = {
  born_digital_pdf: '📄 Digital',
  scanned_pdf: '🖨️ Scanned',
  photo: '📸 Photo',
}

function timeAgo(ts: string): string {
  const diff = (Date.now() - new Date(ts).getTime()) / 1000
  if (diff < 60) return 'just now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m ago`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h ago`
  return `${Math.floor(diff / 86400)}d ago`
}

export default function HistoryView({ onViewApplicant }: Props) {
  const [submissions, setSubmissions] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  const load = async () => {
    setLoading(true)
    setError(null)
    try {
      setSubmissions(await getHistory())
    } catch {
      setError('Failed to load history')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { load() }, [])

  const byApplicant = submissions.reduce<Record<string, Submission[]>>((acc, s) => {
    ;(acc[s.applicant_id] = acc[s.applicant_id] || []).push(s)
    return acc
  }, {})

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Submission History</h1>
          <p className="text-slate-500 mt-1">{submissions.length} document{submissions.length !== 1 ? 's' : ''} verified</p>
        </div>
        <button onClick={load} className="btn-secondary flex items-center gap-2">
          <RefreshCw className="w-4 h-4" /> Refresh
        </button>
      </div>

      {loading && (
        <div className="card p-12 text-center">
          <RefreshCw className="w-8 h-8 text-slate-400 animate-spin mx-auto" />
          <p className="text-slate-500 mt-3">Loading...</p>
        </div>
      )}

      {error && (
        <div className="bg-red-50 border border-red-200 rounded-xl p-4 flex gap-3">
          <AlertCircle className="w-5 h-5 text-red-500 flex-shrink-0" />
          <p className="text-red-700 text-sm">{error}</p>
        </div>
      )}

      {!loading && !error && submissions.length === 0 && (
        <div className="card p-12 text-center">
          <Clock className="w-12 h-12 text-slate-300 mx-auto" />
          <p className="text-slate-500 mt-4 font-medium">No submissions yet</p>
          <p className="text-slate-400 text-sm mt-1">Verify a document to see it here</p>
        </div>
      )}

      {Object.entries(byApplicant).map(([appId, docs]) => {
        const hasRed = docs.some(d => d.verdict === 'FORGED' || d.verdict === 'SUSPICIOUS')
        return (
          <div key={appId} className="card overflow-hidden">
            {/* Applicant header */}
            <div className={`px-5 py-3 flex items-center justify-between
              ${hasRed ? 'bg-red-50 border-b border-red-100' : 'bg-slate-50 border-b border-slate-100'}`}>
              <div className="flex items-center gap-2">
                <User className={`w-4 h-4 ${hasRed ? 'text-red-500' : 'text-slate-500'}`} />
                <span className="font-semibold text-sm text-slate-800">{appId}</span>
                <span className="text-xs text-slate-400">· {docs.length} doc{docs.length > 1 ? 's' : ''}</span>
              </div>
              <button
                onClick={() => onViewApplicant(appId)}
                className="flex items-center gap-1 text-xs text-blue-600 hover:text-blue-800 font-medium"
              >
                Profile <ChevronRight className="w-3.5 h-3.5" />
              </button>
            </div>

            {/* Doc rows */}
            <div className="divide-y divide-slate-100">
              {docs.map((sub) => (
                <div key={sub.id} className="px-5 py-3.5 flex items-center gap-4">
                  <div className="flex-1 min-w-0">
                    <p className="text-sm font-medium text-slate-800">
                      {DOC_TYPE_LABEL[sub.doc_type] ?? sub.doc_type}
                    </p>
                    <p className="text-xs text-slate-400 mt-0.5">
                      {INTAKE_LABEL[sub.intake_mode] ?? sub.intake_mode}
                      {' · '}
                      {timeAgo(sub.created_at)}
                    </p>
                  </div>

                  {/* Score bar */}
                  <div className="hidden sm:block w-24">
                    <div className="flex items-center gap-2">
                      <div className="flex-1 h-1.5 bg-slate-200 rounded-full overflow-hidden">
                        <div
                          className={`h-full rounded-full ${
                            sub.verdict === 'GENUINE' ? 'bg-green-500' :
                            sub.verdict === 'REVIEW' ? 'bg-amber-500' :
                            sub.verdict === 'SUSPICIOUS' ? 'bg-orange-500' : 'bg-red-500'
                          }`}
                          style={{ width: `${sub.score}%` }}
                        />
                      </div>
                      <span className="text-xs text-slate-500 w-6 text-right">{Math.round(sub.score)}</span>
                    </div>
                  </div>

                  <span className={`text-xs font-bold px-2.5 py-1 rounded-full border ${VERDICT_BADGE[sub.verdict]}`}>
                    {sub.verdict}
                  </span>
                </div>
              ))}
            </div>
          </div>
        )
      })}
    </div>
  )
}
