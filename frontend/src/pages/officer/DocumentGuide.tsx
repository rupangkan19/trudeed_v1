import React, { useState } from 'react'
import { BookOpen, ChevronDown, ChevronUp, FileText, CreditCard, Fingerprint, Receipt, Building2, ClipboardList } from 'lucide-react'
import { useTheme } from '../../ThemeContext'

interface Guide {
  title: string
  icon: React.ElementType
  color: string
  rules: string[]
}

const GUIDES: Guide[] = [
  {
    title: 'Salary Slip',
    icon: Receipt,
    color: '#2563eb',
    rules: [
      'Gross Pay − (PF + ESI + Professional Tax + TDS + Other Deductions) = Net Pay. Verify math exactly.',
      'PF deduction must be exactly 12% of Basic Salary (employee contribution).',
      'HRA ≤ 50% of Basic (metro cities) or 40% of Basic (non-metro). Check city.',
      'Date should be within 3 months of submission date. Check month/year consistency.',
      'Employer name, logo, and designation must be consistent across multiple slips.',
      'Watch for mismatched fonts, copy-paste artifacts, or suspicious decimal figures.',
    ],
  },
  {
    title: 'Bank Statement',
    icon: Building2,
    color: '#16a34a',
    rules: [
      'Opening Balance + Total Credits − Total Debits = Closing Balance for each period.',
      'Every single transaction row must reconcile. Check running balance column.',
      'IFSC code must be a valid RBI-registered 11-character code. Verify using IFSC tool.',
      'Account number format must be consistent throughout (no partial masking inconsistency).',
      'Statement period must be continuous — no gaps in dates, no missing pages.',
      'Bank logo and watermark should be consistent and not pixelated.',
      'Salary credits should appear consistently (same date each month, same amount unless noted).',
    ],
  },
  {
    title: 'Income Tax Return (ITR)',
    icon: FileText,
    color: '#d97706',
    rules: [
      'Gross Income − Standard Deduction (₹50,000) − Chapter VI-A deductions = Net Taxable Income.',
      'Tax liability must match the correct slab rate for the assessment year.',
      'TDS claimed must match Form 26AS (employer TDS certificate).',
      'Assessment Year format: YYYY-YY (e.g., 2024-25). Financial Year is one year prior.',
      'PAN must be valid format and match the name on the ITR exactly.',
      'Acknowledgement number from ITR-V should be 15 digits.',
    ],
  },
  {
    title: 'Form 16 (TDS Certificate)',
    icon: ClipboardList,
    color: '#7c3aed',
    rules: [
      'Part A: TDS deducted by employer — quarterly breakdown must add up correctly.',
      'Part B: Gross Salary − Exemptions (HRA, LTA) − Standard Deduction = Net Salary.',
      'Tax computed on net salary must equal TDS deposited (with any short/excess deduction noted).',
      'TAN of employer must be a valid 10-character code: AAAA99999A (4 letters + 5 digits + 1 letter).',
      'PAN of employee and employer must be valid format.',
      'Form 16 must be issued for the correct assessment year; check dates carefully.',
      'Digital signature or TRACES watermark must be present for authenticity.',
    ],
  },
  {
    title: 'Aadhaar Card',
    icon: Fingerprint,
    color: '#dc2626',
    rules: [
      '12-digit Aadhaar UID must pass Verhoeff algorithm checksum (use Quick Tools to verify).',
      'UIDAI header/logo must be present and visually consistent.',
      'Date of birth format must be consistent (DD/MM/YYYY).',
      'QR code on Aadhaar should be scannable and contain matching information.',
      'Name must match exactly with other submitted documents (PAN, salary slips).',
      'Address must be consistent with other documents if address verification is needed.',
      'First digit of UID cannot be 0 or 1 — these are reserved by UIDAI.',
    ],
  },
  {
    title: 'Cheque / Bank Draft',
    icon: CreditCard,
    color: '#0891b2',
    rules: [
      'Amount in words must match amount in figures exactly (no rounding discrepancy).',
      'Date must not be stale — cheques more than 3 months old are non-negotiable.',
      'MICR band at bottom must be 9 digits: 3 (bank code) + 3 (city code) + 3 (branch code).',
      'Payee name must be consistent with account records and other documents.',
      'Account number format must match the bank\'s known format.',
      'Signature must be present and not obviously digitally added.',
      'Cheque serial number (top right) must match MICR encoding.',
    ],
  },
]

export default function DocumentGuide() {
  const { theme } = useTheme()
  const FONT = theme.FONT
  const CARD: React.CSSProperties = {
    background: theme.CARD_BG, borderRadius: 12, border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW, overflow: 'hidden',
  }

  const [expanded, setExpanded] = useState<Set<string>>(new Set())

  const toggle = (title: string) => {
    setExpanded(prev => {
      const next = new Set(prev)
      if (next.has(title)) next.delete(title)
      else next.add(title)
      return next
    })
  }

  return (
    <div style={{ fontFamily: FONT, display: 'flex', flexDirection: 'column', gap: 24 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 12 }}>
        <BookOpen size={22} color={theme.BLUE} />
        <h1 style={{ fontSize: 22, fontWeight: 700, color: theme.TEXT_PRIMARY, margin: 0 }}>Document Verification Guide</h1>
      </div>
      <p style={{ color: theme.TEXT_SECONDARY, fontSize: 14, margin: '-12px 0 0' }}>
        Quick reference for what to look for in each document type.
      </p>

      <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
        {GUIDES.map(({ title, icon: Icon, color, rules }) => {
          const isOpen = expanded.has(title)
          return (
            <div key={title} style={CARD}>
              <button
                onClick={() => toggle(title)}
                style={{
                  width: '100%', display: 'flex', alignItems: 'center', gap: 14,
                  padding: '16px 20px', background: 'none', border: 'none', cursor: 'pointer',
                  textAlign: 'left', fontFamily: FONT,
                }}
              >
                <div style={{ width: 40, height: 40, borderRadius: 10, background: color + '18', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <Icon size={20} color={color} />
                </div>
                <span style={{ flex: 1, fontSize: 15, fontWeight: 700, color: theme.TEXT_PRIMARY }}>{title}</span>
                <span style={{ fontSize: 12, color: theme.TEXT_SECONDARY, marginRight: 8 }}>{rules.length} checks</span>
                {isOpen ? <ChevronUp size={18} color={theme.TEXT_SECONDARY} /> : <ChevronDown size={18} color={theme.TEXT_SECONDARY} />}
              </button>

              {isOpen && (
                <div style={{ padding: '0 20px 20px', borderTop: `1px solid ${theme.BORDER}`, background: 'rgba(255,255,255,0.02)' }}>
                  <ul style={{ margin: '16px 0 0', padding: 0, listStyle: 'none', display: 'flex', flexDirection: 'column', gap: 10 }}>
                    {rules.map((rule, i) => (
                      <li key={i} style={{ display: 'flex', gap: 10, alignItems: 'flex-start' }}>
                        <span style={{ width: 22, height: 22, borderRadius: '50%', background: color + '20', color: color, fontSize: 11, fontWeight: 700, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0, marginTop: 1 }}>
                          {i + 1}
                        </span>
                        <span style={{ fontSize: 13, color: theme.TEXT_PRIMARY, lineHeight: 1.6 }}>{rule}</span>
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
