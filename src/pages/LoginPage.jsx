import { useState } from 'react'
import { useNavigate, useLocation } from 'react-router-dom'
import { useAuth } from '../context/AuthContext'
import './LoginPage.scss'

export function LoginPage() {
  const [inputPassword, setInputPassword] = useState('')
  const { authenticate, error } = useAuth()
  const navigate = useNavigate()
  const location = useLocation()

  const handleSubmit = (e) => {
    e.preventDefault()
    if (authenticate(inputPassword)) {
      // Redirect to the page they were trying to access or to home
      const from = location.state?.from?.pathname || '/'
      navigate(from)
    }
  }

  return (
    <div className="login-container">
      <div className="login-box">
        <h1>💎 Money Drop</h1>
        <p className="login-subtitle">Authentification requise</p>
        
        <form onSubmit={handleSubmit}>
          <div className="input-group">
            <input
              type="password"
              value={inputPassword}
              onChange={(e) => setInputPassword(e.target.value)}
              placeholder="Entrez le mot de passe"
              className="input"
              autoFocus
            />
          </div>
          
          {error && <div className="error-message">{error}</div>}
          
          <button type="submit" className="btn btn-primary btn-lg">
            Accédez
          </button>
        </form>
        
        <p className="login-hint">Entrez votre mot de passe pour continuer</p>
      </div>
    </div>
  )
}
