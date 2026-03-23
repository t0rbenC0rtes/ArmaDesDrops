import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import { AuthProvider } from './context/AuthContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { GameBoard } from './pages/GameBoard'
import { AdminDashboard } from './pages/AdminDashboard'

function App() {
  return (
    <AuthProvider>
      <GameProvider>
        <Router>
          <Routes>
            <Route
              path="/"
              element={
                <ProtectedRoute>
                  <GameBoard />
                </ProtectedRoute>
              }
            />
            <Route
              path="/admin"
              element={
                <ProtectedRoute>
                  <AdminDashboard />
                </ProtectedRoute>
              }
            />
          </Routes>
        </Router>
      </GameProvider>
    </AuthProvider>
  )
}

export default App
