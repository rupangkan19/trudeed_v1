import { useState } from 'react'
import { Search, Loader2, AlertTriangle, User, AlertCircle, CheckCircle } from 'lucide-react'
import { getApplicant } from '../../api'
import type { ApplicantResponse, ApplicantDoc, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

const DOC_LABEL: Record<string, string> = {
  SALARY_SLIP: 'Salary Slip',
  BANK_STATEMENT: 'Bank Statement',
  ITR: 'ITR',
  FORM16: 'Form 16',
  CHEQUE: 'Cheque',
  AADHAAR: 'Aadhaar',
}

function fmt(dateStr: string) {
  const d = new Date(dateStr)
  return d.toLocaleDateString('en-IN', { day: '2-digit', month: 'short', year: 'numeric' })
}

function VerdictBadge({ verdict }: { verdict: Verdict }) {
  const { theme } = useTheme()
  const verdictColor: Record<Verdict, string> = {
    GENUINE: theme.GREEN,
    REVIEW: theme.AMBER,
    SUSPICIOUS: '#ea580c',
    FORGED: theme.RED,
  }
  const verdictBg: Record<Verdict, string> = {
    GENUINE: theme.VERDICT_GREEN_BG,
    REVIEW: theme.VERDICT_AMBER_BG,
    SUSPICIOUS: theme.VERDICT_ORANGE_BG,
    FORGED: theme.VERDICT_RED_BG,
  }
  return (
    <span
      style={{
        display: 'inline-block',
        padding: '2px 10px',
        borderRadius: 99,
        fontSize: 12,
        fontWeight: 600,
        color: verdictColor[verdict],
        background: verdictBg[verdict],
      }}
    >
      {verdict}
    </span>
  )
}

function ScoreBar({ score, verdict }: { score: number; verdict: Verdict }) {
  const { theme } = useTheme()
  const verdictColor: Record<Verdict, string> = {
    GENUINE: theme.GREEN,
    REVIEW: theme.AMBER,
    SUSPICIOUS: '#ea580c',
    FORGED: theme.RED,
  }
  return (
    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
      <div
        style={{
          width: 80,
          height: 6,
          background: theme.SCORE_TRACK,
          borderRadius: 99,
          overflow: 'hidden',
        }}
      >
        <div
          style={{
            height: '100%',
            width: `${score}%`,
            background: verdictColor[verdict],
            borderRadius: 99,
          }}
        />
      </div>
      <span style={{ fontSize: 12, fontWeight: 600, color: theme.TEXT_SECONDARY }}>{score}</span>
    </div>
  )
}

function CrossDocBanner({ docs }: { docs: ApplicantDoc[] }) {
  const { theme } = useTheme()
  const GREEN = theme.GREEN
  const RED = theme.RED

  const hasCrossDocFlags = docs.some(doc =>
    (doc.flags || []).some(f => f.category === 'cross_doc'),
  )
  const crossDocFlags = docs.flatMap(doc =>
    (doc.flags || []).filter(f => f.category === 'cross_doc'),
  )

  if (!hasCrossDocFlags) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 10,
          background: theme.VERDICT_GREEN_BG,
          border: `1px solid ${theme.VERDICT_GREEN_BORDER}`,
          borderRadius: 8,
          padding: '12px 16px',
          marginBottom: 20,
        }}
      >
        <CheckCircle size={18} color={GREEN} />
        <span style={{ fontSize: 13, color: theme.VERDICT_GREEN_TEXT, fontWeight: 500 }}>
          No cross-document inconsistencies detected across {docs.length} document
          {docs.length !== 1 ? 's' : ''}.
        </span>
      </div>
    )
  }

  return (
    <div
      style={{
        background: theme.VERDICT_RED_BG,
        border: `1px solid ${theme.VERDICT_RED_BORDER}`,
        borderRadius: 8,
        padding: '14px 16px',
        marginBottom: 20,
      }}
    >
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 8 }}>
        <AlertCircle size={18} color={RED} />
        <span style={{ fontSize: 13, fontWeight: 700, color: theme.VERDICT_RED_TEXT }}>
          Cross-Document Inconsistencies Found ({crossDocFlags.length})
        </span>
      </div>
      <ul style={{ margin: 0, paddingLeft: 20, display: 'flex', flexDirection: 'column', gap: 4 }}>
        {crossDocFlags.map((f, i) => (
          <li key={i} style={{ fontSize: 12, color: theme.VERDICT_RED_TEXT }}>
            <strong>{f.code}</strong> — {f.detail}
          </li>
        ))}
      </ul>
    </div>
  )
}

