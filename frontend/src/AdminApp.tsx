import { useState } from 'react'
import { useTheme } from './ThemeContext'
import PageShell from './components/layout/PageShell'
import AdminDashboard from './pages/admin/AdminDashboard'
import ReferenceLibrary from './pages/admin/ReferenceLibrary'
import VerificationCenter from './pages/admin/VerificationCenter'
import Analytics from './pages/admin/Analytics'
import ApplicantMgmt from './pages/admin/ApplicantMgmt'
import AuditLog from './pages/admin/AuditLog'
import IFSCRegistry from './pages/admin/IFSCRegistry'
import AdminProfile from './pages/admin/AdminProfile'

interface Props {
  onExit: () => void
  userName: string
}

const PAGE_TITLES: Record<string, string> = {
  dashboard: 'Dashboard',
  'reference-all': 'Reference Library — All Documents',
  'reference-salary': 'Reference Library — Salary Slips',
  'reference-bank': 'Reference Library — Bank Statements',
  'reference-itr': 'Reference Library — ITR / Form 16',
  'reference-aadhaar': 'Reference Library — Aadhaar Cards',
  'reference-cheque': 'Reference Library — Cheques',
  'reference-property': 'Reference Library — Property Docs',
  reference: 'Reference Library',
  'verification-queue': 'Verification Center — Live Queue',
  'verification-pending': 'Verification Center — Pending Review',
  'verification-flagged': 'Verification Center — Flagged Cases',
  'verification-cleared': 'Verification Center — Cleared Cases',
  verification: 'Verification Center',
  'applicants-all': 'Applicant Management — All',
  'applicants-risk': 'Applicant Management — High Risk',
  'applicants-watchlist': 'Applicant Management — Watchlist',
  applicants: 'Applicant Management',
  'analytics-summary': 'Analytics — Detection Summary',
  'analytics-trends': 'Analytics — Fraud Trends',
  'analytics-risk': 'Analytics — Risk Distribution',
  'analytics-export': 'Analytics — Export',
  analytics: 'Analytics & Reports',
  'cases-open': 'Case Management — Open Cases',
  'cases-investigating': 'Case Management — Under Investigation',
  'cases-escalated': 'Case Management — Escalated',
  'cases-resolved': 'Case Management — Resolved',
  cases: 'Case Management',
  ifsc: 'Bank & IFSC Registry',
  rules: 'Rules Engine',
  audit: 'Audit Log',
  notifications: 'Notifications',
  'settings-general': 'Settings — General',
  'settings-thresholds': 'Settings — Detection Thresholds',
  'settings-users': 'Settings — User Management',
  settings: 'Settings',
  profile: 'My Profile',
}

function getDocTypeFilter(page: string): string | undefined {
  const map: Record<string, string> = {
    'reference-salary': 'SALARY_SLIP',
    'reference-bank': 'BANK_STATEMENT',
    'reference-itr': 'ITR',
    'reference-aadhaar': 'AADHAAR',
    'reference-cheque': 'CHEQUE',
  }
  return map[page]
}

function getVerificationFilter(page: string): 'all' | 'pending' | 'flagged' | 'cleared' | undefined {
  const map: Record<string, 'all' | 'pending' | 'flagged' | 'cleared'> = {
    'verification-queue': 'all',
    'verification-pending': 'pending',
    'verification-flagged': 'flagged',
    'verification-cleared': 'cleared',
  }
  return map[page]
}

// Placeholder for pages not yet routed
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

export default function AdminApp({ onExit, userName }: Props) {
  const [activePage, setActivePage] = useState('dashboard')

  const handleNavigate = (page: string) => {
    setActivePage(page)
  }

  const pageTitle = PAGE_TITLES[activePage] ?? activePage

  const renderContent = () => {
    // Dashboard
    if (activePage === 'dashboard') {
      return <AdminDashboard userName={userName} />
    }

    // Reference library pages
    if (
      activePage === 'reference' ||
      activePage === 'reference-all' ||
      activePage === 'reference-salary' ||
      activePage === 'reference-bank' ||
      activePage === 'reference-itr' ||
      activePage === 'reference-aadhaar' ||
      activePage === 'reference-cheque' ||
      activePage === 'reference-property'
    ) {
      const filterType = getDocTypeFilter(activePage)
      return <ReferenceLibrary filterType={filterType} />
    }

    // Verification center pages
    if (
      activePage === 'verification' ||
      activePage === 'verification-queue' ||
      activePage === 'verification-pending' ||
      activePage === 'verification-flagged' ||
      activePage === 'verification-cleared'
    ) {
      const filter = getVerificationFilter(activePage) ?? 'all'
      return <VerificationCenter filter={filter} />
    }

    // Applicant management
    if (
      activePage === 'applicants' ||
      activePage === 'applicants-all' ||
      activePage === 'applicants-risk' ||
      activePage === 'applicants-watchlist'
    ) {
      return <ApplicantMgmt />
    }

    // Analytics
    if (
      activePage === 'analytics' ||
      activePage === 'analytics-summary' ||
      activePage === 'analytics-trends' ||
      activePage === 'analytics-risk' ||
      activePage === 'analytics-export'
    ) {
      return <Analytics />
    }

    // Case management (stub — routes to verification center)
    if (activePage.startsWith('cases')) {
      return <VerificationCenter filter="all" />
    }

    // IFSC Registry
    if (activePage === 'ifsc') {
      return <IFSCRegistry />
    }

    // Audit log
    if (activePage === 'audit') {
      return <AuditLog />
    }

    // Profile
    if (activePage === 'profile') {
      return <AdminProfile userName={userName} />
    }

    // Rules engine (stub)
    if (activePage === 'rules') {
      return <ComingSoon title="Rules Engine" />
    }

    // Settings (stub)
    if (activePage.startsWith('settings')) {
      return <ComingSoon title="Settings" />
    }

    // Notifications (stub)
    if (activePage === 'notifications') {
      return <ComingSoon title="Notifications" />
    }

    return <AdminDashboard userName={userName} />
  }

  return (
    <PageShell
      role="admin"
      activePage={activePage}
      onNavigate={handleNavigate}
      userName={userName}
      pageTitle={pageTitle}
      onExit={onExit}
    >
      {renderContent()}
    </PageShell>
  )
}
