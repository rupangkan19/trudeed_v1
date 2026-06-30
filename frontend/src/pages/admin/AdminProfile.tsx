import React, { useEffect, useState } from 'react'
import { Loader2, UserCircle, FileText, ShieldCheck, AlertTriangle } from 'lucide-react'
import { getHistory, getReferences } from '../../api'
import type { Submission, Verdict } from '../../types'
import type { ReferenceDoc } from '../../api'
import { useTheme } from '../../ThemeContext'

interface Props { userName: string }

export default function AdminProfile({ userName }: Props) {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG, borderRadius: 12, border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW, padding: 24,
  }
  const verdictColor: Record<Verdict, string> = {
    GENUINE: theme.VERDICT_GREEN_TEXT, REVIEW: theme.VERDICT_AMBER_TEXT, SUSPICIOUS: theme.VERDICT_ORANGE_TEXT, FORGED: theme.VERDICT_RED_TEXT,
  }
  const verdictBg: Record<Verdict, string> = {
    GENUINE: theme.VERDICT_GREEN_BG, REVIEW: theme.VERDICT_AMBER_BG, SUSPICIOUS: theme.VERDICT_ORANGE_BG, FORGED: theme.VERDICT_RED_BG,
  }

  const [history, setHistory] = useState<Submission[]>([])
  const [refs, setRefs] = useState<ReferenceDoc[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    Promise.all([getHistory(), getReferences()])
      .then(([h, r]) => { setHistory(h); setRefs(r) })
      .finally(() => setLoading(false))
  }, [])

  const fraudCount = history.filter(s => ['FORGED','SUSPICIOUS'].includes(s.verdict)).length
  const letter = userName ? userName.charAt(0).toUpperCase() : 'A'

  if (loading) return (
    <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
      <Loader2 size={32} color={theme.BLUE} style={{ animation: 'spin 1s linear infinite' }} />
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>
    </div>
  )

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 24 }}>
        <div style={{
          width: 80, height: 80, borderRadius: '50%', background: theme.BLUE,
          display: 'flex', alignItems: 'center', justifyContent: 'center',
          color: '#fff', fontSize: 36, fontWeight: 800, flexShrink: 0,
        }}>
          {letter}
        </div>
        <div>
          <h1 style={{ fontSize: 24, fontWeight: 800, color: theme.TEXT_PRIMARY, margin: '0 0 4px' }}>{userName}</h1>
          <p style={{ color: theme.TEXT_SECONDARY, fontSize: 14, margin: 0 }}>System Administrator</p>
          <div style={{
            display: 'inline-flex', alignItems: 'center', gap: 6, marginTop: 8,
            background: 'rgba(59,130,246,0.1)', border: '1px solid rgba(59,130,246,0.25)', borderRadius: 20,
            padding: '3px 12px',
          }}>
            <ShieldCheck size={12} color={theme.BLUE} />
            <span style={{ fontSize: 11, fontWeight: 600, color: theme.BLUE }}>Admin Access</span>
          </div>
        </div>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: 16 }}>
        {[
          { label: 'References Stored', value: refs.length, icon: FileText, color: theme.BLUE },
          { label: 'Verifications Reviewed', value: history.length, icon: ShieldCheck, color: theme.GREEN },
          { label: 'Fraud Cases Found', value: fraudCount, icon: AlertTriangle, color: theme.RED },
        ].map(({ label, value, icon: Icon, color }) => (
          <div key={label} style={{ ...CARD, display: 'flex', alignItems: 'center', gap: 16 }}>
            <div style={{ width: 44, height: 44, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
              <Icon size={20} color={color} />
            </div>
            <div>
              <p style={{ margin: 0, fontSize: 28, fontWeight: 800, color: theme.TEXT_PRIMARY }}>{value}</p>
              <p style={{ margin: 0, fontSize: 12, color: theme.TEXT_SECONDARY }}>{label}</p>
            </div>
          </div>
        ))}
      </div>

      <div style={CARD}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: '0 0 16px' }}>Recent Activity</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.BORDER}` }}>
              {['Date', 'Applicant ID', 'Doc Type', 'Verdict'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.TEXT_SECONDARY }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {[...history].sort((a,b)=>b.created_at.localeCompare(a.created_at)).slice(0,10).map((s, i) => (
              <tr key={s.id} style={{ borderBottom: `1px solid ${theme.BORDER}`, background: i % 2 === 1 ? theme.TABLE_ROW_HOVER : 'transparent' }}>
                <td style={{ padding: '8px 12px', fontSize: 12, color: theme.TEXT_SECONDARY }}>{new Date(s.created_at).toLocaleDateString('en-IN')}</td>
                <td style={{ padding: '8px 12px', fontFamily: 'monospace', fontSize: 12 }}>{s.applicant_id}</td>
                <td style={{ padding: '8px 12px', fontSize: 12 }}>{s.doc_type.replace(/_/g,' ')}</td>
                <td style={{ padding: '8px 12px' }}>
                  <span style={{ display:'inline-block', padding:'1px 8px', borderRadius:99, fontSize:11, fontWeight:600, color:verdictColor[s.verdict], background:verdictBg[s.verdict] }}>
                    {s.verdict}
                  </span>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
