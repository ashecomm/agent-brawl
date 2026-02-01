export default function Header({ agent, fighter, page, setPage, onLogo }) {
  const nav = ['arena', 'profile', 'leaderboard', 'achievements', 'referral'];
  const labels = { arena: '⚔️ Arena', profile: '👤 Profile', leaderboard: '🏆 Rankings', achievements: '🎖️ Achievements', referral: '🔗 Referrals' };

  return (
    <div className="game-header">
      <div className="game-header-inner">
        <button className="game-logo" onClick={onLogo}>
          <span>⚔️</span><span>Agent Brawl</span>
        </button>
        <div className="game-nav">
          {nav.map(n => (
            <button key={n} className={`game-nav-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>
              {labels[n]}
            </button>
          ))}
        </div>
        {agent && (
          <div className="game-agent">
            {fighter && <span className="game-league" style={{ color: fighter.league === 'Bronze' ? '#cd7f32' : fighter.league === 'Silver' ? '#c0c0c0' : fighter.league === 'Gold' ? '#ffd700' : fighter.league === 'Diamond' ? '#b9f2ff' : '#ff6b35' }}>{fighter.league}</span>}
            <span className="game-agent-name">{agent.name}</span>
          </div>
        )}
      </div>
    </div>
  );
}
