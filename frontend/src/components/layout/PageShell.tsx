import React, { useState } from 'react'
import { Bell, LogOut, Sun, Moon } from 'lucide-react'
import Sidebar from '../Sidebar'
import { useTheme } from '../../ThemeContext'

// ─── Types ────────────────────────────────────────────────────────────────────

interface PageShellProps {
  role: 'admin' | 'officer'
  activePage: string
  onNavigate: (page: string) => void
  userName: string
  children: React.ReactNode
  pageTitle: string
  badgeCounts?: { liveQueue?: number; pendingReview?: number; flaggedCases?: number }
  hasResult?: boolean
  onExit: () => void
}

// ─── PageShell ────────────────────────────────────────────────────────────────

export default function PageShell({
  role,
  activePage,
  onNavigate,
  userName,
  children,
  pageTitle,
  badgeCounts,
  hasResult = false,
  onExit,
}: PageShellProps) {
  const { theme, isDark, toggleTheme } = useTheme()
  const [collapsed, setCollapsed] = useState(false)

  const avatarInitials = userName
    ? userName
        .trim()
        .split(/\s+/)
        .map((word) => word.charAt(0).toUpperCase())
        .slice(0, 2)
        .join('')
    : '?'

  return (
    <div
      style={{
        display: 'flex',
        flexDirection: 'row',
        height: '100vh',
        overflow: 'hidden',
        fontFamily: theme.FONT,
      }}
    >
      {/* ── Sidebar ── */}
      <Sidebar
        role={role}
        activePage={activePage}
        onNavigate={onNavigate}
        collapsed={collapsed}
        onToggle={() => setCollapsed((prev) => !prev)}
        userName={userName}
        badgeCounts={badgeCounts}
        hasResult={hasResult}
      />

      {/* ── Right side: top bar + content ── */}
      <div
        style={{
          flex: 1,
          display: 'flex',
          flexDirection: 'column',
          overflow: 'hidden',
        }}
      >
        {/* ── Top bar ── */}
        <div
          style={{
            height: 52,
            background: theme.CARD_BG,
            borderBottom: `1px solid ${theme.BORDER}`,
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            padding: '0 24px',
            flexShrink: 0,
            boxSizing: 'border-box',
          }}
        >
          {/* Breadcrumb / page title */}
          <span
            style={{
              fontSize: 13,
              color: theme.TEXT_SECONDARY,
              fontWeight: 500,
              whiteSpace: 'nowrap',
              overflow: 'hidden',
              textOverflow: 'ellipsis',
            }}
          >
            {pageTitle}
          </span>

          {/* Right controls */}
          <div
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: 12,
              flexShrink: 0,
            }}
          >
            {/* Bell notification icon */}
            <button
              title="Notifications"
              style={{
                background: 'transparent',
                border: 'none',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                borderRadius: 6,
                color: theme.TEXT_SECONDARY,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement
                btn.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'
                btn.style.color = theme.TEXT_PRIMARY
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement
                btn.style.background = 'transparent'
                btn.style.color = theme.TEXT_SECONDARY
              }}
            >
              <Bell size={18} />
            </button>

            {/* Theme toggle */}
            <button
              onClick={toggleTheme}
              title={isDark ? 'Switch to light mode' : 'Switch to dark mode'}
              style={{
                background: 'transparent',
                border: `1px solid ${theme.BORDER}`,
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                padding: 6,
                borderRadius: 6,
                color: theme.TEXT_SECONDARY,
                transition: 'background 0.15s, color 0.15s',
              }}
              onMouseEnter={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = isDark ? 'rgba(255,255,255,0.06)' : '#f3f4f6'
                b.style.color = theme.TEXT_PRIMARY
              }}
              onMouseLeave={e => {
                const b = e.currentTarget as HTMLButtonElement
                b.style.background = 'transparent'
                b.style.color = theme.TEXT_SECONDARY
              }}
            >
              {isDark ? <Sun size={16} /> : <Moon size={16} />}
            </button>

            {/* Avatar circle */}
            <div
              title={userName}
              style={{
                width: 32,
                height: 32,
                borderRadius: '50%',
                background: '#2563eb',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                color: '#ffffff',
                fontWeight: 700,
                fontSize: 12,
                flexShrink: 0,
                userSelect: 'none',
              }}
            >
              {avatarInitials}
            </div>

            {/* Exit button */}
            <button
              onClick={onExit}
              title="Exit"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: 6,
                background: 'transparent',
                border: `1px solid ${theme.BORDER}`,
                borderRadius: 6,
                cursor: 'pointer',
                padding: '5px 10px',
                color: theme.TEXT_SECONDARY,
                fontSize: 12,
                fontWeight: 500,
                fontFamily: theme.FONT,
                transition: 'background 0.15s, color 0.15s, border-color 0.15s',
              }}
              onMouseEnter={(e) => {
                const btn = e.currentTarget as HTMLButtonElement
                btn.style.background = theme.VERDICT_RED_BG
                btn.style.color = theme.VERDICT_RED_TEXT
                btn.style.borderColor = theme.VERDICT_RED_BORDER
              }}
              onMouseLeave={(e) => {
                const btn = e.currentTarget as HTMLButtonElement
                btn.style.background = 'transparent'
                btn.style.color = theme.TEXT_SECONDARY
                btn.style.borderColor = theme.BORDER
              }}
            >
              <LogOut size={14} />
              <span>Exit</span>
            </button>
          </div>
        </div>

        {/* ── Content area ── */}
        <div
          style={{
            flex: 1,
            overflow: 'auto',
            padding: 24,
            background: theme.CONTENT_BG,
            boxSizing: 'border-box',
          }}
        >
          {children}
        </div>
      </div>
    </div>
  )
}
