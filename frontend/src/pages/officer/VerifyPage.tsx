import { useState, useRef, useCallback } from 'react'
import {
  Upload, X, CheckCircle2, Loader2, AlertCircle, FileText, Info,
  ShieldCheck, ShieldAlert, AlertTriangle, XCircle,
} from 'lucide-react'
import { verifyDocument } from '../../api'
import type { VerifyResponse, Flag, Verdict } from '../../types'
import { DOC_TYPES } from '../../types'
import { useTheme } from '../../ThemeContext'

interface Props {
  onResult: (r: VerifyResponse) => void
  lastResult: VerifyResponse | null
}

function FlagRow({ flag }: { flag: Flag }) {
  const { theme } = useTheme()
  const TEXT_SECONDARY = theme.TEXT_SECONDARY
  const TEXT_PRIMARY = theme.TEXT_PRIMARY
  const BORDER = theme.BORDER
  const sevColor: Record<string, string> = {
    RED: theme.CHIP_RED_TEXT,
    AMBER: theme.CHIP_AMBER_TEXT,
    GREEN: theme.CHIP_GREEN_TEXT,
  }
  const sevBg: Record<string, string> = {
    RED: theme.CHIP_RED_BG,
    AMBER: theme.CHIP_AMBER_BG,
    GREEN: theme.CHIP_GREEN_BG,
  }

  return (
    <div
      style={{
        display: 'flex',
        alignItems: 'flex-start',
        gap: 12,
        padding: '10px 14px',
        borderRadius: 8,
        background: sevBg[flag.severity] || 'rgba(255,255,255,0.04)',
        borderLeft: `4px solid ${sevColor[flag.severity] || BORDER}`,
        marginBottom: 8,
      }}
    >
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap', marginBottom: 2 }}>
          <span
            style={{
              fontFamily: 'monospace',
              fontSize: 11,
              fontWeight: 700,
              background: sevColor[flag.severity] + '22',
              color: sevColor[flag.severity],
              padding: '1px 6px',
              borderRadius: 4,
              border: `1px solid ${sevColor[flag.severity]}44`,
            }}
          >
            {flag.code}
          </span>
          <span style={{ fontSize: 11, color: TEXT_SECONDARY, background: 'rgba(255,255,255,0.08)', padding: '1px 6px', borderRadius: 4 }}>
            {flag.category}
          </span>
        </div>
        <p style={{ margin: 0, fontSize: 13, color: TEXT_PRIMARY }}>{flag.detail}</p>
      </div>
    </div>
  )
}

