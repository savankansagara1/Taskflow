import { useState } from 'react'
import { useLocation } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { Avatar } from '@/components/ui/Avatar'

const pageTitle: Record<string, string> = {
  '/dashboard': 'Dashboard',
  '/projects': 'Projects',
  '/tasks': 'My Tasks',
  '/profile': 'Profile',
  '/settings': 'Settings',
}

interface TopBarProps {
  onMenuClick: () => void
}

export default function TopBar({ onMenuClick }: TopBarProps) {
  const location = useLocation()
  const { user } = useAuthStore()
  const [search, setSearch] = useState('')

  const title = pageTitle[location.pathname] ?? 'TaskFlow'

  return (
    <header className="bg-surface-container-lowest border-b border-outline-variant h-16 flex items-center justify-between px-gutter z-40">
      {/* ── Left ─────────────────────────────────────────────────── */}
      <div className="flex items-center gap-4">
        {/* Mobile hamburger */}
        <button
          onClick={onMenuClick}
          className="md:hidden text-secondary hover:text-primary transition-colors p-1"
          aria-label="Open menu"
        >
          <span className="material-symbols-outlined">menu</span>
        </button>

        {/* Page title on mobile */}
        <h2 className="font-sans text-headline-sm font-bold text-primary md:hidden">{title}</h2>
      </div>

      {/* ── Right ────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 ml-auto">
        {/* Search */}
        <div className="relative hidden sm:block">
          <span className="material-symbols-outlined absolute left-2.5 top-1/2 -translate-y-1/2 text-secondary text-[18px] pointer-events-none">
            search
          </span>
          <input
            type="text"
            placeholder="Search..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="pl-9 pr-3 py-1.5 bg-surface border border-outline-variant rounded-full font-sans text-body-md text-on-surface placeholder:text-secondary focus:outline-none focus:border-primary focus:ring-1 focus:ring-primary transition-all w-52"
          />
        </div>

        {/* Notification icon (decorative — no backend support) */}
        <button
          className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container"
          title="Notifications (not available)"
        >
          <span className="material-symbols-outlined">notifications</span>
        </button>

        {/* Help icon (decorative) */}
        <button
          className="text-secondary hover:text-primary transition-colors p-1 rounded-full hover:bg-surface-container hidden sm:block"
          title="Help"
        >
          <span className="material-symbols-outlined">help_outline</span>
        </button>

        {/* User avatar */}
        {user && (
          <Avatar name={user.username} size="sm" className="cursor-pointer" />
        )}
      </div>
    </header>
  )
}

