// Crystal distribution and math utilities

/**
 * Distribute crystalBank proportionally based on vote counts
 * @param {Object} votes - { 1: [users], 2: [users], 3: [users], 4: [users] }
 * @param {number} crystalBank - Total crystals to distribute
 * @param {boolean} isFinalQuestion - If true, winner-takes-all instead of proportional
 * @returns {Object} { 1: N, 2: N, 3: N, 4: N }
 */
export function distributeCrystals(votes, crystalBank, isFinalQuestion = false) {
  const distribution = { 1: 0, 2: 0, 3: 0, 4: 0 }

  // Count votes per answer
  const voteCounts = {
    1: votes[1]?.length || 0,
    2: votes[2]?.length || 0,
    3: votes[3]?.length || 0,
    4: votes[4]?.length || 0,
  }

  const totalVotes = voteCounts[1] + voteCounts[2] + voteCounts[3] + voteCounts[4]

  // No votes cast - no distribution
  if (totalVotes === 0) {
    return distribution
  }

  if (isFinalQuestion) {
    // Final question: winner takes all
    let maxVotes = 0
    let winners = []

    Object.entries(voteCounts).forEach(([answerId, count]) => {
      if (count > maxVotes) {
        maxVotes = count
        winners = [answerId]
      } else if (count === maxVotes && count > 0) {
        winners.push(answerId)
      }
    })

    // If tied, distribute evenly among winners
    if (winners.length > 0) {
      const crystalPerWinner = Math.floor(crystalBank / winners.length)
      winners.forEach((answerId) => {
        distribution[answerId] = crystalPerWinner
      })
      // Handle remainder by giving to first winner
      const remainder = crystalBank - crystalPerWinner * winners.length
      if (remainder > 0) {
        distribution[winners[0]] += remainder
      }
    }
  } else {
    // Normal questions: proportional distribution
    Object.entries(voteCounts).forEach(([answerId, count]) => {
      if (count > 0) {
        distribution[answerId] = Math.floor((count / totalVotes) * crystalBank)
      }
    })

    // Handle remainder - distribute to answers with votes (in order)
    const distributed = Object.values(distribution).reduce((a, b) => a + b, 0)
    const remainder = crystalBank - distributed

    if (remainder > 0) {
      const answersWithVotes = Object.entries(voteCounts)
        .filter(([, count]) => count > 0)
        .sort((a, b) => b[1] - a[1]) // Sort by vote count descending

      for (let i = 0; i < remainder && i < answersWithVotes.length; i++) {
        const answerId = answersWithVotes[i][0]
        distribution[answerId]++
      }
    }
  }

  return distribution
}

/**
 * Count total votes across all answers
 * @param {Object} votes - { 1: [users], 2: [users], 3: [users], 4: [users] }
 * @returns {number} Total vote count
 */
export function totalVotes(votes) {
  return (
    (votes[1]?.length || 0) +
    (votes[2]?.length || 0) +
    (votes[3]?.length || 0) +
    (votes[4]?.length || 0)
  )
}

/**
 * Calculate crystals remaining after reveal
 * Only counts crystals on the correct answer
 * @param {Object} distribution - { 1: N, 2: N, 3: N, 4: N }
 * @param {number} correctAnswerId - ID of correct answer
 * @returns {number} Crystals that survived
 */
export function calculateSurvivedCrystals(distribution, correctAnswerId) {
  return distribution[correctAnswerId] || 0
}

/**
 * Determine if a voter already voted
 * @param {Object} votes - { 1: [users], 2: [users], ... }
 * @param {string} username - Username to check
 * @returns {boolean} True if user already voted
 */
export function hasUserVoted(votes, username) {
  return Object.values(votes).some((votersArray) => votersArray.includes(username))
}

/**
 * Get vote count for a specific answer
 * @param {Object} votes - { 1: [users], 2: [users], ... }
 * @param {number} answerId - Answer ID to check
 * @returns {number} Vote count for that answer
 */
export function getVoteCount(votes, answerId) {
  return votes[answerId]?.length || 0
}
