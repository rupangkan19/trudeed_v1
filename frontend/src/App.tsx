import { useState } from 'react'
import type { VerifyResponse } from './types'
import AdminApp from './AdminApp'
import OfficerApp from './OfficerApp'
import { Shield, Lock, UserCheck } from 'lucide-react'
import { ThemeProvider } from './ThemeContext'

type Portal = 'home' | 'admin' | 'officer'

const FONT = 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif'

export default function App() {
  const [portal, setPortal] = useState<Portal>('home')
  const [userName, setUserName] = useState('')
  const [nameInput, setNameInput] = useState('')
  const [selectedRole, setSelectedRole] = useState<'admin' | 'officer' | null>(null)
  const [nameError, setNameError] = useState(false)

  const handleEnter = (role: 'admin' | 'officer') => {
    const input = nameInput.trim()
    if (!input) {
      setNameError(true)
      return
    }
    setNameError(false)
    setUserName(input)
    setPortal(role)
  }

  const handleCardClick = (role: 'admin' | 'officer') => {
    setSelectedRole(role)
    const input = nameInput.trim()
    if (!input) {
      setNameError(true)
      return
    }
    handleEnter(role)
  }

  if (portal === 'admin') {
    return <ThemeProvider><AdminApp onExit={() => setPortal('home')} userName={userName} /></ThemeProvider>
  }

  if (portal === 'officer') {
    return <ThemeProvider><OfficerApp onExit={() => { setPortal('home') }} userName={userName} /></ThemeProvider>
  }

  return (
    <ThemeProvider>
    <div
      style={{
        minHeight: '100vh',
        background: '#0f172a',
        display: 'flex',
        flexDirection: 'column',
        alignItems: 'center',
        justifyContent: 'center',
        fontFamily: FONT,
        padding: '24px',
        position: 'relative',
        overflow: 'hidden',
      }}
    >
      {/* Subtle background grid pattern */}
      <div
        style={{
          position: 'absolute',
          inset: 0,
          backgroundImage:
            'linear-gradient(rgba(255,255,255,0.03) 1px, transparent 1px), linear-gradient(90deg, rgba(255,255,255,0.03) 1px, transparent 1px)',
          backgroundSize: '40px 40px',
          pointerEvents: 'none',
        }}
      />

      {/* Glow orb */}
      <div
        style={{
          position: 'absolute',
          top: '20%',
          left: '50%',
          transform: 'translateX(-50%)',
          width: 600,
          height: 300,
          background: 'radial-gradient(ellipse at center, rgba(37,99,235,0.12) 0%, transparent 70%)',
          pointerEvents: 'none',
        }}
      />

      <div style={{ position: 'relative', zIndex: 1, width: '100%', maxWidth: 680 }}>
        {/* Logo & heading */}
        <div style={{ textAlign: 'center', marginBottom: 48 }}>
          <div
            style={{
              width: 72,
              height: 72,
              background: '#1e3a8a',
              borderRadius: 20,
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 20px',
              border: '1px solid rgba(59,130,246,0.4)',
              boxShadow: '0 0 40px rgba(37,99,235,0.25)',
            }}
          >
            <Shield size={36} color="#93c5fd" />
          </div>
          <h1
            style={{
              fontSize: 38,
              fontWeight: 800,
              color: '#f8fafc',
              margin: 0,
              letterSpacing: '-1.5px',
              lineHeight: 1,
            }}
          >
            TruDeed
          </h1>
          <p style={{ color: '#94a3b8', marginTop: 10, fontSize: 15, margin: '10px 0 0' }}>
            Real-time Document Forgery Detection
          </p>

          {/* 100% Offline badge */}
          <div
            style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: 6,
              background: 'rgba(22,163,74,0.12)',
              border: '1px solid rgba(22,163,74,0.3)',
              borderRadius: 20,
              padding: '5px 14px',
              marginTop: 14,
            }}
          >
            <div
              style={{
                width: 7,
                height: 7,
                background: '#22c55e',
                borderRadius: '50%',
                boxShadow: '0 0 8px #22c55e',
              }}
            />
            <span style={{ color: '#86efac', fontSize: 12, fontWeight: 600 }}>
              100% Offline — No Internet Required
            </span>
          </div>
        </div>

        {/* Name input */}
        <div style={{ marginBottom: 24 }}>
          <label
            style={{
              display: 'block',
              color: '#cbd5e1',
              fontSize: 13,
              fontWeight: 600,
              marginBottom: 8,
              textAlign: 'center',
            }}
          >
            Your Name
          </label>
          <input
            type="text"
            value={nameInput}
            onChange={(e) => {
              setNameInput(e.target.value)
              if (e.target.value.trim()) setNameError(false)
            }}
            placeholder="Enter your name to continue..."
            onKeyDown={(e) => {
              if (e.key === 'Enter' && selectedRole) handleEnter(selectedRole)
            }}
            style={{
              width: '100%',
              boxSizing: 'border-box',
              background: 'rgba(255,255,255,0.06)',
              border: nameError ? '1px solid #dc2626' : '1px solid rgba(255,255,255,0.12)',
              borderRadius: 10,
              padding: '12px 16px',
              color: '#f1f5f9',
              fontSize: 15,
              fontFamily: FONT,
              outline: 'none',
              textAlign: 'center',
              transition: 'border-color 0.2s',
            }}
            onFocus={(e) => {
              (e.target as HTMLInputElement).style.borderColor = '#3b82f6'
            }}
            onBlur={(e) => {
              if (!nameError) (e.target as HTMLInputElement).style.borderColor = 'rgba(255,255,255,0.12)'
            }}
          />
          {nameError && (
            <p
              style={{
                color: '#f87171',
                fontSize: 12,
                textAlign: 'center',
                marginTop: 6,
              }}
            >
              Please enter your name before selecting a portal
            </p>
          )}
        </div>

        {/* Portal cards */}
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: '1fr 1fr',
            gap: 20,
          }}
        >
          {/* Admin card */}
          <PortalCard
            icon={Lock}
            title="Admin Portal"
            description="Manage reference documents, review flagged cases, configure the system"
            accent="#6366f1"
            accentLight="rgba(99,102,241,0.15)"
            iconColor="#a5b4fc"
            actionLabel="Enter Admin"
            onClick={() => handleCardClick('admin')}
            selected={selectedRole === 'admin'}
          />

          {/* Officer card */}
          <PortalCard
            icon={UserCheck}
            title="Bank Officer"
            description="Upload and verify documents, detect forgery, manage applicant cases"
            accent="#3b82f6"
            accentLight="rgba(59,130,246,0.15)"
            iconColor="#93c5fd"
            actionLabel="Enter Officer Portal"
            onClick={() => handleCardClick('officer')}
            selected={selectedRole === 'officer'}
          />
        </div>

        {/* Footer */}
        <p
          style={{
            color: '#334155',
            marginTop: 36,
            fontSize: 12,
            textAlign: 'center',
          }}
        >
          Three-Pillar Forensics · Visual Analysis · Content Rules · Cross-Document Consistency
        </p>
      </div>
    </div>
    </ThemeProvider>
  )
}

