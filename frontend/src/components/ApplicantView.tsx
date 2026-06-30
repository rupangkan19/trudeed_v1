import { useState, useEffect } from 'react'
import { Search, ArrowLeft, AlertTriangle, CheckCircle2, User, FileText } from 'lucide-react'
import type { ApplicantResponse, Verdict, Flag, Severity } from '../types'
import { getApplicant } from '../api'

interface Props {
  initialId?: string
  onBack: () => void
}

const VERDICT_CONFIG: Record<Verdict, { bg: string; text: string; label: string }> = {
  GENUINE: { bg: 'bg-green-100', text: 'text-green-800', label: 'GENUINE' },
  REVIEW: { bg: 'bg-amber-100', text: 'text-amber-800', label: 'REVIEW' },
  SUSPICIOUS: { bg: 'bg-orange-100', text: 'text-orange-800', label: 'SUSPICIOUS' },
  FORGED: { bg: 'bg-red-100', text: 'text-red-800', label: 'FORGED' },
}

const SEV_STYLE: Record<Severity, string> = {
  RED: 'text-red-700 bg-red-50 border-red-200',
  AMBER: 'text-amber-700 bg-amber-50 border-amber-200',
  GREEN: 'text-green-700 bg-green-50 border-green-200',
}

const DOC_LABEL: Record<string, string> = {
  SALARY_SLIP: 'Salary Slip',
  BANK_STATEMENT: 'Bank Statement',
  ITR: 'ITR',
  FORM16: 'Form 16',
  CHEQUE: 'Cheque',
  AADHAAR: 'Aadhaar',
}

