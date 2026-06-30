import { useState, useRef, useCallback } from 'react'
import {
  Upload, FileText, AlertCircle, Loader2, Camera, X, CheckCircle2
} from 'lucide-react'
import type { VerifyResponse } from '../types'
import { DOC_TYPES } from '../types'
import { verifyDocument } from '../api'

interface Props {
  onResult: (r: VerifyResponse) => void
}

export default function VerifyView({ onResult }: Props) {
  const [file, setFile] = useState<File | null>(null)
  const [applicantId, setApplicantId] = useState('')
  const [docType, setDocType] = useState('')
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [dragOver, setDragOver] = useState(false)
  const fileRef = useRef<HTMLInputElement>(null)

  const handleFile = (f: File) => {
    setFile(f)
    setError(null)
  }

  const onDrop = useCallback((e: React.DragEvent) => {
    e.preventDefault()
    setDragOver(false)
    const f = e.dataTransfer.files[0]
    if (f) handleFile(f)
  }, [])

  const onFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const f = e.target.files?.[0]
    if (f) handleFile(f)
  }

  const canSubmit = file && applicantId.trim() && docType && !loading

  const submit = async () => {
    if (!canSubmit) return
    setLoading(true)
    setError(null)
    try {
      const result = await verifyDocument(file, applicantId, docType)
      onResult(result)
    } catch (e: unknown) {
      setError(e instanceof Error ? e.message : 'Verification failed')
    } finally {
      setLoading(false)
    }
  }

  const fileSize = file ? (file.size / 1024).toFixed(0) + ' KB' : ''

  return (
    <div className="max-w-2xl mx-auto space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-navy-900">Document Verification</h1>
        <p className="text-slate-500 mt-1">
          Upload a document to detect forgery, tampering, or anomalies in real time.
        </p>
      </div>

      {/* Info strip */}
      <div className="bg-blue-50 border border-blue-200 rounded-xl p-4 flex gap-3">
        <AlertCircle className="w-5 h-5 text-blue-600 flex-shrink-0 mt-0.5" />
        <div className="text-sm text-blue-800">
          <p className="font-semibold mb-1">Fully offline analysis</p>
          <p>All detection runs locally — no document data leaves this system. Supports PDF,
          JPG, and PNG. Physical photographs and born-digital files both accepted.</p>
        </div>
      </div>

      {/* Upload area */}
      <div className="card p-6 space-y-5">
        {/* Drop zone */}
        <div
          onDragOver={(e) => { e.preventDefault(); setDragOver(true) }}
          onDragLeave={() => setDragOver(false)}
          onDrop={onDrop}
          onClick={() => fileRef.current?.click()}
          className={`border-2 border-dashed rounded-xl p-10 text-center cursor-pointer transition-colors
            ${dragOver
              ? 'border-blue-500 bg-blue-50'
              : file
                ? 'border-green-400 bg-green-50'
                : 'border-slate-300 hover:border-blue-400 hover:bg-slate-50'
            }`}
        >
          <input
            ref={fileRef}
            type="file"
            accept=".pdf,.jpg,.jpeg,.png,.webp"
            onChange={onFileChange}
            className="hidden"
          />
          {file ? (
            <div className="space-y-2">
              <CheckCircle2 className="w-12 h-12 text-green-500 mx-auto" />
              <p className="font-semibold text-green-700">{file.name}</p>
              <p className="text-sm text-green-600">{fileSize}</p>
              <button
                onClick={(e) => { e.stopPropagation(); setFile(null) }}
                className="text-sm text-slate-500 hover:text-red-500 flex items-center gap-1 mx-auto mt-1"
              >
                <X className="w-3.5 h-3.5" /> Remove
              </button>
            </div>
          ) : (
            <div className="space-y-3">
              <div className="flex justify-center gap-4">
                <Upload className="w-10 h-10 text-slate-400" />
                <Camera className="w-10 h-10 text-slate-400" />
              </div>
              <div>
                <p className="font-semibold text-slate-700">Drop document here or click to browse</p>
                <p className="text-sm text-slate-400 mt-1">PDF · JPG · PNG · WebP up to 20 MB</p>
              </div>
            </div>
          )}
        </div>

        {/* Form fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Applicant ID <span className="text-red-500">*</span>
            </label>
            <input
              type="text"
              value={applicantId}
              onChange={(e) => setApplicantId(e.target.value)}
              placeholder="e.g. APP001, CUST-2024-01"
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent"
            />
          </div>

          <div>
            <label className="block text-sm font-semibold text-slate-700 mb-1.5">
              Document Type <span className="text-red-500">*</span>
            </label>
            <select
              value={docType}
              onChange={(e) => setDocType(e.target.value)}
              className="w-full border border-slate-300 rounded-lg px-3 py-2.5 text-sm
                         focus:outline-none focus:ring-2 focus:ring-blue-500 focus:border-transparent
                         bg-white"
            >
              <option value="">Select document type...</option>
              {DOC_TYPES.map(d => (
                <option key={d.value} value={d.value}>{d.label}</option>
              ))}
            </select>
          </div>
        </div>

        {error && (
          <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex gap-2 items-start">
            <AlertCircle className="w-4 h-4 text-red-500 flex-shrink-0 mt-0.5" />
            <p className="text-sm text-red-700">{error}</p>
          </div>
        )}

        <button
          onClick={submit}
          disabled={!canSubmit}
          className="w-full btn-primary flex items-center justify-center gap-2 py-3"
        >
          {loading ? (
            <>
              <Loader2 className="w-5 h-5 animate-spin" />
              Analysing document...
            </>
          ) : (
            <>
              <FileText className="w-5 h-5" />
              Verify Document
            </>
          )}
        </button>
      </div>

      {/* What we check */}
      <div className="card p-6">
        <h3 className="font-semibold text-slate-700 mb-4">Detection Capabilities</h3>
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
          {[
            ['🔢', 'Salary math reconciliation', 'Gross − Deductions = Net'],
            ['📊', 'Bank balance verification', 'Every transaction row checked'],
            ['✅', 'Aadhaar Verhoeff checksum', 'Detects digit alteration'],
            ['💳', 'Cheque amount consistency', 'Words vs figures match'],
            ['🔗', 'Cross-document consistency', 'PAN, income, name across docs'],
            ['🏦', 'IFSC registry validation', 'Against offline RBI database'],
            ['🖼️', 'Image forensics', 'ELA, noise, screenshot detection'],
            ['🔄', 'Document recycling', 'Detects same doc for multiple applicants'],
          ].map(([icon, title, desc]) => (
            <div key={title} className="flex gap-3 p-3 bg-slate-50 rounded-lg">
              <span className="text-lg">{icon}</span>
              <div>
                <p className="text-sm font-medium text-slate-700">{title}</p>
                <p className="text-xs text-slate-500">{desc}</p>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  )
}