interface PortalCardProps {
  icon: React.ElementType
  title: string
  description: string
  accent: string
  accentLight: string
  iconColor: string
  actionLabel: string
  onClick: () => void
  selected: boolean
}

function PortalCard({
  icon: Icon,
  title,
  description,
  accent,
  accentLight,
  iconColor,
  actionLabel,
  onClick,
  selected,
}: PortalCardProps) {
  const [hovered, setHovered] = useState(false)

  return (
    <button
      onClick={onClick}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      style={{
        background: hovered || selected ? accentLight : 'rgba(255,255,255,0.04)',
        border: `1px solid ${hovered || selected ? accent : 'rgba(255,255,255,0.09)'}`,
        borderRadius: 16,
        padding: '32px 28px',
        cursor: 'pointer',
        textAlign: 'center',
        transition: 'all 0.2s ease',
        transform: hovered ? 'translateY(-3px)' : 'translateY(0)',
        boxShadow: hovered ? `0 8px 24px rgba(0,0,0,0.3)` : 'none',
        fontFamily: 'Inter, -apple-system, BlinkMacSystemFont, "Segoe UI", sans-serif',
      }}
    >
      <div
        style={{
          width: 52,
          height: 52,
          background: accentLight,
          border: `1px solid ${accent}40`,
          borderRadius: 14,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          margin: '0 auto 18px',
          transition: 'background 0.2s',
        }}
      >
        <Icon size={24} color={iconColor} />
      </div>
      <h2
        style={{
          fontSize: 18,
          fontWeight: 700,
          color: '#f1f5f9',
          margin: '0 0 10px',
        }}
      >
        {title}
      </h2>
      <p
        style={{
          color: '#94a3b8',
          fontSize: 13,
          lineHeight: 1.6,
          margin: '0 0 20px',
        }}
      >
        {description}
      </p>
      <div
        style={{
          background: accent + '33',
          border: `1px solid ${accent}50`,
          borderRadius: 8,
          padding: '8px 16px',
          fontSize: 13,
          fontWeight: 600,
          color: iconColor,
          transition: 'background 0.2s',
        }}
      >
        {actionLabel} →
      </div>
    </button>
  )
}
