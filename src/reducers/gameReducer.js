import { distributeCrystals, hasUserVoted } from '../utils/crystalMath'

// Game State Reducer
const gameReducer = (state, action) => {
  switch (action.type) {
    // Cross-tab state synchronization
    case 'SYNC_STATE': {
      // Replace entire state with synced state from another tab
      return action.payload;
    }

    // Phase 2: Game State & Flow Logic
    case 'START_GAME': {
      // Load questions from action payload and initialize game
      return {
        ...state,
        phase: 'voting',
        currentQuestionIndex: 0,
        questions: action.payload.questions || [],
        crystalBank: 100000,
        savedCrystals: 0,
        votes: { 1: [], 2: [], 3: [], 4: [] },
        crystalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
        eliminatedAnswers: [],
        donationTotal: 0,
        jokersTriggered: { '2': false, '5': false, '10': false, '25': false, '50': false },
        revealState: 'hidden',
        winState: null,
        isFinalQuestion: false,
        activeAnswerCount: 4,
        timerDuration: 45,
        timerRunning: false,
      }
    }

    case 'START_VOTING': {
      // Transition to voting phase and start timer (can be called from idle, result, or voting phases)
      const isFinal = state.currentQuestionIndex === 9
      return {
        ...state,
        phase: 'voting',
        timerRunning: true,
        timerDuration: 45, // Reset timer to 45 seconds
        isFinalQuestion: isFinal,
        activeAnswerCount: isFinal ? 2 : 4,
        revealState: 'hidden',
        winState: null,
        votes: { 1: [], 2: [], 3: [], 4: [] },
        crystalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
      }
    }

    case 'STOP_VOTING': {
      // Stop voting, calculate distribution, move to jokers phase
      const distribution = distributeCrystals(
        state.votes,
        state.crystalBank,
        state.isFinalQuestion
      )

      return {
        ...state,
        phase: 'jokers',
        timerRunning: false,
        crystalDistribution: distribution,
      }
    }

    case 'ADD_VOTE': {
      const { answerId, username } = action.payload

      // Check if user already voted
      if (hasUserVoted(state.votes, username)) {
        return state // Ignore duplicate vote
      }

      // Check if answer is eliminated
      if (state.eliminatedAnswers.includes(answerId)) {
        return state // Ignore vote for eliminated answer
      }

      // Add vote
      const newVotes = {
        ...state.votes,
        [answerId]: [...state.votes[answerId], username],
      }

      return {
        ...state,
        votes: newVotes,
      }
    }

    case 'CALCULATE_DISTRIBUTION': {
      // Explicitly calculate and update distribution (called from action)
      const distribution = distributeCrystals(
        state.votes,
        state.crystalBank,
        state.isFinalQuestion
      )

      return {
        ...state,
        crystalDistribution: distribution,
      }
    }

    case 'SET_PHASE': {
      // Generic phase transition
      return {
        ...state,
        phase: action.payload,
      }
    }

    case 'NEXT_QUESTION': {
      // Advance to next question, reset per-question state
      const nextIndex = state.currentQuestionIndex + 1
      const isFinal = nextIndex === 9

      if (nextIndex >= 10) {
        // Game over - go to endgame
        return {
          ...state,
          phase: 'endgame',
          currentQuestionIndex: nextIndex,
        }
      }

      // Add saved crystals back to bank
      const updatedBank = state.crystalBank + state.savedCrystals

      return {
        ...state,
        phase: 'voting',
        currentQuestionIndex: nextIndex,
        crystalBank: updatedBank,
        savedCrystals: 0,
        votes: { 1: [], 2: [], 3: [], 4: [] },
        crystalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
        eliminatedAnswers: [],
        donationTotal: 0,
        jokersTriggered: { '2': false, '5': false, '10': false, '25': false, '50': false },
        revealState: 'hidden',
        winState: null,
        isFinalQuestion: isFinal,
        activeAnswerCount: isFinal ? 2 : 4,
        timerRunning: false,
      }
    }

    case 'RESET_GAME': {
      // Full reset to initial state
      return {
        ...state,
        phase: 'idle',
        currentQuestionIndex: 0,
        crystalBank: 100000,
        savedCrystals: 0,
        votes: { 1: [], 2: [], 3: [], 4: [] },
        crystalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
        eliminatedAnswers: [],
        donationTotal: 0,
        jokersTriggered: { '2': false, '5': false, '10': false, '25': false, '50': false },
        revealState: 'hidden',
        winState: null,
        isFinalQuestion: false,
        activeAnswerCount: 4,
        timerRunning: false,
      }
    }

    // Phase 3: Twitch Chat / Manual Override
    case 'SET_VOTES_MANUAL': {
      // Set exact vote counts (for admin override)
      const { votes } = action.payload
      return {
        ...state,
        votes: {
          1: Array(votes[1] || 0).fill(''),
          2: Array(votes[2] || 0).fill(''),
          3: Array(votes[3] || 0).fill(''),
          4: Array(votes[4] || 0).fill(''),
        },
      }
    }

    // Phase 6: Joker System
    case 'SAVE_CRYSTALS_JOKER': {
      return {
        ...state,
        savedCrystals: state.savedCrystals + (action.payload || 5000),
        jokersTriggered: { ...state.jokersTriggered, '2': true },
      }
    }

    case 'ELIMINATE_ANSWER': {
      const answerId = action.payload
      const newEliminatedAnswers = [...state.eliminatedAnswers, answerId]

      // Redistribute crystals from eliminated answer to remaining answers
      const eliminatedCrystals = state.crystalDistribution[answerId] || 0
      const newDistribution = { ...state.crystalDistribution, [answerId]: 0 }

      if (eliminatedCrystals > 0) {
        const activeAnswers = [1, 2, 3, 4].filter(
          (id) => !newEliminatedAnswers.includes(id)
        )
        if (activeAnswers.length > 0) {
          const crysPerAnswer = Math.floor(eliminatedCrystals / activeAnswers.length)
          const remainder = eliminatedCrystals % activeAnswers.length

          activeAnswers.forEach((id, idx) => {
            newDistribution[id] += crysPerAnswer
            if (idx === 0) newDistribution[id] += remainder
          })
        }
      }

      return {
        ...state,
        eliminatedAnswers: newEliminatedAnswers,
        activeAnswerCount: state.activeAnswerCount - 1,
        crystalDistribution: newDistribution,
        jokersTriggered: { ...state.jokersTriggered, '5': true },
      }
    }

    case 'TRIGGER_REVOTE': {
      return {
        ...state,
        votes: { 1: [], 2: [], 3: [], 4: [] },
        crystalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
        phase: 'voting',
        timerRunning: false, // Admin must manually restart timer
        jokersTriggered: { ...state.jokersTriggered, '10': true },
      }
    }

    case 'TRIGGER_SPECIAL_JOKER': {
      return {
        ...state,
        jokersTriggered: { ...state.jokersTriggered, '25': true },
      }
    }

    case 'SKIP_QUESTION': {
      // Skip question but keep crystals
      return {
        ...state,
        jokersTriggered: { ...state.jokersTriggered, '50': true },
        phase: 'result',
        winState: 'skip',
      }
    }

    // Phase 7: Reveal Sequence
    case 'SET_REVEAL_STATE': {
      return {
        ...state,
        revealState: action.payload,
      }
    }

    case 'START_REVEAL': {
      return {
        ...state,
        phase: 'reveal',
        revealState: 'cracking',
      }
    }

    case 'SET_WIN_STATE': {
      const winState = action.payload
      return {
        ...state,
        winState: winState,
        phase: 'result',
        revealState: 'done',
      }
    }

    case 'FINALIZE_CRYSTALS': {
      // After reveal, finalize the crystal count
      const correctAnswerId = action.payload.correctAnswerId
      const survivedCrystals =
        state.crystalDistribution[correctAnswerId] || 0

      let newBank = survivedCrystals
      let resultState = survivedCrystals > 0 ? 'win' : 'loss'

      // If loss, crystals go to zero (but savedCrystals carry over to next question)
      if (newBank === 0) {
        resultState = 'loss'
      }

      return {
        ...state,
        phase: 'result',
        crystalBank: newBank,
        winState: resultState,
        revealState: 'done',
      }
    }

    // Phase 9: End Game
    case 'ADD_DONATION': {
      return {
        ...state,
        donationTotal: state.donationTotal + (action.payload || 0),
      }
    }

    case 'RESET_DONATIONS': {
      return {
        ...state,
        donationTotal: 0,
        jokersTriggered: { '2': false, '5': false, '10': false, '25': false, '50': false },
      }
    }

    case 'SET_CRYSTAL_BANK': {
      return {
        ...state,
        crystalBank: action.payload,
      }
    }

    default:
      return state
  }
}

export default gameReducer
