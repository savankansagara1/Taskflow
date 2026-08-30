import { useState } from 'react'
import Button from '@/components/ui/Button'
import toast from 'react-hot-toast'

export default function SettingsPage() {
  const [compactView, setCompactView] = useState(false)
  const [emailNotifications, setEmailNotifications] = useState(true)

  const handleSave = () => {
    toast.success('Preferences saved locally')
  }

  return (
    <div className="p-container-padding max-w-3xl mx-auto w-full space-y-stack-lg">
      <div>
        <h1 className="font-sans text-headline-lg font-bold text-primary">Settings</h1>
        <p className="font-sans text-body-md text-secondary mt-1">
          Configure your workspace appearance and preferences.
        </p>
      </div>

      <div className="bg-surface-container-lowest border border-outline-variant rounded-xl p-8 shadow-card space-y-8">
        {/* Appearance Section */}
        <div className="space-y-4">
          <h2 className="font-sans text-headline-sm font-semibold text-primary pb-2 border-b border-surface-variant">
            Appearance & Theme
          </h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-sans text-body-md font-medium text-primary">Theme Mode</p>
              <p className="font-sans text-label-sm text-secondary">
                TaskFlow uses a strict monochrome light-mode design system.
              </p>
            </div>
            <span className="font-sans text-label-sm px-3 py-1 rounded bg-surface-container text-primary font-medium">
              Light (Monochrome)
            </span>
          </div>

          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-sans text-body-md font-medium text-primary">Compact Density</p>
              <p className="font-sans text-label-sm text-secondary">
                Reduce vertical table row padding for higher data density.
              </p>
            </div>
            <input
              type="checkbox"
              checked={compactView}
              onChange={(e) => setCompactView(e.target.checked)}
              className="w-4 h-4 text-primary bg-surface-container rounded border-outline-variant focus:ring-0 cursor-pointer"
            />
          </div>
        </div>

        {/* Backend & API Section */}
        <div className="space-y-4">
          <h2 className="font-sans text-headline-sm font-semibold text-primary pb-2 border-b border-surface-variant">
            Backend API Connection
          </h2>
          <div className="flex items-center justify-between py-2">
            <div>
              <p className="font-sans text-body-md font-medium text-primary">FastAPI Service</p>
              <p className="font-sans text-label-sm text-secondary">
                Connected to local server via <code className="font-mono text-code text-xs">/api/v1</code>
              </p>
            </div>
            <span className="font-sans text-label-sm px-2 py-0.5 rounded bg-primary text-on-primary">
              Connected
            </span>
          </div>
        </div>

        <div className="pt-4 border-t border-surface-variant flex justify-end">
          <Button variant="primary" size="md" onClick={handleSave}>
            Save Preferences
          </Button>
        </div>
      </div>
    </div>
  )
}

