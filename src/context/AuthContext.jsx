import { createContext, useContext, useState } from 'react'

const AuthContext = createContext(null)

export function AuthProvider({ children }) {
  const [isAuthenticated, setIsAuthenticated] = useState(false)
  const [password, setPassword] = useState('')
  const [error, setError] = useState('')

  const authenticate = (inputPassword) => {
    const adminPassword = import.meta.env.VITE_ADMIN_PASSWORD
    if (inputPassword === adminPassword) {
      setIsAuthenticated(true)
      setPassword(inputPassword)
      setError('')
      // Store in sessionStorage so authentication persists during the session
      sessionStorage.setItem('moneydrop_authenticated', 'true')
      return true
    } else {
      setError('Mot de passe incorrect')
      return false
    }
  }

  const logout = () => {
    setIsAuthenticated(false)
    setPassword('')
    sessionStorage.removeItem('moneydrop_authenticated')
  }

  return (
    <AuthContext.Provider value={{ isAuthenticated, authenticate, logout, error }}>
      {children}
    </AuthContext.Provider>
  )
}

export function useAuth() {
  const context = useContext(AuthContext)
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider')
  }
  return context
}
