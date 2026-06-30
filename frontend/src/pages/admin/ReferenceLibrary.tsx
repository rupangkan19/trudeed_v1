import { useEffect, useState, useRef, useCallback } from 'react'
import { Loader2, Upload, Trash2, AlertTriangle, FolderOpen } from 'lucide-react'
import { getReferences, uploadReference, deleteReference } from '../../api'
import type { ReferenceDoc } from '../../api'
import { DOC_TYPES } from '../../types'
import { useTheme } from '../../ThemeContext'

interface Props {
  filterType?: string
}

const DOC_LABEL: Record<string, string> = {
  SALARY_SLIP: 'Salary Slip',
  BANK_STATEMENT: 'Bank Statement',
  ITR: 'ITR',
  FORM16: 'Form 16',
  CHEQUE: 'Cheque',
  AADHAAR: 'Aadhaar',
}

function slugify(text: string) {
  return text
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '_')
    .replace(/^_|_$/g, '')
    .substring(0, 40)
}

function fmt(dateStr: string) {
  return new Date(dateStr).toLocaleDateString('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  })
}

export default function ReferenceLibrary({ filterType }: Props) {
  const { theme } = useTheme()

  const CARD: React.CSSProperties = {
    background: theme.CARD_BG,
    borderRadius: 12,
    border: `1px solid ${theme.BORDER}`,
    boxShadow: theme.SHADOW,
    padding: 24,
  }

  const [refs, setRefs] = useState<ReferenceDoc[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  // Upload form state
  const [label, setLabel] = useState('')
  const [refId, setRefId] = useState('')
  const [docType, setDocType] = useState(filterType || DOC_TYPES[0].value)
  const [file, setFile] = useState<File | null>(null)
  const [dragging, setDragging] = useState(false)
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState<string | null>(null)
  const [uploadSuccess, setUploadSuccess] = useState<string | null>(null)
  const fileInputRef = useRef<HTMLInputElement>(null)

  const loadRefs = useCallback(() => {
    setLoading(true)
    getReferences()
      .then(setRefs)
      .catch((e: Error) => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    loadRefs()
  }, [loadRefs])

  // Auto-generate ref ID from label
  useEffect(() => {
    if (label && !refId) {
      setRefId(slugify(label))
    }
  }, [label])

  const displayed = filterType ? refs.filter(r => r.doc_type === filterType) : refs

  async function handleUpload(e: React.FormEvent) {
    e.preventDefault()
    if (!file) { setUploadError('Please select a file.'); return }
    if (!label.trim()) { setUploadError('Please enter a label.'); return }
    const finalRefId = refId.trim() || slugify(label)
    setUploading(true)
    setUploadError(null)
    setUploadSuccess(null)
    try {
      const result = await uploadReference(file, finalRefId, docType, label)
      setUploadSuccess(`Uploaded: ${result.label} (${result.ref_id})`)
      setLabel('')
      setRefId('')
      setFile(null)
      setDocType(filterType || DOC_TYPES[0].value)
      loadRefs()
    } catch (err: unknown) {
      setUploadError((err as Error).message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDelete(id: string) {
    if (!confirm('Delete this reference document?')) return
    try {
      await deleteReference(id)
      loadRefs()
    } catch (err: unknown) {
      alert((err as Error).message)
    }
  }

  function onDrop(e: React.DragEvent) {
    e.preventDefault()
    setDragging(false)
    const f = e.dataTransfer.files[0]
    if (f) setFile(f)
  }

  const heading = filterType
    ? `${DOC_LABEL[filterType] || filterType} References`
    : 'Reference Library'

  return (
    <div style={{ fontFamily: theme.FONT, padding: 24, background: theme.CONTENT_BG, minHeight: '100vh' }}>
      <h1 style={{ margin: '0 0 6px', fontSize: 24, fontWeight: 700, color: theme.TEXT_PRIMARY }}>
        {heading}
      </h1>
      <p style={{ margin: '0 0 24px', color: theme.TEXT_SECONDARY, fontSize: 14 }}>
        Manage reference documents used for fraud detection.
      </p>

      {/* Upload Form */}
      <div style={{ ...CARD, marginBottom: 24 }}>
        <h2 style={{ margin: '0 0 16px', fontSize: 16, fontWeight: 600, color: theme.TEXT_PRIMARY }}>
          Upload Reference Document
        </h2>
        <form onSubmit={handleUpload}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr 1fr', gap: 16, marginBottom: 16 }}>
            {/* Label */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.TEXT_PRIMARY, marginBottom: 6 }}>
                Label *
              </label>
              <input
                type="text"
                value={label}
                onChange={e => setLabel(e.target.value)}
                placeholder="e.g. HDFC Salary Slip Jan 2024"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${theme.BORDER}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: theme.FONT,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: theme.INPUT_BG,
                  color: theme.TEXT_PRIMARY,
                }}
              />
            </div>
            {/* Reference ID */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.TEXT_PRIMARY, marginBottom: 6 }}>
                Reference ID (auto-generated if empty)
              </label>
              <input
                type="text"
                value={refId}
                onChange={e => setRefId(e.target.value)}
                placeholder="e.g. hdfc_salary_jan_2024"
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${theme.BORDER}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: theme.FONT,
                  outline: 'none',
                  boxSizing: 'border-box',
                  background: theme.INPUT_BG,
                  color: theme.TEXT_PRIMARY,
                }}
              />
            </div>
            {/* Doc Type */}
            <div>
              <label style={{ display: 'block', fontSize: 13, fontWeight: 500, color: theme.TEXT_PRIMARY, marginBottom: 6 }}>
                Document Type
              </label>
              <select
                value={docType}
                onChange={e => setDocType(e.target.value)}
                disabled={!!filterType}
                style={{
                  width: '100%',
                  padding: '8px 12px',
                  border: `1px solid ${theme.BORDER}`,
                  borderRadius: 8,
                  fontSize: 13,
                  fontFamily: theme.FONT,
                  background: filterType ? theme.CARD_HOVER : theme.INPUT_BG,
                  color: theme.TEXT_PRIMARY,
                  outline: 'none',
                  boxSizing: 'border-box',
                  cursor: filterType ? 'not-allowed' : 'pointer',
                }}
              >
                {DOC_TYPES.map(dt => (
                  <option key={dt.value} value={dt.value}>{dt.label}</option>
                ))}
              </select>
            </div>
          </div>

          {/* Drag & Drop Zone */}
          <div
            onDragOver={e => { e.preventDefault(); setDragging(true) }}
            onDragLeave={() => setDragging(false)}
            onDrop={onDrop}
            onClick={() => fileInputRef.current?.click()}
            style={{
              border: `2px dashed ${dragging ? theme.BLUE : theme.BORDER}`,
              borderRadius: 10,
              padding: 28,
              textAlign: 'center',
              cursor: 'pointer',
              background: dragging ? 'rgba(59,130,246,0.1)' : 'rgba(255,255,255,0.03)',
              marginBottom: 16,
              transition: 'all 0.2s',
            }}
          >
            <Upload size={28} color={dragging ? theme.BLUE : theme.TEXT_SECONDARY} style={{ marginBottom: 8 }} />
            <div style={{ color: theme.TEXT_SECONDARY, fontSize: 14 }}>
              {file
                ? <span style={{ color: theme.BLUE, fontWeight: 500 }}>{file.name}</span>
                : <>Drag & drop a file here, or <span style={{ color: theme.BLUE, textDecoration: 'underline' }}>click to browse</span></>
              }
            </div>
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf"
              style={{ display: 'none' }}
              onChange={e => { if (e.target.files?.[0]) setFile(e.target.files[0]) }}
            />
          </div>

          {uploadError && (
            <div style={{ color: theme.RED, fontSize: 13, marginBottom: 12, display: 'flex', alignItems: 'center', gap: 6 }}>
              <AlertTriangle size={14} /> {uploadError}
            </div>
          )}
          {uploadSuccess && (
            <div style={{ color: theme.GREEN, fontSize: 13, marginBottom: 12 }}>{uploadSuccess}</div>
          )}

          <button
            type="submit"
            disabled={uploading}
            style={{
              padding: '9px 24px',
              background: uploading ? '#93c5fd' : theme.BLUE,
              color: '#fff',
              border: 'none',
              borderRadius: 8,
              fontSize: 14,
              fontWeight: 600,
              cursor: uploading ? 'not-allowed' : 'pointer',
              display: 'flex',
              alignItems: 'center',
              gap: 8,
              fontFamily: theme.FONT,
            }}
          >
            {uploading && <Loader2 size={16} style={{ animation: 'spin 1s linear infinite' }} />}
            Save to Library
          </button>
        </form>
      </div>

      <style>{`@keyframes spin { from { transform: rotate(0deg) } to { transform: rotate(360deg) } }`}</style>

      {/* Reference Grid */}
      {loading ? (
        <div style={{ display: 'flex', justifyContent: 'center', padding: 48 }}>
          <Loader2 size={28} color={theme.BLUE} style={{ animation: 'spin 1s linear infinite' }} />
        </div>
      ) : error ? (
        <div style={{ ...CARD, color: theme.RED, textAlign: 'center' }}>
          <AlertTriangle size={24} /> {error}
        </div>
      ) : displayed.length === 0 ? (
        <div style={{ ...CARD, textAlign: 'center', padding: 48, color: theme.TEXT_SECONDARY }}>
          <FolderOpen size={40} style={{ marginBottom: 12, opacity: 0.4 }} />
          <div style={{ fontWeight: 500 }}>No references found.</div>
          <div style={{ fontSize: 13, marginTop: 4 }}>Upload a document above to get started.</div>
        </div>
      ) : (
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: 16 }}>
          {displayed.map(ref => (
            <div key={ref.ref_id} style={CARD}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: 10 }}>
                <span
                  style={{
                    background: theme.VERDICT_BLUE_BG,
                    color: theme.VERDICT_BLUE_TEXT,
                    fontSize: 11,
                    fontWeight: 600,
                    padding: '2px 8px',
                    borderRadius: 99,
                  }}
                >
                  {DOC_LABEL[ref.doc_type] || ref.doc_type}
                </span>
                <button
                  onClick={() => handleDelete(ref.ref_id)}
                  style={{
                    background: 'none',
                    border: 'none',
                    cursor: 'pointer',
                    padding: 4,
                    color: theme.RED,
                    borderRadius: 6,
                  }}
                  title="Remove"
                >
                  <Trash2 size={15} />
                </button>
              </div>
              <div style={{ fontWeight: 600, fontSize: 14, color: theme.TEXT_PRIMARY, marginBottom: 4 }}>
                {ref.label}
              </div>
              <div style={{ fontSize: 12, color: theme.TEXT_SECONDARY, marginBottom: 10 }}>
                {fmt(ref.created_at)} · {ref.uploaded_by}
              </div>
              <div style={{ fontSize: 11, color: theme.TEXT_SECONDARY, marginBottom: 8, fontFamily: 'monospace' }}>
                ID: {ref.ref_id}
              </div>
              {Object.keys(ref.fields).length > 0 && (
                <div style={{ display: 'flex', flexWrap: 'wrap', gap: 4 }}>
                  {Object.entries(ref.fields).map(([k, v]) => (
                    <span
                      key={k}
                      title={`${k}: ${v}`}
                      style={{
                        background: 'rgba(255,255,255,0.05)',
                        color: theme.TEXT_SECONDARY,
                        fontSize: 11,
                        padding: '2px 7px',
                        borderRadius: 99,
                        maxWidth: 120,
                        overflow: 'hidden',
                        textOverflow: 'ellipsis',
                        whiteSpace: 'nowrap',
                      }}
                    >
                      {k}
                    </span>
                  ))}
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
