import React, { useEffect, useState } from 'react'
import { Loader2, FileText, AlertTriangle, CheckCircle, ShieldAlert } from 'lucide-react'
import { getHistory } from '../../api'
import type { Submission, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

interface Props {
  userName: string
}

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

export default function AdminDashboard({ userName }: Props) {
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

  useEffect(() => {
    getHistory()
      .then(setHistory)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const hour = new Date().getHours()
  const greeting =
    hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const total = history.length
  const genuine = history.filter(s => s.verdict === 'GENUINE').length
  const flagged = history.filter(s => s.verdict === 'FORGED' || s.verdict === 'SUSPICIOUS').length
  const fraudRaw = history.filter(
    s => s.verdict === 'FORGED' || s.verdict === 'SUSPICIOUS' || s.verdict === 'REVIEW',
  ).length
  const fraudRate = total > 0 ? ((fraudRaw / total) * 100).toFixed(1) : '0.0'

  const verdictCounts: Record<Verdict, number> = {
    GENUINE: history.filter(s => s.verdict === 'GENUINE').length,
    REVIEW: history.filter(s => s.verdict === 'REVIEW').length,
    SUSPICIOUS: history.filter(s => s.verdict === 'SUSPICIOUS').length,
    FORGED: history.filter(s => s.verdict === 'FORGED').length,
  }

  const recent = [...history]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 5)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300 }}>
        <Loader2 size={32} color={theme.BLUE} style={{ animation: 'spin 1s linear infinite' }} />
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...CARD, color: theme.RED, textAlign: 'center', padding: 40 }}>
        <AlertTriangle size={32} style={{ marginBottom: 8 }} />
        <div>Failed to load dashboard: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: theme.FONT, padding: 24, background: theme.CONTENT_BG, minHeight: '100vh' }}>
      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: theme.TEXT_PRIMARY }}>
          {greeting}, {userName} 👋
        </h1>
        <p style={{ margin: '4px 0 0', color: theme.TEXT_SECONDARY, fontSize: 14 }}>
          Here's your verification overview for today.
        </p>
      </div>

      {/* Stat Cards */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Docs', value: total, icon: <FileText size={22} color={theme.BLUE} />, accent: theme.BLUE },
          { label: 'Fraud Rate', value: `${fraudRate}%`, icon: <ShieldAlert size={22} color={theme.RED} />, accent: theme.RED },
          { label: 'Genuine', value: genuine, icon: <CheckCircle size={22} color={theme.GREEN} />, accent: theme.GREEN },
          { label: 'Flagged', value: flagged, icon: <AlertTriangle size={22} color={theme.AMBER} />, accent: theme.AMBER },
        ].map(card => (
          <div key={card.label} style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: theme.TEXT_SECONDARY }}>{card.label}</span>
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: card.accent + '18',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                {card.icon}
              </div>
            </div>
            <div style={{ fontSize: 30, fontWeight: 700, color: theme.TEXT_PRIMARY }}>{card.value}</div>
          </div>
        ))}
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '2fr 1fr', gap: 20 }}>
        {/* Recent Submissions Table */}
        <div style={CARD}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: theme.TEXT_PRIMARY }}>
            Recent Submissions
          </h2>
          {recent.length === 0 ? (
            <div style={{ color: theme.TEXT_SECONDARY, textAlign: 'center', padding: 32 }}>No submissions yet.</div>
          ) : (
            <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
              <thead>
                <tr>
                  {['Date', 'Applicant ID', 'Doc Type', 'Verdict', 'Score'].map(h => (
                    <th
                      key={h}
                      style={{
                        textAlign: 'left',
                        padding: '6px 10px',
                        borderBottom: `1px solid ${theme.BORDER}`,
                        color: theme.TEXT_SECONDARY,
                        fontWeight: 600,
                        fontSize: 12,
                      }}
                    >
                      {h}
                    </th>
                  ))}
                </tr>
              </thead>
              <tbody>
                {recent.map(sub => (
                  <tr key={sub.id} style={{ borderBottom: `1px solid ${theme.BORDER}` }}>
                    <td style={{ padding: '8px 10px', color: theme.TEXT_SECONDARY }}>{fmt(sub.created_at)}</td>
                    <td style={{ padding: '8px 10px', fontFamily: 'monospace', fontSize: 12 }}>
                      {sub.applicant_id}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      {DOC_LABEL[sub.doc_type] || sub.doc_type}
                    </td>
                    <td style={{ padding: '8px 10px' }}>
                      <VerdictBadge verdict={sub.verdict} />
                    </td>
                    <td style={{ padding: '8px 10px', fontWeight: 600, color: theme.TEXT_PRIMARY }}>
                      {sub.score}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>

        {/* Verdict Breakdown */}
        <div style={CARD}>
          <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: theme.TEXT_PRIMARY }}>
            Verdict Breakdown
          </h2>
          {total === 0 ? (
            <div style={{ color: theme.TEXT_SECONDARY, textAlign: 'center', padding: 32 }}>No data.</div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: 14 }}>
              {(Object.entries(verdictCounts) as [Verdict, number][]).map(([v, count]) => {
                const pct = total > 0 ? (count / total) * 100 : 0
                return (
                  <div key={v}>
                    <div
                      style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        marginBottom: 4,
                        fontSize: 13,
                        color: theme.TEXT_PRIMARY,
                      }}
                    >
                      <span style={{ fontWeight: 500 }}>{v}</span>
                      <span style={{ color: theme.TEXT_SECONDARY }}>
                        {count} ({pct.toFixed(1)}%)
                      </span>
                    </div>
                    <div
                      style={{
                        height: 8,
                        borderRadius: 99,
                        background: theme.BORDER,
                        overflow: 'hidden',
                      }}
                    >
                      <div
                        style={{
                          height: '100%',
                          width: `${pct}%`,
                          borderRadius: 99,
                          background: verdictColor[v],
                          transition: 'width 0.4s ease',
                        }}
                      />
                    </div>
                  </div>
                )
              })}
            </div>
          )}

          {/* Visual proportion bar */}
          {total > 0 && (
            <div style={{ marginTop: 24 }}>
              <div style={{ fontSize: 12, color: theme.TEXT_SECONDARY, marginBottom: 6 }}>Proportion</div>
              <div style={{ display: 'flex', height: 18, borderRadius: 99, overflow: 'hidden', gap: 1 }}>
                {(Object.entries(verdictCounts) as [Verdict, number][])
                  .filter(([, c]) => c > 0)
                  .map(([v, count]) => (
                    <div
                      key={v}
                      title={`${v}: ${count}`}
                      style={{
                        flex: count,
                        background: verdictColor[v],
                        transition: 'flex 0.4s ease',
                      }}
                    />
                  ))}
              </div>
              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '6px 16px', marginTop: 8 }}>
                {(Object.entries(verdictCounts) as [Verdict, number][]).map(([v]) => (
                  <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 5, fontSize: 11 }}>
                    <div
                      style={{ width: 10, height: 10, borderRadius: 2, background: verdictColor[v] }}
                    />
                    <span style={{ color: theme.TEXT_SECONDARY }}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
