import { useGame } from '../context/GameContext'

/**
 * Hook for managing overall game flow and phase transitions
 * Exposes high-level game control functions with phase guards
 */
export function useGameFlow() {
  const { state, dispatch } = useGame()

  return {
    /**
     * Start a new game
     */
    startGame: (questions) => {
      dispatch({
        type: 'START_GAME',
        payload: { questions },
      })
    },

    /**
     * Start voting phase with timer
     */
    startVoting: () => {
      if (state.phase === 'idle' || state.phase === 'result' || state.phase === 'voting' || state.phase === 'jokers') {
        dispatch({ type: 'START_VOTING' })
      }
    },

    /**
     * Stop voting and move to jokers phase
     */
    stopVoting: () => {
      if (state.phase === 'voting') {
        dispatch({ type: 'STOP_VOTING' })
      }
    },

    /**
     * Trigger the reveal sequence
     */
    triggerReveal: () => {
      if (state.phase === 'jokers') {
        // Validate that at least one vote was cast
        const totalVotes =
          (state.votes[1]?.length || 0) +
          (state.votes[2]?.length || 0) +
          (state.votes[3]?.length || 0) +
          (state.votes[4]?.length || 0)

        if (totalVotes === 0) {
          console.warn('Cannot reveal without any votes cast')
          return false
        }

        dispatch({ type: 'START_REVEAL' })
        return true
      }
      return false
    },

    /**
     * Complete reveal and set win/loss state
     */
    completeReveal: (correctAnswerId) => {
      if (state.phase === 'reveal') {
        dispatch({
          type: 'FINALIZE_CRYSTALS',
          payload: { correctAnswerId },
        })
        return true
      }
      return false
    },

    /**
     * Advance to next question
     */
    advanceQuestion: () => {
      if (state.phase === 'result') {
        dispatch({ type: 'NEXT_QUESTION' })
        return true
      }
      return false
    },

    /**
     * Reset entire game to idle state
     */
    resetGame: () => {
      dispatch({ type: 'RESET_GAME' })
    },

    /**
     * Add a vote for an answer
     */
    addVote: (answerId, username) => {
      dispatch({
        type: 'ADD_VOTE',
        payload: { answerId, username },
      })
    },

    /**
     * Set votes manually (admin override)
     */
    setVotesManual: (votes) => {
      dispatch({
        type: 'SET_VOTES_MANUAL',
        payload: { votes },
      })
      dispatch({ type: 'CALCULATE_DISTRIBUTION' })
    },

    /**
     * Skip current question (via €50 joker)
     */
    skipQuestion: () => {
      if (state.phase === 'jokers') {
        dispatch({ type: 'SKIP_QUESTION' })
        return true
      }
      return false
    },

    /**
     * Trigger €2 joker - Save crystals
     */
    triggerSaveCrystalsJoker: () => {
      if (!state.jokersTriggered['2'] && state.phase === 'jokers') {
        dispatch({
          type: 'SAVE_CRYSTALS_JOKER',
          payload: 5000,
        })
        return true
      }
      return false
    },

    /**
     * Trigger €5 joker - Eliminate answer
     */
    triggerEliminateAnswerJoker: (answerId) => {
      if (!state.jokersTriggered['5'] && state.phase === 'voting') {
        if (!state.eliminatedAnswers.includes(answerId)) {
          dispatch({
            type: 'ELIMINATE_ANSWER',
            payload: answerId,
          })
          return true
        }
      }
      return false
    },

    /**
     * Trigger €10 joker - Re-vote
     */
    triggerRevoteJoker: () => {
      if (!state.jokersTriggered['10'] && state.phase === 'jokers') {
        dispatch({ type: 'TRIGGER_REVOTE' })
        return true
      }
      return false
    },

    /**
     * Trigger €25 joker - Special (placeholder)
     */
    triggerSpecialJoker: () => {
      if (!state.jokersTriggered['25'] && state.phase === 'jokers') {
        dispatch({ type: 'TRIGGER_SPECIAL_JOKER' })
        return true
      }
      return false
    },

    /**
     * Add donation amount
     */
    addDonation: (amount) => {
      dispatch({
        type: 'ADD_DONATION',
        payload: amount,
      })
    },

    /**
     * Reset donations for new question
     */
    resetDonations: () => {
      dispatch({ type: 'RESET_DONATIONS' })
    },

    // Getters for current state
    currentPhase: state.phase,
    currentQuestion: state.currentQuestionIndex,
    crystalBank: state.crystalBank,
    savedCrystals: state.savedCrystals,
    votes: state.votes,
    distribution: state.crystalDistribution,
    isFinalQuestion: state.isFinalQuestion,
    winState: state.winState,
    revealState: state.revealState,
    timerRunning: state.timerRunning,
    canStartVoting: state.phase === 'idle' || state.phase === 'result',
    canStopVoting: state.phase === 'voting',
    canReveal: state.phase === 'jokers',
    canAdvance: state.phase === 'result',
  }
}
