import React, { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, CheckCircle, ShieldAlert, Inbox } from 'lucide-react'
import { getHistory } from '../../api'
import type { Submission, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

interface Props {
  filter?: 'all' | 'pending' | 'flagged' | 'cleared'
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
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
    hour: '2-digit',
    minute: '2-digit',
  })
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

export default function VerificationCenter({ filter = 'all' }: Props) {
  const { theme } = useTheme()
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG,
    borderRadius: 12,
    border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW,
    padding: 24,
  }
  const scoreColor = (s: number) =>
    s >= 75 ? theme.GREEN : s >= 50 ? theme.AMBER : theme.RED

  const [history, setHistory] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistory()
      .then(data =>
        setHistory([...data].sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()))
      )
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  const filtered = history.filter(s => {
    if (filter === 'flagged') return s.verdict === 'FORGED' || s.verdict === 'SUSPICIOUS'
    if (filter === 'pending') return s.verdict === 'REVIEW'
    if (filter === 'cleared') return s.verdict === 'GENUINE'
    return true
  })

  const totalShown = filtered.length
  const flaggedCount = filtered.filter(s => s.verdict === 'FORGED' || s.verdict === 'SUSPICIOUS').length
  const clearedCount = filtered.filter(s => s.verdict === 'GENUINE').length

  const filterLabel: Record<string, string> = {
    all: 'All Verifications',
    pending: 'Pending Review',
    flagged: 'Flagged Cases',
    cleared: 'Cleared Documents',
  }

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
        <div>Failed to load verifications: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: theme.FONT, padding: 24, background: theme.CONTENT_BG, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: theme.TEXT_PRIMARY }}>
        {filterLabel[filter] || 'Verification Center'}
      </h1>
      <p style={{ margin: '0 0 24px', color: theme.TEXT_SECONDARY, fontSize: 14 }}>
        Review and manage document verifications.
      </p>

      {/* Stats Row */}
      <div style={{ display: 'flex', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Shown', value: totalShown, icon: <ShieldAlert size={18} color={theme.BLUE} />, color: theme.BLUE },
          { label: 'Flagged', value: flaggedCount, icon: <AlertTriangle size={18} color={theme.RED} />, color: theme.RED },
          { label: 'Cleared', value: clearedCount, icon: <CheckCircle size={18} color={theme.GREEN} />, color: theme.GREEN },
        ].map(stat => (
          <div
            key={stat.label}
            style={{
              ...CARD,
              padding: '14px 20px',
              display: 'flex',
              alignItems: 'center',
              gap: 14,
              flex: '0 0 auto',
            }}
          >
            <div
              style={{
                width: 36,
                height: 36,
                borderRadius: 8,
                background: stat.color + '18',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
              }}
            >
              {stat.icon}
            </div>
            <div>
              <div style={{ fontSize: 22, fontWeight: 700, color: theme.TEXT_PRIMARY }}>{stat.value}</div>
              <div style={{ fontSize: 12, color: theme.TEXT_SECONDARY }}>{stat.label}</div>
            </div>
          </div>
        ))}
      </div>

      {/* Table */}
      <div style={CARD}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: theme.TEXT_SECONDARY }}>
            <Inbox size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 500 }}>No records match this filter.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Date', 'Applicant ID', 'Doc Type', 'Verdict', 'Score', 'Actions'].map(h => (
                  <th
                    key={h}
                    style={{
                      textAlign: 'left',
                      padding: '8px 12px',
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
              {filtered.map(sub => (
                <tr
                  key={sub.id}
                  style={{ borderBottom: `1px solid ${theme.BORDER}` }}
                >
                  <td style={{ padding: '10px 12px', color: theme.TEXT_SECONDARY, whiteSpace: 'nowrap' }}>
                    {fmt(sub.created_at)}
                  </td>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: theme.TEXT_PRIMARY }}>
                    {sub.applicant_id}
                  </td>
                  <td style={{ padding: '10px 12px', color: theme.TEXT_PRIMARY }}>
                    {DOC_LABEL[sub.doc_type] || sub.doc_type}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <VerdictBadge verdict={sub.verdict} />
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                      <div
                        style={{
                          width: 72,
                          height: 7,
                          borderRadius: 99,
                          background: theme.BORDER,
                          overflow: 'hidden',
                        }}
                      >
                        <div
                          style={{
                            height: '100%',
                            width: `${sub.score}%`,
                            background: scoreColor(sub.score),
                            borderRadius: 99,
                          }}
                        />
                      </div>
                      <span style={{ fontWeight: 600, color: theme.TEXT_PRIMARY }}>{sub.score}</span>
                    </div>
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => console.log('View applicant:', sub.applicant_id, sub)}
                      style={{
                        padding: '5px 14px',
                        background: theme.VERDICT_BLUE_BG,
                        color: theme.VERDICT_BLUE_TEXT,
                        border: `1px solid ${theme.VERDICT_BLUE_BORDER}`,
                        borderRadius: 7,
                        fontSize: 12,
                        fontWeight: 600,
                        cursor: 'pointer',
                        fontFamily: theme.FONT,
                      }}
                    >
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>
    </div>
  )
}
