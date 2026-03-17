import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { GameProvider } from './context/GameContext'
import { GameBoard } from './pages/GameBoard'
import { AdminDashboard } from './pages/AdminDashboard'

function App() {
  return (
    <GameProvider>
      <Router>
        <Routes>
          <Route path="/" element={<GameBoard />} />
          <Route path="/admin" element={<AdminDashboard />} />
        </Routes>
      </Router>
    </GameProvider>
  )
}

export default App
