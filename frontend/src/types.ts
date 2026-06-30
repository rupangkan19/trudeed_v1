export type Verdict = 'GENUINE' | 'REVIEW' | 'SUSPICIOUS' | 'FORGED'
export type Severity = 'RED' | 'AMBER' | 'GREEN'
export type Category = 'content' | 'forensic' | 'cross_doc' | 'history'

export interface Flag {
  code: string
  severity: Severity
  detail: string
  category: Category
}

export interface VerifyResponse {
  verdict: Verdict
  score: number
  confidence: number
  intake_mode: string
  reasons: string[]
  flags: Flag[]
  fields: Record<string, string>
  heatmap_b64: string | null
  fingerprint: string
}

export interface Submission {
  id: number
  applicant_id: string
  doc_type: string
  verdict: Verdict
  score: number
  intake_mode: string
  created_at: string
}

export interface ApplicantDoc {
  doc_type: string
  verdict: Verdict
  score: number
  intake_mode: string
  fields: Record<string, string>
  flags: Flag[]
  created_at: string
}

export interface ApplicantResponse {
  applicant_id: string
  documents: ApplicantDoc[]
}

export type View = 'verify' | 'result' | 'history' | 'applicant' | 'reference'

export const DOC_TYPES = [
  { value: 'SALARY_SLIP', label: 'Salary Slip / Payslip' },
  { value: 'BANK_STATEMENT', label: 'Bank Statement' },
  { value: 'ITR', label: 'Income Tax Return (ITR)' },
  { value: 'FORM16', label: 'Form 16 (TDS Certificate)' },
  { value: 'CHEQUE', label: 'Cheque / Bank Draft' },
  { value: 'AADHAAR', label: 'Aadhaar Card' },
]
