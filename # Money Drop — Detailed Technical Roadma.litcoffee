# Money Drop — Detailed Technical Roadmap

---

## Project Overview

A Twitch-integrated game show web app for the stream of **laemso** on Twitch. The streamer controls the game via an admin dashboard at `/admin`. The audience-facing game board at `/` is displayed as a browser source in OBS. Chat viewers vote by typing `!1` `!2` `!3` `!4` in Twitch chat. The streamer manually inputs donation amounts to trigger jokers. The game runs across 10 StarCraft II-themed questions, with the chat collectively trying to save as many mineral crystals as possible.

---

## Tech Stack

- **React** (functional components, hooks)
- **SCSS** (no Tailwind — use variables, mixins, nesting)
- **JavaScript** (no TypeScript)
- **React Router v6** (two routes: `/` and `/admin`)
- **Context API** for global game state
- **Twitch IRC via WebSocket** for chat vote reading
- **No backend** — fully client-side for v1

---

## Folder Structure

```
src/
├── assets/
│   ├── audio/          # Win/lose/reveal music files or references
│   └── images/         # SC2-themed visuals, crystal sprites
├── components/
│   ├── board/          # Trap, CrystalCounter, QuestionDisplay, Timer
│   ├── jokers/         # DonationGauge, JokerButton, JokerPanel
│   ├── reveal/         # RevealSequence, TrapCrack, CrystalEvaporate
│   ├── admin/          # All admin dashboard sub-components
│   └── shared/         # Button, Modal, ProgressBar, etc.
├── context/
│   └── GameContext.jsx # Global state + dispatch
├── data/
│   └── questions.json  # Question bank
├── hooks/
│   ├── useTwitchChat.js
│   ├── useTimer.js
│   ├── useAudio.js
│   └── useGameFlow.js
├── pages/
│   ├── GameBoard.jsx   # Route: /
│   └── AdminDashboard.jsx # Route: /admin
├── reducers/
│   └── gameReducer.js
├── styles/
│   ├── _variables.scss
│   ├── _mixins.scss
│   ├── _reset.scss
│   └── main.scss
└── utils/
    ├── crystalMath.js
    ├── voteParser.js
    └── jokerLogic.js
```

---

## Data Schema

### `questions.json`
```json
[
  {
    "id": 1,
    "question": "Which unit was introduced in StarCraft II: Heart of the Swarm?",
    "answers": [
      { "id": 1, "text": "Swarm Host" },
      { "id": 2, "text": "Lurker" },
      { "id": 3, "text": "Ravager" },
      { "id": 4, "text": "Viper" }
    ],
    "correctAnswerId": 1
  }
]
```

### Global Game State (Context)
```javascript
{
  phase: "idle" | "voting" | "jokers" | "reveal" | "result" | "final" | "endgame",
  currentQuestionIndex: 0,         // 0–9
  questions: [],                    // loaded from questions.json
  crystalBank: 100000,              // current total crystals in play
  savedCrystals: 0,                 // crystals banked from €2 joker
  votes: { 1: [], 2: [], 3: [], 4: [] }, // arrays of usernames per answer
  crystalDistribution: { 1: 0, 2: 0, 3: 0, 4: 0 },
  eliminatedAnswers: [],            // answer ids removed by €5 joker
  donationTotal: 0,                 // total donations this question
  jokersTriggered: {
    "2": false,
    "5": false,
    "10": false,
    "25": false,
    "50": false
  },
  revealState: "hidden" | "cracking" | "done",
  winState: null | "win" | "loss",
  isFinalQuestion: false,           // true when currentQuestionIndex === 9
  activeAnswerCount: 4,             // 4 normally, 2 on final question, 3 after €5 joker
  timerDuration: 45,
  timerRunning: false
}
```

---

## Phase 0 — Project Setup

**Goal:** Scaffold the project with all tooling, routing, and architectural foundations in place before writing any feature code.

### Tasks

1. **Create React app** using Vite (`npm create vite@latest money-drop -- --template react`)
2. **Install dependencies:**
   - `react-router-dom` v6
   - `sass`
3. **Set up React Router** in `main.jsx`:
   - Route `/` → `GameBoard.jsx`
   - Route `/admin` → `AdminDashboard.jsx`
4. **Create SCSS architecture:**
   - `_variables.scss`: color palette (SC2-inspired dark blues, mineral crystal cyan/teal, gold accents), font sizes, spacing scale, breakpoints
   - `_mixins.scss`: flex helpers, animation mixins, responsive breakpoints
   - `_reset.scss`: box-sizing, margin/padding reset
   - `main.scss`: imports all partials
