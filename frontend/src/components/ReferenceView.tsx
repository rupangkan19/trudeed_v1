import { useState, useEffect, useCallback } from 'react'
import { uploadReference, getReferences, deleteReference } from '../api'
import type { ReferenceDoc } from '../api'
import { DOC_TYPES } from '../types'

function autoRefId(docType: string, label: string): string {
  const ts = Date.now().toString(36).toUpperCase()
  const prefix = docType.slice(0, 3)
  const slug = label.trim().replace(/\s+/g, '-').slice(0, 20) || ts
  return `${prefix}-${slug}-${ts}`
}

export default function ReferenceView() {
  const [refs, setRefs] = useState<ReferenceDoc[]>([])
  const [loading, setLoading] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [error, setError] = useState('')
  const [success, setSuccess] = useState('')

  const [file, setFile] = useState<File | null>(null)
  const [docType, setDocType] = useState('SALARY_SLIP')
  const [label, setLabel] = useState('')
  const [drag, setDrag] = useState(false)

  const loadRefs = useCallback(async () => {
    setLoading(true)
    try {
      setRefs(await getReferences())
    } catch {
      setError('Failed to load reference library')
    } finally {
      setLoading(false)
    }
  }, [])

  useEffect(() => { loadRefs() }, [loadRefs])

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDrag(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const handleUpload = async () => {
    if (!file || !label.trim()) {
      setError('File and a document description are required.')
      return
    }
    const refId = autoRefId(docType, label)
    setUploading(true)
    setError('')
    setSuccess('')
    try {
      const result = await uploadReference(file, refId, docType, label.trim())
      setSuccess(
        `"${result.label}" saved to reference library. ` +
        `Fields captured: ${result.fields_extracted.join(', ') || 'none'}.`
      )
      setFile(null)
      setLabel('')
      await loadRefs()
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Upload failed')
    } finally {
      setUploading(false)
    }
  }

  const handleDelete = async (id: string, lbl: string) => {
    if (!confirm(`Remove "${lbl}" from the reference library?`)) return
    try {
      await deleteReference(id)
      setRefs(refs.filter(r => r.ref_id !== id))
    } catch {
      setError('Failed to delete reference')
    }
  }

  return (
    <div style={{ maxWidth: 800, margin: '0 auto', padding: '24px 16px' }}>

      {/* Header */}
      <div style={{ marginBottom: 28 }}>
        <h2 style={{ fontSize: 22, fontWeight: 700, color: '#1e293b', margin: 0 }}>
          Reference Document Library
        </h2>
        <p style={{ color: '#64748b', marginTop: 6, fontSize: 14, lineHeight: 1.6 }}>
          Store the <strong>original, verified</strong> version of a document here.
          When an officer submits the same document for verification, the system will
          automatically compare fields and flag any numbers that have been altered.
        </p>
      </div>

      {/* How it works banner */}
      <div style={{
        background: 'linear-gradient(135deg, #eef2ff, #f0f9ff)',
        border: '1px solid #c7d2fe', borderRadius: 12, padding: '16px 20px', marginBottom: 28,
        display: 'flex', gap: 16, alignItems: 'flex-start',
      }}>
        <div style={{ fontSize: 22, flexShrink: 0 }}>💡</div>
        <div style={{ fontSize: 13, color: '#3730a3', lineHeight: 1.6 }}>
          <strong>How matching works:</strong> When an officer uploads a document for verification,
          the system computes a visual fingerprint and compares it against every reference here —
          no manual linking needed. If it looks like the same document but numbers differ,
          the system flags it as tampered.
        </div>
      </div>

      {/* Upload form */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: 24, marginBottom: 28, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginTop: 0, marginBottom: 20 }}>
          Add Original Document
        </h3>

        {/* Drop zone */}
        <div
          onDragOver={e => { e.preventDefault(); setDrag(true) }}
          onDragLeave={() => setDrag(false)}
          onDrop={handleDrop}
          onClick={() => document.getElementById('ref-file-input')?.click()}
          style={{
            border: `2px dashed ${drag ? '#6366f1' : file ? '#22c55e' : '#cbd5e1'}`,
            borderRadius: 10, padding: '28px 16px', textAlign: 'center',
            cursor: 'pointer', background: drag ? '#eef2ff' : file ? '#f0fdf4' : '#f8fafc',
            marginBottom: 20, transition: 'all 0.15s',
          }}
        >
          <input
            id="ref-file-input" type="file" accept=".pdf,.jpg,.jpeg,.png"
            style={{ display: 'none' }}
            onChange={e => setFile(e.target.files?.[0] || null)}
          />
          <div style={{ fontSize: 32, marginBottom: 8 }}>{file ? '✅' : '📄'}</div>
          <div style={{ fontSize: 14, color: '#475569', fontWeight: 500 }}>
            {file ? file.name : 'Click or drag the original document here'}
          </div>
          <div style={{ fontSize: 12, color: '#94a3b8', marginTop: 4 }}>PDF, JPG, PNG accepted</div>
        </div>

        {/* Doc type + description */}
        <div style={{ display: 'grid', gridTemplateColumns: '160px 1fr', gap: 12, marginBottom: 20 }}>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              DOCUMENT TYPE
            </label>
            <select
              value={docType}
              onChange={e => setDocType(e.target.value)}
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 13, background: '#fff',
              }}
            >
              {DOC_TYPES.map(t => <option key={t.value} value={t.value}>{t.label}</option>)}
            </select>
          </div>
          <div>
            <label style={{ fontSize: 12, fontWeight: 600, color: '#64748b', display: 'block', marginBottom: 6 }}>
              DESCRIPTION — who is this document for?
            </label>
            <input
              value={label}
              onChange={e => setLabel(e.target.value)}
              placeholder="e.g. Ravi Kumar's salary slip from Infosys, March 2024"
              style={{
                width: '100%', padding: '9px 12px', borderRadius: 8,
                border: '1px solid #e2e8f0', fontSize: 13, boxSizing: 'border-box',
              }}
            />
          </div>
        </div>

        {error && (
          <div style={{
            background: '#fef2f2', border: '1px solid #fca5a5', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#dc2626',
          }}>
            {error}
          </div>
        )}
        {success && (
          <div style={{
            background: '#f0fdf4', border: '1px solid #86efac', borderRadius: 8,
            padding: '10px 14px', marginBottom: 16, fontSize: 13, color: '#16a34a',
          }}>
            {success}
          </div>
        )}

        <button
          onClick={handleUpload}
          disabled={uploading || !file || !label.trim()}
          style={{
            background: uploading || !file || !label.trim() ? '#94a3b8' : '#6366f1',
            color: '#fff', border: 'none', borderRadius: 8, padding: '10px 28px',
            fontSize: 14, fontWeight: 600, cursor: uploading ? 'wait' : 'pointer',
          }}
        >
          {uploading ? 'Saving to Library…' : 'Save to Reference Library'}
        </button>
      </div>

      {/* Reference list */}
      <div style={{
        background: '#fff', border: '1px solid #e2e8f0', borderRadius: 12,
        padding: 24, boxShadow: '0 1px 3px rgba(0,0,0,0.06)',
      }}>
        <h3 style={{ fontSize: 15, fontWeight: 600, color: '#334155', marginTop: 0, marginBottom: 4 }}>
          Stored References
        </h3>
        <p style={{ fontSize: 12, color: '#94a3b8', marginTop: 0, marginBottom: 20 }}>
          {refs.length} document{refs.length !== 1 ? 's' : ''} on file —
          any submitted document that visually matches one of these will be automatically compared
        </p>

        {loading && <div style={{ color: '#94a3b8', fontSize: 14 }}>Loading…</div>}

        {!loading && refs.length === 0 && (
          <div style={{
            color: '#94a3b8', fontSize: 14, textAlign: 'center',
            padding: '32px 0', borderTop: '1px solid #f1f5f9',
          }}>
            No documents stored yet. Add an original document above to get started.
          </div>
        )}

        {refs.map((ref, i) => (
          <div key={ref.ref_id} style={{
            borderTop: i === 0 ? '1px solid #f1f5f9' : undefined,
            borderBottom: '1px solid #f1f5f9',
            padding: '16px 4px',
            display: 'flex', alignItems: 'flex-start', gap: 16,
          }}>
            {/* Doc type badge */}
            <div style={{
              flexShrink: 0, background: '#eef2ff', color: '#6366f1',
              borderRadius: 8, padding: '6px 10px', fontSize: 11, fontWeight: 700,
              textAlign: 'center', minWidth: 64,
            }}>
              {ref.doc_type.replace('_', '\n')}
            </div>

            {/* Info */}
            <div style={{ flex: 1, minWidth: 0 }}>
              <div style={{ fontWeight: 600, fontSize: 14, color: '#1e293b', marginBottom: 4 }}>
                {ref.label}
              </div>
              <div style={{ fontSize: 12, color: '#94a3b8', marginBottom: ref.fields && Object.keys(ref.fields).length > 0 ? 8 : 0 }}>
                Added {new Date(ref.created_at).toLocaleDateString('en-IN', { day: 'numeric', month: 'short', year: 'numeric' })}
                {' · '}by {ref.uploaded_by}
              </div>
              {/* Key extracted fields */}
              {ref.fields && Object.keys(ref.fields).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 6 }}>
                  {Object.entries(ref.fields)
                    .filter(([k]) => ['gross_salary','net_salary','closing_balance','annual_income','pan'].includes(k))
                    .map(([k, v]) => (
                      <span key={k} style={{
                        background: '#f8fafc', border: '1px solid #e2e8f0',
                        borderRadius: 5, padding: '2px 8px', fontSize: 11, color: '#475569',
                      }}>
                        {k.replace(/_/g, ' ')}: <strong>
                          {['gross_salary','net_salary','closing_balance','annual_income'].includes(k)
                            ? `₹${Number(v).toLocaleString('en-IN')}`
                            : v}
                        </strong>
                      </span>
                    ))}
                </div>
              )}
            </div>

            {/* Delete */}
            <button
              onClick={() => handleDelete(ref.ref_id, ref.label)}
              style={{
                flexShrink: 0, background: 'transparent',
                border: '1px solid #fca5a5', borderRadius: 6,
                color: '#ef4444', padding: '4px 10px', fontSize: 12, cursor: 'pointer',
              }}
            >
              Remove
            </button>
          </div>
        ))}
      </div>
    </div>
  )
}
