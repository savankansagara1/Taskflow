import { Link } from 'react-router-dom'
import Button from '@/components/ui/Button'

export function NotFoundPage() {
  return (
    <div className="min-h-screen flex flex-col items-center justify-center text-center p-8 bg-background">
      <span className="material-symbols-outlined text-6xl text-outline mb-4">search_off</span>
      <h1 className="font-sans text-headline-lg font-bold text-primary mb-2">404 - Page Not Found</h1>
      <p className="font-sans text-body-md text-secondary max-w-sm mb-6">
        The workspace route you requested does not exist or has been moved.
      </p>
      <Link to="/dashboard">
        <Button variant="primary" size="md">
          Return to Dashboard
        </Button>
      </Link>
    </div>
  )
}
