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
}) {
  const trapClasses = [
    'trap',
    isEliminated && 'trap--eliminated',
    revealState === 'cracking' && 'trap--cracking',
    revealState === 'done' && 'trap--done',
    isCorrect && revealState === 'done' && 'trap--correct',
    !isCorrect && revealState === 'done' && 'trap--incorrect',
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

  return (
    <div className={trapClasses} onClick={handleClick}>
      <div className="trap-inner">
        <div className="trap-answer">
          <span className="answer-label">{String.fromCharCode(64 + answerId)}</span>
          <p className="answer-text">{answerText}</p>
          {voteCount > 0 && <span className="vote-count">votes: {voteCount}</span>}
        </div>

        {crystalAmount > 0 && !isEliminated && (
          <div className="trap-crystals">
            <div className="crystal-icon">💎</div>
            <span className="crystal-amount">{crystalAmount.toLocaleString()}</span>
          </div>
        )}

        {revealState === 'cracking' && <div className="trap-crack" />}
        {revealState === 'done' && isCorrect && <div className="correct-indicator" />}
        {revealState === 'done' && !isCorrect && isCorrect !== null && (
          <div className="incorrect-indicator" />
        )}
      </div>

      {isEliminated && <div className="eliminated-overlay" />}
    </div>
  )
}