export default function ApplicantView({ initialId, onBack }: Props) {
  const [searchId, setSearchId] = useState(initialId ?? '')
  const [data, setData] = useState<ApplicantResponse | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)

  const lookup = async (id: string) => {
    if (!id.trim()) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      setData(await getApplicant(id.trim()))
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Not found')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (initialId) lookup(initialId)
  }, [initialId])

  const overallVerdict = data?.documents.reduce<Verdict>((worst, doc) => {
    const order: Verdict[] = ['GENUINE', 'REVIEW', 'SUSPICIOUS', 'FORGED']
    return order.indexOf(doc.verdict) > order.indexOf(worst) ? doc.verdict : worst
  }, 'GENUINE')

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      <div className="flex items-center gap-3">
        <button onClick={onBack} className="text-slate-400 hover:text-slate-700 transition-colors">
          <ArrowLeft className="w-5 h-5" />
        </button>
        <div>
          <h1 className="text-2xl font-bold text-navy-900">Applicant Profile</h1>
          <p className="text-slate-500 text-sm mt-0.5">Cross-document analysis for a single applicant</p>
        </div>
      </div>

      {/* Search */}
      <div className="card p-5">
        <label className="block text-sm font-semibold text-slate-700 mb-2">Applicant ID</label>
        <div className="flex gap-3">
          <input
            type="text"
            value={searchId}
            onChange={(e) => setSearchId(e.target.value)}
            onKeyDown={(e) => e.key === 'Enter' && lookup(searchId)}
            placeholder="Enter applicant ID..."
            className="flex-1 border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                       focus:outline-none focus:ring-2 focus:ring-blue-500"
          />
          <button
            onClick={() => lookup(searchId)}
            disabled={!searchId.trim() || loading}
            className="btn-primary flex items-center gap-2"
          >
            <Search className="w-4 h-4" />
            {loading ? 'Loading...' : 'Look up'}
          </button>
        </div>
        {error && (
          <p className="text-sm text-red-600 mt-2">{error}</p>
        )}
      </div>

      {data && (
        <>
          {/* Overall status */}
          <div className={`card p-5 flex items-center gap-4 border-l-4 ${
            overallVerdict === 'GENUINE' ? 'border-green-500' :
            overallVerdict === 'REVIEW' ? 'border-amber-500' :
            overallVerdict === 'SUSPICIOUS' ? 'border-orange-500' : 'border-red-500'
          }`}>
            <User className="w-10 h-10 text-slate-400 flex-shrink-0" />
            <div>
              <p className="text-xs text-slate-500 uppercase tracking-wide font-medium">Applicant</p>
              <p className="text-xl font-bold text-slate-800">{data.applicant_id}</p>
              <p className="text-sm text-slate-500 mt-0.5">
                {data.documents.length} document{data.documents.length !== 1 ? 's' : ''} submitted
                {' · '}
                <span className={`font-semibold ${
                  overallVerdict === 'GENUINE' ? 'text-green-700' :
                  overallVerdict === 'REVIEW' ? 'text-amber-700' :
                  overallVerdict === 'SUSPICIOUS' ? 'text-orange-700' : 'text-red-700'
                }`}>
                  {overallVerdict === 'GENUINE' ? 'All documents pass' :
                   overallVerdict === 'REVIEW' ? 'Manual review recommended' :
                   overallVerdict === 'SUSPICIOUS' ? 'Anomalies detected' : 'Forgery detected'}
                </span>
              </p>
            </div>
          </div>

          {/* Documents */}
          <div className="space-y-4">
            <h2 className="font-semibold text-slate-700">Submitted Documents</h2>
            {data.documents.map((doc, i) => {
              const vc = VERDICT_CONFIG[doc.verdict]
              const redFlags = doc.flags?.filter((f: Flag) => f.severity === 'RED') ?? []
              const fieldEntries = Object.entries(doc.fields ?? {}).filter(([, v]) => v).slice(0, 6)

              return (
                <div key={i} className="card p-5 space-y-4">
                  <div className="flex items-start justify-between">
                    <div className="flex items-center gap-3">
                      <div className="w-9 h-9 bg-navy-100 rounded-lg flex items-center justify-center">
                        <FileText className="w-5 h-5 text-navy-900" />
                      </div>
                      <div>
                        <p className="font-semibold text-slate-800">
                          {DOC_LABEL[doc.doc_type] ?? doc.doc_type}
                        </p>
                        <p className="text-xs text-slate-400">
                          {new Date(doc.created_at).toLocaleDateString('en-IN', {
                            day: '2-digit', month: 'short', year: 'numeric'
                          })}
                        </p>
                      </div>
                    </div>
                    <span className={`text-xs font-bold px-3 py-1 rounded-full ${vc.bg} ${vc.text}`}>
                      {vc.label}
                    </span>
                  </div>

                  {/* Score bar */}
                  <div className="flex items-center gap-3">
                    <div className="flex-1 h-2 bg-slate-100 rounded-full overflow-hidden">
                      <div
                        className={`h-full rounded-full transition-all ${
                          doc.verdict === 'GENUINE' ? 'bg-green-500' :
                          doc.verdict === 'REVIEW' ? 'bg-amber-500' :
                          doc.verdict === 'SUSPICIOUS' ? 'bg-orange-500' : 'bg-red-500'
                        }`}
                        style={{ width: `${doc.score}%` }}
                      />
                    </div>
                    <span className="text-sm font-mono text-slate-500 w-12 text-right">
                      {Math.round(doc.score)}/100
                    </span>
                  </div>

                  {/* Red flags */}
                  {redFlags.map((f: Flag, j: number) => (
                    <div key={j} className={`text-xs border rounded-lg px-3 py-2 ${SEV_STYLE[f.severity]}`}>
                      <span className="font-mono font-bold">{f.code}:</span> {f.detail}
                    </div>
                  ))}

                  {/* Fields */}
                  {fieldEntries.length > 0 && (
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-2">
                      {fieldEntries.map(([key, value]) => (
                        <div key={key} className="bg-slate-50 rounded p-2">
                          <p className="text-xs text-slate-400 uppercase tracking-wide">
                            {key.replace(/_/g, ' ')}
                          </p>
                          <p className="text-xs font-semibold text-slate-700 truncate mt-0.5">
                            {key.includes('income') || key.includes('salary') || key.includes('balance')
                              ? `₹${Number(value).toLocaleString('en-IN')}`
                              : value}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              )
            })}
          </div>

          {/* Cross-doc summary */}
          <div className="card p-5">
            <h3 className="font-semibold text-slate-700 mb-3">Cross-Document Summary</h3>
            {data.documents.every(d => d.verdict === 'GENUINE') ? (
              <div className="flex items-center gap-3 text-green-700 bg-green-50 rounded-lg p-3">
                <CheckCircle2 className="w-5 h-5 flex-shrink-0" />
                <p className="text-sm">All documents are consistent with each other. No cross-document contradictions detected.</p>
              </div>
            ) : (
              <div className="flex items-start gap-3 text-orange-700 bg-orange-50 rounded-lg p-3">
                <AlertTriangle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                <div className="text-sm">
                  <p className="font-semibold">Anomalies detected across documents</p>
                  <p className="mt-1 text-orange-600">
                    Review the individual document findings above. Cross-document inconsistencies
                    in income, name, or PAN fields indicate potential fraud.
                  </p>
                </div>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
