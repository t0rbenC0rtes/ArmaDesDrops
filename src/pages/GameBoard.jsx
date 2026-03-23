import { useEffect, useCallback } from 'react'
import { useGame } from '../context/GameContext'
import { useGameFlow } from '../hooks/useGameFlow'
import { useTwitchChat } from '../hooks/useTwitchChat'
import { QuestionDisplay } from '../components/board/QuestionDisplay'
import { Trap } from '../components/board/Trap'
import { CrystalCounter } from '../components/board/CrystalCounter'
import { VoteDistribution } from '../components/board/VoteDistribution'
import { DonationBar } from '../components/board/DonationBar'
import { Timer } from '../components/board/Timer'
import './GameBoard.scss'
import questionsData from '../data/questions.json'

export function GameBoard() {
  const { state, dispatch } = useGame()
  const gameFlow = useGameFlow()

  // Debug: Log state changes to ensure context is working
  useEffect(() => {
    console.log('[GameBoard] Phase changed to:', state.phase, 'Timer:', state.timerRunning, 'Questions:', state.questions.length)
  }, [state.phase, state.timerRunning, state.questions.length])

  // Create a session-based viewer ID for vote tracking
  const getViewerId = () => {
    let viewerId = sessionStorage.getItem('moneydrop_viewer_id')
    if (!viewerId) {
      viewerId = `viewer_${Math.random().toString(36).substr(2, 9)}_${Date.now()}`
      sessionStorage.setItem('moneydrop_viewer_id', viewerId)
    }
    return viewerId
  }

  // Twitch chat integration - only active during active voting (phase + timer running)
  const handleTwitchVote = useCallback(
    (username, answerId) => {
      gameFlow.addVote(answerId, username)
    },
    [] // No dependencies - use closure to access gameFlow
  )

  const { status: twitchStatus, reconnect: twitchReconnect } = useTwitchChat({
    channelName: 'laemso',
    onVote: handleTwitchVote,
    enabled: state.phase === 'voting' && state.timerRunning === true,
  })

  // Note: State is now loaded from localStorage, no auto-load needed here

  // Handle timer completion with stable callback
  const handleTimerComplete = useCallback(() => {
    if (state.phase === 'voting') {
      gameFlow.stopVoting()
    }
  }, [state.phase])

  // Handle trap click (voter clicking an answer)
  const handleTrapClick = (answerId) => {
    if (state.phase === 'voting') {
      gameFlow.addVote(answerId, getViewerId())
    }
  }

  // Current question data
  const currentQuestion = questionsData[state.currentQuestionIndex] || questionsData[0]
  const isFinal = state.currentQuestionIndex === 9

  // Determine grid layout - 2x2 for normal, 1x2 for final
  const gridClass = isFinal ? 'trap-grid--final' : 'trap-grid--normal'

  // Calculate crystal value per vote during voting phase for real-time display
  const totalVotes = Object.values(state.votes).reduce((sum, votes) => sum + votes.length, 0)
  const crystalPerVote = totalVotes > 0 ? Math.floor(state.crystalBank / totalVotes) : 0

  return (
    <div className="game-board">
      {/* Background */}
      <div className="game-board-bg" />

      {/* Donation Bar - Left Side */}
      <DonationBar donationTotal={state.donationTotal} />

      {/* Top Section */}
      <div className="board-top">
        <QuestionDisplay
          questionText={currentQuestion?.question || 'Loading...'}
          questionNumber={state.currentQuestionIndex + 1}
          totalQuestions={10}
        />
        <div className="top-right-widgets">
          <CrystalCounter crystalBank={state.crystalBank} />
          {state.phase === 'voting' && (
            <VoteDistribution currentQuestion={currentQuestion} state={state} />
          )}
        </div>
      </div>

      {/* Main Content */}
      <div className="board-center">
        {state.questions.length > 0 ? (
          <div className={`trap-grid ${gridClass}`}>
            {currentQuestion?.answers?.map((answer) => (
              <Trap
                key={answer.id}
                answerId={answer.id}
                answerText={answer.text}
                crystalAmount={state.crystalDistribution[answer.id] || 0}
                voteCount={state.votes[answer.id]?.length || 0}
                isEliminated={state.eliminatedAnswers.includes(answer.id)}
                isCorrect={answer.id === currentQuestion.correctAnswerId}
                revealState={state.revealState}
                onClick={handleTrapClick}
                isClickable={state.phase === 'voting'}
                crystalPerVote={state.phase === 'voting' ? crystalPerVote : 0}
              />
            ))}
          </div>
        ) : (
          <div className="loading">Loading questions...</div>
        )}
      </div>

      {/* Bottom Section */}
      <div className="board-bottom">
        {state.phase === 'voting' && (
          <Timer
            duration={state.timerDuration}
            isRunning={state.timerRunning}
            onComplete={handleTimerComplete}
          />
        )}
      </div>
    </div>
  )
}
