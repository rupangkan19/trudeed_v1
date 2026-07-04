import { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, FileText } from 'lucide-react'
import { getHistory } from '../../api'
import type { Submission, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

interface Props {
  filter?: 'today' | 'week' | 'all'
  userName?: string
}

const DOC_LABEL: Record<string, string> = {
  SALARY_SLIP: 'Salary Slip',
  BANK_STATEMENT: 'Bank Statement',
  ITR: 'ITR',
  FORM16: 'Form 16',
  CHEQUE: 'Cheque',
  AADHAAR: 'Aadhaar',
}

type TabFilter = 'today' | 'week' | 'all'

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
}

function isThisWeek(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  const weekAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000)
  return d >= weekAgo
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

const TABS: { key: TabFilter; label: string }[] = [
  { key: 'today', label: 'Today' },
  { key: 'week', label: 'This Week' },
  { key: 'all', label: 'All History' },
]

export default function MySubmissions({ filter: propFilter, userName }: Props) {
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

  const [history, setHistory] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<TabFilter>(propFilter ?? 'all')

  useEffect(() => {
    getHistory(userName)
      .then(data => {
        const sorted = [...data].sort(
          (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime(),
        )
        setHistory(sorted)
      })
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [userName])

  const filtered = history.filter(s => {
    if (activeTab === 'today') return isToday(s.created_at)
    if (activeTab === 'week') return isThisWeek(s.created_at)
    return true
  })

  if (loading) {
    return (
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          height: 300,
          gap: 12,
          fontFamily: FONT,
        }}
      >
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
        <Loader2 size={28} color={BLUE} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: TEXT_SECONDARY, fontSize: 14 }}>Loading submissions...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...CARD, color: RED, textAlign: 'center', padding: 40, fontFamily: FONT }}>
        <AlertTriangle size={32} style={{ marginBottom: 8 }} />
        <div>Failed to load submissions: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: FONT, padding: 24, background: CONTENT_BG, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      <div style={{ marginBottom: 24 }}>
        <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: TEXT_PRIMARY }}>
          My Submissions
        </h1>
        <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY, fontSize: 14 }}>
          View and filter your document verification history.
        </p>
      </div>

      <div style={CARD}>
        {/* Filter tabs */}
        <div
          style={{
            display: 'flex',
            gap: 4,
            marginBottom: 20,
            background: CONTENT_BG,
            padding: 4,
            borderRadius: 8,
            width: 'fit-content',
          }}
        >
          {TABS.map(tab => (
            <button
              key={tab.key}
              onClick={() => setActiveTab(tab.key)}
              style={{
                padding: '6px 16px',
                borderRadius: 6,
                border: 'none',
                fontSize: 13,
                fontWeight: 500,
                cursor: 'pointer',
                background: activeTab === tab.key ? theme.CARD_HOVER : 'transparent',
                color: activeTab === tab.key ? TEXT_PRIMARY : TEXT_SECONDARY,
                boxShadow: activeTab === tab.key ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
                fontFamily: FONT,
                transition: 'all 0.15s',
              }}
            >
              {tab.label}
            </button>
          ))}
        </div>

        {/* Count info */}
        <div style={{ fontSize: 13, color: TEXT_SECONDARY, marginBottom: 16 }}>
          Showing <strong style={{ color: TEXT_PRIMARY }}>{filtered.length}</strong> submission
          {filtered.length !== 1 ? 's' : ''}
        </div>

        {/* Table */}
        {filtered.length === 0 ? (
          <div
            style={{
              textAlign: 'center',
              padding: '48px 24px',
              color: TEXT_SECONDARY,
              display: 'flex',
              flexDirection: 'column',
              alignItems: 'center',
              gap: 12,
            }}
          >
            <FileText size={36} color="#d1d5db" />
            <div style={{ fontSize: 15, fontWeight: 500, color: '#94a3b8' }}>
              No submissions found
            </div>
            <div style={{ fontSize: 13 }}>
              {activeTab === 'today'
                ? 'No documents verified today.'
                : activeTab === 'week'
                ? 'No documents verified this week.'
                : 'No documents verified yet.'}
            </div>
          </div>
        ) : (
          <div style={{ overflowX: 'auto' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr style={{ background: theme.TABLE_HEADER_BG }}>
                  {['Date', 'Applicant ID', 'Doc Type', 'Verdict', 'Score', '# Flags'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '10px 14px',
                        borderBottom: `1px solid ${BORDER}`,
                        color: TEXT_SECONDARY,
                        fontWeight: 600,
                        fontSize: 12,
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {filtered.map(sub => (
                  <tr
                    key={sub.id}
                    style={{
                      borderBottom: `1px solid ${BORDER}`,
                      transition: 'background 0.1s',
                    }}
                    onMouseEnter={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = theme.TABLE_ROW_HOVER
                    }}
                    onMouseLeave={e => {
                      (e.currentTarget as HTMLTableRowElement).style.background = ''
                    }}
                  >
                    <td style={{ padding: '10px 14px', color: TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                      {fmt(sub.created_at)}
                    </td>
                    <td style={{ padding: '10px 14px', fontFamily: 'monospace', fontSize: 12 }}>
                      {sub.applicant_id}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      {DOC_LABEL[sub.doc_type] || sub.doc_type}
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <VerdictBadge verdict={sub.verdict} />
                    </td>
                    <td style={{ padding: '10px 14px' }}>
                      <ScoreBar score={sub.score} verdict={sub.verdict} />
                    </td>
                    <td style={{ padding: '10px 14px', textAlign: 'center', fontWeight: 600, color: TEXT_SECONDARY }}>
                      —
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  )
}
