import { Navigate, Outlet, useLocation } from 'react-router-dom'
import { useAuth } from '../auth'
import { ErrorState, LoadingState } from './States'

/** Wraps every page that needs a logged-in user. */
export default function RequireAuth() {
  const { status, error, retry } = useAuth()
  const location = useLocation()

  if (status === 'loading') {
    return (
      <div className="grid min-h-screen place-items-center px-7">
        <LoadingState label="Restoring your session..." />
      </div>
    )
  }
  if (status === 'error') {
    return (
      <div className="grid min-h-screen place-items-center px-7">
        <ErrorState message={error ?? 'Could not reach the server.'} onRetry={retry} />
      </div>
    )
  }
  if (status === 'anonymous') {
    return <Navigate to="/login" replace state={{ from: location.pathname }} />
  }
  return <Outlet />
}
