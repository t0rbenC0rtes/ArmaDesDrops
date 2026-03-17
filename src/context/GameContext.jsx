import { createContext, useContext, useReducer, useEffect } from 'react';
import gameReducer from '../reducers/gameReducer';

const GameContext = createContext();

// Initial state matching the roadmap specification
const initialState = {
  phase: 'idle', // "idle" | "voting" | "jokers" | "reveal" | "result" | "final" | "endgame"
  currentQuestionIndex: 0, // 0–9
  questions: [], // loaded from questions.json
  crystalBank: 100000, // current total crystals in play
  savedCrystals: 0, // crystals banked from €2 joker
  votes: { 1: [], 2: [], 3: [], 4: [] }, // arrays of usernames per answer
  crystalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
  eliminatedAnswers: [], // answer ids removed by €5 joker
  donationTotal: 0, // total donations this question
  jokersTriggered: {
    '2': false,
    '5': false,
    '10': false,
    '25': false,
    '50': false,
  },
  revealState: 'hidden', // "hidden" | "cracking" | "done"
  winState: null, // null | "win" | "loss"
  isFinalQuestion: false, // true when currentQuestionIndex === 9
  activeAnswerCount: 4, // 4 normally, 2 on final question, 3 after €5 joker
  timerDuration: 45,
  timerRunning: false,
};

const STORAGE_KEY = 'moneydrop_game_state';

export function GameProvider({ children }) {
  // Load initial state from localStorage if available
  const getInitialState = () => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        console.log('[GameContext] Loaded state from localStorage');
        return JSON.parse(stored);
      }
    } catch (error) {
      console.error('[GameContext] Error loading state from localStorage:', error);
    }
    return initialState;
  };

  const [state, dispatch] = useReducer(gameReducer, undefined, getInitialState);

  // Sync state changes to localStorage
  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(state));
      console.log('[GameContext] Synced state to localStorage, phase:', state.phase);
    } catch (error) {
      console.error('[GameContext] Error saving state to localStorage:', error);
    }
  }, [state]);

  // Listen for storage changes from other tabs/windows
  useEffect(() => {
    const handleStorageChange = (event) => {
      if (event.key === STORAGE_KEY && event.newValue) {
        try {
          const newState = JSON.parse(event.newValue);
          console.log('[GameContext] Received state update from another tab, phase:', newState.phase);
          dispatch({ type: 'SYNC_STATE', payload: newState });
        } catch (error) {
          console.error('[GameContext] Error processing storage event:', error);
        }
      }
    };

    window.addEventListener('storage', handleStorageChange);
    return () => window.removeEventListener('storage', handleStorageChange);
  }, []);

  return (
    <GameContext.Provider value={{ state, dispatch }}>
      {children}
    </GameContext.Provider>
  );
}

export function useGame() {
  const context = useContext(GameContext);
  if (!context) {
    throw new Error('useGame must be used within a GameProvider');
  }
  return context;
}
