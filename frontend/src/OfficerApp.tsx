import { useState } from 'react'
import { useTheme } from './ThemeContext'
import type { VerifyResponse } from './types'
import PageShell from './components/layout/PageShell'
import OfficerDashboard from './pages/officer/OfficerDashboard'
import VerifyPage from './pages/officer/VerifyPage'
import MySubmissions from './pages/officer/MySubmissions'
import ApplicantLookup from './pages/officer/ApplicantLookup'
import QuickTools from './pages/officer/QuickTools'
import DocumentGuide from './pages/officer/DocumentGuide'
import OfficerStats from './pages/officer/OfficerStats'
import OfficerProfile from './pages/officer/OfficerProfile'

interface Props {
  onExit: () => void
  userName: string
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'My Dashboard',
  verify: 'Verify Document',
  'last-result': 'Last Result',
  submissions: 'My Submissions',
  'submissions-today': 'Submissions — Today',
  'submissions-week': 'Submissions — This Week',
  'submissions-all': 'Submissions — All History',
  'applicant-lookup': 'Applicant Lookup',
  'case-tracker': 'Case Tracker',
  'case-tracker-active': 'Case Tracker — My Active Cases',
  'case-tracker-pending': 'Case Tracker — Pending Review',
  'case-tracker-resolved': 'Case Tracker — Resolved',
  'quick-tools': 'Quick Tools',
  'quick-ifsc': 'Quick Tools — IFSC Validator',
  'quick-pan': 'Quick Tools — PAN Validator',
  'quick-aadhaar': 'Quick Tools — Aadhaar Checksum',
  'quick-amount': 'Quick Tools — Amount → Words',
  'doc-guide': 'Document Guide',
  'guide-salary': 'Document Guide — Salary Slip',
  'guide-bank': 'Document Guide — Bank Statement',
  'guide-itr': 'Document Guide — ITR',
  'guide-form16': 'Document Guide — Form 16',
  'guide-aadhaar': 'Document Guide — Aadhaar',
  'guide-cheque': 'Document Guide — Cheque',
  stats: 'My Statistics',
  performance: 'Performance',
  notifications: 'Notifications',
  profile: 'My Profile',
}

function getSubmissionsFilter(page: string): 'today' | 'week' | 'all' {
  if (page === 'submissions-today') return 'today'
  if (page === 'submissions-week') return 'week'
  return 'all'
}

// Placeholder for unimplemented pages
function ComingSoon({ title }: { title: string }) {
  const { theme } = useTheme()
  return (
    <div
      style={{
        background: theme.CARD_BG,
        borderRadius: 12,
        border: `1px solid ${theme.BORDER}`,
        boxShadow: theme.SHADOW,
        padding: 48,
        textAlign: 'center',
      }}
    >
      <div style={{ fontSize: 48, marginBottom: 16 }}>🔧</div>
      <h2 style={{ color: theme.TEXT_PRIMARY, fontSize: 20, fontWeight: 700, margin: '0 0 8px' }}>{title}</h2>
      <p style={{ color: theme.TEXT_SECONDARY, fontSize: 14 }}>This section is under construction.</p>
    </div>
  )
}

export default function OfficerApp({ onExit, userName }: Props) {
  const [activePage, setActivePage] = useState('dashboard')
  const [lastResult, setLastResult] = useState<VerifyResponse | null>(null)

  const hasResult = lastResult !== null

  const handleNavigate = (page: string) => {
    setActivePage(page)
  }

  const handleResult = (r: VerifyResponse) => {
    setLastResult(r)
    setActivePage('last-result')
  }

  const pageTitle = PAGE_TITLES[activePage] ?? activePage

  const renderContent = () => {
    // Dashboard
    if (activePage === 'dashboard') {
      return <OfficerDashboard userName={userName} onNavigate={handleNavigate} />
    }

    // Verify document
    if (activePage === 'verify') {
      return <VerifyPage onResult={handleResult} lastResult={null} />
    }

    // Last result
    if (activePage === 'last-result') {
      return <VerifyPage onResult={handleResult} lastResult={lastResult} />
    }

    // Submissions
    if (
      activePage === 'submissions' ||
      activePage === 'submissions-today' ||
      activePage === 'submissions-week' ||
      activePage === 'submissions-all'
    ) {
      const filter = getSubmissionsFilter(activePage)
      return <MySubmissions filter={filter} />
    }

    // Applicant lookup
    if (activePage === 'applicant-lookup') {
      return <ApplicantLookup />
    }

    // Case tracker (reuses submissions for now)
    if (activePage.startsWith('case-tracker')) {
      return <MySubmissions filter="all" />
    }

    // Quick tools
    if (
      activePage === 'quick-tools' ||
      activePage === 'quick-ifsc' ||
      activePage === 'quick-pan' ||
      activePage === 'quick-aadhaar' ||
      activePage === 'quick-amount'
    ) {
      return <QuickTools />
    }

    // Document guide
    if (activePage === 'doc-guide' || activePage.startsWith('guide-')) {
      return <DocumentGuide />
    }

    // Stats / performance
    if (activePage === 'stats' || activePage === 'performance') {
      return <OfficerStats />
    }

    // Profile
    if (activePage === 'profile') {
      return <OfficerProfile userName={userName} />
    }

    // Notifications (stub)
    if (activePage === 'notifications') {
      return <ComingSoon title="Notifications" />
    }

    return <OfficerDashboard userName={userName} onNavigate={handleNavigate} />
  }

  return (
    <PageShell
      role="officer"
      activePage={activePage}
      onNavigate={handleNavigate}
      userName={userName}
      pageTitle={pageTitle}
      hasResult={hasResult}
      onExit={onExit}
    >
      {renderContent()}
    </PageShell>
  )
}
