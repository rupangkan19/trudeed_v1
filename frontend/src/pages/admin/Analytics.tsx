import React, { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, Download } from 'lucide-react'
import { getHistory } from '../../api'
import type { Submission, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

const DOC_LABEL: Record<string, string> = {
  SALARY_SLIP: 'Salary Slip',
  BANK_STATEMENT: 'Bank Statement',
  ITR: 'ITR',
  FORM16: 'Form 16',
  CHEQUE: 'Cheque',
  AADHAAR: 'Aadhaar',
}

const SCORE_BUCKETS = [
  { label: '0–20', min: 0, max: 20 },
  { label: '20–40', min: 20, max: 40 },
  { label: '40–60', min: 40, max: 60 },
  { label: '60–80', min: 60, max: 80 },
  { label: '80–100', min: 80, max: 101 },
]

function exportCsv(history: Submission[]) {
  const headers = ['ID', 'Applicant ID', 'Doc Type', 'Verdict', 'Score', 'Intake Mode', 'Created At']
  const rows = history.map(s =>
    [s.id, s.applicant_id, s.doc_type, s.verdict, s.score, s.intake_mode, s.created_at]
      .map(v => `"${String(v).replace(/"/g, '""')}"`)
      .join(',')
  )
  const csv = [headers.join(','), ...rows].join('\n')
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' })
  const url = URL.createObjectURL(blob)
  const a = document.createElement('a')
  a.href = url
  a.download = `trudeed_verifications_${new Date().toISOString().slice(0, 10)}.csv`
  document.body.appendChild(a)
  a.click()
  document.body.removeChild(a)
  URL.revokeObjectURL(url)
}

export default function Analytics() {
  const { theme } = useTheme()
  const verdictColor: Record<Verdict, string> = {
    GENUINE: theme.GREEN,
    REVIEW: theme.AMBER,
    SUSPICIOUS: '#ea580c',
    FORGED: theme.RED,
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
        <div>Failed to load analytics: {error}</div>
      </div>
    )
  }

  const total = history.length
  const fraudCount = history.filter(s => s.verdict === 'FORGED' || s.verdict === 'SUSPICIOUS' || s.verdict === 'REVIEW').length
  const fraudRate = total > 0 ? ((fraudCount / total) * 100).toFixed(1) : '0.0'
  const avgScore = total > 0
    ? (history.reduce((s, d) => s + d.score, 0) / total).toFixed(1)
    : '0.0'

  // Most flagged doc type
  const flagged = history.filter(s => s.verdict === 'FORGED' || s.verdict === 'SUSPICIOUS')
  const flaggedByType: Record<string, number> = {}
  flagged.forEach(s => { flaggedByType[s.doc_type] = (flaggedByType[s.doc_type] || 0) + 1 })
  const mostFlagged = Object.entries(flaggedByType).sort((a, b) => b[1] - a[1])[0]

  // Verdicts by doc type
  const docTypes = [...new Set(history.map(s => s.doc_type))]
  const verdictsByDoc = docTypes.map(dt => {
    const docs = history.filter(s => s.doc_type === dt)
    const counts: Record<Verdict, number> = { GENUINE: 0, REVIEW: 0, SUSPICIOUS: 0, FORGED: 0 }
    docs.forEach(d => { counts[d.verdict]++ })
    return { docType: dt, counts, total: docs.length }
  })
  const maxDocCount = Math.max(...verdictsByDoc.map(d => d.total), 1)

  // Score distribution
  const bucketCounts = SCORE_BUCKETS.map(b => ({
    ...b,
    count: history.filter(s => s.score >= b.min && s.score < b.max).length,
  }))
  const maxBucket = Math.max(...bucketCounts.map(b => b.count), 1)

  return (
    <div style={{ fontFamily: theme.FONT, padding: 24, background: theme.CONTENT_BG, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: 24 }}>
        <div>
          <h1 style={{ margin: 0, fontSize: 24, fontWeight: 700, color: theme.TEXT_PRIMARY }}>Analytics</h1>
          <p style={{ margin: '4px 0 0', color: theme.TEXT_SECONDARY, fontSize: 14 }}>
            Verification trends and document statistics.
          </p>
        </div>
        <button
          onClick={() => exportCsv(history)}
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: 8,
            padding: '9px 18px',
            background: theme.BLUE,
            color: '#fff',
            border: 'none',
            borderRadius: 9,
            fontSize: 13,
            fontWeight: 600,
            cursor: 'pointer',
            fontFamily: theme.FONT,
          }}
        >
          <Download size={15} />
          Export CSV
        </button>
      </div>

      {/* Top Stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          { label: 'Total Docs', value: total, color: theme.BLUE },
          { label: 'Fraud Rate', value: `${fraudRate}%`, color: theme.RED },
          { label: 'Most Flagged Type', value: mostFlagged ? (DOC_LABEL[mostFlagged[0]] || mostFlagged[0]) : 'N/A', color: theme.AMBER },
          { label: 'Avg Score', value: `${avgScore}/100`, color: theme.GREEN },
        ].map(stat => (
          <div key={stat.label} style={CARD}>
            <div style={{ fontSize: 12, color: theme.TEXT_SECONDARY, marginBottom: 8 }}>{stat.label}</div>
            <div style={{ fontSize: 26, fontWeight: 700, color: stat.color }}>{stat.value}</div>
          </div>
        ))}
      </div>

      {/* Verdicts by Doc Type */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <div style={{ marginBottom: 20 }}>
          <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: theme.TEXT_PRIMARY }}>
            Verdicts by Document Type
          </h2>
        </div>

        {/* Legend */}
        <div style={{ display: 'flex', gap: 16, marginBottom: 16 }}>
          {(['GENUINE', 'REVIEW', 'SUSPICIOUS', 'FORGED'] as Verdict[]).map(v => (
            <div key={v} style={{ display: 'flex', alignItems: 'center', gap: 6, fontSize: 12 }}>
              <div style={{ width: 12, height: 12, borderRadius: 3, background: verdictColor[v] }} />
              <span style={{ color: theme.TEXT_SECONDARY }}>{v}</span>
            </div>
          ))}
        </div>

        {verdictsByDoc.length === 0 ? (
          <div style={{ color: theme.TEXT_SECONDARY, textAlign: 'center', padding: 24 }}>No data yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 16 }}>
            {verdictsByDoc.map(row => (
              <div key={row.docType}>
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: 6 }}>
                  <span style={{ fontSize: 13, fontWeight: 500, color: theme.TEXT_PRIMARY }}>
                    {DOC_LABEL[row.docType] || row.docType}
                  </span>
                  <span style={{ fontSize: 12, color: theme.TEXT_SECONDARY }}>{row.total} docs</span>
                </div>
                <div style={{ display: 'flex', height: 24, borderRadius: 6, overflow: 'hidden', background: 'rgba(255,255,255,0.08)' }}>
                  {(['GENUINE', 'REVIEW', 'SUSPICIOUS', 'FORGED'] as Verdict[])
                    .filter(v => row.counts[v] > 0)
                    .map(v => (
                      <div
                        key={v}
                        title={`${v}: ${row.counts[v]}`}
                        style={{
                          width: `${(row.counts[v] / maxDocCount) * 100}%`,
                          background: verdictColor[v],
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'center',
                          fontSize: 11,
                          color: '#fff',
                          fontWeight: 700,
                          minWidth: row.counts[v] > 0 ? 20 : 0,
                        }}
                      >
                        {row.counts[v] > 0 && row.counts[v]}
                      </div>
                    ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Score Distribution */}
      <div style={CARD}>
        <h2 style={{ margin: '0 0 20px', fontSize: 16, fontWeight: 600, color: theme.TEXT_PRIMARY }}>
          Score Distribution
        </h2>
        {total === 0 ? (
          <div style={{ color: theme.TEXT_SECONDARY, textAlign: 'center', padding: 24 }}>No data yet.</div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
            {bucketCounts.map(b => (
              <div key={b.label} style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
                <span
                  style={{
                    width: 52,
                    fontSize: 12,
                    color: theme.TEXT_SECONDARY,
                    textAlign: 'right',
                    flexShrink: 0,
                  }}
                >
                  {b.label}
                </span>
                <div
                  style={{
                    flex: 1,
                    height: 22,
                    background: theme.BORDER,
                    borderRadius: 6,
                    overflow: 'hidden',
                  }}
                >
                  <div
                    style={{
                      height: '100%',
                      width: `${(b.count / maxBucket) * 100}%`,
                      background:
                        b.min >= 80
                          ? theme.GREEN
                          : b.min >= 60
                          ? theme.AMBER
                          : theme.RED,
                      borderRadius: 6,
                      transition: 'width 0.4s ease',
                    }}
                  />
                </div>
                <span
                  style={{
                    width: 32,
                    fontSize: 13,
                    fontWeight: 600,
                    color: theme.TEXT_PRIMARY,
                    flexShrink: 0,
                  }}
                >
                  {b.count}
                </span>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
