import { useAuth } from '../context/AuthContext'
import { LoginPage } from '../pages/LoginPage'

export function ProtectedRoute({ children }) {
  const { isAuthenticated } = useAuth()
  const sessionAuthenticated = sessionStorage.getItem('moneydrop_authenticated') === 'true'

  // Show protected content if authenticated or if session exists
  if (isAuthenticated || sessionAuthenticated) {
    return children
  }

  // Otherwise, show login page
  return <LoginPage />
}
