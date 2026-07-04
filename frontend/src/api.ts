import type { VerifyResponse, Submission, ApplicantResponse } from './types'

const BASE = '/api'

export async function verifyDocument(
  file: File,
  applicantId: string,
  docType: string,
  officerName?: string,
): Promise<VerifyResponse> {
  const form = new FormData()
  form.append('file', file)
  form.append('applicant_id', applicantId.trim())
  form.append('doc_type', docType)
  if (officerName) {
    form.append('officer_name', officerName)
  }

  const res = await fetch(`${BASE}/verify`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getHistory(officerName?: string): Promise<Submission[]> {
  const url = officerName ? `${BASE}/history?officer_name=${encodeURIComponent(officerName)}` : `${BASE}/history`
  const res = await fetch(url)
  if (!res.ok) throw new Error('Failed to load history')
  return res.json()
}

export async function getApplicant(id: string): Promise<ApplicantResponse> {
  const res = await fetch(`${BASE}/applicant/${encodeURIComponent(id)}`)
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Not found' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export interface ReferenceDoc {
  ref_id: string
  doc_type: string
  label: string
  uploaded_by: string
  created_at: string
  fields: Record<string, string>
}

export interface UploadReferenceResult {
  status: string
  ref_id: string
  doc_type: string
  label: string
  fields_extracted: string[]
  phash: string
}

export async function uploadReference(
  file: File,
  refId: string,
  docType: string,
  label: string,
): Promise<UploadReferenceResult> {
  const form = new FormData()
  form.append('file', file)
  form.append('ref_id', refId.trim())
  form.append('doc_type', docType)
  form.append('label', label.trim())
  form.append('uploaded_by', 'admin')

  const res = await fetch(`${BASE}/admin/reference`, { method: 'POST', body: form })
  if (!res.ok) {
    const err = await res.json().catch(() => ({ detail: 'Unknown error' }))
    throw new Error(err.detail || `HTTP ${res.status}`)
  }
  return res.json()
}

export async function getReferences(): Promise<ReferenceDoc[]> {
  const res = await fetch(`${BASE}/admin/references`)
  if (!res.ok) throw new Error('Failed to load references')
  return res.json()
}

export async function deleteReference(refId: string): Promise<void> {
  const res = await fetch(`${BASE}/admin/reference/${encodeURIComponent(refId)}`, { method: 'DELETE' })
  if (!res.ok) throw new Error('Failed to delete reference')
}
