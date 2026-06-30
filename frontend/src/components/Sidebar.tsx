import React, { useState } from 'react'
import { useTheme } from '../ThemeContext'
import {
  LayoutDashboard,
  FolderOpen,
  ShieldCheck,
  Users,
  BarChart3,
  ClipboardList,
  Building2,
  Sliders,
  FileText,
  Bell,
  Settings,
  UserCircle,
  ChevronLeft,
  ChevronRight,
  ChevronDown,
  ChevronUp,
  Upload,
  FileSearch,
  Search,
  Folder,
  Wrench,
  BookOpen,
  TrendingUp,
  Activity,
} from 'lucide-react'

// ─── Types ────────────────────────────────────────────────────────────────────

interface BadgeCounts {
  liveQueue?: number
  pendingReview?: number
  flaggedCases?: number
}

interface SidebarProps {
  role: 'admin' | 'officer'
  activePage: string
  onNavigate: (page: string) => void
  collapsed: boolean
  onToggle: () => void
  userName: string
  badgeCounts?: BadgeCounts
  hasResult?: boolean
}

interface NavChild {
  id: string
  label: string
  badgeKey?: keyof BadgeCounts
  badge?: string
}

interface NavItem {
  id: string
  label: string
  icon: React.ElementType
  section: string
  children?: NavChild[]
  badge?: string
  badgeKey?: keyof BadgeCounts
  special?: boolean
  hidden?: boolean
}

// ─── Nav data ─────────────────────────────────────────────────────────────────

const adminNavItems: NavItem[] = [
  // Section ""
  { id: 'dashboard', label: 'Dashboard', icon: LayoutDashboard, section: '' },

  // Section "MANAGEMENT"
  {
    id: 'reference',
    label: 'Reference Library',
    icon: FolderOpen,
    section: 'MANAGEMENT',
    children: [
      { id: 'reference-all', label: 'All Documents' },
      { id: 'reference-salary', label: 'Salary Slips' },
      { id: 'reference-bank', label: 'Bank Statements' },
      { id: 'reference-itr', label: 'ITR / Form 16' },
      { id: 'reference-aadhaar', label: 'Aadhaar Cards' },
      { id: 'reference-cheque', label: 'Cheques' },
      { id: 'reference-property', label: 'Property Docs' },
    ],
  },
  {
    id: 'verification',
    label: 'Verification Center',
    icon: ShieldCheck,
    section: 'MANAGEMENT',
    children: [
      { id: 'verification-queue', label: 'Live Queue', badgeKey: 'liveQueue' },
      { id: 'verification-pending', label: 'Pending Review', badgeKey: 'pendingReview' },
      { id: 'verification-flagged', label: 'Flagged Cases', badgeKey: 'flaggedCases' },
      { id: 'verification-cleared', label: 'Cleared Cases' },
    ],
  },
  {
    id: 'applicants',
    label: 'Applicant Management',
    icon: Users,
    section: 'MANAGEMENT',
    children: [
      { id: 'applicants-all', label: 'All Applicants' },
      { id: 'applicants-risk', label: 'High Risk' },
      { id: 'applicants-watchlist', label: 'Watchlist' },
    ],
  },

  // Section "INTELLIGENCE"
  {
    id: 'analytics',
    label: 'Analytics & Reports',
    icon: BarChart3,
    section: 'INTELLIGENCE',
    children: [
      { id: 'analytics-summary', label: 'Detection Summary' },
      { id: 'analytics-trends', label: 'Fraud Trends' },
      { id: 'analytics-risk', label: 'Risk Distribution' },
      { id: 'analytics-export', label: 'Export CSV' },
    ],
  },
  {
    id: 'cases',
    label: 'Case Management',
    icon: ClipboardList,
    section: 'INTELLIGENCE',
    children: [
      { id: 'cases-open', label: 'Open Cases' },
      { id: 'cases-investigating', label: 'Under Investigation' },
      { id: 'cases-escalated', label: 'Escalated' },
      { id: 'cases-resolved', label: 'Resolved' },
    ],
  },
  { id: 'ifsc', label: 'Bank & IFSC Registry', icon: Building2, section: 'INTELLIGENCE' },
  { id: 'rules', label: 'Rules Engine', icon: Sliders, section: 'INTELLIGENCE' },

  // Section "SYSTEM"
  { id: 'audit', label: 'Audit Log', icon: FileText, section: 'SYSTEM' },
  { id: 'notifications', label: 'Notifications', icon: Bell, section: 'SYSTEM', badge: '3' },
  {
    id: 'settings',
    label: 'Settings',
    icon: Settings,
    section: 'SYSTEM',
    children: [
      { id: 'settings-general', label: 'General' },
      { id: 'settings-thresholds', label: 'Detection Thresholds' },
      { id: 'settings-users', label: 'User Management' },
    ],
  },

  // Section "" (bottom)
  { id: 'profile', label: 'Profile', icon: UserCircle, section: 'BOTTOM' },
]

