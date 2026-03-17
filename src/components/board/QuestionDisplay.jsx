import './QuestionDisplay.scss'

export function QuestionDisplay({ questionText, questionNumber, totalQuestions }) {
  return (
    <div className="question-display">
      <div className="question-card">
        <div className="question-header">
          <span className="question-number">Question {questionNumber} of {totalQuestions}</span>
        </div>
        <div className="question-content">
          <h2 className="question-text">{questionText}</h2>
        </div>
      </div>
    </div>
  )
}
