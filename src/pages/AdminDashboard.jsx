import { useState, useRef } from 'react'
import { useGame } from '../context/GameContext'
import { useGameFlow } from '../hooks/useGameFlow'
import questionsData from '../data/questions.json'
import './AdminDashboard.scss'

export function AdminDashboard() {
  const { state, dispatch } = useGame()
  const gameFlow = useGameFlow()
  const [donationInput, setDonationInput] = useState('')
  const [manualVoteCount, setManualVoteCount] = useState(1)
  const [eliminateModalOpen, setEliminateModalOpen] = useState(false)
  const [skipModalOpen, setSkipModalOpen] = useState(false)
  const [crystalOverrideInput, setCrystalOverrideInput] = useState('')
  const [donationOverrideInput, setDonationOverrideInput] = useState('')
  const countdownAudioRef = useRef(null)
  const revealAudioRef = useRef(null)

  const currentQuestion = questionsData[state.currentQuestionIndex] || questionsData[0]

  // Debug: Log state changes
  console.log('[AdminDashboard] Current state:', { phase: state.phase, timerRunning: state.timerRunning, questions: state.questions.length })

  // Joker trigger handlers
  const handleJokerTrigger = (jokerId) => {
    switch (jokerId) {
      case '2':
        // €2 Save: Save 5,000 crystals to bank
        gameFlow.triggerSaveCrystalsJoker()
        console.log('[Joker €2] Save triggered - 5,000 crystals saved to bank')
        break
      case '5':
        // €5 Eliminate: Open modal to select which answer to eliminate
        setEliminateModalOpen(true)
        break
      case '10':
        // €10 Re-vote: Reset votes, reopen voting with 45s timer
        gameFlow.triggerRevoteJoker()
        console.log('[Joker €10] Re-vote triggered - votes reset, timer restarted')
        break
      case '25':
        // €25 TBD: Placeholder - do nothing
        console.log('[Joker €25] TBD - placeholder')
        break
      case '50':
        // €50 Skip: Open modal for confirmation
        setSkipModalOpen(true)
        break
      default:
        break
    }
  }

  // Handle eliminate answer selection
  const handleEliminateAnswer = (answerId) => {
    dispatch({
      type: 'ELIMINATE_ANSWER',
      payload: answerId,
    })
    setEliminateModalOpen(false)
    console.log(`[Joker €5] Answer ${answerId} eliminated`)
  }

  // Handle skip question confirmation
  const handleConfirmSkip = () => {
    gameFlow.skipQuestion()
    setSkipModalOpen(false)
    console.log('[Joker €50] Question skipped - crystals banked')
  }

  // Manual donation handler
  const handleAddDonation = () => {
    const amount = parseInt(donationInput)
    if (amount > 0) {
      dispatch({
        type: 'ADD_DONATION',
        payload: amount,
      })
      setDonationInput('')
    }
  }

  // Quick donation handler
  const handleQuickDonation = (amount) => {
    dispatch({
      type: 'ADD_DONATION',
      payload: amount,
    })
  }

  // Emergency crystal bank override
  const handleOverrideCrystals = () => {
    const amount = parseInt(crystalOverrideInput)
    if (!isNaN(amount) && amount >= 0) {
      dispatch({
        type: 'SET_CRYSTAL_BANK',
        payload: amount,
      })
      setCrystalOverrideInput('')
      console.log(`[EMERGENCY] Crystal bank overridden to ${amount}`)
    }
  }

  // Emergency donation override
  const handleOverrideDonations = () => {
    const amount = parseInt(donationOverrideInput)
    if (!isNaN(amount) && amount >= 0) {
      dispatch({
        type: 'SET_DONATION_TOTAL',
        payload: amount,
      })
      setDonationOverrideInput('')
      console.log(`[EMERGENCY] Donation total overridden to ${amount}`)
    }
  }

  // Play countdown music when voting starts
  const handleStartVoting = () => {
    console.log('[Audio] Playing countdown music')
    if (countdownAudioRef.current) {
      countdownAudioRef.current.currentTime = 0
      countdownAudioRef.current.play().catch((err) => {
        console.warn('[Audio] Could not play countdown music:', err.message)
      })
    }
    gameFlow.startVoting()
  }

  // Play reveal music when revealing answer, then trigger reveal after 25 seconds
  const handleRevealWithMusic = () => {
    console.log('[Audio] Playing reveal music')
    if (revealAudioRef.current) {
      revealAudioRef.current.currentTime = 0
      revealAudioRef.current.play().catch((err) => {
        console.warn('[Audio] Could not play reveal music:', err.message)
      })
    }
    // Delay reveal by 25 seconds to match reveal music length
    setTimeout(() => {
      gameFlow.triggerReveal()
      // Auto-finalize after animation completes
      setTimeout(() => {
        dispatch({
          type: 'FINALIZE_CRYSTALS',
          payload: { correctAnswerId: currentQuestion.correctAnswerId },
        })
      }, 800)
    }, 25000)
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
      {/* Hidden audio elements for game music - played from admin panel */}
      <audio
        ref={countdownAudioRef}
        src="/CountdownMusic.wav"
        preload="auto"
        volume={0.3}
      />
      <audio
        ref={revealAudioRef}
        src="/RevealMusic.wav"
        preload="auto"
        volume={0.3}
      />

      {/* Header */}
      <header className="admin-header">
        <div className="header-content">
          <h1><img src="/mineralIcon.png" alt="crystals" className="crystal-icon-inline" /> Panneau de Contrôle Admin</h1>
          <span className="channel-name">Chaîne: laemso</span>
        </div>
      </header>

      {/* Main Container */}
      <div className="admin-container">
        {/* Left Sidebar - Game State */}
        <aside className="admin-sidebar">
          <div className="sidebar-panel">
            <h3>Question Actuelle</h3>
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
            <h3>Statistiques du Jeu</h3>
            <div className="stat">
              <span className="stat-label">Phase:</span>
              <span className="stat-value">{state.phase.toUpperCase()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Banque de Cristaux:</span>
              <span className="stat-value"><img src="/mineralIcon.png" alt="crystals" className="crystal-icon-inline" /> {state.crystalBank.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Cristaux Sauvegardés:</span>
              <span className="stat-value"><img src="/mineralIcon.png" alt="crystals" className="crystal-icon-inline" /> {state.savedCrystals.toLocaleString()}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Votes Totaux:</span>
              <span className="stat-value">{totalVotes}</span>
            </div>
            <div className="stat">
              <span className="stat-label">Dons:</span>
              <span className="stat-value">💰 ${state.donationTotal.toLocaleString()}</span>
            </div>
          </div>

          <div className="sidebar-panel votes-panel">
            <h3>Distribution des Votes</h3>
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
                  {state.votes[answer.id]?.length || 0} ({state.crystalDistribution[answer.id] || 0}<img src="/mineralIcon.png" alt="crystals" className="crystal-icon-inline" />)
                </span>
              </div>
            ))}
          </div>
        </aside>

        {/* Main Content Area */}
        <main className="admin-main">
          {/* Phase Controls */}
          <section className="control-section">
            <h2>🎮 Contrôles de Phase de jeu</h2>
            <div className="button-grid">
              {state.phase === 'idle' && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    console.log('[AdminDashboard] Start Game clicked')
                    gameFlow.startGame(questionsData)
                  }}
                >
                  Démarrer le Jeu
                </button>
              )}

              {state.phase === 'voting' && !state.timerRunning && (
                <button
                  className="btn btn-primary btn-lg"
                  onClick={() => {
                    console.log('[AdminDashboard] Start Voting clicked')
                    handleStartVoting()
                  }}
                >
                  Commencer à Voter
                </button>
              )}

              {state.phase === 'voting' && state.timerRunning && (
                <>
                  <button
                    className="btn btn-secondary btn-lg"
                    onClick={() => gameFlow.stopVoting()}
                  >
                    Arrêter le Vote
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => gameFlow.startVoting()}
                  >
                    Redémarrer le Vote (Réinitialiser)
                  </button>
                </>
              )}

              {state.phase === 'jokers' && (
                <>
                  <button
                    className="btn btn-primary btn-lg"
                    onClick={() => {
                      handleRevealWithMusic()
                    }}
                  >
                    Révéler la Réponse
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => gameFlow.startVoting()}
                  >
                    Retour au Vote
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
                    Question Suivante
                  </button>
                  <button
                    className="btn btn-secondary"
                    onClick={() => gameFlow.resetGame()}
                  >
                    Réinitialiser le Jeu
                  </button>
                </>
              )}
            </div>
          </section>

          {/* Joker Controls */}
          <section className="control-section">
            <h2>🃏 Jokers</h2>
            <div className="joker-grid">
              <button
                className={`joker-btn joker-save ${!isJokerAvailable('2') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('2')}
                disabled={!isJokerAvailable('2') || state.phase !== 'jokers'}
                title="Sauvegarder 5 000 cristaux à la banque"
              >
                <span className="joker-icon">💾</span>
                <span className="joker-name">5K épargnés</span>
                <span className="joker-cost">€2</span>
              </button>

              <button
                className={`joker-btn joker-eliminate ${!isJokerAvailable('5') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('5')}
                disabled={!isJokerAvailable('5') || state.phase !== 'jokers'}
                title="Éliminer une mauvaise réponse"
              >
                <span className="joker-icon">✕</span>
                <span className="joker-name">Éliminer</span>
                <span className="joker-cost">€5</span>
              </button>

              <button
                className={`joker-btn joker-revote ${!isJokerAvailable('10') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('10')}
                disabled={!isJokerAvailable('10') || state.phase !== 'jokers'}
                title="Réinitialiser les votes, rouvrir le scrutin avec 45 secondes"
              >
                <span className="joker-icon">🔄</span>
                <span className="joker-name">Revoter</span>
                <span className="joker-cost">€10</span>
              </button>

              <button
                className={`joker-btn joker-placeholder ${!isJokerAvailable('25') ? 'used' : ''}`}
                disabled={true}
                title="TBD - Placeholder"
              >
                <span className="joker-icon">📞</span>
                <span className="joker-name">Appel</span>
                <span className="joker-cost">€25</span>
              </button>

              <button
                className={`joker-btn joker-skip ${!isJokerAvailable('50') ? 'used' : ''}`}
                onClick={() => handleJokerTrigger('50')}
                disabled={!isJokerAvailable('50') || state.phase !== 'jokers'}
                title="Sauter à la question suivante, conserver la banque complète"
              >
                <span className="joker-icon">⏭️</span>
                <span className="joker-name">Skip</span>
                <span className="joker-cost">€50</span>
              </button>
            </div>
          </section>

          {/* Manual Controls */}
          <section className="control-section">
            <h2>⚙️ Contrôles Manuels</h2>

            {/* Donation Input */}
            <div className="manual-control-group">
              <h3>Ajouter un Don</h3>
              <div className="input-group">
                <input
                  type="number"
                  min="1"
                  value={donationInput}
                  onChange={(e) => setDonationInput(e.target.value)}
                  placeholder="Montant en €"
                  className="input"
                />
                <button className="btn btn-primary" onClick={handleAddDonation}>
                  Ajouter
                </button>
              </div>
              <div className="button-row">
                {[2, 5, 10, 25, 50].map((amount) => (
                  <button
                    key={amount}
                    className="btn btn-small"
                    onClick={() => handleQuickDonation(amount)}
                  >
                    +€{amount}
                  </button>
                ))}
              </div>
            </div>

            {/* Manual Vote Injection */}
            {state.phase === 'voting' && (
              <div className="manual-control-group">
                <h3>Test d'Injection de Votes ou pour tricher</h3>
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
              <h3>BOUTON D'URGENCE</h3>
              <div className="button-row">
                <button
                  className="btn btn-danger"
                  onClick={() => {
                    if (window.confirm('Reset entire game? This cannot be undone.')) {
                      gameFlow.resetGame()
                    }
                  }}
                >
                  🔴 Reset TOUT LE JEU
                </button>
              </div>
              <div className="input-group">
                <input
                  type="number"
                  min="0"
                  value={crystalOverrideInput}
                  onChange={(e) => setCrystalOverrideInput(e.target.value)}
                  placeholder="Montant de cristaux"
                  className="input"
                />
                <button className="btn btn-warning" onClick={handleOverrideCrystals}>
                  Forcer les Cristaux
                </button>
              </div>
              <div className="input-group">
                <input
                  type="number"
                  min="0"
                  value={donationOverrideInput}
                  onChange={(e) => setDonationOverrideInput(e.target.value)}
                  placeholder="Montant de donations"
                  className="input"
                />
                <button className="btn btn-warning" onClick={handleOverrideDonations}>
                  Forcer les Donations
                </button>
              </div>
            </div>
          </section>
        </main>
      </div>

      {/* Eliminate Answer Modal */}
      {eliminateModalOpen && (
        <div className="modal-overlay" onClick={() => setEliminateModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>€5 Éliminer - Choisir une Réponse à Éliminer</h2>
            <p className="modal-subtitle">Sélectionnez une mauvaise réponse à éliminer du tableau</p>
            <div className="modal-buttons">
              {currentQuestion?.answers?.map((answer) => (
                <button
                  key={answer.id}
                  className="btn btn-lg"
                  onClick={() => handleEliminateAnswer(answer.id)}
                  disabled={
                    answer.id === currentQuestion.correctAnswerId ||
                    state.eliminatedAnswers.includes(answer.id)
                  }
                  title={
                    answer.id === currentQuestion.correctAnswerId
                      ? 'Impossible d\'éliminer la bonne réponse'
                      : state.eliminatedAnswers.includes(answer.id)
                        ? 'Déjà éliminé'
                        : 'Cliquez pour éliminer'
                  }
                >
                  <span className="answer-label">
                    {String.fromCharCode(64 + answer.id)}
                  </span>
                  <span>{answer.text}</span>
                </button>
              ))}
            </div>
            <button
              className="btn btn-secondary"
              onClick={() => setEliminateModalOpen(false)}
            >
              Annuler
            </button>
          </div>
        </div>
      )}

      {/* Skip Question Confirmation Modal */}
      {skipModalOpen && (
        <div className="modal-overlay" onClick={() => setSkipModalOpen(false)}>
          <div className="modal-content" onClick={(e) => e.stopPropagation()}>
            <h2>€50 Sauter la Question</h2>
            <p className="modal-subtitle">Aller à la question suivante ?</p>
            <p className="modal-detail">
              Bancaires tous les cristaux: <strong><img src="/mineralIcon.png" alt="crystals" className="crystal-icon-inline" /> {state.crystalBank.toLocaleString()}</strong>
            </p>
            <div className="modal-buttons">
              <button className="btn btn-primary btn-lg" onClick={handleConfirmSkip}>
                ✓ Confirmer le Skip
              </button>
              <button
                className="btn btn-secondary btn-lg"
                onClick={() => setSkipModalOpen(false)}
              >
                ✕ Annuler
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}

