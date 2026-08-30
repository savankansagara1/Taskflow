import { useState, type ReactNode } from 'react'
import Sidebar from './Sidebar'
import TopBar from './TopBar'

interface AppShellProps {
  children: ReactNode
}

export default function AppShell({ children }: AppShellProps) {
  const [sidebarOpen, setSidebarOpen] = useState(false)

  return (
    <div className="min-h-screen bg-background flex">
      {/* ── Desktop Sidebar (fixed, 240px) ──────────────────────────── */}
      <aside className="hidden md:flex flex-col fixed inset-y-0 left-0 w-60 z-50">
        <Sidebar />
      </aside>

      {/* ── Mobile Sidebar (slide-in sheet) ─────────────────────────── */}
      {sidebarOpen && (
        <>
          {/* Backdrop */}
          <div
            className="fixed inset-0 bg-inverse-surface/40 z-40 md:hidden"
            onClick={() => setSidebarOpen(false)}
            aria-hidden="true"
          />
          {/* Sheet */}
          <aside className="fixed inset-y-0 left-0 w-60 z-50 md:hidden shadow-drawer">
            <Sidebar onClose={() => setSidebarOpen(false)} />
          </aside>
        </>
      )}

      {/* ── Main Content ─────────────────────────────────────────────── */}
      <div className="flex-1 flex flex-col md:ml-60">
        {/* TopBar */}
        <div className="fixed top-0 right-0 left-0 md:left-60 z-40">
          <TopBar onMenuClick={() => setSidebarOpen(true)} />
        </div>

        {/* Page content */}
        <main className="flex-1 pt-16 min-h-screen">
          {children}
        </main>
      </div>
    </div>
  )
}