function DocCard({ doc }: { doc: ApplicantDoc }) {
  const { theme } = useTheme()
  const TEXT_PRIMARY = theme.TEXT_PRIMARY
  const TEXT_SECONDARY = theme.TEXT_SECONDARY
  const BORDER = theme.BORDER

  const fieldEntries = Object.entries(doc.fields || {}).filter(([, v]) => v).slice(0, 4)

  return (
    <div
      style={{
        border: `1px solid ${BORDER}`,
        borderRadius: 10,
        overflow: 'hidden',
        marginBottom: 16,
      }}
    >
      <div
        style={{
          padding: '12px 16px',
          background: theme.TABLE_HEADER_BG,
          borderBottom: `1px solid ${BORDER}`,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: 8,
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
          <span style={{ fontWeight: 700, fontSize: 14, color: TEXT_PRIMARY }}>
            {DOC_LABEL[doc.doc_type] || doc.doc_type}
          </span>
          <VerdictBadge verdict={doc.verdict} />
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: 16, fontSize: 12, color: TEXT_SECONDARY }}>
          <ScoreBar score={doc.score} verdict={doc.verdict} />
          <span>{fmt(doc.created_at)}</span>
        </div>
      </div>
      {fieldEntries.length > 0 && (
        <div
          style={{
            padding: '12px 16px',
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fill, minmax(180px, 1fr))',
            gap: 10,
          }}
        >
          {fieldEntries.map(([key, value]) => (
            <div key={key}>
              <div
                style={{
                  fontSize: 10,
                  fontWeight: 600,
                  color: TEXT_SECONDARY,
                  textTransform: 'uppercase',
                  letterSpacing: 0.5,
                  marginBottom: 2,
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
                  fontFamily: key === 'pan' || key.includes('aadhaar') ? 'monospace' : undefined,
                }}
              >
                {value}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ApplicantLookup() {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const TEXT_PRIMARY = theme.TEXT_PRIMARY
  const TEXT_SECONDARY = theme.TEXT_SECONDARY
  const BORDER = theme.BORDER
  const BLUE = theme.BLUE
  const RED = theme.RED
  const CONTENT_BG = theme.CONTENT_BG
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG,
    borderRadius: 12,
    border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW,
    padding: 24,
  }

  const [query, setQuery] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [data, setData] = useState<ApplicantResponse | null>(null)

  const handleLookup = async () => {
    const id = query.trim()
    if (!id) return
    setLoading(true)
    setError(null)
    setData(null)
    try {
      const result = await getApplicant(id)
      setData(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Lookup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === 'Enter') handleLookup()
  }

  return (
    <div style={{ fontFamily: FONT, padding: 24, background: CONTENT_BG, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: TEXT_PRIMARY }}>
          Applicant Lookup
        </h1>
        <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY, fontSize: 14 }}>
          Search for all documents submitted under an applicant ID.
        </p>
      </div>

      {/* Search */}
      <div style={CARD}>
        <label style={{ display: 'block', fontSize: 13, fontWeight: 600, color: TEXT_PRIMARY, marginBottom: 8 }}>
          Applicant ID
        </label>
        <div style={{ display: 'flex', gap: 10 }}>
          <input
            type="text"
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="e.g. APP001, CUST-2024-01"
            style={{
              flex: 1,
              border: `1px solid ${BORDER}`,
              borderRadius: 8,
              padding: '9px 12px',
              fontSize: 13,
              outline: 'none',
              fontFamily: FONT,
              color: TEXT_PRIMARY,
              background: theme.CARD_BG,
            }}
          />
          <button
            onClick={handleLookup}
            disabled={!query.trim() || loading}
            style={{
              background: query.trim() && !loading ? BLUE : '#93c5fd',
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              padding: '9px 20px',
              fontWeight: 700,
              fontSize: 13,
              cursor: query.trim() && !loading ? 'pointer' : 'not-allowed',
              display: 'flex',
              alignItems: 'center',
              gap: 6,
              fontFamily: FONT,
              whiteSpace: 'nowrap',
            }}
          >
            {loading ? (
              <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />
            ) : (
              <Search size={16} />
            )}
            {loading ? 'Looking up...' : 'Lookup'}
          </button>
        </div>
      </div>

      {/* Error */}
      {error && (
        <div
          style={{
            ...CARD,
            marginTop: 16,
            display: 'flex',
            alignItems: 'center',
            gap: 10,
            background: theme.VERDICT_RED_BG,
            border: `1px solid ${theme.VERDICT_RED_BORDER}`,
            padding: '14px 18px',
          }}
        >
          <AlertTriangle size={18} color={RED} />
          <span style={{ fontSize: 13, color: theme.VERDICT_RED_TEXT }}>{error}</span>
        </div>
      )}

      {/* Results */}
      {data && (
        <div style={{ marginTop: 20 }}>
          {/* Header */}
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 14 }}>
              <div
                style={{
                  width: 48,
                  height: 48,
                  borderRadius: '50%',
                  background: BLUE + '18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={22} color={BLUE} />
              </div>
              <div>
                <div style={{ fontSize: 18, fontWeight: 700, color: TEXT_PRIMARY, fontFamily: 'monospace' }}>
                  {data.applicant_id}
                </div>
                <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginTop: 2 }}>
                  {data.documents.length} document{data.documents.length !== 1 ? 's' : ''} on record
                </div>
              </div>
            </div>
          </div>

          {data.documents.length === 0 ? (
            <div
              style={{
                ...CARD,
                textAlign: 'center',
                padding: 48,
                color: TEXT_SECONDARY,
                fontSize: 14,
              }}
            >
              No documents found for this applicant.
            </div>
          ) : (
            <div style={CARD}>
              <CrossDocBanner docs={data.documents} />
              <h2 style={{ margin: '0 0 16px', fontSize: 15, fontWeight: 700, color: TEXT_PRIMARY }}>
                Document History
              </h2>
              {data.documents.map((doc, i) => (
                <DocCard key={i} doc={doc} />
              ))}
            </div>
          )}
        </div>
      )}

      {/* Empty initial state */}
      {!data && !error && !loading && (
        <div
          style={{
            ...CARD,
            marginTop: 16,
            textAlign: 'center',
            padding: '48px 24px',
            color: TEXT_SECONDARY,
          }}
        >
          <Search size={36} color="#475569" style={{ marginBottom: 12 }} />
          <div style={{ fontSize: 15, fontWeight: 500, color: '#94a3b8', marginBottom: 4 }}>
            Enter an applicant ID to search
          </div>
          <div style={{ fontSize: 13 }}>
            All documents associated with that ID will be shown here.
          </div>
        </div>
      )}
    </div>
  )
}