function buildOfficerNavItems(hasResult: boolean): NavItem[] {
  return [
    // Section ""
    { id: 'dashboard', label: 'My Dashboard', icon: LayoutDashboard, section: '' },

    // Section "VERIFICATION"
    { id: 'verify', label: 'Verify Document', icon: Upload, section: 'VERIFICATION', special: true },
    ...(hasResult
      ? [{ id: 'last-result', label: 'Last Result', icon: FileSearch, section: 'VERIFICATION' } as NavItem]
      : []),
    {
      id: 'submissions',
      label: 'My Submissions',
      icon: ClipboardList,
      section: 'VERIFICATION',
      children: [
        { id: 'submissions-today', label: 'Today' },
        { id: 'submissions-week', label: 'This Week' },
        { id: 'submissions-all', label: 'All History' },
      ],
    },

    // Section "TOOLS"
    { id: 'applicant-lookup', label: 'Applicant Lookup', icon: Search, section: 'TOOLS' },
    {
      id: 'case-tracker',
      label: 'Case Tracker',
      icon: Folder,
      section: 'TOOLS',
      children: [
        { id: 'case-tracker-active', label: 'My Active Cases' },
        { id: 'case-tracker-pending', label: 'Pending Review' },
        { id: 'case-tracker-resolved', label: 'Resolved' },
      ],
    },
    {
      id: 'quick-tools',
      label: 'Quick Tools',
      icon: Wrench,
      section: 'TOOLS',
      children: [
        { id: 'quick-ifsc', label: 'IFSC Validator' },
        { id: 'quick-pan', label: 'PAN Validator' },
        { id: 'quick-aadhaar', label: 'Aadhaar Checksum' },
        { id: 'quick-amount', label: 'Amount → Words' },
      ],
    },

    // Section "KNOWLEDGE"
    {
      id: 'doc-guide',
      label: 'Document Guide',
      icon: BookOpen,
      section: 'KNOWLEDGE',
      children: [
        { id: 'guide-salary', label: 'Salary Slip Guide' },
        { id: 'guide-bank', label: 'Bank Statement Guide' },
        { id: 'guide-itr', label: 'ITR Guide' },
        { id: 'guide-form16', label: 'Form 16 Guide' },
        { id: 'guide-aadhaar', label: 'Aadhaar Guide' },
        { id: 'guide-cheque', label: 'Cheque Guide' },
      ],
    },

    // Section "INSIGHTS"
    { id: 'stats', label: 'My Statistics', icon: TrendingUp, section: 'INSIGHTS' },
    { id: 'performance', label: 'Performance', icon: Activity, section: 'INSIGHTS' },

    // Section "SYSTEM"
    { id: 'notifications', label: 'Notifications', icon: Bell, section: 'SYSTEM', badge: '2' },
    { id: 'profile', label: 'Profile', icon: UserCircle, section: 'SYSTEM' },
  ]
}

// ─── Badge pill ───────────────────────────────────────────────────────────────

function Badge({ value }: { value: string | number }) {
  if (!value && value !== 0) return null
  return (
    <span
      style={{
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        minWidth: 18,
        height: 18,
        padding: '0 5px',
        borderRadius: 9,
        background: '#dc2626',
        color: '#fff',
        fontSize: 10,
        fontWeight: 600,
        lineHeight: 1,
        marginLeft: 'auto',
        flexShrink: 0,
      }}
    >
      {value}
    </span>
  )
}

// ─── Section label ────────────────────────────────────────────────────────────