5. **Create `GameContext.jsx`** with:
   - Initial state object (as defined above)
   - `GameContext` created with `createContext`
   - `GameProvider` component wrapping the app
   - `useGame` custom hook for consuming context
6. **Create `gameReducer.js`** with placeholder action types (to be filled per phase)
7. **Create empty placeholder files** for all hooks, utils, and components so imports don't break
8. **Create `questions.json`** with at least 10 sample SC2-themed questions (4 answers each, one correct)
9. **Set OBS browser source target dimensions** in a CSS variable: default `1920x1080`, ensure `/` page has `overflow: hidden` and fixed dimensions

---

## Phase 1 — Game Board Layout (Static)

**Goal:** Build the full visual layout of the audience-facing screen as static, non-interactive components. No logic yet.

### Components to Build

#### `QuestionDisplay`
- Displays the current question text
- SC2-themed card styling (dark panel, glowing border)
- Appears at the top of the board

#### `Trap` (x4)
- Represents one answer slot
- Props: `answerId`, `answerText`, `crystalAmount`, `isEliminated`, `isCorrect`, `revealState`
- Visual states:
  - **Default**: shows answer text, no crystal count
  - **Post-vote**: shows crystal amount on the trap
  - **Eliminated**: greyed out / visually crossed off
  - **Cracking**: crack animation playing
  - **Fallen**: empty, crystals gone
- Layout: 2x2 grid for questions 1–9, 1x2 grid for question 10

#### `CrystalCounter`
- Displays current `crystalBank` prominently
- Animated count-up/count-down on change
- SC2 mineral crystal icon next to the number

#### `Timer`
- Circular or bar-style countdown from 45 seconds
- Color shifts as time runs low (green → yellow → red)
- Emits an event / calls a callback at `0`

#### `GameBoard` (page)
- Assembles all components
- Layout: `QuestionDisplay` top center, `CrystalCounter` top right, 2x2 `Trap` grid center, `Timer` bottom center
- Full-screen dark SC2-themed background

### SCSS Notes
- All animations defined as `@keyframes` in component SCSS modules
- Use CSS custom properties for dynamic values (crystal amounts, colors)
- No hardcoded pixel values — use spacing scale from `_variables.scss`

---

## Phase 2 — Game State & Flow Logic

**Goal:** Wire up the game state so phases transition correctly and components react to state.

### `gameReducer.js` — Action Types to Implement

```javascript
START_GAME           // Reset state, load questions, set phase to "voting"
START_VOTING         // Start timer, enable vote collection
STOP_VOTING          // Stop timer, freeze votes, calculate distribution
CALCULATE_DISTRIBUTION // Distribute crystalBank proportionally across voted answers
ADD_VOTE             // Add a username vote to an answer (with dedup check)
SET_PHASE            // Generic phase transition
NEXT_QUESTION        // Advance index, reset per-question state, carry over crystals
RESET_GAME           // Full reset to initial state
```

### `crystalMath.js` — Utility Functions

```javascript
// Distribute crystalBank proportionally based on vote counts
distributeCrystals(votes, crystalBank)
// Returns { 1: N, 2: N, 3: N, 4: N }

// Count total votes across all answers
totalVotes(votes)

// Calculate crystals remaining after reveal (crystals on correct answer only)
calculateSurvivedCrystals(distribution, correctAnswerId)
```

### `useGameFlow.js` — Hook

