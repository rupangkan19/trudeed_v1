import React, { useEffect, useState } from 'react'
import { Loader2, TrendingUp, BarChart3 } from 'lucide-react'
import { getHistory } from '../../api'
import type { Submission, Verdict } from '../../types'
import { useTheme } from '../../ThemeContext'

const DOC_COLORS = ['#2563eb','#16a34a','#d97706','#dc2626','#7c3aed','#0891b2']

export default function OfficerStats({ userName }: { userName: string }) {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG, borderRadius: 12, border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW, padding: 24,
  }
  const verdictColor: Record<Verdict, string> = {
    GENUINE: theme.GREEN, REVIEW: theme.AMBER, SUSPICIOUS: '#ea580c', FORGED: theme.RED,
  }

  const [subs, setSubs] = useState<Submission[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    getHistory(userName).then(setSubs).catch(e => setError(e.message)).finally(() => setLoading(false))
  }, [userName])

  if (loading) return <div style={{ display:'flex', justifyContent:'center', padding:48 }}><Loader2 size={32} color={theme.BLUE} style={{ animation:'spin 1s linear infinite' }} /><style>{`@keyframes spin{from{transform:rotate(0)}to{transform:rotate(360deg)}}`}</style></div>
  if (error) return <div style={{...CARD, color:theme.RED}}>Error: {error}</div>

  const total = subs.length
  const fraudCount = subs.filter(s => ['FORGED','SUSPICIOUS'].includes(s.verdict)).length
  const fraudRate = total > 0 ? (fraudCount / total * 100).toFixed(1) : '0'
  const avgScore = total > 0 ? (subs.reduce((s,v)=>s+v.score,0)/total).toFixed(1) : '0'

  // By doc type
  const docMap = new Map<string, number>()
  for (const s of subs) docMap.set(s.doc_type, (docMap.get(s.doc_type) ?? 0) + 1)
  const docEntries = [...docMap.entries()].sort((a,b)=>b[1]-a[1])
  const maxDoc = Math.max(1, ...docEntries.map(([,v])=>v))

  // Verdict distribution
  const verdictCounts: Record<Verdict, number> = { GENUINE:0, REVIEW:0, SUSPICIOUS:0, FORGED:0 }
  for (const s of subs) verdictCounts[s.verdict]++

  return (
    <div style={{ fontFamily:FONT, display:'flex', flexDirection:'column', gap:24 }}>
      <div style={{ display:'flex', alignItems:'center', gap:12 }}>
        <TrendingUp size={22} color={theme.BLUE} />
        <h1 style={{ fontSize:22, fontWeight:700, color:theme.TEXT_PRIMARY, margin:0 }}>My Statistics</h1>
      </div>

      <div style={{ display:'grid', gridTemplateColumns:'repeat(3,1fr)', gap:16 }}>
        {[
          { label:'Total Verified', value:total, color:theme.BLUE },
          { label:'Fraud Rate', value:`${fraudRate}%`, color:theme.RED },
          { label:'Avg Risk Score', value:avgScore, color:theme.AMBER },
        ].map(({ label, value, color }) => (
          <div key={label} style={CARD}>
            <p style={{ fontSize:32, fontWeight:800, color, margin:'0 0 4px' }}>{value}</p>
            <p style={{ fontSize:13, color:theme.TEXT_SECONDARY, margin:0 }}>{label}</p>
          </div>
        ))}
      </div>

      <div style={CARD}>
        <h3 style={{ fontSize:16, fontWeight:700, color:theme.TEXT_PRIMARY, margin:'0 0 20px', display:'flex', alignItems:'center', gap:8 }}>
          <BarChart3 size={18} color={theme.BLUE} /> Breakdown by Document Type
        </h3>
        {docEntries.length === 0 ? (
          <p style={{ color:theme.TEXT_SECONDARY, textAlign:'center', padding:'24px 0' }}>No data yet.</p>
        ) : (
          <div style={{ display:'flex', flexDirection:'column', gap:12 }}>
            {docEntries.map(([type, count], i) => (
              <div key={type}>
                <div style={{ display:'flex', justifyContent:'space-between', marginBottom:4 }}>
                  <span style={{ fontSize:13, fontWeight:500, color:theme.TEXT_PRIMARY }}>{type.replace(/_/g,' ')}</span>
                  <span style={{ fontSize:12, color:theme.TEXT_SECONDARY }}>{count} docs</span>
                </div>
                <div style={{ height:10, background:theme.SCORE_TRACK, borderRadius:5, overflow:'hidden' }}>
                  <div style={{ height:'100%', width:`${count/maxDoc*100}%`, background:DOC_COLORS[i%DOC_COLORS.length], borderRadius:5, transition:'width 0.6s ease' }} />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      <div style={CARD}>
        <h3 style={{ fontSize:16, fontWeight:700, color:theme.TEXT_PRIMARY, margin:'0 0 20px' }}>Verdict Distribution</h3>
        <div style={{ display:'grid', gridTemplateColumns:'repeat(2,1fr)', gap:16 }}>
          {(Object.entries(verdictCounts) as [Verdict, number][]).map(([verdict, count]) => (
            <div key={verdict} style={{ padding:16, borderRadius:10, background:verdictColor[verdict]+'10', border:`1px solid ${verdictColor[verdict]}30`, display:'flex', alignItems:'center', gap:12 }}>
              <div style={{ width:12, height:12, borderRadius:'50%', background:verdictColor[verdict] }} />
              <div>
                <p style={{ margin:0, fontSize:22, fontWeight:800, color:verdictColor[verdict] }}>{count}</p>
                <p style={{ margin:0, fontSize:12, color:theme.TEXT_SECONDARY }}>{verdict} {total > 0 ? `(${(count/total*100).toFixed(0)}%)` : ''}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
