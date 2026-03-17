import { useState } from 'react'
import { useGame } from '../context/GameContext'
import { useGameFlow } from '../hooks/useGameFlow'
import questionsData from '../data/questions.json'
import './AdminDashboard.scss'

export function AdminDashboard() {
  const { state, dispatch } = useGame()
  const gameFlow = useGameFlow()
  const [donationInput, setDonationInput] = useState('')
  const [manualVoteCount, setManualVoteCount] = useState(1)

  const currentQuestion = questionsData[state.currentQuestionIndex] || questionsData[0]

  // Debug: Log state changes
  console.log('[AdminDashboard] Current state:', { phase: state.phase, timerRunning: state.timerRunning, questions: state.questions.length })

  // Joker trigger handlers
  const handleJokerTrigger = (jokerId) => {
    switch (jokerId) {
      case '2':
        gameFlow.triggerSaveCrystalsJoker()
        break
      case '5':
        // For €5 joker, we need to dispatch directly since it requires an answerId
        // For now, eliminate answer 1 (can be changed dynamically later)
        dispatch({
          type: 'ELIMINATE_ANSWER',
          payload: 1,
        })
        dispatch({
          type: 'UPDATE_JOKER_TRIGGERED',
          payload: '5',
        })
        break
      case '10':
        gameFlow.triggerRevoteJoker()
        break
      case '25':
        gameFlow.triggerSpecialJoker()
        break
      case '50':
        gameFlow.skipQuestion()
        break
      default:
        break
    }
  }

  // Manual donation handler
  const handleAddDonation = () => {
    const amount = parseInt(donationInput)
    if (amount > 0) {
      dispatch({
        type: 'ADD_DONATION',
        payload: { amount },
      })
      setDonationInput('')
    }
  }

  // Manual vote injection for testing
  const handleManualVote = (answerId) => {
    for (let i = 0; i < manualVoteCount; i++) {
      gameFlow.addVote(answerId, `admin_vote_${Date.now()}_${i}`)
    }
  }

  // Get total votes
  const totalVotes = Object.values(state.votes).reduce((sum, votes) => sum + votes.length, 0)

  // Check if joker is available (not triggered)
  const isJokerAvailable = (jokerId) => !state.jokersTriggered[jokerId]

  return (
    <div className="admin-dashboard">
      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <h1>💎 Admin Control Panel</h1>
          <span className="channel-name">Channel: laemso</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="admin-container">
        {/* Left Sidebar - Game State */}
        <aside className="admin-sidebar">
          <div className="sidebar-panel">
            <h3>Current Question</h3>
            {state.questions.length > 0 && (
              <>
                <p className="question-number">Q{state.currentQuestionIndex + 1} / 10</p>
                <p className="question-text">{currentQuestion?.question}</p>
                <div className="answers-list">
                  {currentQuestion?.answers?.map((answer) => (
                    <div key={answer.id} className="answer-item">
                      <span className="answer-label">{String.fromCharCode(64 + answer.id)}:</span>
                      <span className="answer-text">{answer.text}</span>
                      {answer.id === currentQuestion.correctAnswerId && (
                        <span className="answer-correct">✓</span>
                      )}
                    </div>
                  ))}
                </div>
              </>
            )}
          </div>

          <div className="sidebar-panel stats-panel">
            <h3>Game Stats</h3>
            <div className="stat">
              <span className="stat-label">Phase:</span>
              <span className="stat-value">{state.phase.toUpperCase()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Crystal Bank:</span>
              <span className="stat-value">💎 {state.crystalBank.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Saved Crystals:</span>
              <span className="stat-value">💎 {state.savedCrystals.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Total Votes:</span>
              <span className="stat-value">{totalVotes}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Donations:</span>
              <span className="stat-value">💰 ${state.donationTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="sidebar-panel votes-panel">
            <h3>Vote Distribution</h3>
            {currentQuestion?.answers?.map((answer) => (
              <div key={answer.id} className="vote-distribution">
                <span className="vote-label">
                  {String.fromCharCode(64 + answer.id)}:
                </span>
                <div className="vote-bar">
                  <div
                    className="vote-fill"
                    style={{
                      width:
                        totalVotes > 0
                          ? `${(state.votes[answer.id]?.length / totalVotes) * 100}%`
                          : '0%',
                    }}
                  />
                </div>
                <span className="vote-count">
                  {state.votes[answer.id]?.length || 0} ({state.crystalDistribution[answer.id] || 0}💎)
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main">
          {/* Phase Controls */}
          <section className="control-section">
            <h2>🎮 Phase Controls</h2>
            <div className="button-grid">
              {state.phase === 'idle' && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    console.log('[AdminDashboard] Start Game clicked')
                    gameFlow.startGame(questionsData)
                  }}
                >
                  Start Game
                </button>
              )}

              {state.phase === 'voting' && !state.timerRunning && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    console.log('[AdminDashboard] Start Voting clicked')
                    gameFlow.startVoting()
                  }}
                >
                  Start Voting
                </button>
              )}

              {state.phase === 'voting' && state.timerRunning && (
                <>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => gameFlow.stopVoting()}
                  >
                    Stop Voting
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => gameFlow.startVoting()}
                  >
                    Restart Voting (Reset Timer)
                  </button>
                </>
              )}

              {state.phase === 'jokers' && (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => {
                      gameFlow.triggerReveal()
                      // Auto-finalize after a short delay for animation
                      setTimeout(() => {
                        dispatch({
                          type: 'FINALIZE_CRYSTALS',
                          payload: { correctAnswerId: currentQuestion.correctAnswerId },
                        })
                      }, 800)
                    }}
                  >
                    Reveal Answer
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => gameFlow.startVoting()}
                  >
                    Back to Voting
                  </button>
                </>
              )}

              {state.phase === 'result' && (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => gameFlow.advanceQuestion()}
                    disabled={state.currentQuestionIndex >= 9}
                  >
                    Next Question
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => gameFlow.resetGame()}
                  >
                    Reset to Question Selection
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Joker Controls */}
          <section className="control-section">
            <h2>🃏 Joker Controls</h2>
            <div className="joker-grid">
              <button
                className={`joker-btn joker-50-50 ${!isJokerAvailable('2') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('2')}
                disabled={!isJokerAvailable('2') || state.phase !== 'jokers'}
                title="Remove 2 wrong answers"
              >
                <span className="joker-icon">50/50</span>
                <span className="joker-name">Fifty-Fifty</span>
                <span className="joker-cost">€2</span>
              </button>

              <button
                className={`joker-btn joker-eliminate ${!isJokerAvailable('5') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('5')}
                disabled={!isJokerAvailable('5') || state.phase !== 'jokers'}
                title="Eliminate 1 incorrect answer"
              >
                <span className="joker-icon">✕</span>
                <span className="joker-name">Eliminate</span>
                <span className="joker-cost">€5</span>
              </button>

              <button
                className={`joker-btn joker-phone ${!isJokerAvailable('10') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('10')}
                disabled={!isJokerAvailable('10') || state.phase !== 'jokers'}
                title="Pause voting, get expert suggestion"
              >
                <span className="joker-icon">☎</span>
                <span className="joker-name">Phone a Friend</span>
                <span className="joker-cost">€10</span>
              </button>

              <button
                className={`joker-btn joker-audience ${!isJokerAvailable('25') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('25')}
                disabled={!isJokerAvailable('25') || state.phase !== 'jokers'}
                title="Lock in audience voting preference"
              >
                <span className="joker-icon">👥</span>
                <span className="joker-name">Audience Help</span>
                <span className="joker-cost">€25</span>
              </button>

              <button
                className={`joker-btn joker-save ${!isJokerAvailable('50') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('50')}
                disabled={!isJokerAvailable('50') || state.phase !== 'jokers'}
                title="Bank crystals safely"
              >
                <span className="joker-icon">🏦</span>
                <span className="joker-name">Save</span>
                <span className="joker-cost">€50</span>
              </button>
            </div>
          </section>

          {/* Manual Controls */}
          <section className="control-section">
            <h2>⚙️ Manual Controls</h2>

            {/* Donation Input */}
            <div className="manual-control-group">
              <h3>Add Donation</h3>
              <div className="input-group">
                <input
                  type="number"
                  min="1"
                  value={donationInput}
                  onChange={(e) => setDonationInput(e.target.value)}
                  placeholder="Amount in dollars"
                  className="input"
                />
                <button className="btn btn-primary" onClick={handleAddDonation}>
                  Add Donation
                </button>
              </div>
            </div>

            {/* Manual Vote Injection */}
            {state.phase === 'voting' && (
              <div className="manual-control-group">
                <h3>Test Vote Injection</h3>
                <div className="input-group">
                  <input
                    type="number"
                    min="1"
                    max="100"
                    value={manualVoteCount}
                    onChange={(e) => setManualVoteCount(parseInt(e.target.value))}
                    className="input"
                  />
                  <span className="label">votes:</span>
                </div>
                <div className="button-row">
                  {[1, 2, 3, 4].map((answerId) => (
                    <button
                      key={answerId}
                      className="btn btn-small"
                      onClick={() => handleManualVote(answerId)}
                    >
                      Vote {String.fromCharCode(64 + answerId)}
                    </button>
                  ))}
                </div>
              </div>
            )}

            {/* Emergency Reset */}
            <div className="manual-control-group emergency">
              <h3>Emergency Controls</h3>
              <button
                className="btn btn-danger"
                onClick={() => {
                  if (window.confirm('Reset entire game? This cannot be undone.')) {
                    gameFlow.resetGame()
                  }
                }}
              >
                🔴 Reset Entire Game
              </button>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}