- Consumes `GameContext`
- Exposes: `startGame()`, `startVoting()`, `stopVoting()`, `triggerReveal()`, `advanceQuestion()`, `resetGame()`
- Handles phase transition guards (e.g., can't go to reveal if still in voting)

### Phase Transition Map

```
idle → voting → jokers → reveal → result → (next question: voting) or (endgame)
```

### Final Question Detection
- When `currentQuestionIndex === 9`, set `isFinalQuestion: true`
- Switch `activeAnswerCount` to 2
- Crystal distribution logic changes: all crystals go to the majority-vote answer (no split)

---

## Phase 3 — Twitch Chat Integration

**Goal:** Connect to Twitch IRC over WebSocket, parse vote commands, and feed them into game state in real time.

### How Twitch IRC Works (Anonymous Read-Only)

- Connect to `wss://irc-ws.chat.twitch.tv:443`
- Send:
  ```
  PASS SCHMOOPIIE
  NICK justinfan<randomnumber>
  JOIN #laemso
  ```
- No OAuth needed for read-only anonymous connection
- Messages arrive as raw IRC strings, parse with regex

### `useTwitchChat.js` — Hook

```javascript
useTwitchChat({ channelName, onVote, enabled })
```

**Responsibilities:**
- Open WebSocket connection on mount
- Send PASS / NICK / JOIN handshake
- Parse incoming PRIVMSG for `!1`, `!2`, `!3`, `!4`
- Extract username from IRC message
- Call `onVote(username, answerId)` callback
- Handle PING/PONG keepalive
- Reconnect on disconnect (exponential backoff, max 5 retries)
- Expose connection status: `"connecting"` | `"connected"` | `"disconnected"` | `"error"`
- Cleanup WebSocket on unmount

### `voteParser.js` — Utility

```javascript
// Parse raw IRC message string into structured object
parseIRCMessage(rawMessage)
// Returns { username, message } or null

// Check if a message is a valid vote command
isVoteCommand(message)
// Returns answerId (1–4) or null
```

### Vote Deduplication

- `votes` in state is `{ 1: ["user1","user2"], 2: ["user3"], 3: [], 4: [] }`
- Before dispatching `ADD_VOTE`, check if username already exists in any answer array
- If yes, ignore the vote entirely (one vote per viewer per question)
- Dedup check happens in the reducer, not just the hook, to be safe

### Integration in `GameBoard.jsx`

- `useTwitchChat` is called with `enabled: phase === "voting"`
- `onVote` dispatches `ADD_VOTE` to the reducer
- When `phase` changes away from `"voting"`, the hook stops processing new votes (even if messages still arrive)

### Admin Override for Votes

- Admin dashboard has a manual vote input section (see Phase 5)
- Admin can directly set vote counts per answer, bypassing Twitch entirely
- This dispatches `SET_VOTES_MANUAL` action

### Connection Status Display

- A small status indicator on the admin dashboard shows Twitch connection state
- If `"disconnected"` or `"error"`, admin sees a warning and can use manual override

---

## Phase 4 — Timer

**Goal:** Build a precise, controllable 45-second countdown that syncs with game phases and music.

### `useTimer.js` — Hook

```javascript
useTimer({ duration, onTick, onComplete, autoStart })
```

**Responsibilities:**
- Count down from `duration` (default 45) in seconds
- `onTick(secondsRemaining)` called every second
- `onComplete()` called when timer hits 0
- Expose: `start()`, `pause()`, `reset()`, `secondsRemaining`, `isRunning`
- Use `useRef` for the interval to avoid stale closures
- Cleanup on unmount

### `Timer` Component Visual States

- `> 30s`: green / neutral
- `15–30s`: yellow / warning pulse
- `< 15s`: red / urgent pulse animation
- `0`: triggers `STOP_VOTING` dispatch and fires `onComplete`

### Music Sync Note

- The Money Drop countdown music is ~45 seconds
- Timer start should be triggerable from admin dashboard (not automatic) so streamer can sync with music manually
- Admin has a **"Start Timer"** button that simultaneously starts the timer and (optionally) triggers an audio cue

---

## Phase 5 — Admin Dashboard

**Goal:** Give the streamer full control over every aspect of the game from a separate `/admin` route.

### Layout

- Left sidebar: game status (current question, phase, crystal bank, Twitch connection)
- Main area: phase-specific controls (changes based on current phase)
- Right panel: question manager

### Sections

#### Game Controls
- **Start Game** button (only active when `phase === "idle"`)
- **Start Voting / Start Timer** button
- **Stop Voting (manual override)** button — force-ends voting early
- **Trigger Joker Phase** button
- **Trigger Reveal** button
- **Next Question** button
- **Reset Game** button (with confirmation modal)

#### Vote Monitor
- Live display of vote counts per answer: `Answer 1: 12 votes | Answer 2: 5 votes | ...`
- Live crystal distribution preview (updates in real time as votes come in)
- Manual vote override: number inputs for each answer + **"Apply Manual Votes"** button
- This dispatches `SET_VOTES_MANUAL` with exact counts (not usernames, just numbers)

#### Donation Input Panel
- Current donation total display
- Quick-add buttons: **+€1**, **+€5**, **+€10**, **+€25**
- Custom amount: number input + **"Add"** button
- **Reset donations** button (resets `donationTotal` and all `jokersTriggered` for the current question)
- Joker threshold indicators (visual progress bar showing proximity to each threshold)

#### Joker Controls
- Each joker shown as a card with its threshold, description, triggered state
- **Manual trigger** button for each joker (bypasses donation check — for streamer override)
- JOKERS CAN ONLY BE USED ONCE PER QUESTION (reset on new question)
- Jokers:
  - €2 — Save 5,000 crystals
  - €5 — Eliminate one wrong answer (admin selects which one via dropdown)
  - €10 — Re-vote (resets votes, re-opens voting with remaining answers)
  - €25 — Placeholder (button exists, labeled "Special Joker — TBD")
  - €50 — Skip question, keep full bank

#### Question Manager
- List of all 10 questions from `questions.json`
- Currently active question highlighted
- Edit mode per question: edit text, edit answers, set correct answer
- Add new question form
- Changes are applied to in-memory state only (no file system write in v1 — show a note: "Export to JSON" button copies updated JSON to clipboard)

#### Twitch Status
- Connection status badge: `Connected to #laemso` / `Disconnected` / `Error`
- **Reconnect** button
- Last 10 parsed vote messages (username + vote) as a live log

---

## Phase 6 — Joker System Logic

**Goal:** Implement all joker effects and tie them to donation total thresholds.

### Auto-trigger Logic

In `GameContext` or `useGameFlow`, watch `donationTotal` with a `useEffect`. When a threshold is crossed and the joker hasn't been triggered yet, auto-trigger it.

```javascript
useEffect(() => {
  if (donationTotal >= 2 && !jokersTriggered["2"]) triggerJoker("2")
  if (donationTotal >= 5 && !jokersTriggered["5"]) triggerJoker("5")
  // etc.
}, [donationTotal])
```

### Joker Implementations

#### €2 — Save 5,000 Crystals
- Dispatch `SAVE_CRYSTALS_JOKER` with `amount: 5000`
- `savedCrystals += 5000` in state
- These crystals are added back to the bank at the start of the next question regardless of reveal outcome
- Visual: small crystal animation flies off the board into a "safe" counter

#### €5 — Eliminate One Wrong Answer
- Admin selects which wrong answer to eliminate (admin dashboard dropdown, only shows non-correct answers)
- Dispatch `ELIMINATE_ANSWER` with `answerId`
- `eliminatedAnswers` array updated in state
- `activeAnswerCount` decreases by 1
- Trap component switches to eliminated visual state
- Crystals on that trap are redistributed proportionally to remaining non-eliminated answers

#### €10 — Re-vote
- Dispatch `TRIGGER_REVOTE`
- Reset `votes` to empty
- Reset `crystalDistribution` to `{ 1: 0, 2: 0, 3: 0, 4: 0 }`
- Set `phase` back to `"voting"` with remaining (non-eliminated) answers only
- Timer resets and restarts
- Admin must manually start the timer again to sync with music

#### €25 — Placeholder
- State flag `jokersTriggered["25"] = true`
- Dispatch `TRIGGER_SPECIAL_JOKER`
- No effect yet — just a visual acknowledgement
- Add a `// TODO: implement €25 joker effect` comment

#### €50 — Skip Question, Keep Full Bank
- Dispatch `SKIP_QUESTION`
- Do not run reveal
- `crystalBank` stays unchanged
- `savedCrystals` is added back to bank as usual
- Advance to next question immediately

### Final Question Joker Rules
- €2: still available
- €5: not available (only 2 answers on final question)
- €10: still available — triggers re-vote with 2 answers
- €25: placeholder
- €50: not available (it's the last question)
- These restrictions enforced in state: `jokersTriggered` or `isFinalQuestion` guards in the trigger logic

---

## Phase 7 — Reveal Sequence & Animations

**Goal:** Build the full choreographed reveal with animations and music cues.

### Reveal Flow

1. Admin clicks **"Trigger Reveal"** on dashboard → `phase` sets to `"reveal"`
2. Music starts: [reveal track](https://www.youtube.com/watch?v=I8DaUb_u7OQ) — note: use `useAudio` hook
3. At **22 seconds** into the music, wrong answer traps begin cracking
4. Crack animation plays on each wrong trap that has crystals on it
5. Crystals on wrong traps "evaporate" (particle or float-up animation)
6. After animation completes, evaluate outcome:
   - If `crystalDistribution[correctAnswerId] === 0` → **loss state**
   - Else → **win state**, surviving crystals carry over

### `useAudio.js` — Hook

```javascript
useAudio({ src, autoPlay, onTimeReached })
```

- Wraps an `Audio` object
- `play()`, `pause()`, `stop()`, `seek(seconds)`
- `onTimeReached: [{ time: 36, callback: startCrackAnimation }]` — array of time-based callbacks
- Expose `currentTime`, `isPlaying`

### Audio Cues

| Event | Audio |
|---|---|
| Reveal sequence | SC2 OST track, starts at load |
| Loss (no crystals on correct trap) | Loss sting |
| Win (crystals survived) | Win sting |

Audio files should be stored in `src/assets/audio/`. If using YouTube links during development, note that autoplay of YouTube embeds has browser restrictions — plan to use extracted audio files for production.

### `RevealSequence` Component

- Orchestrates timing of animations
- Uses `useAudio` internally
- Controls `revealState` per trap via local state passed down as props

### `TrapCrack` Animation

- CSS `@keyframes` crack effect (scale, rotate slightly, opacity fragments)
- Triggered by `revealState === "cracking"` prop on `Trap`

### `CrystalEvaporate` Animation

- Crystal count floats upward and fades out
- Particle-style CSS animation or simple translate + opacity keyframe
- Color: cyan/teal SC2 mineral aesthetic

### Outcome Handling After Reveal

- `phase` → `"result"`
- If win: show surviving crystal count, play win sting, admin sees **"Next Question"** button
- If loss: show 0 crystals, play loss sting, admin sees **"End Game"** button
- `crystalBank` updated: `crystalDistribution[correctAnswerId] + savedCrystals`

---

## Phase 8 — Final Question (Question 10)

**Goal:** Implement the modified final round rules.

### Layout Changes

- `Trap` grid switches from 2x2 to 1x2 (two large traps side by side)
- Only answers 1 and 2 (or whichever two are selected for the final question) are shown

### Crystal Distribution Logic Change

- No proportional split — winner takes all
- After voting ends, count votes for answer 1 vs answer 2
- All of `crystalBank` goes to the answer with the most votes
- If tied: admin decides via manual override button (or coin flip UI)
- Dispatch `SET_FINAL_DISTRIBUTION`

### Final Question Joker Rules

- Already handled in Phase 6 — enforce via `isFinalQuestion` guards

### Re-vote via €10 Joker

- Same as regular re-vote but only 2 answers
- Admin is expected to host a discussion phase before restarting the timer

---

## Phase 9 — End Game Screen

**Goal:** Display the final result and charity donation tiers.

### End Game Trigger

- After question 10 reveal, if win → `phase === "endgame"`
- If loss at any question → `phase === "endgame"` with 0 crystals

### `EndGameScreen` Component (shown on `/` game board)

- Large display of final crystal count saved
- Charity tier table showing what the streamer will donate:

```
100,000 crystals saved → €100 donated
75,000              → €75
50,000              → €50
25,000              → €25
10,000              → €10
5,000               → €5
< 5,000             → €1
0                   → Nothing — gg
```

*(Tiers are hardcoded for v1 — make them configurable in admin later)*

- Animated crystal count reveal
- SC2-themed celebration or defeat visual

### Admin End Game Controls

- **New Game** button → full reset, back to `phase: "idle"`
- Display of final stats: questions answered, crystals saved per question log

---

## Phase 10 — Polish, OBS Integration & Edge Cases

**Goal:** Make the app production-ready for a live stream.

### OBS Setup

- `/` route designed for `1920x1080` browser source
- No scrollbars (`overflow: hidden` on root)
- Background is opaque (OBS chroma key optional — use a solid dark color)
- All text legible at stream resolution

### Edge Cases to Handle

- **No votes cast**: crystals cannot be distributed → show warning on admin, block reveal until at least one vote exists or admin overrides
- **All crystals on wrong answers**: standard loss flow
- **Twitch disconnect mid-vote**: admin warned, votes received so far are preserved, manual override available
- **Timer runs out with 0 votes**: admin must manually handle via override
- **Re-vote (€10 joker) edge case**: if re-vote is triggered after some answers are eliminated, only show non-eliminated answers

### Performance

- Twitch WebSocket and game state updates should not cause unnecessary full re-renders
- Memoize `Trap` components with `React.memo`
- Use `useCallback` for vote dispatch handlers

### Accessibility (Basic)

- Admin dashboard must be keyboard-navigable
- Buttons have clear labels
- Game board is display-only (no accessibility requirements for OBS overlay)

---

## Future Considerations (Out of Scope for v1)

- Persistent question bank stored in a database
- StreamLabs / StreamElements API integration for automatic donation detection
- Viewer-facing voting web app (in addition to chat commands)
- Replay / highlight reel export
- Sound effects for individual joker triggers
- Mobile admin dashboard view