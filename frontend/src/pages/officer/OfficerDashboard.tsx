import { useEffect, useState } from 'react'
import {
  Loader2, AlertTriangle, CheckCircle, ShieldAlert, Upload,
  FileText, Eye, Lightbulb, Search, Clock, TrendingUp, AlertCircle,
} from 'lucide-react'
import { getHistory } from '../../api'
import type { Submission, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

interface Props {
  userName: string
  onNavigate: (page: string) => void
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

function isToday(dateStr: string) {
  const d = new Date(dateStr)
  const now = new Date()
  return (
    d.getDate() === now.getDate() &&
    d.getMonth() === now.getMonth() &&
    d.getFullYear() === now.getFullYear()
  )
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

export default function OfficerDashboard({ userName, onNavigate }: Props) {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const TEXT_PRIMARY = theme.TEXT_PRIMARY
  const TEXT_SECONDARY = theme.TEXT_SECONDARY
  const BORDER = theme.BORDER
  const BLUE = theme.BLUE
  const RED = theme.RED
  const GREEN = theme.GREEN
  const AMBER = theme.AMBER
  const CONTENT_BG = theme.CONTENT_BG
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG,
    borderRadius: 12,
    border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW,
    padding: 24,
  }

  const TIPS = [
    {
      icon: <Eye size={20} color={BLUE} />,
      title: 'Check Heatmap',
      body: 'Always review the forensic heatmap. Red boxes mark critical forgery regions—pay close attention to these areas.',
    },
    {
      icon: <Search size={20} color={AMBER} />,
      title: 'Cross-doc Consistency',
      body: 'Verify that name, PAN, and income details are consistent across all documents submitted by the same applicant.',
    },
    {
      icon: <AlertCircle size={20} color={RED} />,
      title: 'IFSC & PAN Validity',
      body: 'Use Quick Tools to validate IFSC codes against the RBI registry and verify PAN format before processing.',
    },
    {
      icon: <TrendingUp size={20} color={GREEN} />,
      title: 'Score Thresholds',
      body: 'Score < 40 = high risk. Score 40–70 = review manually. Score > 70 = likely genuine. Use context to decide.',
    },
  ]

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
  const greeting = hour < 12 ? 'Good morning' : hour < 17 ? 'Good afternoon' : 'Good evening'

  const todayDocs = history.filter(s => isToday(s.created_at))
  const todayFraud = todayDocs.filter(s => s.verdict === 'FORGED' || s.verdict === 'SUSPICIOUS').length
  const todayGenuine = todayDocs.filter(s => s.verdict === 'GENUINE').length

  const recent = [...history]
    .sort((a, b) => new Date(b.created_at).getTime() - new Date(a.created_at).getTime())
    .slice(0, 3)

  if (loading) {
    return (
      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'center', height: 300, gap: 12, fontFamily: FONT }}>
        <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>
        <Loader2 size={28} color={BLUE} style={{ animation: 'spin 1s linear infinite' }} />
        <span style={{ color: TEXT_SECONDARY, fontSize: 14 }}>Loading dashboard...</span>
      </div>
    )
  }

  if (error) {
    return (
      <div style={{ ...CARD, color: RED, textAlign: 'center', padding: 40, fontFamily: FONT }}>
        <AlertTriangle size={32} style={{ marginBottom: 8 }} />
        <div>Failed to load dashboard: {error}</div>
      </div>
    )
  }

  return (
    <div style={{ fontFamily: FONT, padding: 24, background: CONTENT_BG, minHeight: '100vh' }}>
      <style>{`@keyframes spin { from { transform:rotate(0deg) } to { transform:rotate(360deg) } }`}</style>

      {/* Greeting */}
      <div style={{ marginBottom: 28 }}>
        <h1 style={{ margin: 0, fontSize: 26, fontWeight: 700, color: TEXT_PRIMARY }}>
          {greeting}, {userName}
        </h1>
        <p style={{ margin: '4px 0 0', color: TEXT_SECONDARY, fontSize: 14 }}>
          Here is your verification summary for today.
        </p>
      </div>

      {/* Today stats */}
      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16, marginBottom: 24 }}>
        {[
          {
            label: 'Docs Verified Today',
            value: todayDocs.length,
            icon: <FileText size={22} color={BLUE} />,
            accent: BLUE,
          },
          {
            label: 'Fraud Detected Today',
            value: todayFraud,
            icon: <ShieldAlert size={22} color={RED} />,
            accent: RED,
          },
          {
            label: 'Genuine Passed Today',
            value: todayGenuine,
            icon: <CheckCircle size={22} color={GREEN} />,
            accent: GREEN,
          },
        ].map(card => (
          <div key={card.label} style={{ ...CARD, display: 'flex', flexDirection: 'column', gap: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
              <span style={{ fontSize: 13, fontWeight: 500, color: TEXT_SECONDARY }}>{card.label}</span>
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
            <div style={{ fontSize: 34, fontWeight: 700, color: TEXT_PRIMARY }}>{card.value}</div>
          </div>
        ))}
      </div>

      {/* CTA + Recent */}
      <div style={{ display: 'grid', gridTemplateColumns: '1fr 2fr', gap: 20, marginBottom: 24 }}>
        {/* CTA */}
        <div
          style={{
            ...CARD,
            background: BLUE,
            border: 'none',
            display: 'flex',
            flexDirection: 'column',
            alignItems: 'center',
            justifyContent: 'center',
            gap: 16,
            padding: 32,
          }}
        >
          <div
            style={{
              width: 60,
              height: 60,
              borderRadius: '50%',
              background: 'rgba(255,255,255,0.15)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
            }}
          >
            <Upload size={28} color="#fff" />
          </div>
          <div style={{ textAlign: 'center' }}>
            <div style={{ color: '#fff', fontSize: 18, fontWeight: 700, marginBottom: 6 }}>
              Verify a Document
            </div>
            <div style={{ color: 'rgba(255,255,255,0.75)', fontSize: 13 }}>
              Upload and analyse a new document for forgery detection
            </div>
          </div>
          <button
            onClick={() => onNavigate('verify')}
            style={{
              background: '#fff',
              color: BLUE,
              border: 'none',
              borderRadius: 8,
              padding: '10px 24px',
              fontWeight: 700,
              fontSize: 14,
              cursor: 'pointer',
              width: '100%',
              marginTop: 4,
            }}
          >
            Start Verification
          </button>
        </div>

        {/* Recent results */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 16 }}>
            <h2 style={{ margin: 0, fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: 8 }}>
              <Clock size={16} color={TEXT_SECONDARY} />
              Recent Results
            </h2>
            <button
              onClick={() => onNavigate('submissions')}
              style={{ background: 'none', border: 'none', color: BLUE, fontSize: 13, cursor: 'pointer', fontWeight: 500 }}
            >
              View all
            </button>
          </div>
          {recent.length === 0 ? (
            <div style={{ color: TEXT_SECONDARY, textAlign: 'center', padding: 32, fontSize: 14 }}>
              No submissions yet.
            </div>
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
                        borderBottom: `1px solid ${BORDER}`,
                        color: TEXT_SECONDARY,
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
                  <tr key={sub.id} style={{ borderBottom: `1px solid ${BORDER}` }}>
                    <td style={{ padding: '9px 10px', color: TEXT_SECONDARY }}>{fmt(sub.created_at)}</td>
                    <td style={{ padding: '9px 10px', fontFamily: 'monospace', fontSize: 12 }}>
                      {sub.applicant_id}
                    </td>
                    <td style={{ padding: '9px 10px' }}>{DOC_LABEL[sub.doc_type] || sub.doc_type}</td>
                    <td style={{ padding: '9px 10px' }}>
                      <VerdictBadge verdict={sub.verdict} />
                    </td>
                    <td style={{ padding: '9px 10px', fontWeight: 600, color: TEXT_PRIMARY }}>
                      {sub.score}/100
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>

      {/* Quick tips */}
      <div style={CARD}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: TEXT_PRIMARY, display: 'flex', alignItems: 'center', gap: 8 }}>
          <Lightbulb size={16} color={AMBER} />
          Quick Tips for Officers
        </h2>
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: 16 }}>
          {TIPS.map(tip => (
            <div
              key={tip.title}
              style={{
                background: CONTENT_BG,
                borderRadius: 10,
                padding: 16,
                display: 'flex',
                flexDirection: 'column',
                gap: 10,
              }}
            >
              <div
                style={{
                  width: 38,
                  height: 38,
                  borderRadius: 9,
                  background: theme.CARD_HOVER,
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  border: `1px solid ${BORDER}`,
                }}
              >
                {tip.icon}
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: TEXT_PRIMARY }}>{tip.title}</div>
              <div style={{ fontSize: 12, color: TEXT_SECONDARY, lineHeight: 1.5 }}>{tip.body}</div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
