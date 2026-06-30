import React, { useState } from 'react'
import { Building2, Search, Loader2, AlertCircle, CheckCircle } from 'lucide-react'
import { useTheme } from '../../ThemeContext'

interface IFSCResult {
  valid: boolean
  ifsc?: string
  bank?: string
  branch?: string
  city?: string
  state?: string
  address?: string
  reason?: string
}

const COMMON_BANKS = [
  { bank: 'State Bank of India', prefix: 'SBIN', state: 'All India' },
  { bank: 'HDFC Bank', prefix: 'HDFC', state: 'All India' },
  { bank: 'ICICI Bank', prefix: 'ICIC', state: 'All India' },
  { bank: 'Axis Bank', prefix: 'UTIB', state: 'All India' },
  { bank: 'Punjab National Bank', prefix: 'PUNB', state: 'All India' },
  { bank: 'Bank of Baroda', prefix: 'BARB', state: 'All India' },
  { bank: 'Kotak Mahindra Bank', prefix: 'KKBK', state: 'All India' },
  { bank: 'IndusInd Bank', prefix: 'INDB', state: 'All India' },
  { bank: 'YES Bank', prefix: 'YESB', state: 'All India' },
  { bank: 'Canara Bank', prefix: 'CNRB', state: 'All India' },
]

export default function IFSCRegistry() {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG, borderRadius: 12, border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW, padding: 24,
  }

  const [query, setQuery] = useState('')
  const [result, setResult] = useState<IFSCResult | null>(null)
  const [loading, setLoading] = useState(false)

  const handleLookup = async () => {
    const code = query.toUpperCase().trim()
    if (!code) return
    setLoading(true)
    setResult(null)
    try {
      const res = await fetch(`/api/tools/ifsc/${encodeURIComponent(code)}`)
      const data = await res.json()
      setResult(data)
    } catch {
      setResult({ valid: false, reason: 'Failed to reach server.' })
    } finally {
      setLoading(false)
    }
  }

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Building2 size={22} color={theme.BLUE} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>Bank & IFSC Registry</h1>
      </div>

      <div style={CARD}>
        <p style={{ color: theme.TEXT_SECONDARY, fontSize: 14, margin: '0 0 16px' }}>
          Look up any IFSC code against the offline RBI registry. Invalid codes may indicate a forged bank document.
        </p>
        <div style={{ display: 'flex', gap: 12 }}>
          <input
            value={query}
            onChange={e => setQuery(e.target.value.toUpperCase())}
            onKeyDown={e => e.key === 'Enter' && handleLookup()}
            placeholder="Enter IFSC code (e.g. SBIN0001234)"
            maxLength={11}
            style={{
              flex: 1, padding: '10px 14px', borderRadius: 8, border: `1px solid ${theme.BORDER}`,
              fontSize: 14, fontFamily: 'monospace', color: theme.TEXT_PRIMARY, outline: 'none',
              background: theme.CARD_BG,
            }}
          />
          <button
            onClick={handleLookup}
            disabled={loading || !query.trim()}
            style={{
              display: 'flex', alignItems: 'center', gap: 6, padding: '10px 20px',
              borderRadius: 8, border: 'none', background: theme.BLUE, color: '#fff',
              fontSize: 14, fontWeight: 600, cursor: 'pointer', fontFamily: FONT,
              opacity: loading || !query.trim() ? 0.6 : 1,
            }}
          >
            {loading ? <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={16} />}
            Lookup
          </button>
        </div>
        <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

        {result && (
          <div style={{
            marginTop: 20, padding: 16, borderRadius: 10,
            background: result.valid ? theme.VERDICT_GREEN_BG : theme.VERDICT_RED_BG,
            border: `1px solid ${result.valid ? theme.VERDICT_GREEN_BORDER : theme.VERDICT_RED_BORDER}`,
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: result.valid ? 12 : 0 }}>
              {result.valid
                ? <CheckCircle size={20} color="#16a34a" />
                : <AlertCircle size={20} color="#dc2626" />}
              <span style={{ fontWeight: 700, fontSize: 15, color: result.valid ? theme.VERDICT_GREEN_TEXT : theme.VERDICT_RED_TEXT }}>
                {result.valid ? `Valid IFSC: ${result.ifsc}` : (result.reason ?? 'Invalid IFSC code')}
              </span>
            </div>
            {result.valid && (
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 12 }}>
                {[
                  ['Bank', result.bank],
                  ['Branch', result.branch],
                  ['City', result.city],
                  ['State', result.state],
                ].filter(([, v]) => v).map(([k, v]) => (
                  <div key={k as string}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: theme.TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>{k}</p>
                    <p style={{ margin: '2px 0 0', fontSize: 14, fontWeight: 600, color: theme.TEXT_PRIMARY }}>{v}</p>
                  </div>
                ))}
                {result.address && (
                  <div style={{ gridColumn: '1 / -1' }}>
                    <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: theme.TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.05em' }}>Address</p>
                    <p style={{ margin: '2px 0 0', fontSize: 13, color: theme.TEXT_SECONDARY }}>{result.address}</p>
                  </div>
                )}
              </div>
            )}
            {!result.valid && result.reason?.includes('registry') && (
              <p style={{ margin: '8px 0 0', fontSize: 13, color: theme.VERDICT_RED_TEXT }}>
                This code is NOT in the RBI IFSC registry. Documents containing this code may be forged.
              </p>
            )}
          </div>
        )}
      </div>

      <div style={CARD}>
        <h3 style={{ fontSize: 16, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: '0 0 16px' }}>Common Bank IFSC Prefixes</h3>
        <table style={{ width: '100%', borderCollapse: 'collapse', fontFamily: FONT }}>
          <thead>
            <tr style={{ borderBottom: `1px solid ${theme.BORDER}` }}>
              {['Bank Name', 'IFSC Prefix', 'Coverage'].map(h => (
                <th key={h} style={{ padding: '8px 12px', textAlign: 'left', fontSize: 12, fontWeight: 600, color: theme.TEXT_SECONDARY, textTransform: 'uppercase', letterSpacing: '0.04em' }}>{h}</th>
              ))}
            </tr>
          </thead>
          <tbody>
            {COMMON_BANKS.map((b, i) => (
              <tr key={b.prefix} style={{ borderBottom: `1px solid ${theme.BORDER}`, background: i % 2 === 1 ? theme.TABLE_ROW_HOVER : 'transparent' }}>
                <td style={{ padding: '10px 12px', fontSize: 13, fontWeight: 500, color: theme.TEXT_PRIMARY }}>{b.bank}</td>
                <td style={{ padding: '10px 12px' }}>
                  <code style={{ background: 'rgba(255,255,255,0.08)', color: '#f1f5f9', borderRadius: 4, padding: '2px 8px', fontSize: 12, fontWeight: 700 }}>{b.prefix}</code>
                </td>
                <td style={{ padding: '10px 12px', fontSize: 13, color: theme.TEXT_SECONDARY }}>{b.state}</td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    </div>
  )
}
