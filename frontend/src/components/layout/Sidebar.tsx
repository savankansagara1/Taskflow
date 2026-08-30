import { NavLink, useNavigate } from 'react-router-dom'
import { useAuthStore } from '@/store/authStore'
import { cn } from '@/utils/cn'
import { Avatar } from '@/components/ui/Avatar'

interface NavItem {
  to: string
  icon: string
  label: string
}

const mainNav: NavItem[] = [
  { to: '/dashboard', icon: 'dashboard', label: 'Dashboard' },
  { to: '/projects', icon: 'folder_managed', label: 'Projects' },
  { to: '/tasks', icon: 'assignment', label: 'My Tasks' },
  { to: '/activity', icon: 'switch_account', label: 'Activity' },
]

const bottomNav: NavItem[] = [
  { to: '/profile', icon: 'person', label: 'Profile' },
  { to: '/settings', icon: 'settings', label: 'Settings' },
]

interface SidebarProps {
  onClose?: () => void
}

export default function Sidebar({ onClose }: SidebarProps) {
  const { user, logout } = useAuthStore()
  const navigate = useNavigate()

  const handleLogout = () => {
    logout()
    navigate('/login', { replace: true })
  }

  return (
    <div className="flex flex-col h-full bg-surface-container-low border-r border-outline-variant py-6 px-4">
      {/* ── Brand ──────────────────────────────────────────────────── */}
      <div className="flex items-center gap-3 mb-8 px-2">
        <div className="w-8 h-8 rounded-lg bg-primary flex items-center justify-center text-on-primary">
          <span className="material-symbols-outlined text-[18px]">account_tree</span>
        </div>
        <div>
          <h1 className="font-sans text-headline-sm font-bold text-primary leading-none">
            TaskFlow
          </h1>
          <span className="font-sans text-label-sm text-secondary block mt-0.5">
            Enterprise Edition
          </span>
        </div>
      </div>

      {/* ── Main Navigation ─────────────────────────────────────────── */}
      <nav className="flex-1">
        <ul className="space-y-1">
          {mainNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg font-sans text-body-md transition-colors cursor-pointer',
                    isActive
                      ? 'text-primary font-semibold border-r-2 border-primary bg-surface-container'
                      : 'text-secondary hover:bg-surface-container-high hover:text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn('material-symbols-outlined text-[20px]', isActive && 'fill')}
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}
        </ul>
      </nav>

      {/* ── Bottom Navigation ───────────────────────────────────────── */}
      <div className="mt-auto">
        {/* User info */}
        {user && (
          <div className="flex items-center gap-3 px-3 py-2 mb-2">
            <Avatar name={user.username} size="sm" />
            <div className="min-w-0">
              <p className="font-sans text-label-md font-medium text-on-surface truncate">
                {user.username}
              </p>
              <p className="font-sans text-label-sm text-secondary truncate">{user.email}</p>
            </div>
          </div>
        )}

        <ul className="space-y-1">
          {bottomNav.map((item) => (
            <li key={item.to}>
              <NavLink
                to={item.to}
                onClick={onClose}
                className={({ isActive }) =>
                  cn(
                    'flex items-center gap-3 px-3 py-2 rounded-lg font-sans text-body-md transition-colors cursor-pointer',
                    isActive
                      ? 'text-primary font-semibold bg-surface-container'
                      : 'text-secondary hover:bg-surface-container-high hover:text-primary'
                  )
                }
              >
                {({ isActive }) => (
                  <>
                    <span
                      className={cn('material-symbols-outlined text-[20px]', isActive && 'fill')}
                      style={isActive ? { fontVariationSettings: "'FILL' 1" } : undefined}
                    >
                      {item.icon}
                    </span>
                    <span>{item.label}</span>
                  </>
                )}
              </NavLink>
            </li>
          ))}

          {/* Logout */}
          <li>
            <button
              onClick={handleLogout}
              className="w-full flex items-center gap-3 px-3 py-2 rounded-lg font-sans text-body-md text-error hover:bg-error-container transition-colors cursor-pointer mt-2"
            >
              <span className="material-symbols-outlined text-[20px]">logout</span>
              <span>Logout</span>
            </button>
          </li>
        </ul>
      </div>
    </div>
  )
}

