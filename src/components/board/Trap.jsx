import './Trap.scss'

export function Trap({
  answerId,
  answerText,
  crystalAmount,
  voteCount = 0,
  isEliminated,
  isCorrect,
  revealState,
  isHighlighted,
  onClick,
  isClickable = false,
  crystalPerVote = 0, // Calculated value per vote during voting
}) {
  const trapClasses = [
    'trap',
    isEliminated && 'trap--eliminated',
    revealState === 'done' && 'trap--done',
    isCorrect && revealState === 'done' && 'trap--correct',
    !isCorrect && revealState === 'done' && 'trap--incorrect',
    !isCorrect && revealState === 'done' && 'trap--trapdoor',
    isHighlighted && 'trap--highlighted',
    isClickable && !isEliminated && 'trap--clickable',
  ]
    .filter(Boolean)
    .join(' ')

  const handleClick = () => {
    if (isClickable && !isEliminated && revealState === 'hidden' && onClick) {
      onClick(answerId)
    }
  }

  // Calculate crystal value for this answer's votes during voting phase
  const votesCrystalValue = voteCount > 0 ? Math.floor(voteCount * crystalPerVote) : 0

  return (
    <div className={trapClasses} onClick={handleClick}>
      <div className="trap-inner">
        <div className="trap-answer">
          <span className="answer-label">{String.fromCharCode(64 + answerId)}</span>
          <p className="answer-text">{answerText}</p>
          {voteCount > 0 && (
            <span className="vote-count">
              votes: {voteCount}
              {crystalPerVote > 0 && (
                <img src="/mineralIcon.png" alt="crystals" className="crystal-icon-inline" />
              )}
              {crystalPerVote > 0 && ` (${votesCrystalValue.toLocaleString()})`}
            </span>
          )}
        </div>

        {crystalAmount > 0 && !isEliminated && (
          <div className="trap-crystals">
            <img src="/mineralIcon.png" alt="crystals" className="crystal-icon" />
            <span className="crystal-amount">{crystalAmount.toLocaleString()}</span>
          </div>
        )}

        {revealState === 'done' && isCorrect && <div className="correct-indicator" />}
        {revealState === 'done' && !isCorrect && isCorrect !== null && (
          <div className="incorrect-indicator" />
        )}
      </div>

      {isEliminated && <div className="eliminated-overlay" />}

      {/* Trapdoor void effect for wrong answers during reveal */}
      {revealState === 'done' && !isCorrect && <div className="trapdoor-void" />}
    </div>
  )
}