function ResultPanel({ result }: { result: VerifyResponse }) {
  const { theme } = useTheme()
  const TEXT_PRIMARY = theme.TEXT_PRIMARY
  const TEXT_SECONDARY = theme.TEXT_SECONDARY
  const BORDER = theme.BORDER
  const RED = theme.RED
  const AMBER = theme.AMBER
  const GREEN = theme.GREEN
  const CONTENT_BG = theme.CONTENT_BG
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG,
    borderRadius: 12,
    border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW,
    padding: 24,
  }
  const verdictConfig: Record<Verdict, { bg: string; border: string; color: string; label: string; icon: React.ReactNode }> = {
    GENUINE: {
      bg: theme.VERDICT_GREEN_BG,
      border: theme.VERDICT_GREEN_BORDER,
      color: theme.GREEN,
      label: 'GENUINE',
      icon: <ShieldCheck size={28} color={theme.GREEN} />,
    },
    REVIEW: {
      bg: theme.VERDICT_AMBER_BG,
      border: theme.VERDICT_AMBER_BORDER,
      color: theme.AMBER,
      label: 'REVIEW REQUIRED',
      icon: <AlertCircle size={28} color={theme.AMBER} />,
    },
    SUSPICIOUS: {
      bg: theme.VERDICT_ORANGE_BG,
      border: theme.VERDICT_ORANGE_BORDER,
      color: '#ea580c',
      label: 'SUSPICIOUS',
      icon: <AlertTriangle size={28} color="#ea580c" />,
    },
    FORGED: {
      bg: theme.VERDICT_RED_BG,
      border: theme.VERDICT_RED_BORDER,
      color: theme.RED,
      label: 'LIKELY FORGED',
      icon: <XCircle size={28} color={theme.RED} />,
    },
  }

  const cfg = verdictConfig[result.verdict]
  const flags = result.flags || []
  const reds = flags.filter(f => f.severity === 'RED')
  const ambers = flags.filter(f => f.severity === 'AMBER')
  const greens = flags.filter(f => f.severity === 'GREEN')
  const allFlags = [...reds, ...ambers, ...greens]
  const fieldEntries = Object.entries(result.fields).filter(([, v]) => v)

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 20 }}>
      {/* Verdict banner */}
      <div
        style={{
          ...CARD,
          background: cfg.bg,
          border: `2px solid ${cfg.border}`,
          padding: 24,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, marginBottom: 16 }}>
          {cfg.icon}
          <div>
            <div style={{ fontSize: 22, fontWeight: 800, color: cfg.color, letterSpacing: 0.5 }}>
              {cfg.label}
            </div>
            <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>
              Score: <strong style={{ color: cfg.color }}>{result.score}/100</strong>
              {' · '}
              Confidence: <strong>{Math.round(result.confidence * 100)}%</strong>
              {' · '}
              Mode: {result.intake_mode.replace(/_/g, ' ')}
            </div>
          </div>
        </div>
        {/* Flag summary chips */}
        <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
          {reds.length > 0 && (
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: theme.CHIP_RED_BG, color: theme.CHIP_RED_TEXT, borderRadius: 99,
                padding: '3px 12px', fontSize: 12, fontWeight: 600,
                border: `1px solid ${theme.CHIP_RED_BORDER}`,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.RED, display: 'inline-block' }} />
              {reds.length} Critical
            </span>
          )}
          {ambers.length > 0 && (
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: theme.CHIP_AMBER_BG, color: theme.CHIP_AMBER_TEXT, borderRadius: 99,
                padding: '3px 12px', fontSize: 12, fontWeight: 600,
                border: `1px solid ${theme.CHIP_AMBER_BORDER}`,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.AMBER, display: 'inline-block' }} />
              {ambers.length} Warning
            </span>
          )}
          {greens.length > 0 && (
            <span
              style={{
                display: 'flex', alignItems: 'center', gap: 6,
                background: theme.CHIP_GREEN_BG, color: theme.CHIP_GREEN_TEXT, borderRadius: 99,
                padding: '3px 12px', fontSize: 12, fontWeight: 600,
                border: `1px solid ${theme.CHIP_GREEN_BORDER}`,
              }}
            >
              <span style={{ width: 7, height: 7, borderRadius: '50%', background: theme.GREEN, display: 'inline-block' }} />
              {greens.length} Passed
            </span>
          )}
        </div>
        {/* Reasons */}
        {result.reasons.length > 0 && (
          <ul style={{ margin: '16px 0 0', paddingLeft: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 4 }}>
            {result.reasons.map((r, i) => (
              <li key={i} style={{ fontSize: 13, color: TEXT_PRIMARY, display: 'flex', gap: 8 }}>
                <span style={{ color: cfg.color, flexShrink: 0 }}>•</span>
                <span>{r}</span>
              </li>
            ))}
          </ul>
        )}
      </div>

      {/* Forensic Document Image — prominent */}
      {result.heatmap_b64 && (
        <div style={CARD}>
          <h3 style={{ margin: '0 0 4px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
            Forensic Document Analysis
          </h3>
          <p style={{ margin: '0 0 14px', fontSize: 12, color: TEXT_SECONDARY }}>
            Suspicious regions are annotated directly on the document image below.
          </p>
          {/* Legend */}
          <div
            style={{
              display: 'flex',
              gap: 20,
              flexWrap: 'wrap',
              padding: '8px 14px',
              background: CONTENT_BG,
              borderRadius: 8,
              marginBottom: 14,
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: TEXT_SECONDARY }}>
              <div
                style={{
                  width: 22,
                  height: 15,
                  border: '2.5px solid #ef4444',
                  borderRadius: 3,
                  background: 'rgba(239,68,68,0.08)',
                }}
              />
              <span>Critical forgery region</span>
            </div>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, fontSize: 12, color: TEXT_SECONDARY }}>
              <div
                style={{
                  width: 22,
                  height: 15,
                  border: '2.5px solid #f59e0b',
                  borderRadius: 3,
                  background: 'rgba(245,158,11,0.08)',
                }}
              />
              <span>Anomaly / warning region</span>
            </div>
          </div>
          <img
            src={`data:image/jpeg;base64,${result.heatmap_b64}`}
            alt="Annotated forensic document"
            style={{
              width: '100%',
              maxHeight: 600,
              objectFit: 'contain',
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              background: CONTENT_BG,
              display: 'block',
            }}
          />
        </div>
      )}

      {/* Flags */}
      {allFlags.length > 0 && (
        <div style={CARD}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
            Detection Findings ({allFlags.length})
          </h3>
          {allFlags.map((flag, i) => (
            <FlagRow key={i} flag={flag} />
          ))}
        </div>
      )}

      {/* Extracted fields */}
      {fieldEntries.length > 0 && (
        <div style={CARD}>
          <h3 style={{ margin: '0 0 14px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
            Extracted Fields
          </h3>
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fill, minmax(220px, 1fr))',
              gap: 10,
            }}
          >
            {fieldEntries.map(([key, value]) => (
              <div
                key={key}
                style={{
                  background: CONTENT_BG,
                  borderRadius: 8,
                  padding: '10px 14px',
                }}
              >
                <div
                  style={{
                    fontSize: 10,
                    fontWeight: 600,
                    color: TEXT_SECONDARY,
                    textTransform: 'uppercase',
                    letterSpacing: 0.6,
                    marginBottom: 4,
                  }}
                >
                  {key.replace(/_/g, ' ')}
                </div>
                <div
                  style={{
                    fontSize: 13,
                    fontWeight: 600,
                    color: TEXT_PRIMARY,
                    wordBreak: 'break-word',
                    fontFamily:
                      key === 'pan' || key.includes('aadhaar') ? 'monospace' : undefined,
                  }}
                >
                  {key.includes('salary') || key.includes('income') || key.includes('balance')
                    ? `₹${Number(value).toLocaleString('en-IN')}`
                    : value}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}

export default function VerifyPage({ onResult, lastResult }: Props) {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const TEXT_PRIMARY = theme.TEXT_PRIMARY
  const TEXT_SECONDARY = theme.TEXT_SECONDARY
  const BORDER = theme.BORDER
  const BLUE = theme.BLUE
  const RED = theme.RED
  const GREEN = theme.GREEN
  const CONTENT_BG = theme.CONTENT_BG
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG,
    borderRadius: 12,
    border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW,
    padding: 24,
  }

  const [file, setFile] = useState<File | null>(null)
  const [applicantId, setApplicantId] = useState('')
  const [docType, setDocType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const [currentResult, setCurrentResult] = useState<VerifyResponse | null>(lastResult)

  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setError(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const canSubmit = file && applicantId.trim() && docType && !loading

  const submit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const result = await verifyDocument(file, applicantId, docType)
      setCurrentResult(result)
      onResult(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const fileSize = file ? (file.size / 1024).toFixed(0) + ' KB' : ''

  const inputStyle: React.CSSProperties = {
    width: '100%',
    border: `1px solid ${theme.BORDER}`,
    borderRadius: 8,
    padding: '9px 12px',
    fontSize: 13,
    outline: 'none',
    fontFamily: theme.FONT,
    color: theme.TEXT_PRIMARY,
    background: theme.CARD_BG,
    boxSizing: 'border-box',
  }

  return (
    <div style={{ fontFamily: FONT, padding: 24, background: CONTENT_BG, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      <div style={{ maxWidth: 900, margin: '0 auto' }}>
        <div style={{ marginBottom: 24 }}>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: TEXT_PRIMARY }}>
            Verify a Document
          </h1>
          <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY, fontSize: 14 }}>
            Upload a document to run automated forgery detection.
          </p>
        </div>

        {/* Callout */}
        <div
          style={{
            display: 'flex',
            gap: 12,
            alignItems: 'flex-start',
            background: theme.VERDICT_BLUE_BG,
            border: `1px solid ${theme.VERDICT_BLUE_BORDER}`,
            borderRadius: 10,
            padding: '14px 18px',
            marginBottom: 24,
          }}
        >
          <Info size={18} color={BLUE} style={{ flexShrink: 0, marginTop: 1 }} />
          <div style={{ fontSize: 13, color: theme.VERDICT_BLUE_TEXT }}>
            <strong>Checks run regardless of reference library:</strong>{' '}
            Mathematical consistency · IFSC validity · PAN format · Aadhaar Verhoeff checksum · Date validity · Cross-document consistency
          </div>
        </div>

        {/* Upload form */}
        <div style={CARD}>
          {/* Drop zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragOver(true) }}
            onDragLeave={() => setDragOver(false)}
            onDrop={onDrop}
            onClick={() => fileRef.current?.click()}
            style={{
              border: `2px dashed ${dragOver ? BLUE : file ? GREEN : theme.BORDER}`,
              borderRadius: 10,
              padding: '40px 24px',
              textAlign: 'center',
              cursor: 'pointer',
              background: dragOver ? 'rgba(59,130,246,0.1)' : file ? 'rgba(34,197,94,0.1)' : 'rgba(255,255,255,0.03)',
              transition: 'all 0.2s',
              marginBottom: 20,
            }}
          >
            <input
              ref={fileRef}
              type="file"
              accept=".pdf,.jpg,.jpeg,.png,.webp"
              onChange={onFileChange}
              style={{ display: 'none' }}
            />
            {file ? (
              <div>
                <CheckCircle2 size={44} color={GREEN} style={{ marginBottom: 10 }} />
                <div style={{ fontWeight: 600, color: '#86efac', fontSize: 15, marginBottom: 4 }}>
                  {file.name}
                </div>
                <div style={{ fontSize: 12, color: '#86efac', marginBottom: 12 }}>{fileSize}</div>
                <button
                  onClick={e => { e.stopPropagation(); setFile(null) }}
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: 4,
                    background: 'none',
                    border: 'none',
                    color: TEXT_SECONDARY,
                    fontSize: 12,
                    cursor: 'pointer',
                    padding: '2px 6px',
                  }}
                >
                  <X size={13} /> Remove
                </button>
              </div>
            ) : (
              <div>
                <Upload size={40} color="#9ca3af" style={{ marginBottom: 12 }} />
                <div style={{ fontWeight: 600, color: TEXT_PRIMARY, fontSize: 15, marginBottom: 4 }}>
                  Drop document here or click to browse
                </div>
                <div style={{ fontSize: 12, color: TEXT_SECONDARY }}>
                  PDF · JPG · PNG · WebP — up to 20 MB
                </div>
              </div>
            )}
          </div>

          {/* Fields */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 16, marginBottom: 16 }}>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
                Applicant ID <span style={{ color: RED }}>*</span>
              </label>
              <input
                type="text"
                value={applicantId}
                onChange={e => setApplicantId(e.target.value)}
                placeholder="e.g. APP001, CUST-2024-01"
                style={inputStyle}
              />
            </div>
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 6 }}>
                Document Type <span style={{ color: RED }}>*</span>
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                style={{ ...inputStyle, appearance: 'auto' }}
              >
                <option value="">Select document type...</option>
                {DOC_TYPES.map(d => (
                  <option key={d.value} value={d.value}>{d.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Error */}
          {error && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 8,
                background: theme.VERDICT_RED_BG,
                border: `1px solid ${theme.VERDICT_RED_BORDER}`,
                borderRadius: 8,
                padding: '10px 14px',
                marginBottom: 16,
              }}
            >
              <AlertCircle size={16} color={RED} style={{ flexShrink: 0 }} />
              <span style={{ fontSize: 13, color: theme.VERDICT_RED_TEXT }}>{error}</span>
            </div>
          )}

          {/* Submit button */}
          <button
            onClick={submit}
            disabled={!canSubmit}
            style={{
              width: '100%',
              background: canSubmit ? BLUE : '#93c5fd',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '12px 20px',
              fontSize: 15,
              fontWeight: 700,
              cursor: canSubmit ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              gap: 8,
              fontFamily: FONT,
              transition: 'background 0.2s',
            }}
          >
            {loading ? (
              <>
                <Loader2 size={18} style={{ animation: 'spin 1s linear infinite' }} />
                Analysing document...
              </>
            ) : (
              <>
                <FileText size={18} />
                Analyse Document
              </>
            )}
          </button>
        </div>

        {/* Result */}
        {currentResult && (
          <div style={{ marginTop: 28 }}>
            <ResultPanel result={currentResult} />
          </div>
        )}
      </div>
    </div>
  )
}
