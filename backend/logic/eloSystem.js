function calculateEloChange(winnerElo, loserElo) {
  const K = 32;
  const expectedWinner = 1 / (1 + Math.pow(10, (loserElo - winnerElo) / 400));
  const rawGain = Math.round(K * (1 - expectedWinner));
  const rawLoss = Math.round(K * expectedWinner);
  return {
    winner: Math.max(5, Math.min(50, rawGain)),
    loser: -Math.max(5, Math.min(50, rawLoss))
  };
}

function applyEloDecay(elo, lastActive) {
  if (!lastActive) return elo;
  const now = new Date();
  const last = new Date(lastActive);
  const daysSince = (now - last) / (1000 * 60 * 60 * 24);
  const weeksPassed = Math.floor(daysSince / 7);
  return Math.max(0, elo - (weeksPassed * 10));
}

function getLeague(elo) {
  if (elo >= 2100) return 'Champion';
  if (elo >= 1800) return 'Diamond';
  if (elo >= 1500) return 'Gold';
  if (elo >= 1200) return 'Silver';
  return 'Bronze';
}

module.exports = { calculateEloChange, applyEloDecay, getLeague };