function SectionLabel({ label, font }: { label: string; font: string }) {
  return (
    <div
      style={{
        padding: '12px 16px 4px',
        fontSize: 10,
        fontWeight: 600,
        textTransform: 'uppercase',
        letterSpacing: '0.08em',
        color: '#64748b',
        fontFamily: font,
        userSelect: 'none',
      }}
    >
      {label}
    </div>
  )
}

// ─── Main Sidebar component ───────────────────────────────────────────────────

export default function Sidebar({
  role,
  activePage,
  onNavigate,
  collapsed,
  onToggle,
  userName,
  badgeCounts = {},
  hasResult = false,
}: SidebarProps) {
  const { theme } = useTheme()
  const { SIDEBAR_BG, SIDEBAR_HOVER, SIDEBAR_ACTIVE_BG, SIDEBAR_ACTIVE_BAR, FONT } = theme
  const [expandedItems, setExpandedItems] = useState<Set<string>>(new Set())
  const [hoveredItem, setHoveredItem] = useState<string | null>(null)

  const navItems = role === 'admin' ? adminNavItems : buildOfficerNavItems(hasResult)

  // Determine which parent (if any) contains the active page
  const activeParentId = navItems.find(
    (item) => item.children?.some((child) => child.id === activePage)
  )?.id ?? null

  function toggleExpand(id: string) {
    setExpandedItems((prev) => {
      const next = new Set(prev)
      if (next.has(id)) {
        next.delete(id)
      } else {
        next.add(id)
      }
      return next
    })
  }

  function isItemActive(item: NavItem): boolean {
    if (item.id === activePage) return true
    if (item.children?.some((c) => c.id === activePage)) return true
    return false
  }

  function resolveBadge(item: NavItem | NavChild, isBadgeCounts?: BadgeCounts): string | number | undefined {
    if ('badgeKey' in item && item.badgeKey && isBadgeCounts) {
      const val = isBadgeCounts[item.badgeKey]
      return val !== undefined ? val : undefined
    }
    if ('badge' in item && item.badge) return item.badge
    return undefined
  }

  // Group items by section, preserving order
  const sections: { label: string; items: NavItem[] }[] = []
  const seenSections = new Map<string, NavItem[]>()

  for (const item of navItems) {
    const sec = item.section
    if (!seenSections.has(sec)) {
      seenSections.set(sec, [])
      sections.push({ label: sec, items: seenSections.get(sec)! })
    }
    seenSections.get(sec)!.push(item)
  }

  const avatarLetter = userName ? userName.charAt(0).toUpperCase() : '?'
  const roleLabel = role === 'admin' ? 'Administrator' : 'Officer'

  return (
    <div
      style={{
        width: collapsed ? 58 : 240,
        minWidth: collapsed ? 58 : 240,
        height: '100vh',
        background: SIDEBAR_BG,
        display: 'flex',
        flexDirection: 'column',
        fontFamily: FONT,
        transition: 'width 0.25s ease, min-width 0.25s ease',
        overflow: 'hidden',
        boxSizing: 'border-box',
        position: 'relative',
        zIndex: 10,
      }}
    >
      {/* ── Top bar ── */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: collapsed ? 'center' : 'space-between',
          padding: collapsed ? '14px 0' : '14px 12px 14px 16px',
          borderBottom: '1px solid rgba(255,255,255,0.06)',
          flexShrink: 0,
        }}
      >
        {!collapsed && (
          <span
            style={{
              color: '#fff',
              fontWeight: 700,
              fontSize: 15,
              letterSpacing: '-0.01em',
              whiteSpace: 'nowrap',
              overflow: 'hidden',
            }}
          >
            TruDeed
          </span>
        )}
        <button
          onClick={onToggle}
          title={collapsed ? 'Expand sidebar' : 'Collapse sidebar'}
          style={{
            background: 'transparent',
            border: 'none',
            cursor: 'pointer',
            color: '#9ca3af',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            padding: 4,
            borderRadius: 4,
            flexShrink: 0,
            transition: 'color 0.15s',
          }}
          onMouseEnter={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#fff')}
          onMouseLeave={(e) => ((e.currentTarget as HTMLButtonElement).style.color = '#9ca3af')}
        >
          {collapsed ? <ChevronRight size={18} /> : <ChevronLeft size={18} />}
        </button>
      </div>

      {/* ── Scrollable nav ── */}
      <div
        style={{
          flex: 1,
          overflowY: 'auto',
          overflowX: 'hidden',
          paddingBottom: 8,
          scrollbarWidth: 'thin',
          scrollbarColor: 'rgba(255,255,255,0.1) transparent',
        }}
      >
        {sections.map((section, sIdx) => (
          <div key={`section-${sIdx}`}>
            {/* Section label */}
            {!collapsed && section.label && section.label !== 'BOTTOM' && (
              <SectionLabel label={section.label} font={FONT} />
            )}

            {section.items.map((item) => {
              const Icon = item.icon
              const isActive = isItemActive(item)
              const isExpanded = expandedItems.has(item.id)
              const hasChildren = item.children && item.children.length > 0
              const badgeVal = resolveBadge(item, badgeCounts)
              const isHovered = hoveredItem === item.id

              // Special "Verify Document" button style
              if (item.special && !collapsed) {
                return (
                  <div key={item.id} style={{ padding: '4px 8px' }}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      title={item.label}
                      style={{
                        width: '100%',
                        display: 'flex',
                        alignItems: 'center',
                        gap: 10,
                        background: '#1d4ed8',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        padding: '10px 12px',
                        color: '#fff',
                        fontFamily: FONT,
                        fontSize: 13,
                        fontWeight: 600,
                        transition: 'background 0.15s',
                        boxSizing: 'border-box',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background = '#1e40af')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8')
                      }
                    >
                      <Icon size={18} />
                      <span>{item.label}</span>
                    </button>
                  </div>
                )
              }

              // Special collapsed "Verify Document"
              if (item.special && collapsed) {
                return (
                  <div key={item.id} style={{ padding: '4px 0', display: 'flex', justifyContent: 'center' }}>
                    <button
                      onClick={() => onNavigate(item.id)}
                      title={item.label}
                      style={{
                        width: 38,
                        height: 38,
                        display: 'flex',
                        alignItems: 'center',
                        justifyContent: 'center',
                        background: '#1d4ed8',
                        border: 'none',
                        borderRadius: 8,
                        cursor: 'pointer',
                        color: '#fff',
                        transition: 'background 0.15s',
                      }}
                      onMouseEnter={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background = '#1e40af')
                      }
                      onMouseLeave={(e) =>
                        ((e.currentTarget as HTMLButtonElement).style.background = '#1d4ed8')
                      }
                    >
                      <Icon size={18} />
                    </button>
                  </div>
                )
              }

              return (
                <div key={item.id}>
                  {/* Parent row */}
                  <div
                    role="button"
                    tabIndex={0}
                    title={collapsed ? item.label : undefined}
                    onClick={() => {
                      if (hasChildren) {
                        if (!collapsed) toggleExpand(item.id)
                      } else {
                        onNavigate(item.id)
                      }
                    }}
                    onKeyDown={(e) => {
                      if (e.key === 'Enter' || e.key === ' ') {
                        e.preventDefault()
                        if (hasChildren) {
                          if (!collapsed) toggleExpand(item.id)
                        } else {
                          onNavigate(item.id)
                        }
                      }
                    }}
                    onMouseEnter={() => setHoveredItem(item.id)}
                    onMouseLeave={() => setHoveredItem(null)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: collapsed ? 0 : 10,
                      padding: collapsed ? '8px 0' : '8px 16px',
                      justifyContent: collapsed ? 'center' : 'flex-start',
                      cursor: 'pointer',
                      background: isActive ? SIDEBAR_ACTIVE_BG : isHovered ? SIDEBAR_HOVER : 'transparent',
                      borderLeft: isActive && !collapsed ? `3px solid ${SIDEBAR_ACTIVE_BAR}` : '3px solid transparent',
                      color: isActive ? '#fff' : '#d1d5db',
                      transition: 'background 0.15s, color 0.15s',
                      userSelect: 'none',
                      outline: 'none',
                      position: 'relative',
                    }}
                  >
                    {/* Icon */}
                    <Icon
                      size={18}
                      style={{ flexShrink: 0, color: isActive ? '#fff' : '#9ca3af' }}
                    />

                    {/* Label + badge + expand chevron */}
                    {!collapsed && (
                      <>
                        <span
                          style={{
                            fontSize: 13,
                            fontWeight: isActive ? 600 : 400,
                            whiteSpace: 'nowrap',
                            overflow: 'hidden',
                            textOverflow: 'ellipsis',
                            flex: 1,
                          }}
                        >
                          {item.label}
                        </span>

                        {badgeVal !== undefined && <Badge value={badgeVal} />}

                        {hasChildren && (
                          <span style={{ color: '#6b7280', flexShrink: 0, marginLeft: badgeVal !== undefined ? 4 : 'auto' }}>
                            {isExpanded ? <ChevronUp size={14} /> : <ChevronDown size={14} />}
                          </span>
                        )}
                      </>
                    )}

                    {/* Badge for collapsed state (top-right dot) */}
                    {collapsed && badgeVal !== undefined && (
                      <span
                        style={{
                          position: 'absolute',
                          top: 6,
                          right: 8,
                          width: 8,
                          height: 8,
                          borderRadius: '50%',
                          background: '#dc2626',
                          border: '1.5px solid #0c1120',
                        }}
                      />
                    )}
                  </div>

                  {/* Children */}
                  {!collapsed && hasChildren && isExpanded && (
                    <div>
                      {item.children!.map((child) => {
                        const childActive = child.id === activePage
                        const childBadge = resolveBadge(child, badgeCounts)
                        const childHovered = hoveredItem === child.id
                        return (
                          <div
                            key={child.id}
                            role="button"
                            tabIndex={0}
                            onClick={() => onNavigate(child.id)}
                            onKeyDown={(e) => {
                              if (e.key === 'Enter' || e.key === ' ') {
                                e.preventDefault()
                                onNavigate(child.id)
                              }
                            }}
                            onMouseEnter={() => setHoveredItem(child.id)}
                            onMouseLeave={() => setHoveredItem(null)}
                            style={{
                              display: 'flex',
                              alignItems: 'center',
                              gap: 8,
                              padding: '6px 16px 6px 44px',
                              cursor: 'pointer',
                              background: childActive ? SIDEBAR_ACTIVE_BG : childHovered ? SIDEBAR_HOVER : 'transparent',
                              borderLeft: childActive ? `3px solid ${SIDEBAR_ACTIVE_BAR}` : '3px solid transparent',
                              color: childActive ? '#fff' : '#9ca3af',
                              fontSize: 12,
                              fontWeight: childActive ? 600 : 400,
                              transition: 'background 0.15s, color 0.15s',
                              userSelect: 'none',
                              outline: 'none',
                            }}
                          >
                            <span
                              style={{
                                width: 5,
                                height: 5,
                                borderRadius: '50%',
                                background: childActive ? SIDEBAR_ACTIVE_BAR : '#4b5563',
                                flexShrink: 0,
                              }}
                            />
                            <span
                              style={{
                                flex: 1,
                                whiteSpace: 'nowrap',
                                overflow: 'hidden',
                                textOverflow: 'ellipsis',
                              }}
                            >
                              {child.label}
                            </span>
                            {childBadge !== undefined && <Badge value={childBadge} />}
                          </div>
                        )
                      })}
                    </div>
                  )}
                </div>
              )
            })}
          </div>
        ))}
      </div>

      {/* ── Bottom user info ── */}
      <div
        style={{
          flexShrink: 0,
          borderTop: '1px solid rgba(255,255,255,0.06)',
          padding: collapsed ? '12px 0' : '12px 16px',
          display: 'flex',
          alignItems: 'center',
          gap: collapsed ? 0 : 10,
          justifyContent: collapsed ? 'center' : 'flex-start',
          background: SIDEBAR_BG,
        }}
      >
        {/* Avatar */}
        <div
          style={{
            width: 32,
            height: 32,
            borderRadius: '50%',
            background: '#1d4ed8',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            color: '#fff',
            fontWeight: 700,
            fontSize: 13,
            flexShrink: 0,
          }}
          title={collapsed ? userName : undefined}
        >
          {avatarLetter}
        </div>

        {!collapsed && (
          <div style={{ overflow: 'hidden' }}>
            <div
              style={{
                color: '#f9fafb',
                fontSize: 13,
                fontWeight: 600,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {userName}
            </div>
            <div
              style={{
                color: '#6b7280',
                fontSize: 11,
                whiteSpace: 'nowrap',
                overflow: 'hidden',
                textOverflow: 'ellipsis',
              }}
            >
              {roleLabel}
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
