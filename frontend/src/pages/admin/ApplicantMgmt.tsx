import React, { useEffect, useState } from 'react'
import { Loader2, AlertTriangle, ChevronLeft, User, Inbox } from 'lucide-react'
import { getHistory, getApplicant } from '../../api'
import type { Submission, Verdict, ApplicantDoc, ApplicantResponse } from '../../types'
import { useTheme } from '../../ThemeContext'

const RISK_ORDER: Verdict[] = ['FORGED', 'SUSPICIOUS', 'REVIEW', 'GENUINE']

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
    day: '2-digit', month: 'short', year: 'numeric',
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

function highestRisk(verdicts: Verdict[]): Verdict {
  for (const v of RISK_ORDER) {
    if (verdicts.includes(v)) return v
  }
  return 'GENUINE'
}

interface ApplicantRow {
  applicant_id: string
  docCount: number
  highestRiskVerdict: Verdict
  lastActive: string
}

function ApplicantDetail({ applicantId, onBack }: { applicantId: string; onBack: () => void }) {
  const { theme } = useTheme()
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG,
    borderRadius: 12,
    border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW,
    padding: 24,
  }

  const [data, setData] = useState<ApplicantResponse | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getApplicant(applicantId)
      .then(setData)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [applicantId])

  return (
    <div>
      <button
        onClick={onBack}
        style={{
          display: 'flex',
          alignItems: 'center',
          gap: 6,
          background: 'none',
          border: 'none',
          cursor: 'pointer',
          color: theme.BLUE,
          fontSize: 13,
          fontWeight: 600,
          padding: 0,
          marginBottom: 16,
          fontFamily: theme.FONT,
        }}
      >
        <ChevronLeft size={16} />
        Back to list
      </button>

      {loading && (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={28} color={theme.BLUE} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      )}
      {error && (
        <div style={{ ...CARD, color: theme.RED, textAlign: 'center' }}>
          <AlertTriangle size={24} /> {error}
        </div>
      )}
      {data && (
        <div>
          <div style={{ ...CARD, marginBottom: 16 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 12, marginBottom: 4 }}>
              <div
                style={{
                  width: 44,
                  height: 44,
                  borderRadius: '50%',
                  background: theme.VERDICT_BLUE_BG,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <User size={22} color={theme.BLUE} />
              </div>
              <div>
                <div style={{ fontWeight: 700, fontSize: 17, color: theme.TEXT_PRIMARY, fontFamily: 'monospace' }}>
                  {data.applicant_id}
                </div>
                <div style={{ fontSize: 13, color: theme.TEXT_SECONDARY }}>
                  {data.documents.length} document{data.documents.length !== 1 ? 's' : ''} on record
                </div>
              </div>
            </div>
          </div>

          {data.documents.map((doc: ApplicantDoc, i: number) => (
            <div key={i} style={{ ...CARD, marginBottom: 12 }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 12 }}>
                <div>
                  <div style={{ fontWeight: 600, fontSize: 14, color: theme.TEXT_PRIMARY, marginBottom: 4 }}>
                    {DOC_LABEL[doc.doc_type] || doc.doc_type}
                  </div>
                  <div style={{ fontSize: 12, color: theme.TEXT_SECONDARY }}>{fmt(doc.created_at)}</div>
                </div>
                <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
                  <VerdictBadge verdict={doc.verdict} />
                  <span style={{ fontSize: 13, fontWeight: 700, color: theme.TEXT_PRIMARY }}>
                    {doc.score}/100
                  </span>
                </div>
              </div>

              {/* Fields */}
              {Object.keys(doc.fields).length > 0 && (
                <div style={{ marginBottom: 10 }}>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.TEXT_SECONDARY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Extracted Fields
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {Object.entries(doc.fields).map(([k, v]) => (
                      <span
                        key={k}
                        style={{
                          background: 'rgba(255,255,255,0.05)',
                          padding: '3px 9px',
                          borderRadius: 99,
                          fontSize: 12,
                          color: theme.TEXT_PRIMARY,
                        }}
                      >
                        {k}: <strong>{v}</strong>
                      </span>
                    ))}
                  </div>
                </div>
              )}

              {/* Flags */}
              {doc.flags.length > 0 && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 600, color: theme.TEXT_SECONDARY, marginBottom: 6, textTransform: 'uppercase', letterSpacing: '0.05em' }}>
                    Flags
                  </div>
                  <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                    {doc.flags.map((flag, fi) => (
                      <span
                        key={fi}
                        title={flag.detail}
                        style={{
                          background:
                            flag.severity === 'RED' ? theme.CHIP_RED_BG
                            : flag.severity === 'AMBER' ? theme.CHIP_AMBER_BG
                            : theme.CHIP_GREEN_BG,
                          color:
                            flag.severity === 'RED' ? theme.CHIP_RED_TEXT
                            : flag.severity === 'AMBER' ? theme.CHIP_AMBER_TEXT
                            : theme.CHIP_GREEN_TEXT,
                          padding: '3px 9px',
                          borderRadius: 99,
                          fontSize: 12,
                          fontWeight: 500,
                        }}
                      >
                        {flag.code}
                      </span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}

export default function ApplicantMgmt() {
  const { theme } = useTheme()
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
  const [tabFilter, setTabFilter] = useState<'all' | 'high_risk'>('all')
  const [selectedId, setSelectedId] = useState<string | null>(null)

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
        <div>Failed to load applicants: {error}</div>
      </div>
    )
  }

  // Group by applicant_id
  const grouped: Record<string, Submission[]> = {}
  history.forEach(s => {
    if (!grouped[s.applicant_id]) grouped[s.applicant_id] = []
    grouped[s.applicant_id].push(s)
  })

  const rows: ApplicantRow[] = Object.entries(grouped).map(([id, subs]) => {
    const sorted = [...subs].sort(
      (a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime()
    )
    return {
      applicant_id: id,
      docCount: subs.length,
      highestRiskVerdict: highestRisk(subs.map(s => s.verdict)),
      lastActive: sorted[0].created_at,
    }
  })

  const filteredRows = tabFilter === 'high_risk'
    ? rows.filter(r => r.highestRiskVerdict === 'FORGED' || r.highestRiskVerdict === 'SUSPICIOUS')
    : rows

  const sortedRows = [...filteredRows].sort(
    (a, b) => new Date(b.lastActive).getTime() - new Date(a.lastActive).getTime()
  )

  if (selectedId) {
    return (
      <div style={{ fontFamily: theme.FONT, padding: 24, background: theme.CONTENT_BG, minHeight: '100vh' }}>
        <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>
        <ApplicantDetail applicantId={selectedId} onBack={() => setSelectedId(null)} />
      </div>
    )
  }

  return (
    <div style={{ fontFamily: theme.FONT, padding: 24, background: theme.CONTENT_BG, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: theme.TEXT_PRIMARY }}>
        Applicant Management
      </h1>
      <p style={{ margin: '0 0 20px', color: theme.TEXT_SECONDARY, fontSize: 14 }}>
        View and investigate applicant document histories.
      </p>

      {/* Filter Tabs */}
      <div style={{ display: 'flex', gap: 4, marginBottom: 20, background: 'rgba(255,255,255,0.05)', borderRadius: 9, padding: 4, width: 'fit-content' }}>
        {([['all', 'All Applicants'], ['high_risk', 'High Risk']] as const).map(([val, label]) => (
          <button
            key={val}
            onClick={() => setTabFilter(val)}
            style={{
              padding: '6px 18px',
              borderRadius: 7,
              border: 'none',
              fontSize: 13,
              fontWeight: 600,
              cursor: 'pointer',
              fontFamily: theme.FONT,
              background: tabFilter === val ? theme.CARD_BG : 'transparent',
              color: tabFilter === val ? theme.TEXT_PRIMARY : theme.TEXT_SECONDARY,
              boxShadow: tabFilter === val ? '0 1px 3px rgba(0,0,0,0.1)' : 'none',
              transition: 'all 0.15s',
            }}
          >
            {label}
          </button>
        ))}
      </div>

      <div style={CARD}>
        {sortedRows.length === 0 ? (
          <div style={{ textAlign: 'center', padding: 48, color: theme.TEXT_SECONDARY }}>
            <Inbox size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
            <div style={{ fontWeight: 500 }}>No applicants found.</div>
          </div>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: 13 }}>
            <thead>
              <tr>
                {['Applicant ID', '# Docs', 'Highest Risk', 'Last Active', 'Actions'].map(h => (
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
              {sortedRows.map(row => (
                <tr key={row.applicant_id} style={{ borderBottom: `1px solid ${theme.BORDER}` }}>
                  <td style={{ padding: '10px 12px', fontFamily: 'monospace', fontSize: 12, color: theme.TEXT_PRIMARY }}>
                    {row.applicant_id}
                  </td>
                  <td style={{ padding: '10px 12px', fontWeight: 600, color: theme.TEXT_PRIMARY }}>
                    {row.docCount}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <VerdictBadge verdict={row.highestRiskVerdict} />
                  </td>
                  <td style={{ padding: '10px 12px', color: theme.TEXT_SECONDARY }}>
                    {fmt(row.lastActive)}
                  </td>
                  <td style={{ padding: '10px 12px' }}>
                    <button
                      onClick={() => setSelectedId(row.applicant_id)}
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
