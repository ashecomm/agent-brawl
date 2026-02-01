import { shortenWallet } from '../App.jsx';

export default function Header({ wallet, fighter, page, setPage, connectWallet }) {
  const nav = ['arena', 'profile', 'leaderboard', 'achievements', 'referral'];
  const labels = { arena: '⚔️ Arena', profile: '👤 Profile', leaderboard: '🏆 Rankings', achievements: '🎖️ Achievements', referral: '🔗 Referrals' };

  return (
    <div className="header">
      <div className="header-logo">Agent <span>Brawl</span></div>
      <div className="nav">
        {nav.map(n => (
          <button key={n} className={`nav-btn ${page === n ? 'active' : ''}`} onClick={() => setPage(n)}>
            {labels[n]}
          </button>
        ))}
      </div>
      <div>
        {wallet ? (
          <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
            {fighter && <span className={`league-badge league-${fighter.league}`}>{fighter.league}</span>}
            <button className="wallet-btn wallet-connected" onClick={() => {}}>
              {shortenWallet(wallet)}
            </button>
          </div>
        ) : (
          <button className="wallet-btn" onClick={connectWallet}>Connect Wallet</button>
        )}
      </div>
    </div>
  );
}
