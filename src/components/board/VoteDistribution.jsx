import './VoteDistribution.scss'

export function VoteDistribution({ currentQuestion, state }) {
  const totalVotes = Object.values(state.votes).reduce((sum, votes) => sum + votes.length, 0)

  return (
    <div className="vote-distribution-widget">
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
            {state.votes[answer.id]?.length || 0} ({state.crystalDistribution[answer.id] || 0}<img src="/mineralIcon.png" alt="crystals" className="crystal-icon-inline" />)
          </span>
        </div>
      ))}
    </div>
  )
}
