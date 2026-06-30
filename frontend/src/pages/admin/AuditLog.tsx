import React, { useEffect, useState } from 'react'
import { Loader2, Clock, FileText } from 'lucide-react'
import { getHistory } from '../../api'
import type { Submission, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

type DateFilter = '24h' | '7d' | 'all'

export default function AuditLog() {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG, borderRadius: 12, border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW, padding: 24,
  }
  const verdictColor: Record<Verdict, string> = {
    GENUINE: theme.GREEN, REVIEW: theme.AMBER, SUSPICIOUS: '#ea580c', FORGED: theme.RED,
  }
  const verdictBg: Record<Verdict, string> = {
    GENUINE: theme.VERDICT_GREEN_BG, REVIEW: theme.VERDICT_AMBER_BG, SUSPICIOUS: theme.VERDICT_ORANGE_BG, FORGED: theme.VERDICT_RED_BG,
  }

  const [subs, setSubs] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [dateFilter, setDateFilter] = useState<DateFilter>('all')

  useEffect(() => {
    getHistory().then(data => { setSubs([...data].sort((a,b)=>b.created_at.localeCompare(a.created_at))) })
      .catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [])

  const now = Date.now()
  const filtered = subs.filter(s => {
    const ts = new Date(s.created_at).getTime()
    if (dateFilter === '24h') return now - ts < 86400000
    if (dateFilter === '7d') return now - ts < 604800000
    return true
  })

  if (loading) return <div style={{display:'flex',justifyContent:'center',padding:48}}><Loader2 size={32} color={theme.BLUE} style={{animation:'spin 1s linear infinite'}} /><style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style></div>
  if (error) return <div style={{...CARD, color: theme.RED}}>Error: {error}</div>

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <FileText size={22} color={theme.BLUE} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>Audit Log</h1>
        <div style={{ marginLeft: 'auto', display: 'flex', gap: 8 }}>
          {(['24h','7d','all'] as DateFilter[]).map(f => (
            <button key={f} onClick={() => setDateFilter(f)} style={{
              padding: '6px 14px', borderRadius: 8, border: `1px solid ${theme.BORDER}`,
              background: dateFilter === f ? theme.BLUE : theme.CARD_BG,
              color: dateFilter === f ? '#fff' : theme.TEXT_SECONDARY,
              fontSize: 13, fontWeight: 500, cursor: 'pointer', fontFamily: FONT,
            }}>
              {f === '24h' ? 'Last 24h' : f === '7d' ? 'Last 7 days' : 'All'}
            </button>
          ))}
        </div>
      </div>

      <div style={CARD}>
        {filtered.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '48px 0', color: theme.TEXT_SECONDARY }}>
            <Clock size={48} color={theme.BORDER} style={{ marginBottom: 12 }} />
            <p>No activity in this time range.</p>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: 0 }}>
            {filtered.map((s, i) => {
              const dt = new Date(s.created_at)
              return (
                <div key={s.id} style={{
                  display: 'flex', alignItems: 'flex-start', gap: 16,
                  padding: '14px 0',
                  borderBottom: i < filtered.length - 1 ? `1px solid ${theme.BORDER}` : 'none',
                }}>
                  <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4, flexShrink: 0 }}>
                    <div style={{ width: 10, height: 10, borderRadius: '50%', background: verdictColor[s.verdict] }} />
                    {i < filtered.length - 1 && <div style={{ width: 2, height: 28, background: theme.BORDER }} />}
                  </div>
                  <div style={{ flex: 1 }}>
                    <div style={{ display: 'flex', alignItems: 'center', gap: 8, flexWrap: 'wrap' }}>
                      <span style={{ fontSize: 12, color: theme.TEXT_SECONDARY }}>
                        {dt.toLocaleDateString('en-IN')} {dt.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' })}
                      </span>
                      <span style={{ fontFamily: 'monospace', fontSize: 12, fontWeight: 600, color: theme.TEXT_PRIMARY }}>{s.applicant_id}</span>
                      <span style={{ fontSize: 12, color: theme.TEXT_SECONDARY }}>{s.doc_type.replace(/_/g,' ')}</span>
                      <span style={{
                        display: 'inline-block', padding: '1px 8px', borderRadius: 99,
                        fontSize: 11, fontWeight: 600, color: verdictColor[s.verdict], background: verdictBg[s.verdict],
                      }}>{s.verdict}</span>
                      <span style={{ fontSize: 12, color: theme.TEXT_SECONDARY }}>Score: {Math.round(s.score)}</span>
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        )}
      </div>
    </div>
  )
}
