import { useState } from 'react'
import {
  ArrowLeft, CheckCircle2, AlertTriangle, XCircle, AlertCircle,
  ChevronDown, ChevronUp, User, Tag, Eye
} from 'lucide-react'
import type { VerifyResponse, Flag, Verdict, Severity, Category } from '../types'

interface Props {
  result: VerifyResponse
  onBack: () => void
  onViewApplicant: (id: string) => void
}

const VERDICT_CONFIG: Record<Verdict, {
  bg: string; border: string; text: string; icon: typeof CheckCircle2; label: string
}> = {
  GENUINE: {
    bg: 'bg-green-50', border: 'border-green-300', text: 'text-green-800',
    icon: CheckCircle2, label: 'GENUINE'
  },
  REVIEW: {
    bg: 'bg-amber-50', border: 'border-amber-300', text: 'text-amber-800',
    icon: AlertCircle, label: 'REVIEW REQUIRED'
  },
  SUSPICIOUS: {
    bg: 'bg-orange-50', border: 'border-orange-300', text: 'text-orange-800',
    icon: AlertTriangle, label: 'SUSPICIOUS'
  },
  FORGED: {
    bg: 'bg-red-50', border: 'border-red-300', text: 'text-red-800',
    icon: XCircle, label: 'LIKELY FORGED'
  },
}

const SEV_STYLE: Record<Severity, string> = {
  RED: 'bg-red-100 text-red-800 border-red-200',
  AMBER: 'bg-amber-100 text-amber-800 border-amber-200',
  GREEN: 'bg-green-100 text-green-800 border-green-200',
}

const SEV_DOT: Record<Severity, string> = {
  RED: 'bg-red-500',
  AMBER: 'bg-amber-500',
  GREEN: 'bg-green-500',
}

const CAT_LABEL: Record<Category, string> = {
  content: 'Content Rules',
  forensic: 'Forensics',
  cross_doc: 'Cross-Doc',
  history: 'History',
}

function ScoreGauge({ score, verdict }: { score: number; verdict: Verdict }) {
  const colors: Record<Verdict, string> = {
    GENUINE: '#16a34a',
    REVIEW: '#d97706',
    SUSPICIOUS: '#ea580c',
    FORGED: '#dc2626',
  }
  const color = colors[verdict]
  const angle = (score / 100) * 180 - 90

  return (
    <div className="flex flex-col items-center">
      <div className="relative w-36 h-20 overflow-hidden">
        <svg viewBox="0 0 120 60" className="w-full h-full">
          {/* Background arc */}
          <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke="#e2e8f0" strokeWidth="8" strokeLinecap="round" />
          {/* Score arc */}
          <path d="M10,60 A50,50 0 0,1 110,60" fill="none" stroke={color}
            strokeWidth="8" strokeLinecap="round"
            strokeDasharray={`${(score / 100) * 157} 157`}
          />
          {/* Needle */}
          <line
            x1="60" y1="60" x2="60" y2="18"
            stroke={color} strokeWidth="2" strokeLinecap="round"
            transform={`rotate(${angle}, 60, 60)`}
          />
          <circle cx="60" cy="60" r="4" fill={color} />
        </svg>
      </div>
      <div className="text-center -mt-2">
        <p className="text-4xl font-bold" style={{ color }}>{Math.round(score)}</p>
        <p className="text-xs text-slate-500 mt-1">Risk Score (0–100)</p>
      </div>
    </div>
  )
}

