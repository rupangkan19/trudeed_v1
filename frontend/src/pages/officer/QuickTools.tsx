import React, { useState } from 'react'
import { Wrench, Search, CreditCard, Fingerprint, DollarSign, Loader2, CheckCircle, XCircle } from 'lucide-react'
import { useTheme } from '../../ThemeContext'

// Amount to words (Indian system)
const ones = ['', 'One', 'Two', 'Three', 'Four', 'Five', 'Six', 'Seven', 'Eight', 'Nine',
  'Ten', 'Eleven', 'Twelve', 'Thirteen', 'Fourteen', 'Fifteen', 'Sixteen', 'Seventeen', 'Eighteen', 'Nineteen']
const tens = ['', '', 'Twenty', 'Thirty', 'Forty', 'Fifty', 'Sixty', 'Seventy', 'Eighty', 'Ninety']

function belowHundred(n: number): string {
  if (n < 20) return ones[n]
  const t = Math.floor(n / 10)
  const o = n % 10
  return tens[t] + (o > 0 ? ' ' + ones[o] : '')
}

function numberToWords(n: number): string {
  if (n === 0) return 'Zero'
  if (n < 0) return 'Negative ' + numberToWords(-n)
  const parts: string[] = []
  if (n >= 10000000) { parts.push(numberToWords(Math.floor(n / 10000000)) + ' Crore'); n %= 10000000 }
  if (n >= 100000) { parts.push(numberToWords(Math.floor(n / 100000)) + ' Lakh'); n %= 100000 }
  if (n >= 1000) { parts.push(numberToWords(Math.floor(n / 1000)) + ' Thousand'); n %= 1000 }
  if (n >= 100) { parts.push(ones[Math.floor(n / 100)] + ' Hundred'); n %= 100 }
  if (n > 0) parts.push(belowHundred(n))
  return parts.join(' ')
}

const PAN_TYPE: Record<string, string> = {
  P:'Individual',C:'Company',H:'HUF',F:'Firm',A:'AOP',T:'Trust',B:'BOI',L:'Local Authority',J:'AJP',G:'Government'
}

