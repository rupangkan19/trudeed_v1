import { Shield, Upload, Clock, Users, FolderLock } from 'lucide-react'
import type { View } from '../types'

interface Props {
  current: View
  onNavigate: (v: View) => void
}

const links: { view: View; label: string; icon: typeof Shield }[] = [
  { view: 'verify', label: 'Verify', icon: Upload },
  { view: 'history', label: 'History', icon: Clock },
  { view: 'applicant', label: 'Applicant', icon: Users },
  { view: 'reference', label: 'References', icon: FolderLock },
]

export default function Navbar({ current, onNavigate }: Props) {
  return (
    <header className="bg-navy-900 shadow-lg">
      <div className="max-w-6xl mx-auto px-4 sm:px-6">
        <div className="flex items-center justify-between h-16">
          {/* Logo */}
          <button
            onClick={() => onNavigate('verify')}
            className="flex items-center gap-3 group"
          >
            <div className="w-9 h-9 bg-blue-500 rounded-lg flex items-center justify-center
                            group-hover:bg-blue-400 transition-colors">
              <Shield className="w-5 h-5 text-white" />
            </div>
            <div className="text-left">
              <span className="text-white font-bold text-lg leading-none">TruDeed</span>
              <p className="text-blue-300 text-xs leading-none">Document Verification</p>
            </div>
          </button>

          {/* Nav links */}
          <nav className="flex items-center gap-1">
            {links.map(({ view, label, icon: Icon }) => (
              <button
                key={view}
                onClick={() => onNavigate(view)}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors
                  ${current === view
                    ? 'bg-blue-600 text-white'
                    : 'text-blue-200 hover:text-white hover:bg-navy-800'
                  }`}
              >
                <Icon className="w-4 h-4" />
                {label}
              </button>
            ))}
          </nav>

          {/* Status badge */}
          <div className="flex items-center gap-2">
            <div className="w-2 h-2 bg-green-400 rounded-full animate-pulse" />
            <span className="text-blue-200 text-xs font-medium">OFFLINE MODE</span>
          </div>
        </div>
      </div>
    </header>
  )
}