function FlagItem({ flag }: { flag: Flag }) {
  const [open, setOpen] = useState(false)
  return (
    <div className={`border rounded-lg overflow-hidden ${SEV_STYLE[flag.severity]}`}>
      <button
        onClick={() => setOpen(!open)}
        className="w-full flex items-center gap-3 px-4 py-3 text-left"
      >
        <div className={`w-2 h-2 rounded-full flex-shrink-0 ${SEV_DOT[flag.severity]}`} />
        <div className="flex-1 min-w-0">
          <div className="flex items-center gap-2 flex-wrap">
            <span className="text-xs font-mono font-bold">{flag.code}</span>
            <span className="text-xs opacity-70 border rounded px-1">{CAT_LABEL[flag.category]}</span>
          </div>
        </div>
        <div className="flex-shrink-0">
          {open ? <ChevronUp className="w-4 h-4 opacity-60" /> : <ChevronDown className="w-4 h-4 opacity-60" />}
        </div>
      </button>
      {open && (
        <div className="px-4 pb-3 pt-1 text-sm border-t border-current border-opacity-20 opacity-90">
          {flag.detail}
        </div>
      )}
    </div>
  )
}

export default function ResultView({ result, onBack, onViewApplicant }: Props) {
  const cfg = VERDICT_CONFIG[result.verdict]
  const VIcon = cfg.icon
  const [showHeatmap, setShowHeatmap] = useState(false)

  const reds = result.flags.filter(f => f.severity === 'RED')
  const ambers = result.flags.filter(f => f.severity === 'AMBER')
  const greens = result.flags.filter(f => f.severity === 'GREEN')

  const fieldEntries = Object.entries(result.fields).filter(([, v]) => v)
  const intakeLabel: Record<string, string> = {
    born_digital_pdf: '📄 Born-digital PDF',
    scanned_pdf: '🖨️ Scanned PDF',
    photo: '📸 Photograph',
  }

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Back */}
      <button onClick={onBack} className="flex items-center gap-2 text-slate-500 hover:text-navy-900 transition-colors text-sm">
        <ArrowLeft className="w-4 h-4" /> Back to verify
      </button>

      {/* Verdict card */}
      <div className={`card p-6 border-2 ${cfg.border} ${cfg.bg}`}>
        <div className="flex flex-col sm:flex-row items-center sm:items-start gap-6">
          <ScoreGauge score={result.score} verdict={result.verdict} />

          <div className="flex-1 text-center sm:text-left">
            <div className="flex items-center justify-center sm:justify-start gap-3 mb-2">
              <VIcon className={`w-7 h-7 ${cfg.text}`} />
              <h2 className={`text-2xl font-bold ${cfg.text}`}>{cfg.label}</h2>
            </div>
            <p className="text-sm text-slate-600 mb-4">
              Confidence: <strong>{Math.round(result.confidence * 100)}%</strong>
              {' · '}
              {intakeLabel[result.intake_mode] ?? result.intake_mode}
            </p>

            {/* Summary counts */}
            <div className="flex flex-wrap gap-2 justify-center sm:justify-start">
              {reds.length > 0 && (
                <span className="flex items-center gap-1.5 bg-red-100 text-red-800 border border-red-200 rounded-full px-3 py-1 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-red-500" />
                  {reds.length} Critical
                </span>
              )}
              {ambers.length > 0 && (
                <span className="flex items-center gap-1.5 bg-amber-100 text-amber-800 border border-amber-200 rounded-full px-3 py-1 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-amber-500" />
                  {ambers.length} Warning
                </span>
              )}
              {greens.length > 0 && (
                <span className="flex items-center gap-1.5 bg-green-100 text-green-800 border border-green-200 rounded-full px-3 py-1 text-xs font-semibold">
                  <span className="w-1.5 h-1.5 rounded-full bg-green-500" />
                  {greens.length} Passed
                </span>
              )}
            </div>

            {/* Reasons */}
            {result.reasons.length > 0 && (
              <ul className="mt-4 space-y-1">
                {result.reasons.map((r, i) => (
                  <li key={i} className="text-sm text-slate-700 flex gap-2">
                    <span className="text-slate-400 flex-shrink-0">•</span>
                    <span>{r}</span>
                  </li>
                ))}
              </ul>
            )}
          </div>
        </div>

        {/* Action buttons */}
        <div className="flex flex-wrap gap-3 mt-5 pt-5 border-t border-current border-opacity-20">
          <button
            onClick={() => onViewApplicant(result.fingerprint)}
            className="btn-secondary flex items-center gap-2 text-sm"
          >
            <User className="w-4 h-4" /> View Applicant Profile
          </button>
          <div className="text-xs text-slate-400 flex items-center">
            <Tag className="w-3.5 h-3.5 mr-1" />
            {result.fingerprint}
          </div>
        </div>
      </div>

      {/* Flags */}
      {result.flags.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">
            Detection Findings ({result.flags.length})
          </h3>
          <div className="space-y-2">
            {[...reds, ...ambers, ...greens].map((flag, i) => (
              <FlagItem key={i} flag={flag} />
            ))}
          </div>
        </div>
      )}

      {/* Extracted fields */}
      {fieldEntries.length > 0 && (
        <div className="card p-6">
          <h3 className="font-semibold text-slate-800 mb-4">Extracted Fields</h3>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {fieldEntries.map(([key, value]) => (
              <div key={key} className="bg-slate-50 rounded-lg px-4 py-3">
                <p className="text-xs text-slate-500 font-medium uppercase tracking-wide mb-1">
                  {key.replace(/_/g, ' ')}
                </p>
                <p className="text-sm font-semibold text-slate-800 break-words">
                  {key === 'pan' || key === 'aadhaar_number'
                    ? <span className="font-mono">{value}</span>
                    : key.includes('salary') || key.includes('income') || key.includes('balance')
                      ? `₹${Number(value).toLocaleString('en-IN')}`
                      : value
                  }
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Annotated document image */}
      {result.heatmap_b64 && (
        <div className="card p-6">
          <div className="flex items-center justify-between mb-4">
            <div>
              <h3 className="font-semibold text-slate-800">Forensic Document Analysis</h3>
              <p className="text-xs text-slate-500 mt-0.5">
                Suspicious regions are marked directly on the document
              </p>
            </div>
            <button
              onClick={() => setShowHeatmap(!showHeatmap)}
              className="flex items-center gap-1.5 text-xs text-slate-500 hover:text-slate-800"
            >
              <Eye className="w-3.5 h-3.5" />
              {showHeatmap ? 'Hide' : 'Show'}
              {showHeatmap ? <ChevronUp className="w-3.5 h-3.5" /> : <ChevronDown className="w-3.5 h-3.5" />}
            </button>
          </div>

          {/* Legend */}
          {reds.length + ambers.length > 0 && (
            <div className="flex flex-wrap gap-4 mb-4 p-3 bg-slate-50 rounded-lg">
              {reds.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div style={{ width: 20, height: 14, border: '2.5px solid #ef4444', borderRadius: 3, background: 'rgba(239,68,68,0.08)' }} />
                  <span>Critical forgery region</span>
                </div>
              )}
              {ambers.length > 0 && (
                <div className="flex items-center gap-2 text-xs text-slate-600">
                  <div style={{ width: 20, height: 14, border: '2.5px solid #f59e0b', borderRadius: 3, background: 'rgba(245,158,11,0.08)' }} />
                  <span>Warning / anomaly region</span>
                </div>
              )}
            </div>
          )}

          {/* Auto-show if there are red flags; otherwise toggle */}
          {(showHeatmap || reds.length > 0) && (
            <div className="relative">
              <img
                src={`data:image/jpeg;base64,${result.heatmap_b64}`}
                alt="Annotated document"
                className="w-full rounded-lg border border-slate-200 shadow-sm"
                style={{ maxHeight: 700, objectFit: 'contain', background: '#f8fafc' }}
              />
              {reds.length === 0 && greens.length > 0 && (
                <div style={{
                  position: 'absolute', top: 12, right: 12,
                  background: 'rgba(22,163,74,0.9)', borderRadius: 8,
                  padding: '4px 12px', color: '#fff', fontSize: 12, fontWeight: 600,
                }}>
                  No tampering detected
                </div>
              )}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