export default function QuickTools() {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG, borderRadius: 12, border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW, padding: 24,
  }

  // IFSC
  const [ifscCode, setIfscCode] = useState('')
  const [ifscResult, setIfscResult] = useState<any>(null)
  const [ifscLoading, setIfscLoading] = useState(false)

  // PAN
  const [panInput, setPanInput] = useState('')
  const [panResult, setPanResult] = useState<{ valid: boolean; type?: string } | null>(null)

  // Aadhaar
  const [aadhaarInput, setAadhaarInput] = useState('')
  const [aadhaarResult, setAadhaarResult] = useState<{ valid: boolean; reason?: string } | null>(null)
  const [aadhaarLoading, setAadhaarLoading] = useState(false)

  // Amount
  const [amountInput, setAmountInput] = useState('')
  const [amountWords, setAmountWords] = useState('')

  const handleIFSC = async () => {
    const code = ifscCode.toUpperCase().trim()
    if (!code) return
    setIfscLoading(true)
    setIfscResult(null)
    try {
      const res = await fetch(`/api/tools/ifsc/${encodeURIComponent(code)}`)
      setIfscResult(await res.json())
    } catch { setIfscResult({ valid: false, reason: 'Server error' }) }
    setIfscLoading(false)
  }

  const handlePAN = (v: string) => {
    const pan = v.toUpperCase().replace(/[^A-Z0-9]/g, '').slice(0, 10)
    setPanInput(pan)
    if (pan.length === 10) {
      const valid = /^[A-Z]{5}[0-9]{4}[A-Z]$/.test(pan)
      setPanResult({ valid, type: valid ? PAN_TYPE[pan[3]] ?? 'Unknown' : undefined })
    } else { setPanResult(null) }
  }

  const handleAadhaar = async () => {
    const uid = aadhaarInput.replace(/\s/g, '').trim()
    if (uid.length !== 12) return
    setAadhaarLoading(true)
    setAadhaarResult(null)
    try {
      const res = await fetch(`/api/tools/aadhaar/${encodeURIComponent(uid)}`)
      setAadhaarResult(await res.json())
    } catch { setAadhaarResult({ valid: false, reason: 'Server error' }) }
    setAadhaarLoading(false)
  }

  const handleAmount = (v: string) => {
    setAmountInput(v)
    const n = parseFloat(v.replace(/,/g, ''))
    if (!isNaN(n) && n >= 0 && n < 1e12) setAmountWords(numberToWords(Math.floor(n)) + ' Rupees Only')
    else setAmountWords('')
  }

  const inputStyle: React.CSSProperties = {
    width: '100%', boxSizing: 'border-box', padding: '10px 12px', borderRadius: 8,
    border: `1px solid ${theme.BORDER}`, fontSize: 14, fontFamily: FONT, color: theme.TEXT_PRIMARY, outline: 'none',
    background: theme.CARD_BG,
  }
  const btnStyle: React.CSSProperties = {
    display: 'flex', alignItems: 'center', gap: 6, padding: '10px 16px',
    borderRadius: 8, border: 'none', background: theme.BLUE, color: '#fff',
    fontSize: 13, fontWeight: 600, cursor: 'pointer', fontFamily: FONT, flexShrink: 0,
  }

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <Wrench size={22} color={theme.BLUE} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>Quick Tools</h1>
      </div>
      <style>{`@keyframes spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }`}</style>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: 20 }}>
        {/* IFSC Validator */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Search size={18} color={theme.BLUE} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>IFSC Validator</h3>
          </div>
          <div style={{ display: 'flex', gap: 8 }}>
            <input style={{ ...inputStyle, fontFamily: 'monospace' }} value={ifscCode} placeholder="e.g. SBIN0001234"
              onChange={e => setIfscCode(e.target.value.toUpperCase())}
              onKeyDown={e => e.key === 'Enter' && handleIFSC()} />
            <button style={btnStyle} onClick={handleIFSC} disabled={ifscLoading}>
              {ifscLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Search size={14} />}
            </button>
          </div>
          {ifscResult && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: ifscResult.valid ? theme.VERDICT_GREEN_BG : theme.VERDICT_RED_BG, border: `1px solid ${ifscResult.valid ? theme.VERDICT_GREEN_BORDER : theme.VERDICT_RED_BORDER}` }}>
              {ifscResult.valid
                ? <div>
                    <p style={{ margin: 0, fontWeight: 700, color: theme.VERDICT_GREEN_TEXT, fontSize: 13 }}>✓ Valid IFSC</p>
                    {ifscResult.bank && <p style={{ margin: '4px 0 0', fontSize: 13, color: theme.TEXT_PRIMARY }}>{ifscResult.bank} — {ifscResult.branch}</p>}
                    {ifscResult.city && <p style={{ margin: '2px 0 0', fontSize: 12, color: theme.TEXT_SECONDARY }}>{ifscResult.city}, {ifscResult.state}</p>}
                  </div>
                : <p style={{ margin: 0, color: theme.VERDICT_RED_TEXT, fontSize: 13, fontWeight: 600 }}>✗ {ifscResult.reason ?? 'Not found in RBI registry'}</p>}
            </div>
          )}
        </div>

        {/* PAN Validator */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <CreditCard size={18} color={theme.PURPLE} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>PAN Validator</h3>
          </div>
          <input style={{ ...inputStyle, fontFamily: 'monospace', marginBottom: 8 }}
            value={panInput} placeholder="e.g. ABCDE1234F" maxLength={10}
            onChange={e => handlePAN(e.target.value)} />
          <p style={{ fontSize: 11, color: theme.TEXT_SECONDARY, margin: '0 0 8px' }}>Format: AAAANNNNNA (5 letters · 4 digits · 1 letter)</p>
          {panResult && (
            <div style={{ padding: 12, borderRadius: 8, background: panResult.valid ? theme.VERDICT_GREEN_BG : theme.VERDICT_RED_BG, border: `1px solid ${panResult.valid ? theme.VERDICT_GREEN_BORDER : theme.VERDICT_RED_BORDER}` }}>
              <p style={{ margin: 0, fontWeight: 700, color: panResult.valid ? theme.VERDICT_GREEN_TEXT : theme.VERDICT_RED_TEXT, fontSize: 13 }}>
                {panResult.valid ? `✓ Valid PAN — Holder: ${panResult.type}` : '✗ Invalid PAN format'}
              </p>
            </div>
          )}
        </div>

        {/* Aadhaar Checksum */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <Fingerprint size={18} color={theme.GREEN} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>Aadhaar Checksum</h3>
          </div>
          <div style={{ display: 'flex', gap: 8, marginBottom: 8 }}>
            <input style={{ ...inputStyle, fontFamily: 'monospace' }}
              value={aadhaarInput} placeholder="Enter 12-digit Aadhaar UID" maxLength={12}
              onChange={e => setAadhaarInput(e.target.value.replace(/\D/g, '').slice(0, 12))}
              onKeyDown={e => e.key === 'Enter' && handleAadhaar()} />
            <button style={btnStyle} onClick={handleAadhaar} disabled={aadhaarLoading || aadhaarInput.length !== 12}>
              {aadhaarLoading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <CheckCircle size={14} />}
            </button>
          </div>
          <p style={{ fontSize: 11, color: theme.TEXT_SECONDARY, margin: 0 }}>Validates using Verhoeff algorithm (UIDAI standard)</p>
          {aadhaarResult && (
            <div style={{ marginTop: 12, padding: 12, borderRadius: 8, background: aadhaarResult.valid ? theme.VERDICT_GREEN_BG : theme.VERDICT_RED_BG, border: `1px solid ${aadhaarResult.valid ? theme.VERDICT_GREEN_BORDER : theme.VERDICT_RED_BORDER}` }}>
              <p style={{ margin: 0, fontWeight: 700, color: aadhaarResult.valid ? theme.VERDICT_GREEN_TEXT : theme.VERDICT_RED_TEXT, fontSize: 13 }}>
                {aadhaarResult.valid ? '✓ Valid Aadhaar UID' : '✗ Invalid — checksum failed'}
              </p>
              {aadhaarResult.reason && <p style={{ margin: '4px 0 0', fontSize: 12, color: theme.TEXT_SECONDARY }}>{aadhaarResult.reason}</p>}
            </div>
          )}
        </div>

        {/* Amount to Words */}
        <div style={CARD}>
          <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 16 }}>
            <DollarSign size={18} color={theme.AMBER} />
            <h3 style={{ fontSize: 15, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>Amount → Words</h3>
          </div>
          <input type="number" style={{ ...inputStyle, marginBottom: 12 }}
            value={amountInput} placeholder="Enter amount (e.g. 75000)"
            onChange={e => handleAmount(e.target.value)} />
          {amountWords && (
            <div style={{ padding: 12, borderRadius: 8, background: theme.VERDICT_AMBER_BG, border: `1px solid ${theme.VERDICT_AMBER_BORDER}` }}>
              <p style={{ margin: 0, fontSize: 11, fontWeight: 600, color: theme.VERDICT_AMBER_TEXT, textTransform: 'uppercase', letterSpacing: '0.05em', marginBottom: 4 }}>In Words:</p>
              <p style={{ margin: 0, fontSize: 15, fontWeight: 700, color: theme.VERDICT_AMBER_TEXT }}>{amountWords}</p>
            </div>
          )}
          <p style={{ fontSize: 11, color: theme.TEXT_SECONDARY, margin: '8px 0 0' }}>Indian system: Lakh, Crore</p>
        </div>
      </div>
    </div>
  )
}
