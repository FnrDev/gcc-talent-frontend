import { Navigate, useLocation } from 'react-router'
import { useAuth } from '../context/AuthContext'
import { Spinner } from '@/components/ui/spinner'

function AdminRoute({ children }) {
  const { loading, user } = useAuth()
  const location = useLocation()

  if (loading) {
    return (
      <div className="flex min-h-[calc(100vh-3.5rem)] items-center justify-center" aria-live="polite">
        <div className="flex items-center gap-2 text-sm text-muted-foreground">
          <Spinner />
          Checking access…
        </div>
      </div>
    )
  }

  if (!user) {
    return (
      <Navigate
        to="/sign-in"
        replace
        state={{
          from: `${location.pathname}${location.search}`,
          message: 'Sign in with an administrator account to continue.',
        }}
      />
    )
  }

  if (user.role !== 'admin') {
    return <Navigate to="/dashboard" replace />
  }

  return children
}

export default AdminRoute
